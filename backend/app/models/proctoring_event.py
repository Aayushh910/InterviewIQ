import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class ProctoringEvent(Base):
    """
    Persistent model storing standardized proctoring and monitoring events:
    - eye_tracking_unavailable
    - prolonged_eye_closure
    - off_camera_gaze
    - phone_detected
    - phone_detection_ended
    - face_tracking_unavailable
    - tab_hidden
    - tab_visible
    - window_blur
    - window_focus
    - fullscreen_exited
    - fullscreen_restored
    """
    __tablename__ = "proctoring_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False, index=True)
    confidence = Column(Float, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    event_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("InterviewSession", back_populates="proctoring_events")
