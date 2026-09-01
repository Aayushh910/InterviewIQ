from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class DimensionMetrics(BaseModel):
    answer_quality: float
    relevance: float
    correctness: float
    technical_accuracy: float = 0.0
    completeness: float = 0.0
    clarity: float
    communication: float
    grammar: float = 0.0
    timing: float = 0.0
    confidence_indicator: float

    model_config = ConfigDict(from_attributes=True)


class VisualAnalytics(BaseModel):
    average_face_presence_ratio: Optional[float] = None
    average_camera_alignment: Optional[float] = None
    answers_with_facial_data: int = 0

    model_config = ConfigDict(from_attributes=True)


class CompletionMetrics(BaseModel):
    total_questions: int
    answered_questions: int
    evaluated_answers: int
    facial_analysis_available: int

    model_config = ConfigDict(from_attributes=True)


class AnswerHighlight(BaseModel):
    question_id: str
    question_text: str
    answer_id: str
    answer_score: float
    key_takeaway: str

    model_config = ConfigDict(from_attributes=True)


class QuestionPerformanceItem(BaseModel):
    question_id: str
    question_text: str
    question_type: Optional[str] = "main"
    follow_up_depth: Optional[int] = 0
    answer_id: Optional[str] = None
    answer_text: Optional[str] = None
    summary: Optional[str] = None
    answer_score: Optional[float] = None
    relevance: Optional[float] = None
    correctness: Optional[float] = None
    technical_accuracy: Optional[float] = None
    completeness: Optional[float] = None
    clarity: Optional[float] = None
    communication: Optional[float] = None
    grammar: Optional[float] = None
    timing: Optional[float] = None
    duration_seconds: Optional[float] = None
    confidence_indicator: Optional[float] = None
    strengths: List[str] = []
    improvements: List[str] = []
    visual_observations: List[str] = []
    evaluation_available: bool = False

    model_config = ConfigDict(from_attributes=True)


class InterviewAnalyticsResponse(BaseModel):
    session_id: str
    interview_id: str
    status: str
    overall_score: Optional[float] = None
    performance_category: str
    metrics: Optional[DimensionMetrics] = None
    completion: CompletionMetrics
    visual_observations: VisualAnalytics
    top_strengths: List[str] = []
    top_improvements: List[str] = []
    strongest_answer: Optional[AnswerHighlight] = None
    weakest_answer: Optional[AnswerHighlight] = None
    question_results: List[QuestionPerformanceItem] = []

    model_config = ConfigDict(from_attributes=True)
