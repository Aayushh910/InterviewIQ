import os
from pathlib import Path
from app.core.config import settings

# Base directory for the backend project
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent


def get_resolved_model_path() -> str:
    """
    Resolve model asset path relative to backend root directory.
    """
    model_setting = settings.FACE_LANDMARKER_MODEL_PATH
    path = Path(model_setting)
    if not path.is_absolute():
        path = BACKEND_DIR / path
    return str(path)


MODEL_PATH = get_resolved_model_path()
MAX_FACES = settings.MAX_FACES
MIN_FACE_DETECTION_CONFIDENCE = settings.MIN_FACE_DETECTION_CONFIDENCE
MIN_FACE_PRESENCE_CONFIDENCE = settings.MIN_FACE_PRESENCE_CONFIDENCE
MIN_TRACKING_CONFIDENCE = settings.MIN_TRACKING_CONFIDENCE

# Temporal Analysis Configurations
FACIAL_ANALYSIS_SAMPLE_FPS = settings.FACIAL_ANALYSIS_SAMPLE_FPS
MAX_VIDEO_SIZE_MB = settings.MAX_VIDEO_SIZE_MB
MAX_VIDEO_DURATION_SECONDS = settings.MAX_VIDEO_DURATION_SECONDS
