import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class SessionQuestion(Base):
    """
    Session-specific question model representing dynamically generated adaptive counter questions
    and session-scoped question instances. Isolated per candidate interview attempt.
    """
    __tablename__ = "session_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    interview_id = Column(String, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_question_id = Column(String, nullable=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, default="counter")  # "main" or "counter"
    follow_up_depth = Column(Integer, nullable=False, default=0)
    question_order = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("InterviewSession", backref="session_questions")
    interview = relationship("Interview")
