import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship, foreign
from app.core.database import Base


class InterviewQuestion(Base):
    """
    Interview question model belonging to an interview setup configuration.
    """
    __tablename__ = "interview_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_id = Column(String, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_order = Column(Integer, nullable=False)
    question_type = Column(String(100), nullable=False, default="technical")
    generation_provider = Column(String(100), nullable=True, default="ai")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    interview = relationship("Interview", back_populates="questions")
    answers = relationship("Answer", primaryjoin="InterviewQuestion.id==foreign(Answer.question_id)", cascade="all, delete-orphan")
