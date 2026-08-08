from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.evaluation import AnswerEvaluationRequest, AnswerEvaluationResponse
from app.services.answer_evaluation_service import evaluate_answer

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
        res = evaluate_answer(db, answer_id=req.answer_id, user_id=current_user.id)
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
