from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class SessionBase(BaseModel):
    status: str = "not_started"


class SessionCreate(BaseModel):
    status: Optional[str] = "not_started"


class SessionResponse(SessionBase):
    id: str
    interview_id: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
