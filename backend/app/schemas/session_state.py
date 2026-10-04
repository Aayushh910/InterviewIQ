from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class SessionStatus(str, Enum):
    """
    Standardized lifecycle states for an interview session.
    """
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"
    EXPIRED = "expired"


class QuestionType(str, Enum):
    """
    Classification of interview questions.
    """
    MAIN = "main"
    COUNTER = "counter"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    HR = "hr"


# ─── Configuration ─────────────────────────────────────────────────────────────

class InterviewConfiguration(BaseModel):
    """
    Retained configuration selected when the interview starts.
    Maps directly to existing InterviewIQ configuration options.
    """
    interview_type: str = Field(default="Technical", description="Type of interview (Technical, HR, etc.)")
    role: str = Field(default="Software Engineer", description="Target job role")
    domain: Optional[str] = Field(default="Frontend", description="Domain or technology stack")
    difficulty: str = Field(default="Medium", description="Target difficulty level")
    experience_level: Optional[str] = Field(default="2+", description="Target experience level")
    duration_minutes: int = Field(default=4, description="Target total interview duration in minutes")
    question_count: int = Field(default=5, description="Target number of main questions")
    counter_questions: bool = Field(default=True, description="Whether adaptive counter questions are enabled")
    mode: str = Field(default="General", description="Interview mode (General, Resume Based, etc.)")

    model_config = ConfigDict(from_attributes=True)


# ─── History Items ─────────────────────────────────────────────────────────────

class QuestionHistoryItem(BaseModel):
    """
    Tracked question in the session's question history.
    """
    question_id: str
    question_text: str
    question_type: str = "main"  # "main" or "counter"
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    order: int = 1
    timestamp: Optional[datetime] = None
    is_follow_up: bool = False
    follow_up_depth: int = 0
    parent_question_id: Optional[str] = None
    has_answer: bool = False
    answer_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AnswerHistoryItem(BaseModel):
    """
    Tracked candidate answer in the session's answer history.
    """
    answer_id: str
    question_id: str
    answer_text: Optional[str] = None
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    status: str = "submitted"  # "pending", "submitted", "evaluated"
    evaluation_reference: Optional[Dict[str, Any]] = None
    facial_analysis_reference: Optional[Dict[str, Any]] = None
    behavior_analysis_reference: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class FollowUpHistoryItem(BaseModel):
    """
    Structured relationship tracking the decision and progression chain:
    Original Question -> Candidate Answer -> Follow-up Decision -> Follow-up Question -> Candidate Answer
    """
    follow_up_id: str
    parent_question_id: str
    parent_question_text: Optional[str] = None
    candidate_answer_id: Optional[str] = None
    candidate_answer_text: Optional[str] = None
    follow_up_decision: str = "generated"  # "generated", "depth_limit_reached", "skipped"
    follow_up_question_id: str
    follow_up_question_text: str
    follow_up_depth: int = 1
    follow_up_answer_id: Optional[str] = None
    follow_up_answer_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ─── References ────────────────────────────────────────────────────────────────

class EvaluationReferenceItem(BaseModel):
    """
    Clean reference structure for past or future answer evaluation results.
    """
    evaluation_id: str
    answer_id: str
    question_id: str
    overall_score: float
    dimension_scores: Dict[str, float] = Field(default_factory=dict)
    summary: Optional[str] = None
    evaluator_provider: str = "heuristic"
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class FaceAnalysisReferenceItem(BaseModel):
    """
    Clean reference structure for facial and camera metrics.
    """
    answer_id: str
    has_frame_metrics: bool = False
    has_temporal_metrics: bool = False
    face_presence_ratio: Optional[float] = None
    camera_alignment: Optional[float] = None
    visual_observations: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class BehaviorAnalysisReferenceItem(BaseModel):
    """
    Clean reference structure for behavioral/speech metrics.
    """
    answer_id: str
    observations: List[str] = Field(default_factory=list)
    confidence_indicator: Optional[float] = None
    wpm: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# ─── Progress & Timing ─────────────────────────────────────────────────────────

