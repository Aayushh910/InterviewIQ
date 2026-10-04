"""
InterviewIQ Session State Management Package (Phase 8).
Provides clean separation of concerns for Interview Session State,
validation, builder, lifecycle management, and domain exceptions.
"""

from app.services.session_state.exceptions import (
    SessionStateError,
    SessionNotFoundError,
    MissingSessionIdError,
    InvalidSessionStateError,
    InvalidStatusTransitionError,
    DuplicateQuestionError,
    InvalidAnswerError,
    MalformedConfigurationError,
    SessionExpiredError,
)
from app.services.session_state.validator import (
    validate_session_id,
    validate_status_transition,
    validate_new_question,
    validate_new_answer,
    validate_configuration,
)
from app.services.session_state.builder import build_session_state
from app.services.session_state.manager import InterviewStateManager, session_state_manager

__all__ = [
    "SessionStateError",
    "SessionNotFoundError",
    "MissingSessionIdError",
    "InvalidSessionStateError",
    "InvalidStatusTransitionError",
    "DuplicateQuestionError",
    "InvalidAnswerError",
    "MalformedConfigurationError",
    "SessionExpiredError",
    "validate_session_id",
    "validate_status_transition",
    "validate_new_question",
    "validate_new_answer",
    "validate_configuration",
    "build_session_state",
    "InterviewStateManager",
    "session_state_manager",
]
