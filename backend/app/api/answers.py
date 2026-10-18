from typing import List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.session import SessionResponse
from app.schemas.answer import AnswerCreate, AnswerResponse, AnswerSubmitResponse
from app.models.user import User
import app.services.session_service as session_service
import app.services.answer_service as answer_service
import app.services.speech_service as speech_service
import app.services.facial_analysis_service as facial_analysis_service
import app.services.temporal_facial_analysis_service as temporal_facial_analysis_service
import app.services.proctoring_service as proctoring_service
from app.schemas.proctoring import ProctoringPolicy, SessionTerminationRequest

router = APIRouter()


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve a practice session owned by the current candidate user.
    """
    session = session_service.get_session_by_id(db, session_id=session_id, user_id=current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return session


@router.post("/sessions/{session_id}/start", response_model=SessionResponse)
def start_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start an interview session, setting status to in_progress and timestamping started_at.
    """
    try:
        session = session_service.start_session(db, session_id=session_id, user_id=current_user.id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        return session
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/sessions/{session_id}/complete", response_model=SessionResponse)
def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Complete an interview session, setting status to completed and timestamping completed_at.
    """
    try:
        session = session_service.complete_session(db, session_id=session_id, user_id=current_user.id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        return session
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/sessions/{session_id}/answers", response_model=AnswerSubmitResponse, status_code=status.HTTP_201_CREATED)
def submit_answer(
    session_id: str,
    answer_in: AnswerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit candidate answer text for a question during an active session, returning next question info.
    """
    try:
        result = answer_service.submit_answer(
            db, session_id=session_id, user_id=current_user.id, data=answer_in
        )
        return result
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/sessions/{session_id}/answers/audio", response_model=AnswerSubmitResponse, status_code=status.HTTP_201_CREATED)
async def submit_audio_answer(
    session_id: str,
    question_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit candidate audio recording for a question during an active session.
    Transcribes audio to text, saves/updates Answer record, runs Phase 2 evaluation, and returns next question info.
    """
    try:
        contents = await file.read()
        filename = file.filename or ""
        content_type = file.content_type or ""

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

        result = speech_service.submit_audio_answer(
            db,
            session_id=session_id,
            question_id=question_id,
            user_id=current_user.id,
            audio_bytes=contents,
            filename=filename,
            content_type=content_type
        )
        return result
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session or question not found or unauthorized"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/sessions/{session_id}/answers/{answer_id}/facial", response_model=AnswerResponse, status_code=status.HTTP_200_OK)
async def submit_answer_facial_frame(
    session_id: str,
    answer_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Attach single-frame facial analysis metrics to an owned candidate answer.
    Processes facial geometry, position quality, head pose, and camera alignment.
    """
    try:
        contents = await file.read()
        filename = file.filename or ""
        content_type = file.content_type or ""

        if filename and (not content_type or content_type == "application/octet-stream"):
            lower_name = filename.lower()
            if lower_name.endswith(".jpg") or lower_name.endswith(".jpeg"):
                content_type = "image/jpeg"
            elif lower_name.endswith(".png"):
                content_type = "image/png"
            elif lower_name.endswith(".webp"):
                content_type = "image/webp"

        result = facial_analysis_service.attach_facial_frame_to_answer(
            db,
            session_id=session_id,
            answer_id=answer_id,
            user_id=current_user.id,
            image_bytes=contents,
            filename=filename,
            content_type=content_type
        )
        return result
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer or session not found or unauthorized access"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/sessions/{session_id}/answers/{answer_id}/facial/video", response_model=AnswerResponse, status_code=status.HTTP_200_OK)
async def submit_answer_facial_video(
    session_id: str,
    answer_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Attach temporal facial video analysis metrics to an owned candidate answer.
    Samples video frames across answer duration, computing face presence ratio, average head pose, and alignment.
    """
    try:
        contents = await file.read()
        filename = file.filename or ""
        content_type = file.content_type or ""

        if filename and (not content_type or content_type == "application/octet-stream"):
            lower_name = filename.lower()
            if lower_name.endswith(".mp4"):
                content_type = "video/mp4"
            elif lower_name.endswith(".webm"):
                content_type = "video/webm"
            elif lower_name.endswith(".mov"):
                content_type = "video/quicktime"
            elif lower_name.endswith(".avi"):
                content_type = "video/x-msvideo"

        result = temporal_facial_analysis_service.attach_facial_video_to_answer(
            db,
            session_id=session_id,
            answer_id=answer_id,
            user_id=current_user.id,
            video_bytes=contents,
            filename=filename,
            content_type=content_type
        )
        return result
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer or session not found or unauthorized access"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/sessions/{session_id}/answers", response_model=List[AnswerResponse])
def get_session_answers(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all submitted answers for an owned interview session.
    """
    answers = answer_service.get_session_answers(db, session_id=session_id, user_id=current_user.id)
    if answers is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return answers


@router.get("/sessions/{session_id}/answers/{answer_id}", response_model=AnswerResponse)
def get_answer(
    session_id: str,
    answer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve a specific candidate answer.
    """
    answer = answer_service.get_answer_by_id(
        db, answer_id=answer_id, session_id=session_id, user_id=current_user.id
    )
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found"
        )
    return answer


# --- PROCTORING ALIAS ENDPOINTS ---

@router.get("/sessions/{session_id}/proctoring-config", response_model=ProctoringPolicy)
def get_session_proctoring_config_alias(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    config = proctoring_service.get_session_proctoring_config(
        db, session_id=session_id, user_id=current_user.id
    )
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or unauthorized")
    return config


@router.post("/sessions/{session_id}/proctoring-events", status_code=status.HTTP_201_CREATED)
def submit_proctoring_events_alias(
    session_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.schemas.proctoring import ProctoringEventCreate, ProctoringEventsBatchRequest, ProctoringEventResponse
    try:
        if "events" in payload and isinstance(payload["events"], list):
            batch = ProctoringEventsBatchRequest.model_validate(payload)
            events = proctoring_service.record_proctoring_events_batch(
                db, session_id=session_id, user_id=current_user.id, batch=batch
            )
            if events is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or unauthorized")
            return [ProctoringEventResponse.model_validate(e) for e in events]
        else:
            event_in = ProctoringEventCreate.model_validate(payload)
            event = proctoring_service.record_proctoring_event(
                db, session_id=session_id, user_id=current_user.id, event_in=event_in
            )
            if event is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or unauthorized")
            return ProctoringEventResponse.model_validate(event)
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(err))


@router.get("/sessions/{session_id}/proctoring-summary")
def get_session_proctoring_summary_alias(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    summary = proctoring_service.get_session_proctoring_summary(
        db, session_id=session_id, user_id=current_user.id
    )
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or unauthorized")
    return summary


@router.post("/sessions/{session_id}/terminate", response_model=SessionResponse)
def terminate_session_by_policy_alias(
    session_id: str,
    termination_in: SessionTerminationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = proctoring_service.terminate_session_by_policy(
        db, session_id=session_id, user_id=current_user.id, termination_in=termination_in
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or unauthorized")
    return session
