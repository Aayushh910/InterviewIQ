import logging
from typing import Dict, Any, Optional
from app.ai.evaluation.answer.provider import BaseAnswerEvaluationProvider
from app.ai.evaluation.answer.exceptions import AIProviderError, AIProviderTimeoutError

logger = logging.getLogger(__name__)


class MockAnswerEvaluationProvider(BaseAnswerEvaluationProvider):
    """
    Mock AI Provider used for unit/integration testing of edge cases:
    valid structured responses, provider timeouts, provider failures, and malformed outputs.
    """

    def __init__(self, mode: str = "success"):
        """
        :param mode: 'success', 'timeout', 'failure', or 'malformed'
        """
        self.mode = mode

    def evaluate_answer(
        self,
        question_text: str,
        answer_text: str,
        interview_meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        logger.info(f"MockAnswerEvaluationProvider executing in '{self.mode}' mode.")

        if self.mode == "timeout":
            raise AIProviderTimeoutError("AI Provider timed out after 10.0 seconds")
        
        if self.mode == "failure":
            raise AIProviderError("AI Provider API key missing or provider unavailable")

        if self.mode == "malformed":
            # Return corrupt structure missing required keys and invalid data types
            return {
                "relevance": "INVALID_SCORE",
                "strengths": "Not a list",
                # missing correctness, completeness, clarity, technical_depth, summary
            }

        # Success mode
        return {
            "relevance": 85.0,
            "correctness": 88.0,
            "completeness": 80.0,
            "clarity": 90.0,
            "technical_depth": 82.0,
            "communication": 88.0,
            "confidence": 0.85,
            "strengths": [
                "Direct and clear response to the question prompt.",
                "Good technical accuracy on core concepts."
            ],
            "improvements": [
                "Provide more concrete system architecture examples.",
                "Mention quantitative outcomes or benchmarks."
            ],
            "summary": "Mock evaluation: Strong candidate response demonstrating good fundamental knowledge."
        }
