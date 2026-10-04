"""
Pydantic schemas and candidate-facing Data Transfer Objects (DTOs)
for InterviewIQ Results Dashboard & Interview Report System (Phase 13).

Strictly isolates internal database models, foreign keys, and raw implementation
details from candidate-facing representations.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class DimensionScore(BaseModel):
    """Underlying answer quality dimension score and label."""
    dimension_key: str
    dimension_name: str
    score: float = Field(..., ge=0.0, le=100.0)
    description: str

    model_config = ConfigDict(from_attributes=True)


class AnswerQualityBreakdown(BaseModel):
    """Detailed candidate-facing breakdown of answer quality."""
    score: float = Field(..., ge=0.0, le=100.0)
    applied_weight_pct: float = Field(..., description="Weight percentage applied in final score, e.g. 70.0")
    dimensions: List[DimensionScore] = Field(default_factory=list)
    explanation: str

    model_config = ConfigDict(from_attributes=True)


class CommunicationSignals(BaseModel):
    """Observable, neutral communication telemetry signals."""
    is_available: bool = False
    speaking_rate_wpm: Optional[float] = None
    filler_word_count: Optional[int] = None
    speaking_ratio_pct: Optional[float] = None
    speaking_flow: Optional[str] = None
    observations: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class CommunicationBreakdown(BaseModel):
    """Detailed candidate-facing breakdown of observable communication behavior."""
    score: Optional[float] = None
    applied_weight_pct: Optional[float] = None
    is_available: bool = False
    signals: CommunicationSignals
    explanation: str

    model_config = ConfigDict(from_attributes=True)


class VisualSignals(BaseModel):
    """Observable, neutral visual presentation telemetry signals."""
    is_available: bool = False
    face_presence_pct: Optional[float] = None
    camera_alignment_pct: Optional[float] = None
    position_quality_pct: Optional[float] = None
    observations: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class VisualBreakdown(BaseModel):
    """Detailed candidate-facing breakdown of observable visual presentation."""
    score: Optional[float] = None
    applied_weight_pct: Optional[float] = None
    is_available: bool = False
    signals: VisualSignals
    explanation: str

    model_config = ConfigDict(from_attributes=True)


class CandidateQuestionResult(BaseModel):
    """
    Sanitized question-level result for candidate review.
    Does NOT expose database IDs or raw implementation internals.
    """
    question_number: int = Field(..., description="1-indexed question sequence number")
    question_text: str
    question_type: str = Field(..., description="'Main Question' or 'Follow-up Question'")
    raw_question_type: str = Field(..., description="'main' or 'counter'")
    answer_score: float = Field(..., ge=0.0, le=100.0)
    visual_score: Optional[float] = None
    communication_score: Optional[float] = None
    combined_score: float = Field(..., ge=0.0, le=100.0)
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    evidence_availability: Dict[str, bool] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class EvidenceCoverageDTO(BaseModel):
    """Summary of evidence collection completeness."""
    total_questions: int
    answered_questions: int
    completion_percentage: float
    has_answer_evidence: bool = True
    has_communication_evidence: bool = False
    has_visual_evidence: bool = False
    explanation: str

    model_config = ConfigDict(from_attributes=True)


class EvidenceReliabilityDTO(BaseModel):
    """Summary of sensor and signal reliability."""
    answer_coverage: str
    communication_quality: str
    visual_quality: str
    explanation: str

    model_config = ConfigDict(from_attributes=True)


class ScoringTransparencyDTO(BaseModel):
    """Educational breakdown of how final scores are deterministically synthesized."""
    scoring_version: str = "1.0"
    applied_weights: Dict[str, float] = Field(default_factory=dict)
    methodology: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class CandidateResultsDTO(BaseModel):
    """
    Complete candidate-facing interview performance analysis DTO.
    Consumes Phase 12 FinalEvaluation and aggregated telemetry.
    """
    session_id: str
    interview_title: str
    job_role: str
    interview_type: str
    candidate_name: str
    completed_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None

    # Overall summary
    overall_score: float = Field(..., ge=0.0, le=100.0)
    performance_category: str = Field(..., description="Exceptional, Strong, Proficient, Developing, Needs Improvement")
    evaluation_summary: str

    # Pillar breakdowns
    answer_quality: AnswerQualityBreakdown
    communication: CommunicationBreakdown
    visual_presentation: VisualBreakdown

    # "Why did I receive this score?" explanation
    score_explanations: List[str] = Field(default_factory=list)

    # Per-Question details
    questions: List[CandidateQuestionResult] = Field(default_factory=list)

    # Consolidated Insights
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)

    # Telemetry and Transparency
    evidence_coverage: EvidenceCoverageDTO
    evidence_reliability: EvidenceReliabilityDTO
    transparency: ScoringTransparencyDTO

    # Report metadata
    report_version: str = "1.0"
    pdf_download_url: str

    model_config = ConfigDict(from_attributes=True)
