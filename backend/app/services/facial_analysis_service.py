import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.ai.facial.analyzer import FacialAnalyzer
from app.schemas.facial_analysis import FacialAnalysisResponse
from app.schemas.answer import AnswerResponse
from app.services.answer_service import get_answer_by_id

logger = logging.getLogger(__name__)

# Allowed image MIME types and extensions
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def analyze_facial_image(image_bytes: bytes, filename: str = "", content_type: str = "") -> FacialAnalysisResponse:
    """
    Validate input file stream, execute facial analysis pipeline, and return structured schema.
    """
    if not image_bytes or len(image_bytes) == 0:
        raise ValueError("Uploaded image file is empty.")

    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValueError("Uploaded image exceeds maximum allowed limit of 10 MB.")

    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
        raise ValueError(f"Unsupported image MIME type '{content_type}'. Must be JPEG, PNG, or WEBP.")

    analyzer = FacialAnalyzer()
    raw_result = analyzer.analyze_image_bytes(image_bytes)

    return FacialAnalysisResponse.model_validate(raw_result)


def attach_facial_frame_to_answer(
    db: Session,
    session_id: str,
    answer_id: str,
    user_id: str,
    image_bytes: bytes,
    filename: str = "",
    content_type: str = ""
) -> AnswerResponse:
    """
    Verify ownership of answer_id within session_id, execute single-frame facial analysis,
    persist observable facial computer-vision metrics on the Answer record in PostgreSQL, and return updated answer schema.
    """
    answer = get_answer_by_id(db, answer_id=answer_id, session_id=session_id, user_id=user_id)
    if not answer:
        raise KeyError("Answer not found or unauthorized")

    facial_res = analyze_facial_image(image_bytes, filename=filename, content_type=content_type)
    facial_data = facial_res.model_dump()

    answer.facial_analysis = facial_data
    db.commit()
    db.refresh(answer)

    return AnswerResponse.model_validate(answer)
