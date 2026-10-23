import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    """
    User database model representing platform candidates and administrators.
    """
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(100), default="Senior Full-Stack Candidate")
    avatar = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)

    # Detailed Candidate Profile Fields
    target_position = Column(String(255), nullable=True)
    bio = Column(String(1000), nullable=True)
    location = Column(String(255), nullable=True)
    skills = Column(String(1000), nullable=True)
    education = Column(String(255), nullable=True)
    github = Column(String(255), nullable=True)
    linkedin = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    leetcode = Column(String(255), nullable=True)
    codeforces = Column(String(255), nullable=True)
    codechef = Column(String(255), nullable=True)
    hackerrank = Column(String(255), nullable=True)
    groq_api_key = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
