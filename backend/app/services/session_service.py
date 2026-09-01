from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.services.interview_service import get_interview_by_id


def create_session(db: Session, interview_id: str, user_id: str) -> Optional[InterviewSession]:
    """
    Create a new attempt session for an owned interview.
    """
    interview = get_interview_by_id(db, interview_id=interview_id, user_id=user_id)
    if not interview:
        return None

    session = InterviewSession(
        interview_id=interview_id,
        status="not_started"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_user_sessions(db: Session, interview_id: str, user_id: str) -> Optional[List[InterviewSession]]:
    """
    Retrieve all sessions for an owned interview.
    """
    interview = get_interview_by_id(db, interview_id=interview_id, user_id=user_id)
    if not interview:
        return None

    return db.query(InterviewSession).filter(
        InterviewSession.interview_id == interview_id
    ).order_by(InterviewSession.created_at.desc()).all()


def get_session_by_id(db: Session, session_id: str, user_id: str) -> Optional[InterviewSession]:
    """
    Retrieve a session by ID ensuring it belongs to an interview owned by the user.
    """
    return db.query(InterviewSession).join(Interview).filter(
        InterviewSession.id == session_id,
        Interview.user_id == user_id
    ).first()


def start_session(db: Session, session_id: str, user_id: str) -> Optional[InterviewSession]:
    """
    Transition a session status from not_started to in_progress.
    """
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        return None

    if session.status == "completed":
        raise ValueError("Cannot start an already completed interview session")

    session.status = "in_progress"
    session.started_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


def complete_session(db: Session, session_id: str, user_id: str) -> Optional[InterviewSession]:
    """
    Transition a session status to completed (idempotent if already completed).
    """
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        return None

    if session.status == "completed":
        return session

    if session.status != "in_progress" and session.status != "not_started":
        raise ValueError("Session is not in active progress")

    session.status = "completed"
    session.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


def validate_session_active(session: InterviewSession, max_duration_minutes: float = 4.0) -> bool:
    """
    Validate whether an interview session is active and within allowed 4-minute duration.
    """
    if not session or session.status in ["completed", "abandoned", "expired"]:
        return False
    if session.started_at:
        elapsed = (datetime.utcnow() - session.started_at).total_seconds()
        allowed_seconds = (max_duration_minutes * 60) + 30.0
        if elapsed > allowed_seconds:
            return False
    return True

