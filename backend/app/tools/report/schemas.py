from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class GenerateInterviewReportInput(BaseModel):
    session_id: str = Field(..., description="Interview session ID")
    include_pdf: bool = Field(default=False, description="Whether to compile PDF report binary")
    model_config = ConfigDict(from_attributes=True)


class GenerateInterviewReportOutput(BaseModel):
    report_id: str = Field(default="")
    report_url: Optional[str] = Field(default=None)
    summary: str = Field(default="")
    model_config = ConfigDict(from_attributes=True)
