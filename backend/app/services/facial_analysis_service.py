from typing import Dict, Any
from app.ai.facial.analyzer import FacialAnalyzer
from app.schemas.facial_analysis import FacialAnalysisResponse

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
