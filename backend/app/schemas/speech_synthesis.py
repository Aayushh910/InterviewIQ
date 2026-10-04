from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SpeechSynthesisRequest(BaseModel):
    """
    Request schema for text-to-speech audio synthesis.
    """
    text: str = Field(..., min_length=1, max_length=1000, description="Interview question text to synthesize into speech.")
    voice: Optional[str] = "default"
    language: Optional[str] = "en"
    provider: Optional[str] = None
    mock_mode: Optional[str] = None


class SpeechSynthesisResponse(BaseModel):
    """
    Metadata response schema for text-to-speech synthesis.
    """
    duration_seconds: float
    language: str
    provider: str
    content_type: str = "audio/wav"

    model_config = ConfigDict(from_attributes=True)
