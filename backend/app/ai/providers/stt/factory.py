import logging
from typing import Optional
from app.core.config import settings
from app.ai.providers.stt.base import BaseSTTProvider
from app.ai.providers.stt.groq_stt_provider import GroqWhisperSTTProvider
from app.ai.providers.stt.faster_whisper_provider import FasterWhisperSTTProvider
from app.ai.providers.stt.mock_stt_provider import MockSTTProvider

logger = logging.getLogger(__name__)


def get_stt_provider(
    provider_name: Optional[str] = None,
    mock_mode: Optional[str] = None
) -> BaseSTTProvider:
    """
    Factory function to instantiate STT Provider based on configuration or explicit overrides.
    """
    target = (provider_name or settings.STT_PROVIDER or "groq").lower().strip()

    if mock_mode or target == "mock":
        mode = mock_mode or "success"
        logger.info(f"Instantiating MockSTTProvider (mock_mode: '{mode}')")
        return MockSTTProvider(mock_mode=mode)

    if target == "groq":
        logger.info("Instantiating GroqWhisperSTTProvider")
        return GroqWhisperSTTProvider()

    if target in ["faster_whisper", "local", "whisper"]:
        logger.info("Instantiating FasterWhisperSTTProvider")
        return FasterWhisperSTTProvider()

    logger.warning(f"Unrecognized STT provider '{target}'. Falling back to GroqWhisperSTTProvider.")
    if settings.STT_API_KEY or settings.AI_API_KEY:
        return GroqWhisperSTTProvider()

    return MockSTTProvider()
