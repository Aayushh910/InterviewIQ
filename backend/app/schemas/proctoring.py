from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


VALID_PROCTORING_EVENT_TYPES = {
    # Phase 16 Visual Analysis Events
    "eye_tracking_unavailable",
    "prolonged_eye_closure",
    "off_camera_gaze",
    "phone_detected",
    "phone_detection_ended",
    "face_tracking_unavailable",
    "multiple_faces_detected",
    # Phase 17 Tab & Session Monitoring Events
    "tab_hidden",
    "tab_visible",
    "window_blur",
    "window_focus",
    "fullscreen_exited",
    "fullscreen_restored",
}


class ProctoringPolicy(BaseModel):
    """
    Authoritative proctoring policy and threshold configuration.
    """
    tab_monitoring_enabled: bool = Field(default=True, description="Enable tab visibility monitoring")
    fullscreen_enforcement_enabled: bool = Field(default=False, description="Enforce fullscreen throughout session")
    policy_mode: str = Field(default="warning_only", description="Policy enforcement mode: 'warning_only' or 'auto_submit'")
    max_tab_departures: int = Field(default=2, ge=1, le=10, description="Max allowed qualifying tab departures before action")
    grace_period_seconds: float = Field(default=10.0, ge=1.0, le=60.0, description="Grace period before departure is confirmed")
    phone_detection_enabled: bool = Field(default=True, description="Enable real-time mobile phone detection")
    gaze_eye_analysis_enabled: bool = Field(default=True, description="Enable eye openness and gaze tracking")
    phone_confidence_threshold: float = Field(default=0.45, ge=0.1, le=1.0, description="Min confidence for phone detection")
    eye_closure_threshold_seconds: float = Field(default=2.5, ge=1.0, le=10.0, description="Duration to classify prolonged eye closure")
    off_camera_threshold_seconds: float = Field(default=3.5, ge=1.0, le=15.0, description="Duration to classify off-camera gaze")
    auto_submission_enabled: bool = Field(default=False, description="Whether exceeding policy triggers auto-submission")


class ProctoringEventCreate(BaseModel):
    """
    Input schema for single proctoring event ingestion with server-side validation.
    """
    event_id: Optional[str] = Field(default=None, max_length=64)
    event_type: str = Field(..., max_length=64)
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    duration_seconds: Optional[float] = Field(default=None, ge=0.0, le=7200.0)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        clean_type = v.strip().lower()
        if clean_type not in VALID_PROCTORING_EVENT_TYPES:
            raise ValueError(
                f"Invalid proctoring event type '{v}'. Allowed types: {sorted(VALID_PROCTORING_EVENT_TYPES)}"
            )
        return clean_type

    @field_validator("metadata")
    @classmethod
    def validate_metadata_size(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if v and len(str(v)) > 8192:
            raise ValueError("Proctoring event metadata payload exceeds 8KB limit.")
        return v or {}


class ProctoringEventsBatchRequest(BaseModel):
    """
    Batch ingestion schema to minimize network round-trips.
    """
    events: List[ProctoringEventCreate] = Field(..., max_length=50)


class ProctoringEventResponse(BaseModel):
    """
    Response representation of a persisted proctoring event.
    """
    id: str
    session_id: str
    event_type: str
    confidence: Optional[float] = None
    duration_seconds: Optional[float] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    recorded_at: datetime
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, validation_alias="event_metadata")

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }


class ProctoringSummaryResponse(BaseModel):
    """
    Aggregated proctoring metrics and integrity indicators.
    """
    session_id: str
    face_tracking_coverage: float = Field(default=1.0, ge=0.0, le=1.0)
    eye_open_percentage: float = Field(default=95.0, ge=0.0, le=100.0)
    camera_directed_gaze_percentage: float = Field(default=85.0, ge=0.0, le=100.0)
    screen_directed_gaze_percentage: float = Field(default=10.0, ge=0.0, le=100.0)
    blink_count: int = Field(default=0, ge=0)
    blink_frequency: float = Field(default=0.0, ge=0.0)  # blinks per minute
    prolonged_closure_count: int = Field(default=0, ge=0)
    prolonged_closure_total_duration: float = Field(default=0.0, ge=0.0)
    off_camera_gaze_intervals: int = Field(default=0, ge=0)
    off_camera_gaze_total_duration: float = Field(default=0.0, ge=0.0)
    longest_off_camera_interval: float = Field(default=0.0, ge=0.0)
    phone_detection_count: int = Field(default=0, ge=0)
    phone_detection_total_duration: float = Field(default=0.0, ge=0.0)
    tab_departures_count: int = Field(default=0, ge=0)
    fullscreen_exits_count: int = Field(default=0, ge=0)
    window_blur_count: int = Field(default=0, ge=0)
    tracking_failures_count: int = Field(default=0, ge=0)
    total_events_count: int = Field(default=0, ge=0)
    integrity_status: str = Field(default="verified")  # verified, flagged, review_required, insufficient_data
    termination_reason: Optional[str] = None
    policy: ProctoringPolicy = Field(default_factory=ProctoringPolicy)
    recent_events: List[ProctoringEventResponse] = Field(default_factory=list)


class SessionTerminationRequest(BaseModel):
    """
    Request to finalize or terminate a session due to proctoring policy violation.
    """
    reason: str = Field(default="proctoring_tab_departures", max_length=100)
    departure_count: Optional[int] = Field(default=None, ge=0)
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)
