from typing import Optional
from pydantic import BaseModel, ConfigDict


class FaceMetrics(BaseModel):
    center_x: float
    center_y: float
    width: float
    height: float
    area_ratio: float
    position_quality: float

    model_config = ConfigDict(from_attributes=True)


class HeadPose(BaseModel):
    yaw: float
    pitch: float
    roll: float

    model_config = ConfigDict(from_attributes=True)


class CameraOrientation(BaseModel):
    alignment_score: float

    model_config = ConfigDict(from_attributes=True)


class FacialAnalysisResponse(BaseModel):
    face_detected: bool
    face_count: int
    face_metrics: Optional[FaceMetrics] = None
    head_pose: Optional[HeadPose] = None
    camera_orientation: Optional[CameraOrientation] = None

    model_config = ConfigDict(from_attributes=True)
