import logging
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.interview import Interview
from app.schemas.speech import SpeechTranscriptionResponse
from app.schemas.speech_synthesis import SpeechSynthesisRequest
from app.services.speech_service import transcribe_speech_audio
from app.services.tts_service import TextToSpeechService
from app.ai.evaluation.answer.exceptions import (
    AIProviderError,
    AIProviderTimeoutError,
    AIValidationError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/transcribe", response_model=SpeechTranscriptionResponse, status_code=status.HTTP_200_OK)
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    interview_id: Optional[str] = Form(None),
    question_id: Optional[str] = Form(None),
    provider: Optional[str] = Form(None),
    mock_mode: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Phase 3: Speech-to-Text Transcription Endpoint.
    Transcribes candidate microphone audio recording using configured STT provider (Groq Whisper / FasterWhisper / Mock).
    Requires JWT authentication. Performs ownership verification if interview_id is provided.
    """
    logger.info(f"Received speech transcription request for user '{current_user.id}' (filename: '{file.filename}')")
    try:
        # Verify ownership if interview_id is provided
        if interview_id:
            interview = db.query(Interview).filter(
                Interview.id == interview_id,
                Interview.user_id == current_user.id
            ).first()
            if not interview:
                logger.warning(f"Interview '{interview_id}' not found or unauthorized for user '{current_user.id}'")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Interview not found or unauthorized access."
                )

        contents = await file.read()
        filename = file.filename or ""
        content_type = file.content_type or ""

        # Fallback MIME detection by file extension if content_type is generic application/octet-stream
        if filename and (not content_type or content_type == "application/octet-stream"):
            lower_name = filename.lower()
            if lower_name.endswith(".webm"):
                content_type = "audio/webm"
            elif lower_name.endswith(".wav"):
                content_type = "audio/wav"
            elif lower_name.endswith(".mp3"):
                content_type = "audio/mp3"
            elif lower_name.endswith(".m4a"):
                content_type = "audio/m4a"
            elif lower_name.endswith(".ogg"):
                content_type = "audio/ogg"

        result = transcribe_speech_audio(
            contents,
            filename=filename,
            content_type=content_type,
            provider_name=provider,
            mock_mode=mock_mode
        )
        return result

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Speech transcription validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AIValidationError as e:
        logger.error(f"STT provider output validation failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed STT response: {str(e)}"
        )
    except AIProviderTimeoutError as e:
        logger.error(f"STT provider timeout: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Speech-to-text transcription service timed out. Please try again."
        )
    except AIProviderError as e:
        logger.error(f"STT provider failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Speech-to-text service provider unavailable."
        )
    except Exception as e:
        logger.error(f"Unexpected speech transcription error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred during speech-to-text processing."
        )


@router.post("/synthesize", status_code=status.HTTP_200_OK)
def synthesize_speech_endpoint(
    req: SpeechSynthesisRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Phase 4: Text-to-Speech Synthesis Endpoint.
    Converts interview question text into spoken audio binary payload.
    Requires JWT authentication. Returns Response with audio/wav media type.
    """
    logger.info(f"Received speech synthesis request for user '{current_user.id}' (text_len: {len(req.text)})")
    try:
        res = TextToSpeechService.synthesize(
            text=req.text,
            voice=req.voice,
            language=req.language,
            provider_name=req.provider,
            mock_mode=req.mock_mode
        )
        audio_bytes = res.get("audio_bytes") or b""
        content_type = res.get("content_type") or "audio/wav"
        provider_used = res.get("provider") or "mock"
        duration_sec = str(res.get("duration_seconds") or 1.5)

        headers = {
            "X-TTS-Provider": provider_used,
            "X-TTS-Duration-Seconds": duration_sec,
            "Cache-Control": "public, max-age=86400"
        }

        return Response(
            content=audio_bytes,
            media_type=content_type,
            headers=headers
        )

    except ValueError as e:
        logger.warning(f"Speech synthesis validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AIProviderTimeoutError as e:
        logger.error(f"TTS provider timeout: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Text-to-speech synthesis service timed out. Please try again."
        )
    except AIProviderError as e:
        logger.error(f"TTS provider failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Text-to-speech service provider unavailable."
        )
    except Exception as e:
        logger.error(f"Unexpected speech synthesis error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred during text-to-speech processing."
        )
