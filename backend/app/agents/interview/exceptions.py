"""
Domain exceptions for the InterviewIQ Groq Interview Agent.
"""

class AgentException(Exception):
    """Base exception for all Interview Agent errors."""
    pass


class AgentExecutionError(AgentException):
    """Raised when an error occurs during agent execution or tool invocation."""
    pass


class AgentMaxIterationsError(AgentException):
    """Raised when the agent tool call loop reaches the hard safety iteration limit."""
    pass


class AgentContextError(AgentException):
    """Raised when agent context cannot be assembled or is invalid."""
    pass


class AgentSecurityError(AgentException):
    """Raised when session authorization or access control fails."""
    pass


class AgentProviderError(AgentException):
    """Raised when external AI provider fails or encounters network/rate limits."""
    pass


class AgentMalformedDecisionError(AgentException):
    """Raised when model response cannot be parsed into an AgentDecision."""
    pass
