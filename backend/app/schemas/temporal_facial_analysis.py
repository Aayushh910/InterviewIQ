from typing import Optional
from pydantic import BaseModel, ConfigDict


class AverageHeadPose(BaseModel):
    yaw: float
    pitch: float
    roll: float

    model_config = ConfigDict(from_attributes=True)


class HeadPoseVariability(BaseModel):
    yaw: float
    pitch: float
    roll: float

    model_config = ConfigDict(from_attributes=True)


class TemporalFacialAnalysisResponse(BaseModel):
    duration_seconds: float
    frames_sampled: int
    frames_with_face: int
    face_presence_ratio: float
    average_camera_alignment: Optional[float] = None
    average_position_quality: Optional[float] = None
    average_head_pose: Optional[AverageHeadPose] = None
    head_pose_variability: Optional[HeadPoseVariability] = None
    camera_alignment_variability: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
