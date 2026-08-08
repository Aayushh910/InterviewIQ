from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class InterviewBase(BaseModel):
    title: str = "Technical Interview"
    job_role: str = "Software Engineer"
    interview_type: str = "Technical"
    mode: str = "General"
    domain: Optional[str] = "Frontend"
    difficulty: str = "Medium"
    experience_level: Optional[str] = "2+"
    question_count: int = 5
    counter_questions: bool = True
    status: str = "ready"


class InterviewCreate(BaseModel):
    title: Optional[str] = "Technical Interview"
    job_role: Optional[str] = "Software Engineer"
    interview_type: Optional[str] = "Technical"
    mode: Optional[str] = "General"
    domain: Optional[str] = "Frontend"
    difficulty: Optional[str] = "Medium"
    experience_level: Optional[str] = "2+"
    question_count: Optional[int] = 5
    counter_questions: Optional[bool] = True
    status: Optional[str] = "ready"


class InterviewUpdate(BaseModel):
    title: Optional[str] = None
    job_role: Optional[str] = None
    interview_type: Optional[str] = None
    mode: Optional[str] = None
    domain: Optional[str] = None
    difficulty: Optional[str] = None
    experience_level: Optional[str] = None
    question_count: Optional[int] = None
    counter_questions: Optional[bool] = None
    status: Optional[str] = None


class InterviewResponse(InterviewBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
