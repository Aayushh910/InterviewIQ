"""
Persistent database model for final interview evaluations (Phase 12).
Stores deterministic, reproducible scores, breakdowns, and audit metadata.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship, backref
from app.core.database import Base


class FinalEvaluation(Base):
    """
    Authoritative final evaluation model storing interview-level deterministic scores,
    per-question breakdowns, observable telemetry contributions, and performance summary.
    """
    __tablename__ = "final_evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(
        String,
        ForeignKey("interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )
    interview_id = Column(
        String,
        ForeignKey("interviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    overall_score = Column(Float, nullable=False)
    answer_score = Column(Float, nullable=False)
    communication_score = Column(Float, nullable=True)
    visual_score = Column(Float, nullable=True)
    performance_category = Column(String(50), nullable=False)

    category_scores = Column(JSON, nullable=False, default=dict)
    applied_weights = Column(JSON, nullable=False, default=dict)
    evidence_coverage = Column(JSON, nullable=False, default=dict)
    evidence_reliability = Column(JSON, nullable=False, default=dict)
    per_question_breakdown = Column(JSON, nullable=False, default=list)

    strengths = Column(JSON, nullable=False, default=list)
    improvements = Column(JSON, nullable=False, default=list)
    summary = Column(Text, nullable=False)

    scoring_version = Column(String(20), nullable=False, default="1.0")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    session = relationship("InterviewSession", backref=backref("final_evaluation", uselist=False, cascade="all, delete-orphan"))
    interview = relationship("Interview")
    user = relationship("User")
