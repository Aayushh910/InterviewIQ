from typing import List, Optional, Set
from app.schemas.session_state import SessionStatus, InterviewConfiguration
from app.services.session_state.exceptions import (
    MissingSessionIdError,
    InvalidStatusTransitionError,
    InvalidSessionStateError,
    DuplicateQuestionError,
    InvalidAnswerError,
    MalformedConfigurationError,
)

# Standard lifecycle state transitions
VALID_TRANSITIONS: dict[str, Set[str]] = {
    SessionStatus.NOT_STARTED.value: {
        SessionStatus.IN_PROGRESS.value,
        SessionStatus.ABANDONED.value,
    },
    SessionStatus.IN_PROGRESS.value: {
        SessionStatus.PAUSED.value,
        SessionStatus.COMPLETED.value,
        SessionStatus.ABANDONED.value,
        SessionStatus.EXPIRED.value,
    },
    SessionStatus.PAUSED.value: {
        SessionStatus.IN_PROGRESS.value,
        SessionStatus.COMPLETED.value,
        SessionStatus.ABANDONED.value,
    },
    SessionStatus.COMPLETED.value: set(),  # Terminal state
    SessionStatus.ABANDONED.value: set(),  # Terminal state
    SessionStatus.EXPIRED.value: set(),    # Terminal state
}


def validate_session_id(session_id: Optional[str]) -> str:
    """
    Validate that session ID is present and non-empty.
    """
    if not session_id or not str(session_id).strip():
        raise MissingSessionIdError("Session ID cannot be empty.")
    return str(session_id).strip()


def validate_status_transition(current_status: str, new_status: str) -> None:
    """
    Enforce legal lifecycle state transitions for an interview session.
    Allows idempotent transitions (same state).
    """
    current = current_status.lower().strip()
    target = new_status.lower().strip()

    valid_statuses = {s.value for s in SessionStatus}
    if target not in valid_statuses:
        raise InvalidStatusTransitionError(f"'{target}' is not a recognized session status.")

    if current == target:
        return

    allowed = VALID_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise InvalidStatusTransitionError(
            f"Cannot transition interview session from '{current}' to '{target}'."
        )


def validate_new_question(existing_question_texts: List[str], question_text: str) -> None:
    """
    Validate question content and prevent duplicates.
    """
    text = (question_text or "").strip()
    if len(text) < 3:
        raise MalformedConfigurationError("Question text must be at least 3 characters long.")

    text_lower = text.lower()
    for existing in existing_question_texts:
        if (existing or "").strip().lower() == text_lower:
            raise DuplicateQuestionError(f"Question already exists in this interview: '{text[:60]}...'")


def validate_new_answer(valid_question_ids: List[str], question_id: str, session_status: str) -> None:
    """
    Validate candidate answer target question and session availability.
    """
    if not question_id or not str(question_id).strip():
        raise InvalidAnswerError("Answer submission must specify a valid question_id.")

    if session_status in [SessionStatus.COMPLETED.value, SessionStatus.ABANDONED.value, SessionStatus.EXPIRED.value]:
        raise InvalidSessionStateError(
            f"Cannot submit answers to a session with status '{session_status}'."
        )

    if question_id not in valid_question_ids:
        raise InvalidAnswerError(
            f"Question ID '{question_id}' does not belong to this interview session."
        )


def validate_configuration(config: InterviewConfiguration) -> None:
    """
    Validate interview configuration parameters.
    """
    if config.question_count < 1 or config.question_count > 50:
        raise MalformedConfigurationError("question_count must be between 1 and 50.")
    if config.duration_minutes < 1 or config.duration_minutes > 180:
        raise MalformedConfigurationError("duration_minutes must be between 1 and 180.")
    if not (config.role or "").strip():
        raise MalformedConfigurationError("Job role cannot be empty.")
    if not (config.interview_type or "").strip():
        raise MalformedConfigurationError("Interview type cannot be empty.")
