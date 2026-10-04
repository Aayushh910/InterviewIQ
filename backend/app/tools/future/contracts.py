"""
Future-ready tool contracts compatibility layer for InterviewIQ.
All 9 core operational tools have now graduated into dedicated packages:
- question_generation (Phase 9)
- follow_up (Phase 9)
- answer_evaluation (Phase 9)
- interview_state (Phase 8/9)
- multimodal (Phase 11)
- final_evaluation (Phase 12)
- report (Phase 13)

This module maintains backward-compatibility re-exports for existing test suites.
"""

# Re-export real operational tools for backward compatibility
from app.tools.multimodal.face_tool import AnalyzeFaceTool
from app.tools.multimodal.behavior_tool import AnalyzeBehaviorTool
from app.tools.final_evaluation.tool import CalculateFinalEvaluationTool
from app.tools.report.tool import GenerateInterviewReportTool
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
from app.tools.report.schemas import (
    GenerateInterviewReportInput,
    GenerateInterviewReportOutput,
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
