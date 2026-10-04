"""
Schemas for CalculateFinalEvaluationTool (Phase 12).
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CalculateFinalEvaluationInput(BaseModel):
    """Input payload for calculate_final_evaluation tool."""
    session_id: str = Field(..., min_length=1, description="Interview session ID to evaluate")
    force_recalculate: bool = Field(default=False, description="Whether to recompute existing evaluation")

    model_config = ConfigDict(from_attributes=True)


class CalculateFinalEvaluationOutput(BaseModel):
    """Structured output of calculate_final_evaluation tool."""
    evaluation_id: str = Field(default="", description="Unique evaluation record ID")
    session_id: str = Field(default="", description="Interview session ID")
    overall_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Overall weighted interview score")
    performance_category: str = Field(default="Evaluated", description="Qualitative grade band")
    category_scores: Dict[str, float] = Field(default_factory=dict, description="Component score breakdown")
    applied_weights: Dict[str, float] = Field(default_factory=dict, description="Normalized category weights applied")
    strengths: List[str] = Field(default_factory=list, description="Top candidate strengths")
    improvements: List[str] = Field(default_factory=list, description="Areas for candidate improvement")
    summary: str = Field(default="", description="Deterministic performance summary")
    scoring_version: str = Field(default="1.0", description="Scoring version identifier")

    model_config = ConfigDict(from_attributes=True)
