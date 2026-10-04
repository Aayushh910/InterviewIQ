"""
Pydantic schemas for Phase 11: Real-Time Multimodal Evidence Collection.
Defines structured contracts for observed evidence, derived indicators, measurement reliability,
and temporal evidence records.
"""

from enum import Enum
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class EvidenceType(str, Enum):
    """Classification of collected multimodal interview evidence."""
    FACE = "face"
    BEHAVIOR = "behavior"
    TEMPORAL_FACE = "temporal_face"


class EvidenceStatus(str, Enum):
    """Measurement outcome and data availability status."""
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    NO_FACE_DETECTED = "no_face_detected"
    INSUFFICIENT_QUALITY = "insufficient_quality"


class MeasurementReliability(BaseModel):
    """Deterministic reliability metrics indicating measurement validity."""
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0, description="Measurement reliability index (0-1)")
    quality_rating: str = Field(default="high", description="Reliability level: high, medium, low, unreliable")
    notes: Optional[str] = Field(default=None, description="Technical measurement quality notes")

    model_config = ConfigDict(from_attributes=True)


# ─── 1. Face Analysis Schemas ──────────────────────────────────────────────────

class AnalyzeFaceInput(BaseModel):
    """Input payload for the analyze_face tool."""
    session_id: str = Field(..., min_length=1, description="Interview session ID")
    answer_id: Optional[str] = Field(default=None, description="Optional answer ID to associate evidence with")
    question_id: Optional[str] = Field(default=None, description="Optional question ID being answered")
    image_base64: Optional[str] = Field(default=None, description="Optional base64-encoded frame image to analyze")

    model_config = ConfigDict(from_attributes=True)


class AnalyzeFaceOutput(BaseModel):
    """Structured objective evidence produced by the analyze_face tool."""
    status: EvidenceStatus = Field(default=EvidenceStatus.AVAILABLE, description="Measurement availability status")
    face_detected: bool = Field(default=False, description="Whether a human face was identified in the visual sample")
    face_presence_ratio: float = Field(default=0.0, ge=0.0, le=1.0, description="Ratio of sampled frames where face was detected")
    camera_alignment: float = Field(default=0.0, ge=0.0, le=1.0, description="Direct camera orientation alignment score")
    head_orientation: Optional[Dict[str, float]] = Field(default=None, description="Estimated head pose: yaw, pitch, roll in degrees")
    position_quality: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Centering and scale framing quality score")
    eye_openness: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Eye openness / aspect ratio indicator if measurable")
    reliability: MeasurementReliability = Field(default_factory=MeasurementReliability, description="Sensor measurement reliability")
    observations: List[str] = Field(default_factory=list, description="Neutral objective observations (no psychological claims)")

    model_config = ConfigDict(from_attributes=True)


# ─── 2. Behavior Analysis Schemas ──────────────────────────────────────────────

class AnalyzeBehaviorInput(BaseModel):
    """Input payload for the analyze_behavior tool."""
    session_id: str = Field(..., min_length=1, description="Interview session ID")
    answer_id: Optional[str] = Field(default=None, description="Optional answer ID to associate evidence with")
    question_id: Optional[str] = Field(default=None, description="Optional question ID being answered")
    transcript: Optional[str] = Field(default=None, description="Optional speech transcript text to analyze")
    duration_seconds: Optional[float] = Field(default=None, ge=0.0, description="Optional audio/speech duration in seconds")

    model_config = ConfigDict(from_attributes=True)


class AnalyzeBehaviorOutput(BaseModel):
    """Structured objective evidence produced by the analyze_behavior tool."""
    status: EvidenceStatus = Field(default=EvidenceStatus.AVAILABLE, description="Measurement availability status")
    response_duration_seconds: float = Field(default=0.0, ge=0.0, description="Total candidate response duration in seconds")
    speaking_rate_wpm: float = Field(default=0.0, ge=0.0, description="Calculated words per minute pacing indicator")
    pause_count: int = Field(default=0, ge=0, description="Measured count of noticeable speaking pauses")
    filler_word_count: int = Field(default=0, ge=0, description="Identified count of verbal filler words")
    speaking_ratio: float = Field(default=1.0, ge=0.0, le=1.0, description="Active speaking time vs total answer duration")
    response_latency_seconds: Optional[float] = Field(default=None, ge=0.0, description="Elapsed seconds from prompt to first spoken word")
    reliability: MeasurementReliability = Field(default_factory=MeasurementReliability, description="Sensor measurement reliability")
    observations: List[str] = Field(default_factory=list, description="Neutral objective observations (no psychological claims)")

    model_config = ConfigDict(from_attributes=True)


# ─── 3. Stored Multimodal Evidence Record ─────────────────────────────────────

class MultimodalEvidenceRecord(BaseModel):
    """Complete persistent representation of a temporal multimodal evidence record."""
    id: str = Field(..., description="Unique evidence record ID")
    session_id: str = Field(..., description="Interview session ID")
    question_id: Optional[str] = Field(default=None, description="Associated question ID")
    answer_id: Optional[str] = Field(default=None, description="Associated candidate answer ID")
    evidence_type: EvidenceType = Field(..., description="Category of multimodal evidence")
    status: EvidenceStatus = Field(..., description="Status of the evidence measurement")
    confidence_score: float = Field(default=1.0, description="Measurement reliability score")
    raw_evidence: Dict[str, Any] = Field(default_factory=dict, description="Raw measured telemetry")
    derived_indicators: Dict[str, Any] = Field(default_factory=dict, description="Deterministic calculated indicators")
    observations: List[str] = Field(default_factory=list, description="Neutral descriptive findings")
    recorded_at: datetime = Field(..., description="UTC timestamp when evidence was collected")

    model_config = ConfigDict(from_attributes=True)
