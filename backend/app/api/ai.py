import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.evaluation import AnswerEvaluationRequest, AnswerEvaluationResponse
from app.services.answer_evaluation_service import evaluate_direct_answer, evaluate_answer
from app.ai.evaluation.answer.exceptions import (
    AIProviderError,
    AIProviderTimeoutError,
    AIValidationError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/evaluate-answer", response_model=AnswerEvaluationResponse, status_code=status.HTTP_200_OK)
def evaluate_candidate_answer_endpoint(
    req: AnswerEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Primary AI Endpoint for evaluating interview answers. Supports:
    1. Direct Q&A evaluation payloads (question + answer).
    2. Persisted evaluation payloads (answer_id).
    Requires JWT authentication.
    """
    logger.info(f"Received AI evaluation request for user '{current_user.id}'")
    try:
        if req.answer_id:
            res = evaluate_answer(db, answer_id=req.answer_id, user_id=current_user.id, override_provider=req.provider)
        else:
            res = evaluate_direct_answer(req, user_id=current_user.id, db=db)
        return res

    except KeyError as e:
        logger.warning(f"AI evaluation target not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer record not found or unauthorized access"
        )
    except ValueError as e:
        logger.warning(f"AI evaluation validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AIValidationError as e:
        logger.error(f"AI evaluation output validation failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed AI response: {str(e)}"
        )
    except AIProviderTimeoutError as e:
        logger.error(f"AI evaluation timeout: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI evaluation service timed out. Please try again."
        )
    except AIProviderError as e:
        logger.error(f"AI provider failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI evaluation service provider unavailable."
        )
    except Exception as e:
        logger.error(f"Unexpected AI evaluation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred during AI evaluation."
        )
