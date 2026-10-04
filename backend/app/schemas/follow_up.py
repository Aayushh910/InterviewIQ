from typing import Optional
from pydantic import BaseModel, ConfigDict


class FollowUpRequest(BaseModel):
    """
    Request schema for generating an adaptive AI follow-up question based on candidate answer.
    """
    interview_id: str
    question_id: str
    answer_id: str
    provider: Optional[str] = None
    mock_mode: Optional[str] = None


class FollowUpItem(BaseModel):
    """
    Details of the generated follow-up question.
    """
    id: str
    question_text: str
    question_type: str = "counter"
    follow_up_type: str
    follow_up_depth: int
    parent_question_id: Optional[str] = None
    generation_provider: Optional[str] = "groq"

    model_config = ConfigDict(from_attributes=True)


class FollowUpResponse(BaseModel):
    """
    Structured output response for AI follow-up decision and details.
    """
    should_follow_up: bool
    reason: str
    follow_up: Optional[FollowUpItem] = None

    model_config = ConfigDict(from_attributes=True)
