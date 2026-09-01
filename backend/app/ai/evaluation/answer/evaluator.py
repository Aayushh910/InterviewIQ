import logging
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.scoring_config import (
    clamp_score,
    calculate_timing_score,
    calculate_grammar_score,
    calculate_weighted_overall_score,
)
from app.ai.evaluation.answer.provider import BaseAnswerEvaluationProvider
from app.ai.evaluation.answer.heuristic_provider import HeuristicAnswerEvaluationProvider
from app.ai.evaluation.answer.mock_provider import MockAnswerEvaluationProvider
from app.ai.evaluation.answer.llm_provider import LLMAnswerEvaluationProvider
from app.ai.evaluation.answer.exceptions import AIValidationError, AIProviderError, AIProviderTimeoutError

logger = logging.getLogger(__name__)


class AnswerEvaluator:
    """
    Core AI Evaluation Service orchestrating provider abstraction, score validation,
    bounding, deterministic 7-dimension weighting, and safe exception propagation.
    """

    def __init__(self, provider_name: Optional[str] = None):
        selected = (provider_name or getattr(settings, "EVALUATION_PROVIDER", None) or getattr(settings, "AI_PROVIDER", "heuristic")).lower()
        self.provider_name = selected
        self.provider = self._resolve_provider(selected)

    def _resolve_provider(self, provider_name: str, mock_mode: str = "success") -> BaseAnswerEvaluationProvider:
        if provider_name == "mock":
            return MockAnswerEvaluationProvider(mode=mock_mode)
        elif provider_name in ["openai", "llm", "gemini", "ollama", "groq"]:
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

        # 3. Numeric Score Validation & Clamping for 7 Core Dimensions
        relevance = clamp_score(raw_res.get("relevance", raw_res.get("relevance_score", 0.0)))
        correctness = clamp_score(raw_res.get("correctness", raw_res.get("correctness_score", 0.0)))
        completeness = clamp_score(raw_res.get("completeness", raw_res.get("completeness_score", 0.0)))
        clarity = clamp_score(raw_res.get("clarity", raw_res.get("clarity_score", 0.0)))
        technical_depth = clamp_score(
            raw_res.get("technical_accuracy",
            raw_res.get("technical_accuracy_score",
            raw_res.get("technical_depth",
            raw_res.get("technical_depth_score", 0.0))))
        )

        words = len((answer_text or "").split())
        duration = meta.get("duration_seconds")

        # Grammar evaluation
        grammar = clamp_score(
            raw_res.get("grammar", raw_res.get("grammar_score", calculate_grammar_score(answer_text)))
        )

        # Timing evaluation
        timing = clamp_score(
            raw_res.get("timing", raw_res.get("timing_score", calculate_timing_score(duration, words, answer_text)))
        )

        # Derived communication & confidence scores
        communication = clamp_score(
            raw_res.get("communication", raw_res.get("communication_score", (clarity + completeness) / 2.0))
        )
        confidence = clamp_score(raw_res.get("confidence", raw_res.get("confidence_score", 0.85)), min_val=0.0, max_val=1.0)

        # 4. Deterministic Weighted Formula Calculation
        q_type = meta.get("question_type") or meta.get("interview_type") or "Technical"
        dim_map = {
            "correctness": correctness,
            "relevance": relevance,
            "technical_accuracy": technical_depth,
            "completeness": completeness,
            "communication": communication,
            "grammar": grammar,
            "timing": timing,
        }

        overall_score = calculate_weighted_overall_score(dim_map, question_type=q_type)

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
            "technical_accuracy_score": technical_depth,
            "communication_score": communication,
            "grammar_score": grammar,
            "timing_score": timing,
            "confidence_score": confidence,
            "overall_score": overall_score,
            "strengths": strengths,
            "improvements": improvements,
            "summary": summary,
            "evaluator_provider": provider_key
        }


evaluator_instance = AnswerEvaluator()
