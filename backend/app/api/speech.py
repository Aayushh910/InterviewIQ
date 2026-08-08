from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.speech import SpeechTranscriptionResponse
from app.services.speech_service import transcribe_speech_audio

router = APIRouter()


@router.post("/transcribe", response_model=SpeechTranscriptionResponse, status_code=status.HTTP_200_OK)
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Transcribe candidate microphone audio recording to text using local speech-to-text model.
    Development endpoint requiring JWT authentication. Processes audio in memory / temporary files.
    """
    try:
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

        result = transcribe_speech_audio(contents, filename=filename, content_type=content_type)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Speech-to-text model asset error"
        )
