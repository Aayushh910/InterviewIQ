import os
import tempfile
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.ai.speech.audio import validate_audio_buffer
from app.ai.speech.transcriber import SpeechTranscriberManager
from app.schemas.speech import SpeechTranscriptionResponse
from app.schemas.answer import AnswerCreate, AnswerSubmitResponse
from app.services.session_service import get_session_by_id
import app.services.answer_service as answer_service

logger = logging.getLogger(__name__)

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

        # Sanitize transcript text
        if isinstance(raw_result, dict):
            raw_text = raw_result.get("text", "")
            if isinstance(raw_text, str):
                raw_result["text"] = raw_text.strip()

        return SpeechTranscriptionResponse.model_validate(raw_result)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to remove temporary audio file '{tmp_path}': {e}")


def submit_audio_answer(
    db: Session,
    session_id: str,
    question_id: str,
    user_id: str,
    audio_bytes: bytes,
    filename: str = "",
    content_type: str = ""
) -> AnswerSubmitResponse:
    """
    Complete Voice Interview Pipeline:
    1. Verify user session ownership.
    2. Transcribe candidate audio recording.
    3. Validate transcript non-emptiness.
    4. Save/update Answer record in database.
    5. Trigger Phase 2 Answer Evaluation Engine & adaptive follow-up.
    6. Return structured AnswerSubmitResponse with evaluation & next question info.
    """
    # 1. Verify Session Ownership
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        raise KeyError("Session not found or unauthorized")

    # 2. Transcribe Audio
    transcription = transcribe_speech_audio(audio_bytes, filename=filename, content_type=content_type)
    clean_transcript = (transcription.text or "").strip()

    if not clean_transcript:
        raise ValueError("Speech transcription yielded an empty or un-substantive response.")

    # 3. Create/Update Answer & Trigger Phase 2 Evaluation
    answer_in = AnswerCreate(
        question_id=question_id,
        answer_text=clean_transcript
    )

    result = answer_service.submit_answer(
        db, session_id=session_id, user_id=user_id, data=answer_in
    )

    return result
