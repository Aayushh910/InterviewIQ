import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class MultimodalEvidence(Base):
    """
    Persistent model storing temporal multimodal evidence (facial, behavioral, speech metrics)
    associated with an interview session, question, or candidate answer.
    """
    __tablename__ = "multimodal_evidence"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String, nullable=True, index=True)
    answer_id = Column(String, ForeignKey("answers.id", ondelete="SET NULL"), nullable=True, index=True)
    evidence_type = Column(String(50), nullable=False, index=True)  # face, behavior, temporal_face
    status = Column(String(50), nullable=False, default="available")  # available, unavailable, no_face_detected, insufficient_quality
    confidence_score = Column(Float, nullable=False, default=1.0)
    raw_evidence = Column(JSON, nullable=True)
    derived_indicators = Column(JSON, nullable=True)
    observations = Column(JSON, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("InterviewSession", backref="multimodal_evidence")
    answer = relationship("Answer", backref="multimodal_evidence")
