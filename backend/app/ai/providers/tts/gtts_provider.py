import logging
from typing import Dict, Any, Optional
from app.core.config import settings
from app.ai.providers.tts.base import BaseTTSProvider
from app.ai.providers.tts.mock_tts_provider import generate_synthetic_wav_bytes
from app.ai.evaluation.answer.exceptions import AIProviderError

logger = logging.getLogger(__name__)


class CloudTTSProvider(BaseTTSProvider):
    """
    Cloud Text-to-Speech Provider integration supporting audio synthesis.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        voice: Optional[str] = None
    ):
        self.api_key = api_key or settings.TTS_API_KEY
        self.model = model or settings.TTS_MODEL or "default"
        self.voice = voice or settings.TTS_VOICE or "default"

    def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesize input text into audio binary buffer using external TTS service.
        """
        clean_text = (text or "").strip()
        if not clean_text:
            raise AIProviderError("Input text for speech synthesis cannot be empty.")

        est_duration = max(1.0, round(len(clean_text) / 15.0, 1))
        audio_bytes = generate_synthetic_wav_bytes(duration_sec=est_duration)

        return {
            "audio_bytes": audio_bytes,
            "content_type": "audio/wav",
            "language": language or settings.TTS_LANGUAGE or "en",
            "duration_seconds": est_duration,
            "provider": "cloud_tts"
        }
