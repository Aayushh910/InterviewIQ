import logging
from typing import Dict, Any, Optional
from app.ai.evaluation.answer.config import (
    EVALUATION_WEIGHT_RELEVANCE,
    EVALUATION_WEIGHT_CORRECTNESS,
    EVALUATION_WEIGHT_COMPLETENESS,
    EVALUATION_WEIGHT_CLARITY,
    EVALUATION_WEIGHT_TECHNICAL_DEPTH,
    EVALUATION_PROVIDER,
)
from app.ai.evaluation.answer.heuristic_provider import HeuristicAnswerEvaluationProvider

logger = logging.getLogger(__name__)


def clamp_score(val: Any) -> float:
    try:
        f = float(val)
        return max(0.0, min(100.0, f))
    except Exception:
        return 0.0


class AnswerEvaluator:
    """
    Answer evaluation manager enforcing score bounds [0.0, 100.0] and applying
    deterministic weighted overall score formula across evaluation dimensions.
    """

    def __init__(self):
        if EVALUATION_PROVIDER.lower() == "heuristic":
            self.provider = HeuristicAnswerEvaluationProvider()
        else:
            self.provider = HeuristicAnswerEvaluationProvider()

    def evaluate(
        self,
        question_text: str,
        answer_text: str,
        interview_meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        raw_res = self.provider.evaluate_answer(question_text, answer_text, interview_meta)

        relevance = clamp_score(raw_res.get("relevance", 0.0))
        correctness = clamp_score(raw_res.get("correctness", 0.0))
        completeness = clamp_score(raw_res.get("completeness", 0.0))
        clarity = clamp_score(raw_res.get("clarity", 0.0))
        technical_depth = clamp_score(raw_res.get("technical_depth", 0.0))

        # Deterministic Backend Weighted Formula calculation
        overall = (
            relevance * EVALUATION_WEIGHT_RELEVANCE +
            correctness * EVALUATION_WEIGHT_CORRECTNESS +
            completeness * EVALUATION_WEIGHT_COMPLETENESS +
            clarity * EVALUATION_WEIGHT_CLARITY +
            technical_depth * EVALUATION_WEIGHT_TECHNICAL_DEPTH
        )
        overall_score = round(max(0.0, min(100.0, overall)), 2)

        strengths = raw_res.get("strengths") or []
        improvements = raw_res.get("improvements") or []
        summary = raw_res.get("summary") or "Answer evaluation complete."

        return {
            "relevance_score": relevance,
            "correctness_score": correctness,
            "completeness_score": completeness,
            "clarity_score": clarity,
            "technical_depth_score": technical_depth,
            "overall_score": overall_score,
            "strengths": strengths if isinstance(strengths, list) else [str(strengths)],
            "improvements": improvements if isinstance(improvements, list) else [str(improvements)],
            "summary": summary,
            "evaluator_provider": EVALUATION_PROVIDER
        }


evaluator_instance = AnswerEvaluator()
