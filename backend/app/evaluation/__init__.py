"""
InterviewIQ Final Evaluation & Deterministic Scoring Package (Phase 12).
Provides evidence aggregation, deterministic scoring, and evaluation orchestration.
"""

from app.evaluation.config import SCORING_VERSION, CATEGORY_WEIGHTS, get_performance_category
from app.evaluation.exceptions import (
    EvaluationError,
    SessionNotFoundError,
    UnauthorizedEvaluationError,
    SessionNotCompleteError,
    InsufficientEvidenceError,
    ScoringError,
)
from app.evaluation.schemas import (
    NormalizedAnswerEvidence,
    NormalizedVisualEvidence,
    NormalizedBehaviorEvidence,
    QuestionEvidenceBundle,
    AggregatedSessionEvidence,
    PerQuestionScore,
    FinalEvaluationResult,
    CalculateFinalEvaluationRequest,
    FinalEvaluationSummaryResponse,
)
from app.evaluation.evidence_aggregator import EvidenceAggregator
from app.evaluation.scoring_engine import DeterministicScoringEngine
from app.evaluation.evaluator import FinalEvaluator, final_evaluator

__all__ = [
    "SCORING_VERSION",
    "CATEGORY_WEIGHTS",
    "get_performance_category",
    "EvaluationError",
    "SessionNotFoundError",
    "UnauthorizedEvaluationError",
    "SessionNotCompleteError",
    "InsufficientEvidenceError",
    "ScoringError",
    "NormalizedAnswerEvidence",
    "NormalizedVisualEvidence",
    "NormalizedBehaviorEvidence",
    "QuestionEvidenceBundle",
    "AggregatedSessionEvidence",
    "PerQuestionScore",
    "FinalEvaluationResult",
    "CalculateFinalEvaluationRequest",
    "FinalEvaluationSummaryResponse",
    "EvidenceAggregator",
    "DeterministicScoringEngine",
    "FinalEvaluator",
    "final_evaluator",
]
