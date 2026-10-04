import logging
from typing import Dict, Any
from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.tools.answer_evaluation.schemas import EvaluateAnswerToolInput, EvaluateAnswerToolOutput
from app.ai.evaluation.answer.evaluator import AnswerEvaluator, evaluator_instance

logger = logging.getLogger(__name__)


class EvaluateAnswerTool(BaseTool):
    """
    Tool responsible for evaluating an individual candidate answer across core dimensions.
    Produces answer-level evaluation, not final interview summary scores.
    """
    name: str = "evaluate_answer"
    description: str = (
        "Evaluate a candidate's answer against the interview question across relevance, "
        "correctness, completeness, clarity, and technical depth dimensions."
    )
    input_schema = EvaluateAnswerToolInput
    output_schema = EvaluateAnswerToolOutput
    category: str = "evaluation"

    def execute(self, context: ToolExecutionContext, params: EvaluateAnswerToolInput) -> ToolResult:
        provider_name = context.provider_override or context.metadata.get("provider")
        mock_mode = context.mock_mode or context.metadata.get("mock_mode", "success")

        meta: Dict[str, Any] = {
            "job_role": params.role or "Software Engineer",
            "domain": params.domain or "Frontend",
            "difficulty": params.difficulty or "Medium",
            "interview_type": params.interview_type or "Technical",
            "duration_seconds": params.duration_seconds,
            "mock_mode": mock_mode,
        }

        try:
            evaluator = AnswerEvaluator(provider_name=provider_name) if provider_name else evaluator_instance
            res = evaluator.evaluate(
                question_text=params.question_text,
                answer_text=params.candidate_answer_text,
                interview_meta=meta,
                override_provider=provider_name
            )

            output = EvaluateAnswerToolOutput(
                relevance_score=res.get("relevance_score", 0.0),
                correctness_score=res.get("correctness_score", 0.0),
                completeness_score=res.get("completeness_score", 0.0),
                clarity_score=res.get("clarity_score", 0.0),
                technical_depth_score=res.get("technical_depth_score", 0.0),
                overall_score=res.get("overall_score", 0.0),
                communication_score=res.get("communication_score", 0.0),
                grammar_score=res.get("grammar_score", 0.0),
                timing_score=res.get("timing_score", 0.0),
                strengths=res.get("strengths") or [],
                improvements=res.get("improvements") or [],
                summary=res.get("summary", "Evaluation complete."),
                recommended_response=res.get("recommended_response"),
                evaluator_provider=res.get("evaluator_provider", provider_name or "heuristic")
            )

            return ToolResult(
                tool_name=self.name,
                success=True,
                data=output.model_dump()
            )
        except Exception as e:
            logger.error(f"Error in {self.name}: {e}", exc_info=True)
            return ToolResult(
                tool_name=self.name,
                success=False,
                error=f"Answer evaluation failed: {str(e)}"
            )
