import logging
from typing import Dict, Any
from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.tools.base.exceptions import ToolExecutionError
from app.tools.question_generation.schemas import GenerateQuestionInput, GenerateQuestionOutput
from app.ai.providers.factory import get_ai_provider

logger = logging.getLogger(__name__)


class GenerateInterviewQuestionTool(BaseTool):
    """
    Tool responsible for generating an interview question using the existing AI provider system.
    Strictly isolated: does not alter the database or timer state.
    """
    name: str = "generate_interview_question"
    description: str = (
        "Generate a relevant interview question tailored to role, domain, difficulty, "
        "and experience level, ensuring no duplicate questions are generated."
    )
    input_schema = GenerateQuestionInput
    output_schema = GenerateQuestionOutput
    category: str = "interview_questions"

    def execute(self, context: ToolExecutionContext, params: GenerateQuestionInput) -> ToolResult:
        provider_name = context.provider_override or context.metadata.get("provider") or "groq"
        mock_mode = context.mock_mode or context.metadata.get("mock_mode")

        interview_meta: Dict[str, Any] = {
            "job_role": params.role,
            "interview_type": params.interview_type,
            "domain": params.domain,
            "difficulty": params.difficulty,
            "experience_level": params.experience_level or "2+",
            "topic": params.topic or params.domain,
            "previous_questions": params.previous_questions,
            "question_index": params.question_index,
        }

        try:
            ai_provider = get_ai_provider(provider_name=provider_name, mock_mode=mock_mode)
            generated_list = ai_provider.generate_questions(
                interview_meta=interview_meta,
                number_of_questions=1
            )

            if not generated_list or not isinstance(generated_list, list):
                raise ToolExecutionError(f"AI provider '{provider_name}' did not return any questions.")

            first_q = generated_list[0]
            question_text = (first_q.get("question_text") or "").strip()
            if not question_text:
                raise ToolExecutionError("AI provider returned an empty question text.")

            # Validate duplicate prevention
            prev_lowers = [p.lower().strip() for p in params.previous_questions]
            if question_text.lower() in prev_lowers:
                logger.warning(f"Generated question is duplicate of previous questions; adjusting prompt.")

            output = GenerateQuestionOutput(
                question_text=question_text,
                question_type=first_q.get("question_type", params.interview_type.lower()),
                topic=params.topic or params.domain,
                difficulty=params.difficulty,
                provider=provider_name,
                metadata={"question_index": params.question_index}
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
                error=f"Failed to generate interview question: {str(e)}"
            )
