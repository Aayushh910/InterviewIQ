import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.evaluation import AnswerEvaluationRequest, AnswerEvaluationResponse
from app.schemas.question_generation import QuestionGenerationRequest, QuestionGenerationResponse
from app.schemas.follow_up import FollowUpRequest, FollowUpResponse
from app.schemas.question import QuestionResponse
from app.services.answer_evaluation_service import evaluate_direct_answer, evaluate_answer
from app.services.question_generator_service import generate_and_store_interview_questions
from app.services.follow_up_service import generate_and_store_follow_up_question
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


@router.post("/questions/generate", response_model=QuestionGenerationResponse, status_code=status.HTTP_200_OK)
def generate_interview_questions_endpoint(
    req: QuestionGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate interview questions tailored to the candidate's interview configuration using external AI Provider.
    Requires JWT authentication and valid owned interview_id.
    """
    logger.info(f"Received question generation request for interview '{req.interview_id}' by user '{current_user.id}'")
    try:
        count = req.number_of_questions or 5
        questions_records, provider_used = generate_and_store_interview_questions(
            db=db,
            user_id=current_user.id,
            interview_id=req.interview_id,
            number_of_questions=count,
            provider_name=req.provider,
            mock_mode=req.mock_mode
        )

        formatted_questions = [
            QuestionResponse.model_validate(q) for q in questions_records
        ]

        return QuestionGenerationResponse(
            interview_id=req.interview_id,
            count=len(formatted_questions),
            provider=provider_used,
            questions=formatted_questions
        )

    except KeyError as e:
        logger.warning(f"Question generation unauthorized/not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found or unauthorized access."
        )
    except ValueError as e:
        logger.warning(f"Question generation validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AIValidationError as e:
        logger.error(f"Question generation AI output validation failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed AI response: {str(e)}"
        )
    except AIProviderTimeoutError as e:
        logger.error(f"Question generation AI timeout: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI question generation service timed out. Please try again."
        )
    except AIProviderError as e:
        logger.error(f"Question generation AI provider failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI question generation service provider unavailable."
        )
    except Exception as e:
        logger.error(f"Unexpected question generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred during question generation."
        )


@router.post("/follow-up/generate", response_model=FollowUpResponse, status_code=status.HTTP_200_OK)
def generate_follow_up_question_endpoint(
    req: FollowUpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Phase 2: Adaptive Follow-Up Question Engine Endpoint.
    Analyzes candidate's answer and dynamically decides whether to generate a contextual follow-up question.
    Requires JWT authentication and valid ownership across interview_id, question_id, and answer_id.
    """
    logger.info(f"Received follow-up generation request for answer '{req.answer_id}' (user: '{current_user.id}')")
    try:
        response = generate_and_store_follow_up_question(
            db=db,
            user_id=current_user.id,
            interview_id=req.interview_id,
            question_id=req.question_id,
            answer_id=req.answer_id,
            provider_name=req.provider,
            mock_mode=req.mock_mode
        )
        return response

    except KeyError as e:
        logger.warning(f"Follow-up generation target not found or unauthorized: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValueError as e:
        logger.warning(f"Follow-up generation validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AIValidationError as e:
        logger.error(f"Follow-up AI response validation failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed AI response: {str(e)}"
        )
    except AIProviderTimeoutError as e:
        logger.error(f"Follow-up AI provider timeout: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI follow-up engine timed out. Please try again."
        )
    except AIProviderError as e:
        logger.error(f"Follow-up AI provider failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI follow-up engine provider unavailable."
        )
    except Exception as e:
        logger.error(f"Unexpected follow-up generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred during follow-up question analysis."
        )
