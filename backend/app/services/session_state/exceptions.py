"""
Domain-specific exceptions for Interview Session State management.
"""

class SessionStateError(Exception):
    """Base exception for all session state management errors."""
    pass


class SessionNotFoundError(SessionStateError):
    """Raised when an interview session cannot be found or the user is unauthorized."""
    pass


class MissingSessionIdError(SessionStateError):
    """Raised when a session ID parameter is missing or empty."""
    pass


class InvalidSessionStateError(SessionStateError):
    """Raised when an operation is invalid for the session's current lifecycle state."""
    pass


class InvalidStatusTransitionError(SessionStateError):
    """Raised when attempting an illegal transition between session lifecycle states."""
    pass


class DuplicateQuestionError(SessionStateError):
    """Raised when attempting to add a duplicate question to an interview or session."""
    pass


class InvalidAnswerError(SessionStateError):
    """Raised when an answer payload is invalid or refers to a non-existent question."""
    pass


class MalformedConfigurationError(SessionStateError):
    """Raised when an interview configuration is malformed or contains invalid parameter values."""
    pass


class SessionExpiredError(SessionStateError):
    """Raised when an action is attempted on an expired interview session."""
    pass
