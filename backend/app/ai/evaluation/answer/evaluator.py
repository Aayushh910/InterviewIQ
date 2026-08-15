import logging
from typing import Dict, Any, Optional
from app.core.config import settings
from app.ai.evaluation.answer.config import (
    EVALUATION_WEIGHT_RELEVANCE,
    EVALUATION_WEIGHT_CORRECTNESS,
    EVALUATION_WEIGHT_COMPLETENESS,
    EVALUATION_WEIGHT_CLARITY,
    EVALUATION_WEIGHT_TECHNICAL_DEPTH,
)
from app.ai.evaluation.answer.provider import BaseAnswerEvaluationProvider
from app.ai.evaluation.answer.heuristic_provider import HeuristicAnswerEvaluationProvider
from app.ai.evaluation.answer.mock_provider import MockAnswerEvaluationProvider
from app.ai.evaluation.answer.llm_provider import LLMAnswerEvaluationProvider
from app.ai.evaluation.answer.exceptions import AIValidationError, AIProviderError, AIProviderTimeoutError

logger = logging.getLogger(__name__)


def clamp_score(val: Any, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """
    Safely parse and clamp numeric evaluation scores within valid bounds.
    """
    try:
        f = float(val)
        return max(min_val, min(max_val, f))
    except (ValueError, TypeError):
        return min_val


class AnswerEvaluator:
    """
    Core AI Evaluation Service orchestrating provider abstraction, score validation,
    bounding, deterministic weighting, and safe exception propagation.
    """

    def __init__(self, provider_name: Optional[str] = None):
        selected = (provider_name or getattr(settings, "AI_PROVIDER", None) or getattr(settings, "EVALUATION_PROVIDER", "heuristic")).lower()
        self.provider_name = selected
        self.provider = self._resolve_provider(selected)

    def _resolve_provider(self, provider_name: str, mock_mode: str = "success") -> BaseAnswerEvaluationProvider:
        if provider_name == "mock":
            return MockAnswerEvaluationProvider(mode=mock_mode)
        elif provider_name in ["openai", "llm", "gemini", "ollama"]:
            return LLMAnswerEvaluationProvider()
        else:
            return HeuristicAnswerEvaluationProvider()

    def evaluate(
        self,
        question_text: str,
        answer_text: str,
        interview_meta: Optional[Dict[str, Any]] = None,
        override_provider: Optional[str] = None
    ) -> Dict[str, Any]:
        meta = interview_meta or {}
        provider_key = (override_provider or meta.get("provider") or self.provider_name).lower()
        mock_mode = meta.get("mock_mode", "success")

        provider = self._resolve_provider(provider_key, mock_mode=mock_mode)
        logger.info(f"Evaluating answer using AI provider: '{provider_key}'")

        # 1. Execute Provider Evaluation
        try:
            raw_res = provider.evaluate_answer(question_text, answer_text, meta)
        except (AIProviderError, AIProviderTimeoutError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error in AI provider '{provider_key}': {e}", exc_info=True)
            raise AIProviderError(f"AI Provider '{provider_key}' failed: {str(e)}")

        # 2. Strict AI Output Response Validation
        if not isinstance(raw_res, dict):
            logger.error("AI provider returned non-dictionary output")
            raise AIValidationError("AI provider response must be a valid JSON object.")

        # Check required fields exist or can be parsed
        required_keys = ["relevance", "correctness", "completeness", "clarity", "technical_depth"]
        for key in required_keys:
            if key not in raw_res and f"{key}_score" not in raw_res:
                logger.warning(f"AI response missing standard key '{key}'. Applying 0.0 default.")

        # 3. Numeric Score Validation & Clamping
        relevance = clamp_score(raw_res.get("relevance", raw_res.get("relevance_score", 0.0)))
        correctness = clamp_score(raw_res.get("correctness", raw_res.get("correctness_score", 0.0)))
        completeness = clamp_score(raw_res.get("completeness", raw_res.get("completeness_score", 0.0)))
        clarity = clamp_score(raw_res.get("clarity", raw_res.get("clarity_score", 0.0)))
        technical_depth = clamp_score(raw_res.get("technical_depth", raw_res.get("technical_depth_score", 0.0)))

        # Derived communication & confidence scores
        communication = clamp_score(raw_res.get("communication", (clarity + completeness) / 2.0))
        confidence = clamp_score(raw_res.get("confidence", 0.85), min_val=0.0, max_val=1.0)

        # 4. Deterministic Weighted Formula Calculation
        weighted_sum = (
            relevance * EVALUATION_WEIGHT_RELEVANCE +
            correctness * EVALUATION_WEIGHT_CORRECTNESS +
            completeness * EVALUATION_WEIGHT_COMPLETENESS +
            clarity * EVALUATION_WEIGHT_CLARITY +
            technical_depth * EVALUATION_WEIGHT_TECHNICAL_DEPTH
        )
        overall_score = round(max(0.0, min(100.0, weighted_sum)), 2)

        # 5. Format Strengths, Improvements, Summary
        raw_strengths = raw_res.get("strengths")
        if isinstance(raw_strengths, list):
            strengths = [str(s).strip() for s in raw_strengths if s]
        elif raw_strengths:
            strengths = [str(raw_strengths).strip()]
        else:
            strengths = ["Structured candidate answer recorded."]

        raw_improvements = raw_res.get("improvements")
        if isinstance(raw_improvements, list):
            improvements = [str(i).strip() for i in raw_improvements if i]
        elif raw_improvements:
            improvements = [str(raw_improvements).strip()]
        else:
            improvements = ["Provide more technical depth or implementation details."]

        summary_val = raw_res.get("summary")
        if isinstance(summary_val, str) and summary_val.strip():
            summary = summary_val.strip()
        else:
            summary = "Candidate answer evaluation complete."

        return {
            "relevance_score": relevance,
            "correctness_score": correctness,
            "completeness_score": completeness,
            "clarity_score": clarity,
            "technical_depth_score": technical_depth,
            "communication_score": communication,
            "confidence_score": confidence,
            "overall_score": overall_score,
            "strengths": strengths,
            "improvements": improvements,
            "summary": summary,
            "evaluator_provider": provider_key
        }


evaluator_instance = AnswerEvaluator()
