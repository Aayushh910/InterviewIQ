import os
import logging
from typing import Dict, Any, List
from faster_whisper import WhisperModel
from app.ai.speech.config import (
    STT_MODEL_SIZE,
    STT_DEVICE,
    STT_COMPUTE_TYPE,
    STT_LANGUAGE,
)

logger = logging.getLogger(__name__)


class SpeechTranscriberManager:
    """
    Singleton manager wrapping faster_whisper.WhisperModel instance.
    Prevents costly re-initialization on every API request.
    """
    _instance: "SpeechTranscriberManager" = None

    def __init__(self):
        logger.info(
            f"Initializing WhisperModel(model_size='{STT_MODEL_SIZE}', device='{STT_DEVICE}', compute_type='{STT_COMPUTE_TYPE}')"
        )
        self.model = WhisperModel(
            STT_MODEL_SIZE,
            device=STT_DEVICE,
            compute_type=STT_COMPUTE_TYPE
        )
        logger.info("WhisperModel initialized successfully.")

    @classmethod
    def get_instance(cls) -> "SpeechTranscriberManager":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def transcribe(self, audio_path: str, language: str = None) -> Dict[str, Any]:
        """
        Transcribe an audio file and return normalized transcription text, language, duration, and segments.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found at '{audio_path}'")

        target_lang = language or STT_LANGUAGE
        segments_gen, info = self.model.transcribe(
            audio_path,
            language=target_lang,
            beam_size=1
        )

        segments_list: List[Dict[str, Any]] = []
        text_parts: List[str] = []

        for seg in segments_gen:
            clean_text = seg.text.strip()
            if clean_text:
                text_parts.append(clean_text)
                segments_list.append({
                    "start": round(float(seg.start), 2),
                    "end": round(float(seg.end), 2),
                    "text": clean_text
                })

        full_text = " ".join(text_parts).strip()
        duration = round(float(info.duration), 2) if info.duration else 0.0
        lang = info.language or target_lang or "en"

        return {
            "text": full_text,
            "language": lang,
            "duration_seconds": duration,
            "segments": segments_list if segments_list else None
        }
