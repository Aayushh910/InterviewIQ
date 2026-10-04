"""
Results API Router for InterviewIQ (Phase 13).
Serves sanitized, candidate-facing interview performance analysis and telemetry.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.results import CandidateResultsDTO
from app.services.results_service import results_service
from app.evaluation.exceptions import (
    SessionNotFoundError,
    UnauthorizedEvaluationError,
    EvaluationNotFoundError,
)

router = APIRouter()


@router.get("/sessions/{session_id}", response_model=CandidateResultsDTO, status_code=status.HTTP_200_OK)
def get_interview_results(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve candidate-facing interview performance results, breakdowns, and telemetry.
    Strictly verifies user ownership and authorization.
    """
    try:
        results = results_service.get_candidate_results(
            db=db,
            session_id=session_id,
            user_id=str(current_user.id),
        )
        return results
    except SessionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session '{session_id}' not found.",
        )
    except UnauthorizedEvaluationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You do not have access to view results for this interview session.",
        )
    except EvaluationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Final evaluation has not yet been generated for interview session '{session_id}'.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve results: {str(e)}",
        )
