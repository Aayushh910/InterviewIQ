import contextvars
from typing import Optional

groq_api_key_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("groq_api_key_ctx", default=None)
