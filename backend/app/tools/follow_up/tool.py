import logging
from typing import Dict, Any
from app.core.config import settings
from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.tools.follow_up.schemas import FollowUpToolInput, FollowUpToolOutput
from app.ai.providers.factory import get_ai_provider

logger = logging.getLogger(__name__)


class GenerateFollowUpQuestionTool(BaseTool):
    """
    Tool responsible for evaluating whether a candidate answer warrants a follow-up,
    and generating the adaptive counter-question using existing AI provider logic.
    """
    name: str = "generate_follow_up_question"
    description: str = (
        "Analyze a candidate's answer against the parent question to decide if an adaptive "
        "counter-question is needed, and generate the tailored follow-up question."
    )
    input_schema = FollowUpToolInput
    output_schema = FollowUpToolOutput
    category: str = "counter_questions"

    def execute(self, context: ToolExecutionContext, params: FollowUpToolInput) -> ToolResult:
        provider_name = context.provider_override or context.metadata.get("provider") or "groq"
        mock_mode = context.mock_mode or context.metadata.get("mock_mode")

        # 1. Guardrail: Max depth limit
        max_limit = getattr(settings, "MAX_FOLLOW_UPS_PER_QUESTION", 2)
        if params.follow_up_depth >= max_limit:
            output = FollowUpToolOutput(
                should_follow_up=False,
                reason=f"Maximum follow-up depth limit ({max_limit}) reached.",
                follow_up_question=None,
                follow_up_depth=params.follow_up_depth,
                provider=provider_name
            )
            return ToolResult(tool_name=self.name, success=True, data=output.model_dump())

        # 2. Guardrail: Answer length check
        ans_clean = (params.candidate_answer_text or "").strip()
        if len(ans_clean) < 5:
            output = FollowUpToolOutput(
                should_follow_up=False,
                reason="Candidate answer is empty or too short for follow-up probing.",
                follow_up_question=None,
                follow_up_depth=params.follow_up_depth,
                provider=provider_name
            )
            return ToolResult(tool_name=self.name, success=True, data=output.model_dump())

        interview_meta: Dict[str, Any] = {
            "job_role": params.role,
            "interview_type": params.interview_type,
            "domain": params.domain,
            "difficulty": params.difficulty,
            "experience_level": params.experience_level or "2+",
        }

        try:
            ai_provider = get_ai_provider(provider_name=provider_name, mock_mode=mock_mode)
            should_follow_up, reason, follow_up_text, follow_up_type = ai_provider.generate_follow_up(
                interview_meta=interview_meta,
                question_text=params.parent_question_text,
                answer_text=ans_clean,
                previous_context=params.previous_context,
                follow_up_depth=params.follow_up_depth
            )

            new_depth = params.follow_up_depth + 1 if should_follow_up and follow_up_text else params.follow_up_depth
            output = FollowUpToolOutput(
                should_follow_up=should_follow_up and bool(follow_up_text),
                reason=reason,
                follow_up_question=follow_up_text if should_follow_up else None,
                follow_up_type=follow_up_type,
                follow_up_depth=new_depth,
                provider=provider_name
            )

            return ToolResult(
                tool_name=self.name,
                success=True,
                data=output.model_dump()
            )
        except Exception as e:
            logger.error(f"Error in {self.name}: {e}", exc_info=True)
            return ToolResult(
                tool_name=self.name,
                success=False,
                error=f"Failed to generate follow-up question: {str(e)}"
            )
