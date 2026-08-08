from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.session import SessionResponse
from app.schemas.answer import AnswerCreate, AnswerResponse, AnswerSubmitResponse
from app.models.user import User
import app.services.session_service as session_service
import app.services.answer_service as answer_service

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
