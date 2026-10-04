from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict, Field


class FollowUpToolInput(BaseModel):
    """
    Input schema for the generate_follow_up_question tool.
    """
    parent_question_text: str = Field(..., min_length=3, description="Original question text")
    candidate_answer_text: str = Field(..., description="Candidate's answer text")
    role: str = Field(default="Software Engineer", description="Target job role")
    domain: str = Field(default="Frontend", description="Domain or technology stack")
    difficulty: str = Field(default="Medium", description="Target difficulty level")
    interview_type: str = Field(default="Technical", description="Interview category")
    experience_level: Optional[str] = Field(default="2+", description="Target experience level")
    follow_up_depth: int = Field(default=0, ge=0, le=5, description="Current follow-up nesting depth")
    previous_context: Optional[List[Dict[str, str]]] = Field(default=None, description="Prior conversation turns in the session")

    model_config = ConfigDict(from_attributes=True)


class FollowUpToolOutput(BaseModel):
    """
    Output schema for the generate_follow_up_question tool.
    """
    should_follow_up: bool = Field(..., description="Whether a follow-up question was generated")
    reason: str = Field(..., description="Reasoning behind the follow-up decision")
    follow_up_question: Optional[str] = Field(default=None, description="Generated follow-up question text")
    follow_up_type: Optional[str] = Field(default=None, description="Focus area of the follow-up question")
    follow_up_depth: int = Field(default=0, description="Resulting follow-up depth")
    provider: str = Field(default="groq", description="AI provider used")

    model_config = ConfigDict(from_attributes=True)
