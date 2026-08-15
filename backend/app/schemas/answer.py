from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.question import NextQuestionInfo
from app.schemas.evaluation import AnswerEvaluationResponse


class AnswerBase(BaseModel):
    question_id: str
    answer_text: Optional[str] = None
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None


class AnswerCreate(AnswerBase):
    pass


class AnswerResponse(AnswerBase):
    id: str
    session_id: str
    facial_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnswerSubmitResponse(BaseModel):
    id: str
    session_id: str
    question_id: str
    answer_text: Optional[str] = None
    facial_analysis: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    answer: Optional[AnswerResponse] = None
    evaluation: Optional[AnswerEvaluationResponse] = None
    next_question: Optional[NextQuestionInfo] = None
    interview_complete: bool = False

    model_config = ConfigDict(from_attributes=True)
