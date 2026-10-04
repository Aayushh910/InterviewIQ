"""
Evaluation domain exceptions for InterviewIQ (Phase 12).
"""


class EvaluationError(Exception):
    """Base exception for all evaluation domain errors."""
    pass


class SessionNotFoundError(EvaluationError):
    """Raised when the specified interview session does not exist."""
    pass


class UnauthorizedEvaluationError(EvaluationError):
    """Raised when a user attempts to evaluate a session they do not own."""
    pass


class SessionNotCompleteError(EvaluationError):
    """Raised when attempting final evaluation on an unstarted or invalid session."""
    pass


class InsufficientEvidenceError(EvaluationError):
    """Raised when an interview session lacks minimal evidence (e.g. no answered questions)."""
    pass


class ScoringError(EvaluationError):
    """Raised when an error occurs during deterministic scoring calculations."""
    pass


class EvaluationNotFoundError(EvaluationError):
    """Raised when final evaluation has not yet been generated for an interview session."""
    pass
