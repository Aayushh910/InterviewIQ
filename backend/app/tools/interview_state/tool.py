import logging
from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.tools.interview_state.schemas import GetInterviewStateInput, UpdateInterviewStateInput
from app.schemas.session_state import InterviewSessionState, SessionStateUpdateRequest
from app.services.session_state.manager import session_state_manager
from app.services.session_state.exceptions import (
    SessionNotFoundError,
    InvalidStatusTransitionError,
    InvalidSessionStateError,
    MissingSessionIdError,
)

logger = logging.getLogger(__name__)


class GetInterviewStateTool(BaseTool):
    """
    Tool wrapping Phase 8 InterviewStateManager to retrieve the current authoritative
    interview state for a given session.
    """
    name: str = "get_interview_state"
    description: str = (
        "Retrieve the complete, single-source-of-truth interview session state including "
        "active question, question/answer history, follow-up chains, and progress."
    )
    input_schema = GetInterviewStateInput
    output_schema = InterviewSessionState
    category: str = "interview_state"

    def execute(self, context: ToolExecutionContext, params: GetInterviewStateInput) -> ToolResult:
        if not context.db or not context.user_id:
            return ToolResult(
                tool_name=self.name,
                success=False,
                error="Database session and authenticated user_id are required context for state operations."
            )

        try:
            state = session_state_manager.get_session_state(
                db=context.db,
                session_id=params.session_id,
                user_id=context.user_id
            )
            return ToolResult(
                tool_name=self.name,
                success=True,
                data=state.model_dump()
            )
        except SessionNotFoundError as e:
            return ToolResult(tool_name=self.name, success=False, error=str(e))
        except MissingSessionIdError as e:
            return ToolResult(tool_name=self.name, success=False, error=str(e))
        except Exception as e:
            logger.error(f"Error in {self.name}: {e}", exc_info=True)
            return ToolResult(
                tool_name=self.name,
                success=False,
                error=f"Failed to retrieve interview state: {str(e)}"
            )


class UpdateInterviewStateTool(BaseTool):
    """
    Tool wrapping Phase 8 InterviewStateManager to update mutable session state attributes
    (such as status transitions, active topic, or metadata).
    """
    name: str = "update_interview_state"
    description: str = (
        "Update mutable interview session state attributes such as status transitions "
        "(e.g. paused, completed), active discussion topic, or runtime metadata."
    )
    input_schema = UpdateInterviewStateInput
    output_schema = InterviewSessionState
    category: str = "interview_state"

    def execute(self, context: ToolExecutionContext, params: UpdateInterviewStateInput) -> ToolResult:
        if not context.db or not context.user_id:
            return ToolResult(
                tool_name=self.name,
                success=False,
                error="Database session and authenticated user_id are required context for state operations."
            )

        try:
            update_req = SessionStateUpdateRequest(
                status=params.status,
                current_topic=params.current_topic,
                metadata=params.metadata
            )
            state = session_state_manager.update_session_state(
                db=context.db,
                session_id=params.session_id,
                user_id=context.user_id,
                update_data=update_req
            )
            return ToolResult(
                tool_name=self.name,
                success=True,
                data=state.model_dump()
            )
        except (SessionNotFoundError, InvalidStatusTransitionError, InvalidSessionStateError, MissingSessionIdError) as e:
            return ToolResult(tool_name=self.name, success=False, error=str(e))
        except Exception as e:
            logger.error(f"Error in {self.name}: {e}", exc_info=True)
            return ToolResult(
                tool_name=self.name,
                success=False,
                error=f"Failed to update interview state: {str(e)}"
            )
