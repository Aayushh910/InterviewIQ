"""
Operational Report Generation Tool (Phase 13).
Compiles comprehensive candidate performance reports and generates downloadable PDF artifacts.
"""

from typing import Optional
from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.tools.report.schemas import (
    GenerateInterviewReportInput,
    GenerateInterviewReportOutput,
)


class GenerateInterviewReportTool(BaseTool):
    """
    Authoritative operational tool for interview report generation and PDF compilation.
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

            # Validate and generate report PDF
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
