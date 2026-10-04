from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field


class ToolResult(BaseModel):
    """
    Standardized result structure returned by any tool execution.
    """
    tool_name: str = Field(..., description="Name of the executed tool")
    success: bool = Field(..., description="Whether tool executed successfully")
    data: Optional[Any] = Field(default=None, description="Structured output payload on success")
    error: Optional[str] = Field(default=None, description="Sanitized error description on failure")
    execution_time_ms: float = Field(default=0.0, description="Duration of tool execution in milliseconds")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Execution metadata")

    model_config = ConfigDict(from_attributes=True)
