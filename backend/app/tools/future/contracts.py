"""
Future-ready tool contracts for InterviewIQ.
In Phase 11, AnalyzeFaceTool and AnalyzeBehaviorTool have graduated into real operational tools
in `app.tools.multimodal`.

Only final scoring and reporting remain as future contracts.
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult

# Re-export real multimodal tools from their operational package for backward compatibility
from app.tools.multimodal.face_tool import AnalyzeFaceTool
from app.tools.multimodal.behavior_tool import AnalyzeBehaviorTool
from app.schemas.multimodal_evidence import (
    AnalyzeFaceInput,
    AnalyzeFaceOutput,
    AnalyzeBehaviorInput,
    AnalyzeBehaviorOutput,
)


# ─── 1. Final Evaluation Contract (Future) ────────────────────────────────────

class CalculateFinalEvaluationInput(BaseModel):
    session_id: str = Field(..., description="Interview session ID to evaluate")
    model_config = ConfigDict(from_attributes=True)


class CalculateFinalEvaluationOutput(BaseModel):
    overall_score: float = Field(default=0.0)
    performance_category: str = Field(default="Evaluated")
    category_scores: Dict[str, float] = Field(default_factory=dict)
    summary: str = Field(default="")
    model_config = ConfigDict(from_attributes=True)


class CalculateFinalEvaluationTool(BaseTool):
    """
    Future-ready contract for calculating comprehensive final session scores.
    """
    name: str = "calculate_final_evaluation"
    description: str = "Future evaluation tool contract for aggregating question scores into final session evaluation."
    input_schema = CalculateFinalEvaluationInput
    output_schema = CalculateFinalEvaluationOutput
    category: str = "final_evaluation"
    is_future_contract: bool = True

    def execute(self, context: ToolExecutionContext, params: CalculateFinalEvaluationInput) -> ToolResult:
        return ToolResult(
            tool_name=self.name,
            success=False,
            error=f"Tool '{self.name}' is a future-ready contract and is not yet implemented in Phase 11."
        )


# ─── 2. Report Generation Contract (Future) ───────────────────────────────────

class GenerateInterviewReportInput(BaseModel):
    session_id: str = Field(..., description="Interview session ID")
    include_pdf: bool = Field(default=False, description="Whether to compile PDF report binary")
    model_config = ConfigDict(from_attributes=True)


class GenerateInterviewReportOutput(BaseModel):
    report_id: str = Field(default="")
    report_url: Optional[str] = Field(default=None)
    summary: str = Field(default="")
    model_config = ConfigDict(from_attributes=True)


class GenerateInterviewReportTool(BaseTool):
    """
    Future-ready contract for interview report generation and PDF compilation.
    """
    name: str = "generate_interview_report"
    description: str = "Future reporting tool contract for compiling comprehensive candidate performance reports."
    input_schema = GenerateInterviewReportInput
    output_schema = GenerateInterviewReportOutput
    category: str = "reporting"
    is_future_contract: bool = True

    def execute(self, context: ToolExecutionContext, params: GenerateInterviewReportInput) -> ToolResult:
        return ToolResult(
            tool_name=self.name,
            success=False,
            error=f"Tool '{self.name}' is a future-ready contract and is not yet implemented in Phase 11."
        )


__all__ = [
    "AnalyzeFaceInput",
    "AnalyzeFaceOutput",
    "AnalyzeFaceTool",
    "AnalyzeBehaviorInput",
    "AnalyzeBehaviorOutput",
    "AnalyzeBehaviorTool",
    "CalculateFinalEvaluationInput",
    "CalculateFinalEvaluationOutput",
    "CalculateFinalEvaluationTool",
    "GenerateInterviewReportInput",
    "GenerateInterviewReportOutput",
    "GenerateInterviewReportTool",
]
