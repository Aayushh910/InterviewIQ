import os
import tempfile
from typing import Dict, Any
from app.ai.speech.audio import validate_audio_buffer
from app.ai.speech.transcriber import SpeechTranscriberManager
from app.schemas.speech import SpeechTranscriptionResponse

ALLOWED_EXTENSIONS = {".webm", ".wav", ".mp3", ".m4a", ".mp4", ".ogg", ".aac", ".flac"}


def transcribe_speech_audio(
    audio_bytes: bytes,
    filename: str = "",
    content_type: str = ""
) -> SpeechTranscriptionResponse:
    """
    Validate uploaded audio buffer, write to a temporary file, execute speech-to-text transcription,
    clean up temporary storage, and return structured transcription schema.
    """
    is_valid, err_msg = validate_audio_buffer(audio_bytes, filename=filename, content_type=content_type)
    if not is_valid:
        raise ValueError(err_msg)

    ext = os.path.splitext(filename)[1].lower() if filename else ""
    suffix = ext if ext in ALLOWED_EXTENSIONS else ".webm"

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        transcriber = SpeechTranscriberManager.get_instance()
        raw_result = transcriber.transcribe(tmp_path)

        return SpeechTranscriptionResponse.model_validate(raw_result)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
