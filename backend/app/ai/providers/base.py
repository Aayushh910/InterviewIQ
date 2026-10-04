from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple


class BaseAIProvider(ABC):
    """
    Abstract Base Class for external AI providers in InterviewIQ.
    Defines generic completion generation and question generation contracts.
    """

    @abstractmethod
    def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = True
    ) -> Dict[str, Any]:
        """
        Generate raw text or structured JSON completion from external AI provider.
        """
        pass

    @abstractmethod
    def generate_questions(
        self,
        interview_meta: Dict[str, Any],
        number_of_questions: int
    ) -> List[Dict[str, Any]]:
        """
        Generate interview questions tailored to candidate interview configuration.
        """
        pass

    @abstractmethod
    def generate_follow_up(
        self,
        interview_meta: Dict[str, Any],
        question_text: str,
        answer_text: str,
        previous_context: Optional[List[Dict[str, str]]] = None,
        follow_up_depth: int = 0
    ) -> Tuple[bool, str, Optional[str], Optional[str]]:
        """
        Analyze candidate answer and generate adaptive follow-up decision tuple:
        (should_follow_up, reason, follow_up_question, follow_up_type).
        """
        pass

    def generate_chat_with_tools(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = "auto",
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """
        Execute chat completion with tool calling support.
        Returns dict with keys: 'content', 'tool_calls', 'finish_reason'.
        """
        return {"content": None, "tool_calls": []}


