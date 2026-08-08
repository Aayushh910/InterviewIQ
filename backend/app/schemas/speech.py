from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class TranscriptionSegment(BaseModel):
    start: float
    end: float
    text: str

    model_config = ConfigDict(from_attributes=True)


class SpeechTranscriptionResponse(BaseModel):
    text: str
    language: str
    duration_seconds: float
    segments: Optional[List[TranscriptionSegment]] = None

    model_config = ConfigDict(from_attributes=True)
