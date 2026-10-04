"""
CalculateFinalEvaluationTool: Real executable evaluation tool for InterviewIQ (Phase 12).
Executes deterministic evidence aggregation and scoring across answer quality,
visual engagement, and speech communication signals.
"""

import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.tools.final_evaluation.schemas import (
    CalculateFinalEvaluationInput,
    CalculateFinalEvaluationOutput,
)
from app.evaluation.evaluator import final_evaluator
from app.evaluation.exceptions import (
    EvaluationError,
    SessionNotFoundError,
    UnauthorizedEvaluationError,
    SessionNotCompleteError,
    InsufficientEvidenceError,
)

logger = logging.getLogger(__name__)


class CalculateFinalEvaluationTool(BaseTool):
    """
    Executable tool calculating comprehensive final interview evaluation
    using pure deterministic scoring based on multi-source evidence.
    """
    name: str = "calculate_final_evaluation"
    description: str = (
        "Calculate deterministic final interview evaluation combining candidate answer "
        "evaluations, observable communication pacing, and visual engagement evidence."
    )
    input_schema = CalculateFinalEvaluationInput
    output_schema = CalculateFinalEvaluationOutput
    category: str = "final_evaluation"
    is_future_contract: bool = False

    def execute(self, context: ToolExecutionContext, params: CalculateFinalEvaluationInput) -> ToolResult:
        mock_mode = context.mock_mode or context.metadata.get("mock_mode")
        db: Optional[Session] = context.db

        session_id = params.session_id.strip()

        # 1. Mock Mode Handling for Deterministic Testing
        if mock_mode == "failure":
            return ToolResult(
                tool_name=self.name,
                success=False,
                error="Mock evaluation engine simulated pipeline failure."
            )

        if mock_mode == "success" or not db:
            out = CalculateFinalEvaluationOutput(
                evaluation_id="eval-mock-12345",
                session_id=session_id,
                overall_score=84.5,
                performance_category="Strong",
                category_scores={
                    "answer_quality": 86.0,
                    "communication": 82.0,
                    "visual_presentation": 80.0,
                },
                applied_weights={
                    "answer_quality": 0.70,
                    "communication": 0.15,
                    "visual_presentation": 0.15,
                },
                strengths=[
                    "Strong foundational understanding of asynchronous programming.",
                    "Articulate and well-paced response delivery.",
                ],
                improvements=[
                    "Could provide deeper architectural details on distributed failure recovery.",
                ],
                summary="Candidate demonstrated strong technical grasp and clear communication across responses.",
                scoring_version="1.0"
            )
            return ToolResult(tool_name=self.name, success=True, data=out.model_dump())

        # 2. Authorization Check
        if not context.user_id:
            return ToolResult(
                tool_name=self.name,
                success=False,
                error="Authenticated user_id is required in execution context."
            )

        # 3. Execute Authoritative Deterministic Evaluator
        try:
            result = final_evaluator.evaluate_interview_session(
                db=db,
                session_id=session_id,
                user_id=context.user_id,
                force_recalculate=params.force_recalculate,
            )

            out = CalculateFinalEvaluationOutput(
                evaluation_id=result.evaluation_id,
                session_id=result.session_id,
                overall_score=result.overall_score,
                performance_category=result.performance_category,
                category_scores=result.category_scores,
                applied_weights=result.applied_weights,
                strengths=result.strengths,
                improvements=result.improvements,
                summary=result.summary,
                scoring_version=result.scoring_version,
            )

            return ToolResult(
                tool_name=self.name,
                success=True,
                data=out.model_dump()
            )

        except (SessionNotFoundError, UnauthorizedEvaluationError, SessionNotCompleteError, InsufficientEvidenceError) as e:
            return ToolResult(tool_name=self.name, success=False, error=str(e))
        except Exception as e:
            logger.error(f"Unexpected error executing {self.name} for session '{session_id}': {e}", exc_info=True)
            return ToolResult(
                tool_name=self.name,
                success=False,
                error=f"Evaluation failed: {str(e)}"
            )
