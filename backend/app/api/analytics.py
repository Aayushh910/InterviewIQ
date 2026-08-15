from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.analytics import InterviewAnalyticsResponse
from app.services.analytics_service import get_session_analytics

router = APIRouter()


@router.get("/sessions/{session_id}/analytics", response_model=InterviewAnalyticsResponse, status_code=status.HTTP_200_OK)
def get_session_analytics_endpoint(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve comprehensive interview session analytics including overall score,
    dimension averages, performance category, completion stats, deduplicated strengths & top improvements,
    strongest/weakest answers, and question-by-question breakdown.
    """
    try:
        result = get_session_analytics(
            db, session_id=session_id, user_id=current_user.id
        )
        return result
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or unauthorized access"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
