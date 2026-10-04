from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class AgentAction(str, Enum):
    """
    Conceptual decision actions determined by the Groq Interview Agent.
    """
    ASK_QUESTION = "ASK_QUESTION"
    EVALUATE_ANSWER = "EVALUATE_ANSWER"
    FOLLOW_UP = "FOLLOW_UP"
    CONTINUE = "CONTINUE"
    END_INTERVIEW = "END_INTERVIEW"


class AgentDecision(BaseModel):
    """
    Structured reasoning decision output produced by the Interview Agent.
    """
    action: AgentAction = Field(..., description="Action to execute next")
    reasoning: str = Field(..., min_length=3, description="LLM reasoning rationale")
    response_to_candidate: Optional[str] = Field(default=None, description="Verbal message or transition prompt for candidate")
    tool_call_used: Optional[str] = Field(default=None, description="Primary tool that informed this decision")
    tool_result_data: Optional[Dict[str, Any]] = Field(default=None, description="Data extracted from tool execution (e.g. question, score)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Operational metadata")

    model_config = ConfigDict(from_attributes=True)


class AgentTurnRequest(BaseModel):
    """
    Payload sent to the Interview Agent to trigger a decision/orchestration turn.
    """
    session_id: str = Field(..., min_length=1, description="Interview session ID")
    user_message: Optional[str] = Field(default=None, description="Optional textual message or prompt from user/system")
    candidate_answer: Optional[str] = Field(default=None, description="Candidate answer text if submitted in this turn")
    question_id: Optional[str] = Field(default=None, description="Target question ID being answered")
    duration_seconds: Optional[float] = Field(default=None, ge=0.0, description="Answer duration in seconds")
    max_iterations: int = Field(default=4, ge=1, le=8, description="Hard loop safety limit for tool calls")

    model_config = ConfigDict(from_attributes=True)


class ToolExecutionRecord(BaseModel):
    """
    Audit record of a single tool executed during an agent turn.
    """
    tool_name: str
    success: bool
    execution_time_ms: float
    error: Optional[str] = None
    output_preview: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class AgentTurnResponse(BaseModel):
    """
    Response returned by the Interview Agent after completing an orchestration turn.
    """
    session_id: str = Field(..., description="Interview session ID")
    decision: AgentDecision = Field(..., description="Structured decision reached by the agent")
    tools_executed: List[str] = Field(default_factory=list, description="List of tool names executed in this turn")
    tool_records: List[ToolExecutionRecord] = Field(default_factory=list, description="Execution records of invoked tools")
    iterations_count: int = Field(default=1, description="Number of model/tool call cycles executed")
    session_status: str = Field(..., description="Latest interview session status")
    execution_time_ms: float = Field(..., description="Total wall-clock duration of the agent turn")
    fallback_applied: bool = Field(default=False, description="Whether fallback logic was activated due to failure")
    error: Optional[str] = Field(default=None, description="Error message if fallback was triggered")

    model_config = ConfigDict(from_attributes=True)
