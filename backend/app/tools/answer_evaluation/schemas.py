from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class EvaluateAnswerToolInput(BaseModel):
    """
    Input schema for the evaluate_answer tool.
    """
    question_text: str = Field(..., min_length=3, description="Interview question text")
    candidate_answer_text: str = Field(..., description="Candidate's answer transcript or text")
    role: Optional[str] = Field(default="Software Engineer", description="Target job role")
    domain: Optional[str] = Field(default="Frontend", description="Domain or tech stack")
    difficulty: Optional[str] = Field(default="Medium", description="Difficulty level")
    interview_type: Optional[str] = Field(default="Technical", description="Interview category")
    duration_seconds: Optional[float] = Field(default=None, ge=0.0, description="Answer speech/response duration")

    model_config = ConfigDict(from_attributes=True)


class EvaluateAnswerToolOutput(BaseModel):
    """
    Output schema for the evaluate_answer tool.
    """
    relevance_score: float = Field(..., ge=0.0, le=100.0, description="Relevance score (0-100)")
    correctness_score: float = Field(..., ge=0.0, le=100.0, description="Correctness score (0-100)")
    completeness_score: float = Field(..., ge=0.0, le=100.0, description="Completeness score (0-100)")
    clarity_score: float = Field(..., ge=0.0, le=100.0, description="Clarity score (0-100)")
    technical_depth_score: float = Field(..., ge=0.0, le=100.0, description="Technical depth score (0-100)")
    overall_score: float = Field(..., ge=0.0, le=100.0, description="Weighted overall score (0-100)")
    communication_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Communication score (0-100)")
    grammar_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Grammar score (0-100)")
    timing_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Timing score (0-100)")
    strengths: List[str] = Field(default_factory=list, description="Key candidate strengths identified")
    improvements: List[str] = Field(default_factory=list, description="Areas for candidate improvement")
    summary: str = Field(..., description="Executive summary feedback")
    recommended_response: Optional[str] = Field(default=None, description="Model exemplar response")
    evaluator_provider: str = Field(default="heuristic", description="Evaluation engine used")

    model_config = ConfigDict(from_attributes=True)
