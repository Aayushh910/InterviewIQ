import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class AnswerEvaluation(Base):
    """
    Answer evaluation model storing structured 5-dimension scores, overall weighted score,
    strengths, improvements, and feedback summary for a candidate response.
    """
    __tablename__ = "answer_evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    answer_id = Column(String, ForeignKey("answers.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    relevance_score = Column(Float, nullable=False)
    correctness_score = Column(Float, nullable=False)
    completeness_score = Column(Float, nullable=False)
    clarity_score = Column(Float, nullable=False)
    technical_depth_score = Column(Float, nullable=False)
    overall_score = Column(Float, nullable=False)
    strengths = Column(JSON, nullable=False, default=list)
    improvements = Column(JSON, nullable=False, default=list)
    summary = Column(Text, nullable=False)
    evaluator_provider = Column(String(50), nullable=False, default="heuristic")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    answer = relationship("Answer", back_populates="evaluation")
