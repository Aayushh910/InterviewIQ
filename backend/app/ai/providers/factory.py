import logging
from typing import Optional
from app.core.config import settings
from app.ai.providers.base import BaseAIProvider
from app.ai.providers.groq_provider import GroqProvider
from app.ai.providers.mock_provider import MockProvider

logger = logging.getLogger(__name__)


def get_ai_provider(provider_name: Optional[str] = None, **kwargs) -> BaseAIProvider:
    """
    Factory function returning the configured AI Provider instance.
    Supports runtime override or settings default (groq, mock, heuristic).
    """
    p_name = (provider_name or settings.AI_PROVIDER or "groq").lower().strip()

    if p_name == "groq":
        logger.info("Instantiating Groq AI Provider")
        return GroqProvider(**kwargs)
    elif p_name in ["mock", "heuristic"]:
        logger.info(f"Instantiating Mock AI Provider (mode: {p_name})")
        mock_mode = kwargs.get("mock_mode", "success")
        return MockProvider(mock_mode=mock_mode)
    else:
        logger.warning(f"Unknown AI Provider '{p_name}'. Falling back to Groq Provider.")
        return GroqProvider(**kwargs)
