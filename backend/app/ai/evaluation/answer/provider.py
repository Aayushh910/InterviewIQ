from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseAnswerEvaluationProvider(ABC):
    """
    Abstract interface for answer evaluation providers.
    Supports modular provider replacement (e.g. Heuristic, OpenAI, Anthropic, Ollama).
    """

    @abstractmethod
    def evaluate_answer(
        self,
        question_text: str,
        answer_text: str,
        interview_meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate candidate answer and return dictionary containing 5 raw dimension scores,
        strengths, improvements, and summary.
        """
        pass
