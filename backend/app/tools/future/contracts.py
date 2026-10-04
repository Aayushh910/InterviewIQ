"""
Future-ready tool contracts for InterviewIQ.
In Phase 12, CalculateFinalEvaluationTool has graduated into a real operational tool
in `app.tools.final_evaluation`.

Only report generation remains as a future contract.
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult

# Re-export real operational tools for backward compatibility
from app.tools.multimodal.face_tool import AnalyzeFaceTool
from app.tools.multimodal.behavior_tool import AnalyzeBehaviorTool
from app.tools.final_evaluation.tool import CalculateFinalEvaluationTool
from app.schemas.multimodal_evidence import (
    AnalyzeFaceInput,
    AnalyzeFaceOutput,
    AnalyzeBehaviorInput,
    AnalyzeBehaviorOutput,
)
from app.tools.final_evaluation.schemas import (
    CalculateFinalEvaluationInput,
    CalculateFinalEvaluationOutput,
)


# ─── 1. Report Generation Contract (Future) ───────────────────────────────────

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
    Operational tool for interview report generation and PDF compilation (Phase 13).
    """
    name: str = "generate_interview_report"
    description: str = "Compile comprehensive candidate performance report and generate downloadable PDF."
    input_schema = GenerateInterviewReportInput
    output_schema = GenerateInterviewReportOutput
    category: str = "reporting"
    is_future_contract: bool = False

    def execute(self, context: ToolExecutionContext, params: GenerateInterviewReportInput) -> ToolResult:
        if not context.db:
            return ToolResult(
                tool_name=self.name,
                success=False,
                error="Database session required in ToolExecutionContext to generate report."
            )

        try:
            from app.services.report_service import report_service
            # Validate and generate report
            pdf_bytes = report_service.generate_pdf_report(
                db=context.db,
                session_id=params.session_id,
                user_id=context.user_id,
            )
            report_id = f"rep_{params.session_id[:8]}"
            report_url = f"/api/v1/reports/sessions/{params.session_id}/pdf"
            summary = f"Official performance report compiled successfully ({len(pdf_bytes)} bytes)."

            return ToolResult(
                tool_name=self.name,
                success=True,
                data={
                    "report_id": report_id,
                    "report_url": report_url,
                    "summary": summary,
                }
            )
        except Exception as e:
            return ToolResult(
                tool_name=self.name,
                success=False,
                error=f"Failed to generate report for session '{params.session_id}': {str(e)}"
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
