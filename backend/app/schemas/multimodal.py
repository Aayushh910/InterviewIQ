from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class AnswerPerformanceCategory(BaseModel):
    available: bool = True
    relevance_score: float
    correctness_score: float
    completeness_score: float
    clarity_score: float
    technical_depth_score: float
    communication_score: float
    confidence_score: float
    overall_score: float
    strengths: List[str] = []
    improvements: List[str] = []
    summary: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VisualObservationsCategory(BaseModel):
    available: bool = True
    face_detected: bool = True
    face_presence_ratio: Optional[float] = None
    camera_alignment_score: Optional[float] = None
    position_quality: Optional[float] = None
    average_head_pose: Optional[Dict[str, float]] = None
    pose_variability: Optional[Dict[str, float]] = None
    observations: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class AnswerMultimodalResponse(BaseModel):
    answer_id: str
    session_id: str
    question_id: str
    answer_text: Optional[str] = None
    answer_performance: Optional[AnswerPerformanceCategory] = None
    visual_observations: Optional[VisualObservationsCategory] = None
    combined_insights: List[str] = []
    recommendations: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class SessionMultimodalResponse(BaseModel):
    session_id: str
    interview_id: str
    total_answers: int
    evaluated_answers: int
    average_answer_score: Optional[float] = None
    average_face_presence: Optional[float] = None
    session_summary: str
    answer_analyses: List[AnswerMultimodalResponse] = []

    model_config = ConfigDict(from_attributes=True)
