"""
InterviewIQ Tool Architecture & Tool Registry Package (Phase 9).
Provides tool abstraction, registration, discovery, and isolated execution
for existing and future AI capabilities.
"""

from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.tools.base.exceptions import (
    ToolError,
    ToolNotFoundError,
    ToolDuplicateRegistrationError,
    ToolValidationError,
    ToolExecutionError,
    ToolUnauthorizedError,
)
from app.tools.registry.registry import (
    ToolRegistry,
    default_registry,
    get_tool_registry,
)

# Core Tools
from app.tools.question_generation.tool import GenerateInterviewQuestionTool
from app.tools.follow_up.tool import GenerateFollowUpQuestionTool
from app.tools.answer_evaluation.tool import EvaluateAnswerTool
from app.tools.interview_state.tool import (
    GetInterviewStateTool,
    UpdateInterviewStateTool,
)

# Multimodal Analysis Tools (Phase 11)
from app.tools.multimodal.face_tool import AnalyzeFaceTool
from app.tools.multimodal.behavior_tool import AnalyzeBehaviorTool

# Final Evaluation Tool (Phase 12)
from app.tools.final_evaluation.tool import CalculateFinalEvaluationTool

# Operational Reporting Tool (Phase 13)
from app.tools.report.tool import (
    GenerateInterviewReportTool,
)


def register_standard_tools(registry: ToolRegistry = default_registry) -> ToolRegistry:
    """
    Register all core tools and future contracts into the provided registry.
    Safe against duplicate registration.
    """
    tools = [
        # Core Active Tools
        GenerateInterviewQuestionTool(),
        GenerateFollowUpQuestionTool(),
        EvaluateAnswerTool(),
        GetInterviewStateTool(),
        UpdateInterviewStateTool(),
        # Multimodal Active Tools (Phase 11)
        AnalyzeFaceTool(),
        AnalyzeBehaviorTool(),
        # Final Evaluation Active Tool (Phase 12)
        CalculateFinalEvaluationTool(),
        # Future-Ready Tool Contracts
        GenerateInterviewReportTool(),
    ]

    for tool in tools:
        if not registry.has_tool(tool.name):
            registry.register(tool)

    return registry


# Auto-populate the default registry on module import
register_standard_tools(default_registry)

__all__ = [
    "BaseTool",
    "ToolExecutionContext",
    "ToolResult",
    "ToolError",
    "ToolNotFoundError",
    "ToolDuplicateRegistrationError",
    "ToolValidationError",
    "ToolExecutionError",
    "ToolUnauthorizedError",
    "ToolRegistry",
    "default_registry",
    "get_tool_registry",
    "register_standard_tools",
    "GenerateInterviewQuestionTool",
    "GenerateFollowUpQuestionTool",
    "EvaluateAnswerTool",
    "GetInterviewStateTool",
    "UpdateInterviewStateTool",
    "AnalyzeFaceTool",
    "AnalyzeBehaviorTool",
    "CalculateFinalEvaluationTool",
    "GenerateInterviewReportTool",
]
