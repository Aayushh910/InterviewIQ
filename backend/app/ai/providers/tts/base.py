from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseTTSProvider(ABC):
    """
    Abstract Base Class for Text-to-Speech (TTS) Providers in InterviewIQ.
    Defines generic text-to-audio synthesis contract across cloud API and local/mock implementations.
    """

    @abstractmethod
    def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesize input text into audio binary buffer and return normalized dictionary:
        {
            "audio_bytes": bytes,
            "content_type": str,
            "language": str,
            "duration_seconds": float,
            "provider": str
        }
        """
        pass
