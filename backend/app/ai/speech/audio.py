import os
from typing import Tuple
from app.ai.speech.config import MAX_AUDIO_SIZE_MB

ALLOWED_AUDIO_MIME_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/m4a",
    "audio/mp4",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
    "video/webm",  # Chrome sometimes sends MediaRecorder WebM audio with video/webm MIME
}

ALLOWED_AUDIO_EXTENSIONS = {
    ".webm", ".wav", ".mp3", ".m4a", ".mp4", ".ogg", ".aac", ".flac"
}


def validate_audio_buffer(
    audio_bytes: bytes,
    filename: str = "",
    content_type: str = ""
) -> Tuple[bool, str]:
    """
    Validate audio buffer existence, file size limits, and allowed audio formats.
    """
    if not audio_bytes or len(audio_bytes) == 0:
        return False, "Uploaded audio buffer is empty."

    max_bytes = MAX_AUDIO_SIZE_MB * 1024 * 1024
    if len(audio_bytes) > max_bytes:
        return False, f"Uploaded audio file exceeds maximum allowed limit of {MAX_AUDIO_SIZE_MB} MB."

    ext = os.path.splitext(filename)[1].lower() if filename else ""
    low_type = content_type.lower() if content_type else ""

    if low_type and low_type not in ALLOWED_AUDIO_MIME_TYPES and ext not in ALLOWED_AUDIO_EXTENSIONS:
        return False, f"Unsupported audio format '{content_type or ext}'. Must be WebM, WAV, MP3, M4A, or OGG."

    return True, ""
