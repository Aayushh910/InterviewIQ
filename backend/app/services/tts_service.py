import logging
from typing import Dict, Any, Optional
from app.ai.providers.tts.factory import get_tts_provider

logger = logging.getLogger(__name__)


class TextToSpeechService:
    """
    Dedicated Business Service for Phase 4 Text-to-Speech Processing.
    Handles text input validation, voice/language options, TTS provider delegation, and audio payload formatting.
    """

    @staticmethod
    def synthesize(
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None,
        provider_name: Optional[str] = None,
        mock_mode: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate input question text, delegate to configured TTS provider, and return synthesized audio buffer dictionary.
        """
        clean_text = (text or "").strip()
        if not clean_text:
            raise ValueError("Input text for speech synthesis cannot be empty.")

        if len(clean_text) > 1000:
            raise ValueError("Text exceeds maximum allowed limit of 1000 characters for speech synthesis.")

        tts_provider = get_tts_provider(provider_name=provider_name, mock_mode=mock_mode)
        result = tts_provider.synthesize(text=clean_text, voice=voice, language=language)

        return result
