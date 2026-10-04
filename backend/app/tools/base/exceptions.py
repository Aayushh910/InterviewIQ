"""
Domain-specific exceptions for InterviewIQ Tool Architecture.
"""

class ToolError(Exception):
    """Base exception for all tool execution and registry errors."""
    pass


class ToolNotFoundError(ToolError):
    """Raised when a requested tool name is not registered in the registry."""
    pass


class ToolDuplicateRegistrationError(ToolError):
    """Raised when attempting to register a tool with a name that is already registered."""
    pass


class ToolValidationError(ToolError):
    """Raised when input parameters fail validation against the tool's input schema."""
    pass


class ToolExecutionError(ToolError):
    """Raised when an unexpected error occurs during tool execution."""
    pass


class ToolUnauthorizedError(ToolError):
    """Raised when a tool action is unauthorized for the context user."""
    pass
