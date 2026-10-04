from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.session_state import (
    InterviewSessionState,
    SessionInitializeRequest,
    SessionStateUpdateRequest,
    AddQuestionRequest,
    AddAnswerRequest,
    AddFollowUpRequest,
    AddEvaluationReferenceRequest,
)
from app.services.session_state.manager import session_state_manager
from app.services.session_state.exceptions import (
    SessionNotFoundError,
    MissingSessionIdError,
    InvalidSessionStateError,
    InvalidStatusTransitionError,
    DuplicateQuestionError,
    InvalidAnswerError,
    MalformedConfigurationError,
    SessionExpiredError,
)

router = APIRouter()


def _handle_domain_exception(e: Exception) -> None:
    """Map domain exceptions to corresponding FastAPI HTTPException."""
    if isinstance(e, SessionNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    elif isinstance(e, DuplicateQuestionError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    elif isinstance(e, (InvalidStatusTransitionError, InvalidAnswerError, MissingSessionIdError, InvalidSessionStateError, MalformedConfigurationError)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    elif isinstance(e, SessionExpiredError):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=str(e))
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected session state error occurred.")


@router.post("/state/{interview_id}", response_model=InterviewSessionState, status_code=status.HTTP_201_CREATED)
def create_session_state(
    interview_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new interview practice session and return its initial centralized state.
    """
    try:
        return session_state_manager.create_session(db, interview_id=interview_id, user_id=current_user.id)
    except Exception as e:
        _handle_domain_exception(e)


@router.get("/{session_id}/state", response_model=InterviewSessionState)
def get_session_state(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the single source of truth InterviewSessionState for an active or past interview.
    """
    try:
        return session_state_manager.get_session_state(db, session_id=session_id, user_id=current_user.id)
    except Exception as e:
        _handle_domain_exception(e)


@router.post("/{session_id}/state/initialize", response_model=InterviewSessionState)
def initialize_session_state(
    session_id: str,
    payload: SessionInitializeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Initialize interview session, optionally seeding initial questions, transitioning status to in_progress.
    """
    try:
        return session_state_manager.initialize_session(
            db,
            session_id=session_id,
            user_id=current_user.id,
            initial_questions=payload.initial_questions,
        )
    except Exception as e:
        _handle_domain_exception(e)


@router.patch("/{session_id}/state", response_model=InterviewSessionState)
def update_session_state(
    session_id: str,
    payload: SessionStateUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update mutable session state fields (status transition, active topic, metadata).
    """
    try:
        return session_state_manager.update_session_state(
            db, session_id=session_id, user_id=current_user.id, update_data=payload
        )
    except Exception as e:
        _handle_domain_exception(e)


@router.post("/{session_id}/state/questions", response_model=InterviewSessionState, status_code=status.HTTP_201_CREATED)
def add_question_to_session(
    session_id: str,
    payload: AddQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a new question into the interview session's question history.
    """
    try:
        return session_state_manager.add_question(
            db, session_id=session_id, user_id=current_user.id, data=payload
        )
    except Exception as e:
        _handle_domain_exception(e)


@router.post("/{session_id}/state/answers", response_model=InterviewSessionState, status_code=status.HTTP_201_CREATED)
def add_answer_to_session(
    session_id: str,
    payload: AddAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit a candidate answer, update timestamps, advance progress, and return the updated session state.
    """
    try:
        state, _ = session_state_manager.add_answer(
            db, session_id=session_id, user_id=current_user.id, data=payload
        )
        return state
    except Exception as e:
        _handle_domain_exception(e)


@router.post("/{session_id}/state/follow-ups", response_model=InterviewSessionState, status_code=status.HTTP_201_CREATED)
def add_follow_up_to_session(
    session_id: str,
    payload: AddFollowUpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Record an adaptive counter/follow-up question linked to its parent question.
    """
    try:
        return session_state_manager.add_follow_up(
            db, session_id=session_id, user_id=current_user.id, data=payload
        )
    except Exception as e:
        _handle_domain_exception(e)


@router.post("/{session_id}/state/evaluations", response_model=InterviewSessionState, status_code=status.HTTP_200_OK)
def add_evaluation_reference_to_session(
    session_id: str,
    payload: AddEvaluationReferenceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Attach an evaluation reference to a candidate answer within the session state.
    """
    try:
        return session_state_manager.add_evaluation_reference(
            db, session_id=session_id, user_id=current_user.id, data=payload
        )
    except Exception as e:
        _handle_domain_exception(e)


@router.post("/{session_id}/state/end", response_model=InterviewSessionState)
def end_session_state(
    session_id: str,
    reason: str = "completed",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    End and finalize an interview session (marking completed, abandoned, or expired).
    """
    try:
        return session_state_manager.end_session(
            db, session_id=session_id, user_id=current_user.id, reason=reason
        )
    except Exception as e:
        _handle_domain_exception(e)
