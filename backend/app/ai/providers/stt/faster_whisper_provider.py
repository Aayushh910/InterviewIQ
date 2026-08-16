import os
import logging
from typing import Dict, Any, Optional
from app.ai.providers.stt.base import BaseSTTProvider
from app.ai.speech.transcriber import SpeechTranscriberManager

logger = logging.getLogger(__name__)


class FasterWhisperSTTProvider(BaseSTTProvider):
    """
    Local Speech-to-Text Provider wrapping faster_whisper SpeechTranscriberManager singleton.
    Provides offline transcription fallback.
    """

    def transcribe(self, audio_path: str, language: Optional[str] = None) -> Dict[str, Any]:
        """
        Transcribe local audio file using faster_whisper engine.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found at '{audio_path}'")

        manager = SpeechTranscriberManager.get_instance()
        raw_res = manager.transcribe(audio_path, language=language)

        return {
            "text": (raw_res.get("text") or "").strip(),
            "language": raw_res.get("language") or "en",
            "duration_seconds": float(raw_res.get("duration_seconds") or 0.0),
            "provider": "faster_whisper"
        }
