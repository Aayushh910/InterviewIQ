import os
import logging
from typing import Dict, Any, Optional
from app.ai.providers.stt.base import BaseSTTProvider
from app.ai.evaluation.answer.exceptions import AIProviderError, AIProviderTimeoutError

logger = logging.getLogger(__name__)


class MockSTTProvider(BaseSTTProvider):
    """
    Deterministic Mock Speech-to-Text Provider for zero-cost offline testing and unit tests.
    Supports mock modes: 'success', 'empty', 'failure', 'timeout'.
    """

    def __init__(self, mock_mode: str = "success"):
        self.mock_mode = mock_mode

    def transcribe(self, audio_path: str, language: Optional[str] = None) -> Dict[str, Any]:
        """
        Simulate audio transcription for mock testing.
        """
        if self.mock_mode == "failure":
            raise AIProviderError("Mock STT provider simulated API failure.")
        if self.mock_mode == "timeout":
            raise AIProviderTimeoutError("Mock STT provider simulated API timeout after 30 seconds.")
        if self.mock_mode == "empty":
            return {
                "text": "",
                "language": language or "en",
                "duration_seconds": 0.0,
                "provider": "mock"
            }

        sample_text = (
            "I would design the system by introducing a Redis caching layer with cache-aside pattern, "
            "implementing database query indexing, and optimizing connection pooling."
        )

        return {
            "text": sample_text,
            "language": language or "en",
            "duration_seconds": 8.5,
            "provider": "mock"
        }
