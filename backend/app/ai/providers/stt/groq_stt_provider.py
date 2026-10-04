import os
import logging
from typing import Dict, Any, Optional
import httpx

from app.core.config import settings
from app.ai.providers.stt.base import BaseSTTProvider
from app.ai.evaluation.answer.exceptions import AIProviderError, AIProviderTimeoutError, AIValidationError

logger = logging.getLogger(__name__)


class GroqWhisperSTTProvider(BaseSTTProvider):
    """
    Groq Cloud Speech-to-Text Provider using Groq's high-speed Whisper API endpoint.
    Endpoint: https://api.groq.com/openai/v1/audio/transcriptions
    Model: whisper-large-v3-turbo (configurable)
    """

    GROQ_STT_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None
    ):
        self.api_key = api_key or settings.STT_API_KEY or settings.AI_API_KEY
        self.model = model or settings.STT_MODEL or "whisper-large-v3-turbo"
        self.timeout = timeout or settings.STT_TIMEOUT_SECONDS or 30.0

    def transcribe(self, audio_path: str, language: Optional[str] = None) -> Dict[str, Any]:
        """
        Send audio file to Groq Whisper API and parse structured transcription response.
        """
        if not self.api_key:
            logger.error("API key is not configured for GroqWhisperSTTProvider.")
            raise AIProviderError("Groq STT API key is missing or not configured.")

        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found at '{audio_path}'")

        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }

        filename = os.path.basename(audio_path)

        try:
            logger.info(f"Initiating Groq Whisper STT API request (model: '{self.model}', timeout: {self.timeout}s)")
            with open(audio_path, "rb") as audio_file:
                files = {
                    "file": (filename, audio_file, "application/octet-stream")
                }
                data = {
                    "model": self.model,
                    "response_format": "verbose_json"
                }
                if language:
                    data["language"] = language

                with httpx.Client(timeout=self.timeout) as client:
                    resp = client.post(self.GROQ_STT_API_URL, headers=headers, files=files, data=data)

            if resp.status_code == 401:
                logger.error("Groq STT API authentication failure (HTTP 401)")
                raise AIProviderError("Groq STT API authentication failed. Invalid API key.")

            if resp.status_code == 429:
                logger.error("Groq STT API rate limit exceeded (HTTP 429)")
                raise AIProviderError("Groq STT API rate limit exceeded. Please try again shortly.")

            if resp.status_code != 200:
                logger.error(f"Groq STT API HTTP {resp.status_code}: {resp.text}")
                raise AIProviderError(f"Groq STT API returned HTTP status {resp.status_code}")

            result_data = resp.json()
            raw_text = (result_data.get("text") or "").strip()

            if not raw_text:
                logger.warning("Groq STT API returned empty transcription text.")

            duration = float(result_data.get("duration") or 0.0)
            detected_lang = result_data.get("language") or language or "en"

            return {
                "text": raw_text,
                "language": detected_lang,
                "duration_seconds": round(duration, 2),
                "provider": "groq"
            }

        except httpx.TimeoutException:
            logger.error(f"Groq STT API request timed out after {self.timeout}s")
            raise AIProviderTimeoutError(f"Groq STT provider timed out after {self.timeout} seconds.")
        except httpx.RequestError as e:
            logger.error(f"Network error communicating with Groq STT API: {e}")
            raise AIProviderError("Network connection to Groq STT provider failed.")
