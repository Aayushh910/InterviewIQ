from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class QuestionBase(BaseModel):
    question_text: str
    question_order: int = 1
    question_type: str = "technical"


class QuestionCreate(QuestionBase):
    pass


class QuestionResponse(QuestionBase):
    id: str
    interview_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NextQuestionInfo(BaseModel):
    id: str
    question_text: str
    question_type: str = "main"  # "main" or "counter"
    parent_question_id: Optional[str] = None
    follow_up_depth: int = 0

    model_config = ConfigDict(from_attributes=True)
