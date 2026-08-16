import os
import tempfile
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.ai.speech.audio import validate_audio_buffer
from app.ai.providers.stt.factory import get_stt_provider
from app.schemas.speech import SpeechTranscriptionResponse
from app.schemas.answer import AnswerCreate, AnswerSubmitResponse
from app.services.session_service import get_session_by_id
import app.services.answer_service as answer_service

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".webm", ".wav", ".mp3", ".m4a", ".mp4", ".ogg", ".aac", ".flac"}


class SpeechToTextService:
    """
    Dedicated Business Service for Phase 3 Speech-to-Text Processing.
    Handles audio buffer validation, temporary file lifecycle, STT provider delegation,
    and transcript normalization.
    """

    @staticmethod
    def transcribe(
        audio_bytes: bytes,
        filename: str = "",
        content_type: str = "",
        provider_name: Optional[str] = None,
        mock_mode: Optional[str] = None
    ) -> SpeechTranscriptionResponse:
        """
        Validate uploaded audio buffer, process audio using configured STT provider,
        and return normalized SpeechTranscriptionResponse.
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

            stt_provider = get_stt_provider(provider_name=provider_name, mock_mode=mock_mode)
            raw_result = stt_provider.transcribe(tmp_path)

            raw_text = (raw_result.get("text") or "").strip()
            result_dict = {
                "text": raw_text,
                "transcript": raw_text,
                "language": raw_result.get("language") or "en",
                "duration_seconds": float(raw_result.get("duration_seconds") or 0.0),
                "provider": raw_result.get("provider") or "groq"
            }

            return SpeechTranscriptionResponse.model_validate(result_dict)

        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception as e:
                    logger.warning(f"Failed to clean up temporary audio file '{tmp_path}': {e}")


def transcribe_speech_audio(
    audio_bytes: bytes,
    filename: str = "",
    content_type: str = "",
    provider_name: Optional[str] = None,
    mock_mode: Optional[str] = None
) -> SpeechTranscriptionResponse:
    """
    Module helper function delegating to SpeechToTextService.transcribe.
    """
    return SpeechToTextService.transcribe(
        audio_bytes=audio_bytes,
        filename=filename,
        content_type=content_type,
        provider_name=provider_name,
        mock_mode=mock_mode
    )


def submit_audio_answer(
    db: Session,
    session_id: str,
    question_id: str,
    user_id: str,
    audio_bytes: bytes,
    filename: str = "",
    content_type: str = "",
    provider_name: Optional[str] = None,
    mock_mode: Optional[str] = None
) -> AnswerSubmitResponse:
    """
    Complete Voice Interview Answer Submission Pipeline:
    1. Verify user session ownership.
    2. Transcribe candidate audio recording using STT Service.
    3. Validate transcript non-emptiness.
    4. Save Answer record in database.
    5. Trigger Phase 2 Adaptive Follow-Up Question Engine.
    6. Return structured AnswerSubmitResponse.
    """
    # 1. Verify Session Ownership
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        raise KeyError("Session not found or unauthorized access.")

    # 2. Transcribe Audio
    transcription = transcribe_speech_audio(
        audio_bytes=audio_bytes,
        filename=filename,
        content_type=content_type,
        provider_name=provider_name,
        mock_mode=mock_mode
    )
    clean_transcript = (transcription.text or "").strip()

    if not clean_transcript:
        raise ValueError("Speech transcription yielded an empty or un-substantive response.")

    # 3. Create/Update Answer & Trigger Phase 2 Follow-Up Engine Pipeline
    answer_in = AnswerCreate(
        question_id=question_id,
        answer_text=clean_transcript
    )

    result = answer_service.submit_answer(
        db, session_id=session_id, user_id=user_id, data=answer_in
    )

    return result
