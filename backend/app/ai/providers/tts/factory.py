import logging
from typing import Optional
from app.core.config import settings
from app.ai.providers.tts.base import BaseTTSProvider
from app.ai.providers.tts.mock_tts_provider import MockTTSProvider
from app.ai.providers.tts.gtts_provider import CloudTTSProvider

logger = logging.getLogger(__name__)


def get_tts_provider(
    provider_name: Optional[str] = None,
    mock_mode: Optional[str] = None
) -> BaseTTSProvider:
    """
    Factory function to instantiate TTS Provider based on configuration or explicit overrides.
    """
    target = (provider_name or settings.TTS_PROVIDER or "mock").lower().strip()

    if mock_mode or target == "mock":
        mode = mock_mode or "success"
        logger.info(f"Instantiating MockTTSProvider (mock_mode: '{mode}')")
        return MockTTSProvider(mock_mode=mode)

    if target in ["cloud", "gtts", "edge_tts", "openai"]:
        logger.info("Instantiating CloudTTSProvider")
        return CloudTTSProvider()

    logger.warning(f"Unrecognized TTS provider '{target}'. Falling back to MockTTSProvider.")
    return MockTTSProvider()
