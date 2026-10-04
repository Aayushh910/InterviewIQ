from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseSTTProvider(ABC):
    """
    Abstract Base Class for Speech-to-Text (STT) Providers in InterviewIQ.
    Defines generic audio transcription contract across cloud API and local/mock implementations.
    """

    @abstractmethod
    def transcribe(self, audio_path: str, language: Optional[str] = None) -> Dict[str, Any]:
        """
        Transcribe audio file at audio_path and return normalized dictionary:
        {
            "text": str,
            "language": str,
            "duration_seconds": float,
            "provider": str
        }
        """
        pass
