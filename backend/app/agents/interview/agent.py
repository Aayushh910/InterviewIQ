"""
InterviewAgent: Central Groq-powered Interview Agent for InterviewIQ.
Orchestrates adaptive interviews by reasoning over authoritative state
and invoking tools from the ToolRegistry.
"""

import logging
import time
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.tools.registry.registry import ToolRegistry, default_registry
from app.ai.providers.base import BaseAIProvider
from app.ai.providers.factory import get_ai_provider
from app.services.session_state.manager import InterviewStateManager, session_state_manager
from app.services.session_state.exceptions import SessionNotFoundError
from app.schemas.session_state import (
    SessionStatus,
    AddQuestionRequest,
    AddAnswerRequest,
    AddFollowUpRequest,
    AddEvaluationReferenceRequest,
)
from app.agents.interview.schemas import (
    AgentAction,
    AgentDecision,
    AgentTurnRequest,
    AgentTurnResponse,
    ToolExecutionRecord,
)
from app.agents.interview.prompts import (
    INTERVIEW_AGENT_SYSTEM_PROMPT,
    build_agent_turn_prompt,
)
from app.agents.interview.context import AgentContextBuilder
from app.agents.interview.executor import ControlledToolExecutor
from app.agents.interview.exceptions import (
    AgentSecurityError,
    AgentExecutionError,
)

logger = logging.getLogger(__name__)


