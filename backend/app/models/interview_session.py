import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class InterviewSession(Base):
    """
    Interview session model representing an actual candidate attempt at taking an interview.
    """
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id = Column(String, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=False, default="not_started")  # not_started, in_progress, completed, abandoned
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    interview = relationship("Interview", back_populates="sessions")
    answers = relationship("Answer", back_populates="session", cascade="all, delete-orphan")
