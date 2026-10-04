from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class GetInterviewStateInput(BaseModel):
    """
    Input schema for the get_interview_state tool.
    """
    session_id: str = Field(..., min_length=1, description="Interview session ID")

    model_config = ConfigDict(from_attributes=True)


class UpdateInterviewStateInput(BaseModel):
    """
    Input schema for the update_interview_state tool.
    """
    session_id: str = Field(..., min_length=1, description="Interview session ID")
    status: Optional[str] = Field(default=None, description="Target lifecycle state (in_progress, paused, completed, abandoned)")
    current_topic: Optional[str] = Field(default=None, description="Active discussion topic")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Runtime metadata key-value updates")

    model_config = ConfigDict(from_attributes=True)
