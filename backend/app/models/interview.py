import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Interview(Base):
    """
    Interview configuration model belonging to a specific candidate user.
    """
    __tablename__ = "interviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    job_role = Column(String(255), nullable=False, default="Software Engineer")
    interview_type = Column(String(100), nullable=False, default="Technical")
    mode = Column(String(100), nullable=False, default="General")
    domain = Column(String(100), nullable=True)
    difficulty = Column(String(50), nullable=False, default="Medium")
    experience_level = Column(String(50), nullable=True, default="2+")
    question_count = Column(Integer, nullable=False, default=5)
    counter_questions = Column(Boolean, nullable=False, default=True)
    status = Column(String(50), nullable=False, default="ready")  # draft, ready, completed, archived
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="interviews")
    questions = relationship(
        "InterviewQuestion",
        back_populates="interview",
        order_by="InterviewQuestion.question_order",
        cascade="all, delete-orphan"
    )
    sessions = relationship("InterviewSession", back_populates="interview", cascade="all, delete-orphan")
