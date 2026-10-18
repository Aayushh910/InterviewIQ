from typing import List, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.interview import (
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
)
from app.schemas.question import QuestionCreate, QuestionResponse
from app.schemas.session import SessionCreate, SessionResponse
from app.schemas.proctoring import (
    ProctoringPolicy,
    ProctoringEventCreate,
    ProctoringEventResponse,
    ProctoringEventsBatchRequest,
    ProctoringSummaryResponse,
    SessionTerminationRequest,
)
import app.services.interview_service as interview_service
import app.services.session_service as session_service
import app.services.proctoring_service as proctoring_service

router = APIRouter()


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(
    interview_in: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new interview configuration for the authenticated candidate.
    """
    interview = interview_service.create_interview(db, user_id=current_user.id, data=interview_in)
    return interview


@router.get("", response_model=List[InterviewResponse])
def get_user_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve all interviews owned strictly by the current user.
    """
    return interview_service.get_user_interviews(db, user_id=current_user.id)


@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve a specific owned interview by ID.
    """
    interview = interview_service.get_interview_by_id(db, interview_id=interview_id, user_id=current_user.id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return interview


@router.patch("/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: str,
    interview_in: InterviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update configuration of an owned interview.
    """
    interview = interview_service.update_interview(
        db, interview_id=interview_id, user_id=current_user.id, data=interview_in
    )
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return interview


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete an owned interview.
    """
    success = interview_service.delete_interview(db, interview_id=interview_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return None


# --- QUESTIONS ENDPOINTS ---

@router.post("/{interview_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def add_question(
    interview_id: str,
    question_in: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a question to an owned interview configuration.
    """
    question = interview_service.add_interview_question(
        db, interview_id=interview_id, user_id=current_user.id, data=question_in
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return question


@router.get("/{interview_id}/questions", response_model=List[QuestionResponse])
def get_questions(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all questions for an owned interview in question_order sequence.
    """
    questions = interview_service.get_interview_questions(
        db, interview_id=interview_id, user_id=current_user.id
    )
    if questions is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return questions


# --- SESSIONS ENDPOINTS ---

@router.post("/{interview_id}/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new practice attempt session for an owned interview.
    """
    session = session_service.create_session(db, interview_id=interview_id, user_id=current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return session


@router.get("/{interview_id}/sessions", response_model=List[SessionResponse])
def get_sessions(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List practice sessions for an owned interview.
    """
    sessions = session_service.get_user_sessions(db, interview_id=interview_id, user_id=current_user.id)
    if sessions is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return sessions


# --- PROCTORING & MONITORING ENDPOINTS (PHASE 16 & PHASE 17) ---

@router.get("/{session_id}/proctoring-config", response_model=ProctoringPolicy)
def get_session_proctoring_config(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve authoritative proctoring policy and thresholds for an interview session.
    """
    config = proctoring_service.get_session_proctoring_config(
        db, session_id=session_id, user_id=current_user.id
    )
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or unauthorized"
        )
    return config


@router.post("/{session_id}/proctoring-events", status_code=status.HTTP_201_CREATED)
def submit_proctoring_events(
    session_id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ingest validated proctoring event(s). Supports single event or batch events.
    """
    try:
        # Check if batch payload or single event payload
        if "events" in payload and isinstance(payload["events"], list):
            batch = ProctoringEventsBatchRequest.model_validate(payload)
            events = proctoring_service.record_proctoring_events_batch(
                db, session_id=session_id, user_id=current_user.id, batch=batch
            )
            if events is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found or unauthorized"
                )
            return [ProctoringEventResponse.model_validate(e) for e in events]
        else:
            event_in = ProctoringEventCreate.model_validate(payload)
            event = proctoring_service.record_proctoring_event(
                db, session_id=session_id, user_id=current_user.id, event_in=event_in
            )
            if event is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found or unauthorized"
                )
            return ProctoringEventResponse.model_validate(event)
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err)
        )


@router.get("/{session_id}/proctoring-summary", response_model=ProctoringSummaryResponse)
def get_session_proctoring_summary(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve comprehensive proctoring summary and metrics for an interview session.
    """
    summary = proctoring_service.get_session_proctoring_summary(
        db, session_id=session_id, user_id=current_user.id
    )
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or unauthorized"
        )
    return summary


@router.post("/{session_id}/terminate", response_model=SessionResponse)
def terminate_session_by_policy(
    session_id: str,
    termination_in: SessionTerminationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Safely and idempotently terminate an interview session due to proctoring policy violation.
    """
    session = proctoring_service.terminate_session_by_policy(
        db, session_id=session_id, user_id=current_user.id, termination_in=termination_in
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or unauthorized"
        )
    return session

