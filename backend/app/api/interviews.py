from typing import List
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
import app.services.interview_service as interview_service
import app.services.session_service as session_service

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