class SessionProgress(BaseModel):
    """
    Quantitative progress metrics for the interview attempt.
    """
    current_question_index: int = 0
    total_questions: int = 5
    completed_questions: int = 0
    progress_percentage: float = 0.0
    current_follow_up_depth: int = 0
    stage: str = "not_started"

    model_config = ConfigDict(from_attributes=True)


class SessionTimestamps(BaseModel):
    """
    Timestamp tracking for session milestones.
    """
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None
    current_question_started_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RemainingTimeInfo(BaseModel):
    """
    Timing calculation based on configuration duration and elapsed time.
    """
    total_duration_seconds: int = 240
    elapsed_seconds: float = 0.0
    remaining_seconds: float = 240.0
    is_expired: bool = False

    model_config = ConfigDict(from_attributes=True)


# ─── Centralized Session State ─────────────────────────────────────────────────

class InterviewSessionState(BaseModel):
    """
    Centralized Interview Session State.
    Single source of truth for an active interview session, consumable by UI, tools, and the AI agent.
    """
    session_id: str
    interview_id: str
    user_id: str
    session_status: str = SessionStatus.NOT_STARTED.value
    interview_configuration: InterviewConfiguration
    current_question: Optional[QuestionHistoryItem] = None
    question_history: List[QuestionHistoryItem] = Field(default_factory=list)
    answer_history: List[AnswerHistoryItem] = Field(default_factory=list)
    follow_up_history: List[FollowUpHistoryItem] = Field(default_factory=list)
    evaluation_history: List[EvaluationReferenceItem] = Field(default_factory=list)
    current_topic: Optional[str] = None
    covered_topics: List[str] = Field(default_factory=list)
    progress: SessionProgress
    timestamps: SessionTimestamps
    remaining_time: RemainingTimeInfo
    face_analysis_references: List[FaceAnalysisReferenceItem] = Field(default_factory=list)
    behavior_analysis_references: List[BehaviorAnalysisReferenceItem] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


# ─── Request / Input Schemas ───────────────────────────────────────────────────

class SessionInitializeRequest(BaseModel):
    """
    Request to initialize an interview session.
    """
    initial_questions: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None


class SessionStateUpdateRequest(BaseModel):
    """
    Request to update mutable session state fields.
    """
    status: Optional[str] = None
    current_topic: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AddQuestionRequest(BaseModel):
    """
    Request to append a new question to the session/interview.
    """
    question_text: str = Field(..., min_length=3, description="Text of the question")
    question_order: Optional[int] = Field(default=None, description="Sequence order")
    question_type: str = Field(default="technical", description="Question category")
    topic: Optional[str] = None
    difficulty: Optional[str] = None


class AddAnswerRequest(BaseModel):
    """
    Request to submit a candidate answer within the session state manager.
    """
    question_id: str = Field(..., description="ID of question being answered")
    answer_text: Optional[str] = Field(default="", description="Candidate transcript or text")
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None


class AddFollowUpRequest(BaseModel):
    """
    Request to record an adaptive counter/follow-up question into session state.
    """
    parent_question_id: str = Field(..., description="Parent question ID")
    answer_id: Optional[str] = Field(default=None, description="Answer ID that triggered follow-up")
    question_text: str = Field(..., min_length=3, description="Counter question text")
    follow_up_depth: int = Field(default=1, ge=1, le=5, description="Follow-up nesting depth")
    question_order: Optional[int] = None


class AddEvaluationReferenceRequest(BaseModel):
    """
    Request to record an answer evaluation reference.
    """
    answer_id: str
    overall_score: float
    relevance_score: Optional[float] = None
    correctness_score: Optional[float] = None
    completeness_score: Optional[float] = None
    clarity_score: Optional[float] = None
    technical_depth_score: Optional[float] = None
    summary: Optional[str] = None
    evaluator_provider: str = "heuristic"
