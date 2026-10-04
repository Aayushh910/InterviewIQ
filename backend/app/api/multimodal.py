from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.multimodal import AnswerMultimodalResponse, SessionMultimodalResponse
from app.services.multimodal_service import get_answer_multimodal_analysis, get_session_multimodal_analysis

router = APIRouter()


@router.get("/sessions/{session_id}/answers/{answer_id}/multimodal", response_model=AnswerMultimodalResponse, status_code=status.HTTP_200_OK)
def get_answer_multimodal(
    session_id: str,
    answer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve structured multimodal insights combining speech transcript, Phase 2 answer evaluation,
    and Phase 4 facial computer-vision metrics for a specific candidate answer.
    """
    try:
        result = get_answer_multimodal_analysis(
            db, session_id=session_id, answer_id=answer_id, user_id=current_user.id
        )
        return result
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer or session not found or unauthorized access"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/sessions/{session_id}/multimodal", response_model=SessionMultimodalResponse, status_code=status.HTTP_200_OK)
def get_session_multimodal(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve interview session-level multimodal intelligence aggregating evaluation scores,
    visual computer-vision signals, and summary feedback across all candidate answers.
    """
    try:
        result = get_session_multimodal_analysis(
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


@router.get("/sessions/{session_id}/multimodal/evidence", status_code=status.HTTP_200_OK)
def get_session_multimodal_evidence(
    session_id: str,
    evidence_type: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve structured, chronological multimodal evidence records (face & behavior telemetry)
    for an interview session.
    """
    from app.services.multimodal_evidence_service import evidence_service
    try:
        records = evidence_service.get_session_evidence(
            db=db,
            session_id=session_id,
            user_id=str(current_user.id),
            evidence_type=evidence_type
        )
        return [
            {
                "id": str(r.id),
                "session_id": str(r.session_id),
                "question_id": str(r.question_id) if r.question_id else None,
                "answer_id": str(r.answer_id) if r.answer_id else None,
                "evidence_type": r.evidence_type,
                "status": r.status,
                "confidence_score": r.confidence_score,
                "raw_evidence": r.raw_evidence,
                "derived_indicators": r.derived_indicators,
                "observations": r.observations,
                "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
            }
            for r in records
        ]
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to session"
        )

