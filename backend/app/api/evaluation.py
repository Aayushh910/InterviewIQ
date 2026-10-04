from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.evaluation import AnswerEvaluationRequest, AnswerEvaluationResponse
from app.services.answer_evaluation_service import evaluate_answer, evaluate_direct_answer

router = APIRouter()


@router.post("/answer", response_model=AnswerEvaluationResponse, status_code=status.HTTP_200_OK)
def evaluate_candidate_answer(
    req: AnswerEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluate candidate answer to a question, storing structured 5-dimension scores, overall score,
    strengths, improvements, and feedback summary. Requires JWT authentication.
    """
    try:
        if req.answer_id:
            res = evaluate_answer(db, answer_id=req.answer_id, user_id=current_user.id, override_provider=req.provider)
        else:
            res = evaluate_direct_answer(req, user_id=current_user.id, db=db)
        return res
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found or unauthorized"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ─── Final Interview Evaluation Endpoints (Phase 12) ──────────────────────────

from typing import Optional
from app.evaluation.schemas import (
    FinalEvaluationResult,
    CalculateFinalEvaluationRequest,
)
from app.evaluation.evaluator import final_evaluator
from app.evaluation.exceptions import (
    SessionNotFoundError,
    UnauthorizedEvaluationError,
    SessionNotCompleteError,
    InsufficientEvidenceError,
)


@router.post("/sessions/{session_id}/final", response_model=FinalEvaluationResult, status_code=status.HTTP_200_OK)
def calculate_session_final_evaluation(
    session_id: str,
    req: Optional[CalculateFinalEvaluationRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate deterministic, reproducible final interview evaluation combining answer quality,
    observable communication, and visual presentation evidence. Requires JWT authentication.
    """
    force_recalc = req.force_recalculate if req else False
    try:
        result = final_evaluator.evaluate_interview_session(
            db=db,
            session_id=session_id,
            user_id=str(current_user.id),
            force_recalculate=force_recalc,
        )
        return result
    except SessionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session '{session_id}' not found."
        )
    except UnauthorizedEvaluationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to interview session."
        )
    except SessionNotCompleteError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except InsufficientEvidenceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/sessions/{session_id}/final", response_model=FinalEvaluationResult, status_code=status.HTTP_200_OK)
def get_session_final_evaluation(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve stored deterministic final evaluation for a completed interview session.
    """
    try:
        result = final_evaluator.get_final_evaluation(
            db=db,
            session_id=session_id,
            user_id=str(current_user.id),
        )
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No final evaluation found for session '{session_id}'."
            )
        return result
    except UnauthorizedEvaluationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to interview session."
        )

