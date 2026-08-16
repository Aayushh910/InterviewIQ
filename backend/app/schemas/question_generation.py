from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.question import QuestionResponse


class QuestionGenerationRequest(BaseModel):
    """
    Input request schema for AI Interview Question Generation.
    """
    interview_id: str
    number_of_questions: Optional[int] = Field(default=5, ge=1, le=20)
    provider: Optional[str] = None
    mock_mode: Optional[str] = None


class QuestionGenerationResponse(BaseModel):
    """
    Output response schema containing persisted AI-generated questions.
    """
    interview_id: str
    count: int
    provider: str
    questions: List[QuestionResponse]

    model_config = ConfigDict(from_attributes=True)
