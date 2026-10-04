from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, model_validator


class AnswerEvaluationRequest(BaseModel):
    """
    Validated request schema supporting either:
    1. Direct question & answer evaluation with optional context metadata.
    2. Database-backed evaluation via answer_id.
    """
    answer_id: Optional[str] = None
    question: Optional[str] = None
    answer: Optional[str] = None
    interview_type: Optional[str] = "Technical"
    difficulty: Optional[str] = "Medium"
    domain: Optional[str] = "Software Engineering"
    job_role: Optional[str] = None
    expected_topics: Optional[List[str]] = None
    provider: Optional[str] = None
    mock_mode: Optional[str] = None

    @model_validator(mode="after")
    def validate_request_payload(self) -> "AnswerEvaluationRequest":
        if not self.answer_id and (not self.question or not self.answer):
            raise ValueError("Evaluation request must provide either 'answer_id' or both 'question' and 'answer'.")
        return self


class AnswerEvaluationResponse(BaseModel):
    """
    Structured AI Answer Evaluation Response containing 7-dimension scores,
    communication/confidence metrics, weighted overall score, strengths, improvements,
    summary, and evaluator provider information.
    """
    id: Optional[str] = None
    answer_id: Optional[str] = None
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
    technical_accuracy_score: float = 0.0
    communication_score: float = 0.0
    grammar_score: float = 0.0
    timing_score: float = 0.0
    confidence_score: float = 0.85
    overall_score: float = 0.0
    strengths: List[str] = []
    improvements: List[str] = []
    summary: str = ""
    recommended_response: Optional[str] = None
    evaluator_provider: str = "heuristic"
    created_at: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def populate_dimension_aliases(cls, data: any) -> any:
        if isinstance(data, dict):
            rel = data.get("relevance", data.get("relevance_score", 0.0))
            corr = data.get("correctness", data.get("correctness_score", 0.0))
            comp = data.get("completeness", data.get("completeness_score", 0.0))
            cla = data.get("clarity", data.get("clarity_score", 0.0))
            tech = data.get("technical_accuracy_score", data.get("technical_depth", data.get("technical_depth_score", 0.0)))
            gram = data.get("grammar_score", cla)
            tim = data.get("timing_score", 90.0)
            comm = data.get("communication_score", (cla + comp) / 2.0)
            conf = data.get("confidence_score", 0.85)

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
            data["technical_accuracy_score"] = tech
            data["communication_score"] = comm
            data["grammar_score"] = gram
            data["timing_score"] = tim
            data["confidence_score"] = conf
        elif hasattr(data, "relevance_score"):
            rel = getattr(data, "relevance_score", 0.0)
            corr = getattr(data, "correctness_score", 0.0)
            comp = getattr(data, "completeness_score", 0.0)
            cla = getattr(data, "clarity_score", 0.0)
            tech = getattr(data, "technical_depth_score", 0.0)
            gram = getattr(data, "grammar_score", cla)
            tim = getattr(data, "timing_score", 90.0)
            comm = getattr(data, "communication_score", (cla + comp) / 2.0)
            conf = getattr(data, "confidence_score", 0.85)

            setattr(data, "relevance", rel)
            setattr(data, "correctness", corr)
            setattr(data, "completeness", comp)
            setattr(data, "clarity", cla)
            setattr(data, "technical_depth", tech)
            setattr(data, "technical_accuracy_score", tech)
            setattr(data, "communication_score", comm)
            setattr(data, "grammar_score", gram)
            setattr(data, "timing_score", tim)
            setattr(data, "confidence_score", conf)
        return data

    model_config = ConfigDict(from_attributes=True)
