"""
Pydantic v2 schemas for InterviewIQ Final Evaluation & Scoring (Phase 12).
Defines normalized evidence structures, per-question score models, and final evaluation results.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict, Field


# ─── Normalized Evidence Schemas (Aggregator Output) ──────────────────────────

class NormalizedAnswerEvidence(BaseModel):
    """Normalized structured answer evaluation evidence for a single question."""
    question_id: str
    question_text: str
    question_type: str = "main"  # "main" or "counter"
    question_order: int = 1
    answer_id: str
    answer_text: str
    duration_seconds: Optional[float] = None
    # 5 core evaluation dimensions
    correctness_score: float = 0.0
    relevance_score: float = 0.0
    technical_depth_score: float = 0.0
    completeness_score: float = 0.0
    clarity_score: float = 0.0
    overall_answer_score: float = 0.0
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    summary: str = ""
    has_evaluation: bool = True

    model_config = ConfigDict(from_attributes=True)


class NormalizedVisualEvidence(BaseModel):
    """Normalized structured facial/visual telemetry evidence."""
    status: str = "available"  # "available", "unavailable", "no_face_detected", "insufficient_quality"
    face_detected: bool = False
    face_presence_ratio: Optional[float] = None
    camera_alignment: Optional[float] = None
    position_quality: Optional[float] = None
    confidence_score: float = 1.0
    quality_rating: str = "high"  # "high", "medium", "low"
    observations: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class NormalizedBehaviorEvidence(BaseModel):
    """Normalized structured communication/speech behavior evidence."""
    status: str = "available"  # "available", "unavailable"
    duration_seconds: float = 0.0
    speaking_rate_wpm: float = 0.0
    pause_count: int = 0
    filler_word_count: int = 0
    speaking_ratio: float = 1.0
    confidence_score: float = 1.0
    quality_rating: str = "high"
    observations: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class QuestionEvidenceBundle(BaseModel):
    """Complete collection of evidence tied to a specific question attempt."""
    question_id: str
    question_text: str
    question_type: str = "main"
    question_order: int = 1
    answer: Optional[NormalizedAnswerEvidence] = None
    visual: Optional[NormalizedVisualEvidence] = None
    behavior: Optional[NormalizedBehaviorEvidence] = None

    model_config = ConfigDict(from_attributes=True)


class AggregatedSessionEvidence(BaseModel):
    """Complete aggregated evidence package for an entire interview session."""
    session_id: str
    interview_id: str
    user_id: str
    session_status: str
    total_questions: int
    answered_questions_count: int
    questions: List[QuestionEvidenceBundle] = Field(default_factory=list)
    session_visual: Optional[NormalizedVisualEvidence] = None
    session_behavior: Optional[NormalizedBehaviorEvidence] = None

    model_config = ConfigDict(from_attributes=True)


# ─── Scoring Engine Output Schemas ────────────────────────────────────────────

class PerQuestionScore(BaseModel):
    """Deterministic score and breakdown for a single question."""
    question_id: str
    question_text: str
    question_type: str = "main"
    answer_id: Optional[str] = None
    answer_score: float = 0.0
    visual_score: Optional[float] = None
    communication_score: Optional[float] = None
    combined_score: float = 0.0
    evidence_availability: Dict[str, bool] = Field(default_factory=dict)
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class FinalEvaluationResult(BaseModel):
    """
    Comprehensive, reproducible final interview evaluation result.
    Consumable by UI, APIs, and persistent storage.
    """
    evaluation_id: str
    session_id: str
    interview_id: str
    user_id: str
    overall_score: float = Field(..., ge=0.0, le=100.0, description="Overall weighted interview score")
    answer_quality_score: float = Field(..., ge=0.0, le=100.0, description="Average answer quality score")
    communication_score: Optional[float] = Field(default=None, description="Communication behavior score if available")
    visual_presentation_score: Optional[float] = Field(default=None, description="Visual presentation score if available")
    performance_category: str = Field(..., description="Qualitative grade band: Exceptional, Strong, etc.")
    category_scores: Dict[str, float] = Field(default_factory=dict, description="Component score breakdown")
    applied_weights: Dict[str, float] = Field(default_factory=dict, description="Exact weights applied after renormalization")
    evidence_coverage: Dict[str, Any] = Field(default_factory=dict, description="Coverage statistics across questions")
    evidence_reliability: Dict[str, Any] = Field(default_factory=dict, description="Aggregate sensor reliability indicators")
    per_question_breakdown: List[PerQuestionScore] = Field(default_factory=list, description="Per-question scores")
    strengths: List[str] = Field(default_factory=list, description="Consolidated top candidate strengths")
    improvements: List[str] = Field(default_factory=list, description="Consolidated areas for improvement")
    summary: str = Field(..., description="Deterministic, explainable summary of interview performance")
    scoring_version: str = Field(default="1.0", description="Version of scoring algorithm used")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


# ─── API Request / Response Schemas ───────────────────────────────────────────

class CalculateFinalEvaluationRequest(BaseModel):
    """Request payload for triggering final evaluation."""
    force_recalculate: bool = Field(default=False, description="Whether to recompute if evaluation already exists")


class FinalEvaluationSummaryResponse(BaseModel):
    """Concise representation of final evaluation for dashboard lists."""
    evaluation_id: str
    session_id: str
    overall_score: float
    performance_category: str
    answer_quality_score: float
    communication_score: Optional[float] = None
    visual_presentation_score: Optional[float] = None
    summary: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
