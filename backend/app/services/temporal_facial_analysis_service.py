import os
import cv2
import tempfile
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.ai.facial.analyzer import FacialAnalyzer
from app.ai.facial.video import VideoProcessor
from app.ai.facial.temporal import TemporalFacialAggregator
from app.ai.facial.config import (
    FACIAL_ANALYSIS_SAMPLE_FPS,
    MAX_VIDEO_SIZE_MB,
    MAX_VIDEO_DURATION_SECONDS,
)
from app.schemas.temporal_facial_analysis import TemporalFacialAnalysisResponse
from app.schemas.answer import AnswerResponse
from app.services.answer_service import get_answer_by_id

logger = logging.getLogger(__name__)

# Allowed video MIME types / extension keywords
ALLOWED_VIDEO_MIME_TYPES = {
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/avi",
}

ALLOWED_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}


def analyze_temporal_facial_video(
    video_bytes: bytes,
    filename: str = "",
    content_type: str = ""
) -> TemporalFacialAnalysisResponse:
    """
    Validate uploaded video file, sample frames, analyze facial behavior across time,
    and compute aggregated temporal metrics.
    """
    if not video_bytes or len(video_bytes) == 0:
        raise ValueError("Uploaded video file is empty.")

    max_bytes = MAX_VIDEO_SIZE_MB * 1024 * 1024
    if len(video_bytes) > max_bytes:
        raise ValueError(f"Uploaded video file exceeds maximum allowed limit of {MAX_VIDEO_SIZE_MB} MB.")

    # Extension validation
    ext = os.path.splitext(filename)[1].lower() if filename else ""
    if content_type and content_type.lower() not in ALLOWED_VIDEO_MIME_TYPES and ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported video file format '{content_type or ext}'. Must be MP4, WebM, MOV, or AVI.")

    tmp_path = None
    try:
        suffix = ext if ext in ALLOWED_EXTENSIONS else ".mp4"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        with VideoProcessor(tmp_path) as processor:
            if processor.duration_seconds > MAX_VIDEO_DURATION_SECONDS:
                raise ValueError(
                    f"Video duration ({processor.duration_seconds:.1f}s) exceeds maximum allowed limit of "
                    f"{MAX_VIDEO_DURATION_SECONDS} seconds."
                )

            analyzer = FacialAnalyzer()
            observations = []

            for timestamp_sec, frame_bgr in processor.sample_frames(FACIAL_ANALYSIS_SAMPLE_FPS):
                success, encoded = cv2.imencode(".jpg", frame_bgr)
                if not success:
                    continue

                frame_res = analyzer.analyze_image_bytes(encoded.tobytes())

                obs = {
                    "timestamp_seconds": timestamp_sec,
                    "face_detected": frame_res.get("face_detected", False),
                    "face_count": frame_res.get("face_count", 0),
                    "position_quality": frame_res["face_metrics"]["position_quality"] if frame_res.get("face_metrics") else None,
                    "camera_alignment": frame_res["camera_orientation"]["alignment_score"] if frame_res.get("camera_orientation") else None,
                    "yaw": frame_res["head_pose"]["yaw"] if frame_res.get("head_pose") else None,
                    "pitch": frame_res["head_pose"]["pitch"] if frame_res.get("head_pose") else None,
                    "roll": frame_res["head_pose"]["roll"] if frame_res.get("head_pose") else None,
                }
                observations.append(obs)

            raw_aggregated = TemporalFacialAggregator.aggregate_observations(
                observations,
                duration_seconds=processor.duration_seconds
            )

            return TemporalFacialAnalysisResponse.model_validate(raw_aggregated)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to remove temporary video file '{tmp_path}': {e}")


def attach_facial_video_to_answer(
    db: Session,
    session_id: str,
    answer_id: str,
    user_id: str,
    video_bytes: bytes,
    filename: str = "",
    content_type: str = ""
) -> AnswerResponse:
    """
    Verify ownership of answer_id within session_id, execute temporal video facial analysis,
    persist observable computer-vision metrics on the Answer record in PostgreSQL, and return updated answer schema.
    """
    answer = get_answer_by_id(db, answer_id=answer_id, session_id=session_id, user_id=user_id)
    if not answer:
        raise KeyError("Answer not found or unauthorized")

    temporal_res = analyze_temporal_facial_video(video_bytes, filename=filename, content_type=content_type)
    temporal_data = temporal_res.model_dump()

    answer.facial_analysis = temporal_data
    db.commit()
    db.refresh(answer)

    return AnswerResponse.model_validate(answer)
