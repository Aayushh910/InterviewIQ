class AIProviderError(Exception):
    """Raised when an AI provider fails during operation (e.g. HTTP error, API failure, bad configuration)."""
    pass


class AIProviderTimeoutError(AIProviderError):
    """Raised when an AI provider call times out."""
    pass


class AIValidationError(Exception):
    """Raised when AI provider response fails validation or is malformed."""
    pass