class InterviewAgent:
    """
    Central Interview Agent for InterviewIQ.
    Combines Groq LLM reasoning with ToolRegistry operations and InterviewStateManager persistence.
    """

    def __init__(
        self,
        registry: Optional[ToolRegistry] = None,
        provider: Optional[BaseAIProvider] = None,
        state_manager: Optional[InterviewStateManager] = None,
    ):
        self.registry = registry or default_registry
        self.provider = provider or get_ai_provider("groq")
        self.state_manager = state_manager or session_state_manager

    def get_exposed_tools(self) -> List[Dict[str, Any]]:
        """
        Return the tool definitions exposed to the agent.
        Only Phase 9 operational tools are exposed; future placeholder contracts are excluded.
        """
        return self.registry.get_tool_definitions(include_future=False)

    def orchestrate_turn(
        self,
        db: Session,
        user_id: str,
        request: AgentTurnRequest,
        provider_override: Optional[str] = None,
        mock_mode: Optional[str] = None,
    ) -> AgentTurnResponse:
        """
        Execute an end-to-end orchestration turn for the active interview session.
        Validates authorization, builds bounded context, executes the tool loop,
        applies state updates via InterviewStateManager, and returns a structured AgentTurnResponse.
        """
        start_time = time.perf_counter()
        session_id = request.session_id.strip()

        logger.info(f"[InterviewAgent] Invoking turn for session '{session_id}' by user '{user_id}'")

        # 1. Authoritative State Retrieval & Ownership Authorization
        try:
            current_state = self.state_manager.get_session_state(db, session_id, user_id)
        except SessionNotFoundError:
            logger.warning(f"[InterviewAgent] Unauthorized or non-existent session '{session_id}' for user '{user_id}'")
            raise AgentSecurityError(f"Session '{session_id}' not found or unauthorized.")
        except Exception as e:
            logger.error(f"[InterviewAgent] Failed to retrieve session state: {e}", exc_info=True)
            raise AgentExecutionError(f"Failed to access interview state: {str(e)}")

        # 2. Record candidate answer in session state if submitted in this turn
        if request.candidate_answer and request.question_id:
            try:
                current_state, _ = self.state_manager.add_answer(
                    db=db,
                    session_id=session_id,
                    user_id=user_id,
                    data=AddAnswerRequest(
                        question_id=request.question_id,
                        answer_text=request.candidate_answer,
                        duration_seconds=request.duration_seconds
                    )
                )
                logger.info(f"[InterviewAgent] Recorded answer for question '{request.question_id}' in session '{session_id}'")
            except Exception as e:
                logger.warning(f"[InterviewAgent] Could not record answer to state before orchestration: {e}")

        # 3. Build bounded, sanitized context
        context_summary = AgentContextBuilder.build_context_summary(current_state)
        active_question_text = (
            current_state.current_question.question_text
            if current_state.current_question
            else None
        )

        user_turn_prompt = build_agent_turn_prompt(
            context_summary=context_summary,
            user_message=request.user_message,
            candidate_answer=request.candidate_answer,
            question_text=active_question_text
        )

        messages = [
            {"role": "system", "content": INTERVIEW_AGENT_SYSTEM_PROMPT},
            {"role": "user", "content": user_turn_prompt}
        ]

        # 4. Resolve AI Provider (supports test isolation with MockProvider)
        active_provider = self.provider
        if provider_override or mock_mode:
            active_provider = get_ai_provider(provider_override or "groq", mock_mode=mock_mode)

        # 5. Discover operational tools (excluding future contracts)
        exposed_tools = self.get_exposed_tools()

        # 6. Execute Controlled Tool Loop
        executor = ControlledToolExecutor(
            registry=self.registry,
            provider=active_provider,
            max_iterations=request.max_iterations
        )

        decision, tool_records, iterations, fallback_applied, err_msg = executor.run_loop(
            session_id=session_id,
            interview_id=current_state.interview_id,
            user_id=user_id,
            state=current_state,
            messages=messages,
            tools=exposed_tools,
            db=db,
            provider_override=provider_override,
            mock_mode=mock_mode,
        )

        # 7. Apply State Consistency Transitions via InterviewStateManager
        self._apply_state_effects(
            db=db,
            session_id=session_id,
            user_id=user_id,
            decision=decision,
            tool_records=tool_records,
            current_state=current_state
        )

        # 8. Retrieve latest authoritative state after updates
        try:
            final_state = self.state_manager.get_session_state(db, session_id, user_id)
            final_status = final_state.session_status
        except Exception:
            final_status = current_state.session_status

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        tools_executed = [rec.tool_name for rec in tool_records]

        logger.info(
            f"[InterviewAgent] Finished turn for session '{session_id}': action={decision.action.value}, "
            f"tools={tools_executed}, iterations={iterations}, duration={elapsed_ms}ms"
        )

        return AgentTurnResponse(
            session_id=session_id,
            decision=decision,
            tools_executed=tools_executed,
            tool_records=tool_records,
            iterations_count=iterations,
            session_status=final_status,
            execution_time_ms=elapsed_ms,
            fallback_applied=fallback_applied,
            error=err_msg
        )

    def _apply_state_effects(
        self,
        db: Session,
        session_id: str,
        user_id: str,
        decision: AgentDecision,
        tool_records: List[ToolExecutionRecord],
        current_state: Any
    ) -> None:
        """
        Synchronize successful tool results into authoritative InterviewStateManager.
        """
        for tr in tool_records:
            if not tr.success or not tr.output_preview:
                continue

            # Record answer evaluation reference if evaluate_answer succeeded
            if tr.tool_name == "evaluate_answer":
                eval_data = tr.output_preview
                # Find most recent answer ID in session
                target_ans_id = None
                if current_state.answer_history:
                    target_ans_id = current_state.answer_history[-1].answer_id

                if target_ans_id:
                    try:
                        self.state_manager.add_evaluation_reference(
                            db=db,
                            session_id=session_id,
                            user_id=user_id,
                            data=AddEvaluationReferenceRequest(
                                answer_id=target_ans_id,
                                overall_score=eval_data.get("overall_score", 70.0),
                                relevance_score=eval_data.get("relevance_score"),
                                correctness_score=eval_data.get("correctness_score"),
                                completeness_score=eval_data.get("completeness_score"),
                                clarity_score=eval_data.get("clarity_score"),
                                technical_depth_score=eval_data.get("technical_depth_score"),
                                summary=eval_data.get("summary", "Evaluation recorded."),
                                evaluator_provider=eval_data.get("evaluator_provider", "groq")
                            )
                        )
                        logger.info(f"[InterviewAgent] Linked evaluation reference to answer '{target_ans_id}'")
                    except Exception as e:
                        logger.warning(f"[InterviewAgent] Could not link evaluation reference: {e}")

            # Record new main question if generate_interview_question succeeded
            elif tr.tool_name == "generate_interview_question":
                q_text = tr.output_preview.get("question_text")
                if q_text:
                    try:
                        self.state_manager.add_question(
                            db=db,
                            session_id=session_id,
                            user_id=user_id,
                            data=AddQuestionRequest(
                                question_text=q_text,
                                question_type=tr.output_preview.get("question_type", "technical")
                            )
                        )
                        logger.info(f"[InterviewAgent] Appended new question to session '{session_id}'")
                    except Exception as e:
                        logger.warning(f"[InterviewAgent] Could not append generated question: {e}")

            # Record follow-up question if generate_follow_up_question succeeded
            elif tr.tool_name == "generate_follow_up_question":
                fu_text = tr.output_preview.get("follow_up_question")
                parent_id = current_state.current_question.question_id if current_state.current_question else None
                depth = tr.output_preview.get("follow_up_depth", 1)
                if fu_text and parent_id:
                    try:
                        self.state_manager.add_follow_up(
                            db=db,
                            session_id=session_id,
                            user_id=user_id,
                            data=AddFollowUpRequest(
                                parent_question_id=parent_id,
                                question_text=fu_text,
                                follow_up_depth=depth
                            )
                        )
                        logger.info(f"[InterviewAgent] Appended follow-up question to session '{session_id}'")
                    except Exception as e:
                        logger.warning(f"[InterviewAgent] Could not append follow-up question: {e}")

        # If decision is END_INTERVIEW, transition session to completed
        if decision.action == AgentAction.END_INTERVIEW:
            try:
                if current_state.session_status == SessionStatus.NOT_STARTED.value:
                    self.state_manager.update_status(
                        db=db,
                        session_id=session_id,
                        user_id=user_id,
                        new_status=SessionStatus.IN_PROGRESS.value
                    )
                self.state_manager.end_session(db=db, session_id=session_id, user_id=user_id, reason="completed")
                logger.info(f"[InterviewAgent] Ended session '{session_id}' upon END_INTERVIEW decision")
            except Exception as e:
                logger.warning(f"[InterviewAgent] Could not end session: {e}")


# Global default agent instance
interview_agent = InterviewAgent()


def get_interview_agent() -> InterviewAgent:
    """Dependency provider returning singleton InterviewAgent instance."""
    return interview_agent
