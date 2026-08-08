from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, model_validator


class AnswerEvaluationRequest(BaseModel):
    answer_id: str


class AnswerEvaluationResponse(BaseModel):
    id: str
    answer_id: str
    relevance: float = 0.0
    correctness: float = 0.0
    completeness: float = 0.0
    clarity: float = 0.0
    technical_depth: float = 0.0
    relevance_score: float = 0.0
    correctness_score: float = 0.0
    completeness_score: float = 0.0
    clarity_score: float = 0.0
    technical_depth_score: float = 0.0
    overall_score: float = 0.0
    strengths: List[str] = []
    improvements: List[str] = []
    summary: str = ""
    evaluator_provider: str = "heuristic"
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def populate_dimension_aliases(cls, data: any) -> any:
        if isinstance(data, dict):
            rel = data.get("relevance", data.get("relevance_score", 0.0))
            corr = data.get("correctness", data.get("correctness_score", 0.0))
            comp = data.get("completeness", data.get("completeness_score", 0.0))
            cla = data.get("clarity", data.get("clarity_score", 0.0))
            tech = data.get("technical_depth", data.get("technical_depth_score", 0.0))

            data["relevance"] = rel
            data["relevance_score"] = rel
            data["correctness"] = corr
            data["correctness_score"] = corr
            data["completeness"] = comp
            data["completeness_score"] = comp
            data["clarity"] = cla
            data["clarity_score"] = cla
            data["technical_depth"] = tech
            data["technical_depth_score"] = tech
        elif hasattr(data, "relevance_score"):
            rel = getattr(data, "relevance_score", 0.0)
            corr = getattr(data, "correctness_score", 0.0)
            comp = getattr(data, "completeness_score", 0.0)
            cla = getattr(data, "clarity_score", 0.0)
            tech = getattr(data, "technical_depth_score", 0.0)

            setattr(data, "relevance", rel)
            setattr(data, "correctness", corr)
            setattr(data, "completeness", comp)
            setattr(data, "clarity", cla)
            setattr(data, "technical_depth", tech)
        return data

    model_config = ConfigDict(from_attributes=True)
