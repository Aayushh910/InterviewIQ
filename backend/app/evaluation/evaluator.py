"""
Final Interview Evaluator Service for InterviewIQ (Phase 12).
Orchestrates evidence aggregation, deterministic scoring, idempotency management,
and PostgreSQL persistence.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.final_evaluation import FinalEvaluation
from app.models.interview_session import InterviewSession
from app.models.interview import Interview
from app.evaluation.schemas import (
    FinalEvaluationResult,
    PerQuestionScore,
)
from app.evaluation.evidence_aggregator import EvidenceAggregator
from app.evaluation.scoring_engine import DeterministicScoringEngine
from app.evaluation.exceptions import (
    SessionNotFoundError,
    UnauthorizedEvaluationError,
    SessionNotCompleteError,
)

logger = logging.getLogger(__name__)


class FinalEvaluator:
    """
    Authoritative evaluation coordinator executing deterministic interview assessment.
    """

    @classmethod
    def evaluate_interview_session(
        cls,
        db: Session,
        session_id: str,
        user_id: str,
        force_recalculate: bool = False,
    ) -> FinalEvaluationResult:
        """
        Evaluate a completed interview session, enforcing authorization, idempotency,
        deterministic scoring, and persistence.
        """
        # 1. Authorization & Session Verification
        session = db.query(InterviewSession).join(Interview).filter(
            InterviewSession.id == session_id
        ).first()

        if not session:
            raise SessionNotFoundError(f"Interview session '{session_id}' not found.")

        if str(session.interview.user_id) != str(user_id):
            raise UnauthorizedEvaluationError(f"User '{user_id}' is not authorized to evaluate session '{session_id}'.")

        # 2. Idempotency Check: Return existing evaluation if already evaluated and not forced
        existing_eval = db.query(FinalEvaluation).filter(
            FinalEvaluation.session_id == session_id
        ).first()

        if existing_eval and not force_recalculate:
            logger.info(f"Returning cached idempotent FinalEvaluation '{existing_eval.id}' for session '{session_id}'")
            return cls._model_to_result(existing_eval)

        # 3. Aggregate all session evidence
        evidence = EvidenceAggregator.aggregate_session_evidence(
            db=db,
            session_id=session_id,
            user_id=user_id,
            require_completed=True,
        )

        # 4. Execute Pure Deterministic Scoring Engine
        eval_id = existing_eval.id if existing_eval else str(uuid.uuid4())
        result = DeterministicScoringEngine.evaluate_session(
            evidence=evidence,
            evaluation_id=eval_id,
        )

        # 5. Persist to PostgreSQL
        if existing_eval:
            # Update existing record
            existing_eval.overall_score = result.overall_score
            existing_eval.answer_score = result.answer_quality_score
            existing_eval.communication_score = result.communication_score
            existing_eval.visual_score = result.visual_presentation_score
            existing_eval.performance_category = result.performance_category
            existing_eval.category_scores = result.category_scores
            existing_eval.applied_weights = result.applied_weights
            existing_eval.evidence_coverage = result.evidence_coverage
            existing_eval.evidence_reliability = result.evidence_reliability
            existing_eval.per_question_breakdown = [q.model_dump() for q in result.per_question_breakdown]
            existing_eval.strengths = result.strengths
            existing_eval.improvements = result.improvements
            existing_eval.summary = result.summary
            existing_eval.scoring_version = result.scoring_version
            existing_eval.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_eval)
            saved_eval = existing_eval
            logger.info(f"Updated existing FinalEvaluation '{saved_eval.id}' for session '{session_id}'")
        else:
            # Create new persistent entity
            new_eval = FinalEvaluation(
                id=eval_id,
                session_id=session_id,
                interview_id=session.interview_id,
                user_id=user_id,
                overall_score=result.overall_score,
                answer_score=result.answer_quality_score,
                communication_score=result.communication_score,
                visual_score=result.visual_presentation_score,
                performance_category=result.performance_category,
                category_scores=result.category_scores,
                applied_weights=result.applied_weights,
                evidence_coverage=result.evidence_coverage,
                evidence_reliability=result.evidence_reliability,
                per_question_breakdown=[q.model_dump() for q in result.per_question_breakdown],
                strengths=result.strengths,
                improvements=result.improvements,
                summary=result.summary,
                scoring_version=result.scoring_version,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(new_eval)
            db.commit()
            db.refresh(new_eval)
            saved_eval = new_eval
            logger.info(f"Persisted new FinalEvaluation '{saved_eval.id}' for session '{session_id}'")

        return cls._model_to_result(saved_eval)

    @classmethod
    def get_final_evaluation(
        cls,
        db: Session,
        session_id: str,
        user_id: str,
    ) -> Optional[FinalEvaluationResult]:
        """
        Retrieve stored final evaluation for an interview session.
        """
        eval_record = db.query(FinalEvaluation).join(InterviewSession).join(Interview).filter(
            FinalEvaluation.session_id == session_id
        ).first()

        if not eval_record:
            return None

        if str(eval_record.user_id) != str(user_id):
            raise UnauthorizedEvaluationError(f"User '{user_id}' is not authorized to view evaluation for session '{session_id}'.")

        return cls._model_to_result(eval_record)

    @staticmethod
    def _model_to_result(model: FinalEvaluation) -> FinalEvaluationResult:
        """Helper to convert FinalEvaluation DB model into FinalEvaluationResult schema."""
        breakdown_dicts = model.per_question_breakdown or []
        breakdown_objs = [PerQuestionScore(**b) if isinstance(b, dict) else b for b in breakdown_dicts]

        return FinalEvaluationResult(
            evaluation_id=model.id,
            session_id=model.session_id,
            interview_id=model.interview_id,
            user_id=model.user_id,
            overall_score=model.overall_score,
            answer_quality_score=model.answer_score,
            communication_score=model.communication_score,
            visual_presentation_score=model.visual_score,
            performance_category=model.performance_category,
            category_scores=model.category_scores or {},
            applied_weights=model.applied_weights or {},
            evidence_coverage=model.evidence_coverage or {},
            evidence_reliability=model.evidence_reliability or {},
            per_question_breakdown=breakdown_objs,
            strengths=model.strengths or [],
            improvements=model.improvements or [],
            summary=model.summary,
            scoring_version=model.scoring_version,
            created_at=model.created_at,
        )


final_evaluator = FinalEvaluator()
