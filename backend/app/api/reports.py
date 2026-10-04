"""
Reports API Router for InterviewIQ (Phase 13).
Serves secure, server-side generated PDF performance reports.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.report_service import report_service
from app.evaluation.exceptions import (
    SessionNotFoundError,
    UnauthorizedEvaluationError,
    EvaluationNotFoundError,
)

router = APIRouter()


@router.get("/sessions/{session_id}/pdf", status_code=status.HTTP_200_OK)
def download_interview_report_pdf(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate and stream secure, official PDF candidate interview report.
    Validates user authentication, session ownership, and evaluation availability.
    """
    try:
        pdf_bytes = report_service.generate_pdf_report(
            db=db,
            session_id=session_id,
            user_id=str(current_user.id),
        )

        filename = f"InterviewIQ_Report_{session_id[:8]}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf",
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        )
    except SessionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session '{session_id}' not found.",
        )
    except UnauthorizedEvaluationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You do not have permission to download the report for this session.",
        )
    except EvaluationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Final evaluation has not yet been generated for interview session '{session_id}'.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation error: {str(e)}",
        )
