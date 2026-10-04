"""
Controlled tool loop executor for the InterviewIQ Groq Interview Agent.
Orchestrates model tool calling with strict iteration bounds, parameter validation,
error containment, and safe fallback handling.
"""

import json
import logging
import re
import time
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.schemas.session_state import InterviewSessionState
from app.tools.registry.registry import ToolRegistry
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.ai.providers.base import BaseAIProvider
from app.ai.evaluation.answer.exceptions import AIProviderError, AIProviderTimeoutError
from app.agents.interview.schemas import (
    AgentAction,
    AgentDecision,
    ToolExecutionRecord,
)
from app.agents.interview.exceptions import (
    AgentMaxIterationsError,
    AgentMalformedDecisionError,
)

logger = logging.getLogger(__name__)


class ControlledToolExecutor:
    """
    Executes the agent tool call loop with a hard safety iteration limit.
    """

    def __init__(
        self,
        registry: ToolRegistry,
        provider: BaseAIProvider,
        max_iterations: int = 4
    ):
        self.registry = registry
        self.provider = provider
        self.max_iterations = max_iterations

    def run_loop(
        self,
        session_id: str,
        interview_id: str,
        user_id: str,
        state: InterviewSessionState,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
        db: Optional[Session] = None,
        provider_override: Optional[str] = None,
        mock_mode: Optional[str] = None,
    ) -> Tuple[AgentDecision, List[ToolExecutionRecord], int, bool, Optional[str]]:
        """
        Execute the conversation turns between model and tools until a final AgentDecision is produced
        or until the safety iteration limit is reached.

        Returns: (decision, tool_records, iteration_count, fallback_applied, error_message)
        """
        iteration = 0
        tool_records: List[ToolExecutionRecord] = []
        fallback_applied = False
        last_error = None
        accumulated_tool_data: Dict[str, Any] = {}

        while iteration < self.max_iterations:
            iteration += 1
            logger.info(
                f"[Agent Executor] Session {session_id} - Iteration {iteration}/{self.max_iterations} "
                f"with {len(tools)} tools exposed"
            )

            try:
                response = self.provider.generate_chat_with_tools(
                    messages=messages,
                    tools=tools,
                    tool_choice="auto",
                    temperature=0.2,
                )
            except (AIProviderTimeoutError, AIProviderError) as e:
                logger.warning(f"[Agent Executor] AI Provider error on session {session_id}: {e}")
                fallback_decision = self._generate_fallback_decision(
                    state=state,
                    reason=f"AI Provider error: {str(e)}",
                    accumulated_data=accumulated_tool_data
                )
                return fallback_decision, tool_records, iteration, True, str(e)
            except Exception as e:
                logger.error(f"[Agent Executor] Unexpected error calling provider: {e}", exc_info=True)
                fallback_decision = self._generate_fallback_decision(
                    state=state,
                    reason=f"Unexpected error: {str(e)}",
                    accumulated_data=accumulated_tool_data
                )
                return fallback_decision, tool_records, iteration, True, str(e)

            content = response.get("content")
            tool_calls = response.get("tool_calls") or []

            # Case 1: Model requests one or more tool calls
            if tool_calls:
                logger.info(f"[Agent Executor] Model requested {len(tool_calls)} tool call(s)")
                # Append assistant tool call message to conversational context
                messages.append({
                    "role": "assistant",
                    "content": content,
                    "tool_calls": tool_calls
                })

                for tc in tool_calls:
                    call_id = tc.get("id") or f"call_{int(time.time() * 1000)}"
                    func_obj = tc.get("function") or {}
                    func_name = (func_obj.get("name") or "").strip()
                    raw_args = func_obj.get("arguments") or "{}"

                    rec, result_dict = self._execute_single_tool(
                        func_name=func_name,
                        raw_args=raw_args,
                        session_id=session_id,
                        interview_id=interview_id,
                        user_id=user_id,
                        db=db,
                        provider_override=provider_override,
                        mock_mode=mock_mode,
                    )
                    tool_records.append(rec)

                    if rec.success and rec.output_preview:
                        accumulated_tool_data.update(rec.output_preview)

                    # Feed tool execution output back into model context
                    messages.append({
                        "role": "tool",
                        "tool_call_id": call_id,
                        "name": func_name,
                        "content": json.dumps(result_dict)
                    })

                # Proceed to next iteration so model reasons over tool results
                continue

            # Case 2: Model produced final text without tool calls
            if content:
                logger.info(f"[Agent Executor] Model returned final content, attempting decision parsing")
                decision = self._parse_agent_decision(content, accumulated_tool_data)
                return decision, tool_records, iteration, False, None

            # Model returned neither tool_calls nor content
            logger.warning("[Agent Executor] Model returned empty content and empty tool calls")
            break

        # If loop exited due to max iterations or empty output:
        logger.warning(
            f"[Agent Executor] Exited tool loop after {iteration} iterations. "
            f"Applying controlled fallback."
        )
        fallback_decision = self._generate_fallback_decision(
            state=state,
            reason=f"Reached maximum tool execution iterations ({self.max_iterations})",
            accumulated_data=accumulated_tool_data
        )
        return fallback_decision, tool_records, iteration, True, "Max iterations exceeded"

    def _execute_single_tool(
        self,
        func_name: str,
        raw_args: Any,
        session_id: str,
        interview_id: str,
        user_id: str,
        db: Optional[Session],
        provider_override: Optional[str],
        mock_mode: Optional[str],
    ) -> Tuple[ToolExecutionRecord, Dict[str, Any]]:
        """
        Execute a single tool with validation and error containment.
        """
        start_t = time.perf_counter()

        # Parse arguments safely
        if isinstance(raw_args, str):
            try:
                parsed_args = json.loads(raw_args) if raw_args.strip() else {}
            except Exception as e:
                elapsed = (time.perf_counter() - start_t) * 1000.0
                rec = ToolExecutionRecord(
                    tool_name=func_name,
                    success=False,
                    execution_time_ms=round(elapsed, 2),
                    error=f"Malformed JSON arguments: {str(e)}"
                )
                return rec, {"success": False, "error": rec.error}
        elif isinstance(raw_args, dict):
            parsed_args = raw_args
        else:
            parsed_args = {}

        # Enforce session context defaults if missing
        if "session_id" not in parsed_args and func_name in ["get_interview_state", "update_interview_state"]:
            parsed_args["session_id"] = session_id

        context = ToolExecutionContext(
            db=db,
            user_id=user_id,
            provider_override=provider_override,
            mock_mode=mock_mode,
            metadata={
                "session_id": session_id,
                "interview_id": interview_id
            }
        )

        try:
            result = self.registry.execute_tool(
                name=func_name,
                context=context,
                params=parsed_args
            )
            elapsed = (time.perf_counter() - start_t) * 1000.0

            output_dict = result.data or {}
            rec = ToolExecutionRecord(
                tool_name=func_name,
                success=result.success,
                execution_time_ms=round(elapsed, 2),
                error=result.error if not result.success else None,
                output_preview=output_dict if result.success else None
            )
            return rec, result.model_dump()

        except Exception as e:
            elapsed = (time.perf_counter() - start_t) * 1000.0
            logger.error(f"[Agent Executor] Uncaught error running tool '{func_name}': {e}", exc_info=True)
            rec = ToolExecutionRecord(
                tool_name=func_name,
                success=False,
                execution_time_ms=round(elapsed, 2),
                error=f"Execution error: {str(e)}"
            )
            return rec, {"success": False, "error": rec.error}

    def _parse_agent_decision(
        self,
        content: str,
        accumulated_data: Dict[str, Any]
    ) -> AgentDecision:
        """
        Parse raw model response content into a validated AgentDecision schema.
        Handles optional markdown formatting or raw JSON.
        """
        cleaned = content.strip()

        # Extract markdown json fence if present
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
        if json_match:
            cleaned = json_match.group(1).strip()
        else:
            brace_match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
            if brace_match:
                cleaned = brace_match.group(1).strip()

        try:
            data = json.loads(cleaned)
            if isinstance(data, dict):
                # Ensure action enum is valid
                action_str = str(data.get("action", "")).upper()
                action_val = AgentAction.__members__.get(action_str, AgentAction.CONTINUE)

                return AgentDecision(
                    action=action_val,
                    reasoning=data.get("reasoning") or "Orchestration decision computed.",
                    response_to_candidate=data.get("response_to_candidate") or data.get("message"),
                    tool_call_used=data.get("tool_call_used"),
                    tool_result_data=data.get("tool_result_data") or accumulated_data or None,
                    metadata=data.get("metadata") or {}
                )
        except Exception as e:
            logger.warning(f"[Agent Executor] Failed parsing structured decision JSON: {e}")

        # If not parseable JSON, wrap plain text into CONTINUE decision
        return AgentDecision(
            action=AgentAction.CONTINUE,
            reasoning="Model returned unstructured response; wrapped into continue action.",
            response_to_candidate=content.strip(),
            tool_call_used=None,
            tool_result_data=accumulated_data or None,
            metadata={"raw_content": content[:200]}
        )

    def _generate_fallback_decision(
        self,
        state: InterviewSessionState,
        reason: str,
        accumulated_data: Dict[str, Any]
    ) -> AgentDecision:
        """
        Generate a safe, deterministic fallback AgentDecision when errors occur.
        """
        prog = state.progress
        is_complete = prog.completed_questions >= prog.total_questions or state.remaining_time.is_expired

        if is_complete:
            return AgentDecision(
                action=AgentAction.END_INTERVIEW,
                reasoning=f"Fallback triggered and session criteria met: {reason}",
                response_to_candidate="Thank you for participating. We have reached the end of this interview session.",
                tool_call_used=None,
                tool_result_data=accumulated_data or None,
                metadata={"fallback": True, "reason": reason}
            )

        return AgentDecision(
            action=AgentAction.CONTINUE,
            reasoning=f"Safe fallback applied: {reason}",
            response_to_candidate="Understood. Let's continue with the interview.",
            tool_call_used=None,
            tool_result_data=accumulated_data or None,
            metadata={"fallback": True, "reason": reason}
        )
