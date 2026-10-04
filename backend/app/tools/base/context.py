from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session


class ToolExecutionContext(BaseModel):
    """
    Context passed into tool execution providing access to database sessions,
    authenticated user identity, and provider overrides.
    """
    db: Optional[Any] = Field(default=None, description="SQLAlchemy Session instance")
    user_id: Optional[str] = Field(default=None, description="Authenticated user ID")
    provider_override: Optional[str] = Field(default=None, description="Override AI provider (e.g. groq, mock)")
    mock_mode: Optional[str] = Field(default=None, description="Mock mode configuration (e.g. success, failure, timeout)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional context parameters")

    model_config = ConfigDict(arbitrary_types_allowed=True)
