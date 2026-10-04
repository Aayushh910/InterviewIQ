"""
Evidence Aggregator for InterviewIQ (Phase 12).
Responsible for retrieving, validating, normalizing, and organizing all evidence
(answers, answer evaluations, facial telemetry, behavioral telemetry) for a session.
Does NOT compute scores; purely aggregates and normalizes raw evidence.
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.interview_question import InterviewQuestion
from app.models.session_question import SessionQuestion
from app.models.answer import Answer
from app.models.answer_evaluation import AnswerEvaluation
from app.models.multimodal_evidence import MultimodalEvidence
from app.evaluation.schemas import (
    NormalizedAnswerEvidence,
    NormalizedVisualEvidence,
    NormalizedBehaviorEvidence,
    QuestionEvidenceBundle,
    AggregatedSessionEvidence,
)
from app.evaluation.exceptions import (
    SessionNotFoundError,
    UnauthorizedEvaluationError,
    SessionNotCompleteError,
    InsufficientEvidenceError,
)

logger = logging.getLogger(__name__)


class EvidenceAggregator:
    """
    Evidence aggregation engine collecting and normalizing multi-source interview signals.
    """

    @staticmethod
    def aggregate_session_evidence(
        db: Session,
        session_id: str,
        user_id: str,
        require_completed: bool = True,
    ) -> AggregatedSessionEvidence:
        """
        Retrieve, validate, and normalize all evidence for a specific interview session attempt.
        """
        # 1. Retrieve session and verify ownership
        session = db.query(InterviewSession).join(Interview).filter(
            InterviewSession.id == session_id
        ).first()

        if not session:
            raise SessionNotFoundError(f"Interview session '{session_id}' not found.")

        if str(session.interview.user_id) != str(user_id):
            raise UnauthorizedEvaluationError(f"User '{user_id}' is not authorized to evaluate session '{session_id}'.")

        # 2. Check session status
        if require_completed and session.status == "not_started":
            raise SessionNotCompleteError(f"Cannot evaluate session '{session_id}' in 'not_started' status.")

        # 3. Retrieve all questions (main and counter questions)
        main_questions: List[InterviewQuestion] = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == session.interview_id
        ).order_by(InterviewQuestion.question_order.asc()).all()

        session_questions: List[SessionQuestion] = db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session_id
        ).order_by(SessionQuestion.created_at.asc()).all()

        # 4. Retrieve answers and answer evaluations
        answers: List[Answer] = db.query(Answer).filter(
            Answer.session_id == session_id
        ).order_by(Answer.created_at.asc()).all()

        if not answers and require_completed:
            raise InsufficientEvidenceError(f"Session '{session_id}' has no candidate answers recorded.")

        answer_ids = [a.id for a in answers]
        evaluations: List[AnswerEvaluation] = []
        if answer_ids:
            evaluations = db.query(AnswerEvaluation).filter(
                AnswerEvaluation.answer_id.in_(answer_ids)
            ).all()

        eval_by_ans_id: Dict[str, AnswerEvaluation] = {ev.answer_id: ev for ev in evaluations}
        ans_by_qid: Dict[str, Answer] = {a.question_id: a for a in answers}

        # 5. Retrieve multimodal evidence (face & behavior)
        multimodal_records: List[MultimodalEvidence] = []
        try:
            multimodal_records = db.query(MultimodalEvidence).filter(
                MultimodalEvidence.session_id == session_id
            ).order_by(MultimodalEvidence.recorded_at.asc()).all()
        except Exception as e:
            logger.warning(f"Could not query MultimodalEvidence: {e}")

        # Index multimodal evidence by answer_id
        face_by_ans_id: Dict[str, MultimodalEvidence] = {}
        beh_by_ans_id: Dict[str, MultimodalEvidence] = {}
        session_face_records: List[MultimodalEvidence] = []
        session_beh_records: List[MultimodalEvidence] = []

        for rec in multimodal_records:
            if rec.answer_id:
                if rec.evidence_type == "face":
                    face_by_ans_id[rec.answer_id] = rec
                elif rec.evidence_type == "behavior":
                    beh_by_ans_id[rec.answer_id] = rec
            else:
                if rec.evidence_type == "face":
                    session_face_records.append(rec)
                elif rec.evidence_type == "behavior":
                    session_beh_records.append(rec)

        # 6. Build Question Evidence Bundles
        question_bundles: List[QuestionEvidenceBundle] = []

        # Process main questions
        for mq in main_questions:
            bundle = EvidenceAggregator._build_bundle(
                question_id=mq.id,
                question_text=mq.question_text,
                question_type="main",
                question_order=mq.question_order,
                answer=ans_by_qid.get(mq.id),
                eval_by_ans_id=eval_by_ans_id,
                face_by_ans_id=face_by_ans_id,
                beh_by_ans_id=beh_by_ans_id,
            )
            question_bundles.append(bundle)

        # Process counter / follow-up questions
        for sq in session_questions:
            bundle = EvidenceAggregator._build_bundle(
                question_id=sq.id,
                question_text=sq.question_text,
                question_type="counter",
                question_order=sq.question_order,
                answer=ans_by_qid.get(sq.id),
                eval_by_ans_id=eval_by_ans_id,
                face_by_ans_id=face_by_ans_id,
                beh_by_ans_id=beh_by_ans_id,
            )
            question_bundles.append(bundle)

        # 7. Normalize session-level multimodal fallback evidence
        norm_session_face = None
        if session_face_records:
            latest_face = session_face_records[-1]
            norm_session_face = EvidenceAggregator._normalize_visual(latest_face)

        norm_session_beh = None
        if session_beh_records:
            latest_beh = session_beh_records[-1]
            norm_session_beh = EvidenceAggregator._normalize_behavior(latest_beh)

        answered_count = sum(1 for b in question_bundles if b.answer is not None and b.answer.answer_text)

        return AggregatedSessionEvidence(
            session_id=session_id,
            interview_id=session.interview_id,
            user_id=user_id,
            session_status=session.status,
            total_questions=len(question_bundles),
            answered_questions_count=answered_count,
            questions=question_bundles,
            session_visual=norm_session_face,
            session_behavior=norm_session_beh,
        )

    @staticmethod
    def _build_bundle(
        question_id: str,
        question_text: str,
        question_type: str,
        question_order: int,
        answer: Optional[Answer],
        eval_by_ans_id: Dict[str, AnswerEvaluation],
        face_by_ans_id: Dict[str, MultimodalEvidence],
        beh_by_ans_id: Dict[str, MultimodalEvidence],
    ) -> QuestionEvidenceBundle:
        """Helper to build a normalized question bundle."""
        norm_ans = None
        norm_vis = None
        norm_beh = None

        if answer and answer.answer_text:
            eval_record = eval_by_ans_id.get(answer.id)
            duration = None
            if answer.started_at and answer.submitted_at:
                duration = max(0.0, (answer.submitted_at - answer.started_at).total_seconds())

            if eval_record:
                norm_ans = NormalizedAnswerEvidence(
                    question_id=question_id,
                    question_text=question_text,
                    question_type=question_type,
                    question_order=question_order,
                    answer_id=answer.id,
                    answer_text=answer.answer_text,
                    duration_seconds=duration,
                    correctness_score=eval_record.correctness_score,
                    relevance_score=eval_record.relevance_score,
                    technical_depth_score=eval_record.technical_depth_score,
                    completeness_score=eval_record.completeness_score,
                    clarity_score=eval_record.clarity_score,
                    overall_answer_score=eval_record.overall_score,
                    strengths=eval_record.strengths or [],
                    improvements=eval_record.improvements or [],
                    summary=eval_record.summary or "Evaluation recorded.",
                    has_evaluation=True,
                )
            else:
                # Answer exists without formal AnswerEvaluation record
                norm_ans = NormalizedAnswerEvidence(
                    question_id=question_id,
                    question_text=question_text,
                    question_type=question_type,
                    question_order=question_order,
                    answer_id=answer.id,
                    answer_text=answer.answer_text,
                    duration_seconds=duration,
                    overall_answer_score=0.0,
                    has_evaluation=False,
                )

            # Check dedicated multimodal evidence
            face_ev = face_by_ans_id.get(answer.id)
            if face_ev:
                norm_vis = EvidenceAggregator._normalize_visual(face_ev)
            elif answer.facial_analysis and isinstance(answer.facial_analysis, dict):
                # Fallback to Answer.facial_analysis legacy telemetry
                fa = answer.facial_analysis
                norm_vis = NormalizedVisualEvidence(
                    status="available" if fa.get("face_detected") else "no_face_detected",
                    face_detected=bool(fa.get("face_detected")),
                    face_presence_ratio=fa.get("face_presence_ratio"),
                    camera_alignment=fa.get("camera_alignment"),
                    position_quality=fa.get("position_quality", 0.8),
                    confidence_score=fa.get("confidence_indicator", 0.9),
                    quality_rating="high",
                    observations=fa.get("observations") or [],
                )

            beh_ev = beh_by_ans_id.get(answer.id)
            if beh_ev:
                norm_beh = EvidenceAggregator._normalize_behavior(beh_ev)

        return QuestionEvidenceBundle(
            question_id=question_id,
            question_text=question_text,
            question_type=question_type,
            question_order=question_order,
            answer=norm_ans,
            visual=norm_vis,
            behavior=norm_beh,
        )

    @staticmethod
    def _normalize_visual(rec: MultimodalEvidence) -> NormalizedVisualEvidence:
        """Normalize a MultimodalEvidence face record."""
        derived = rec.derived_indicators or {}
        raw = rec.raw_evidence or {}
        rating = "high"
        if rec.confidence_score < 0.5:
            rating = "low"
        elif rec.confidence_score < 0.8:
            rating = "medium"

        return NormalizedVisualEvidence(
            status=rec.status,
            face_detected=bool(raw.get("face_detected", True)),
            face_presence_ratio=derived.get("face_presence_ratio"),
            camera_alignment=derived.get("camera_alignment"),
            position_quality=raw.get("position_quality"),
            confidence_score=rec.confidence_score,
            quality_rating=rating,
            observations=rec.observations or [],
        )

    @staticmethod
    def _normalize_behavior(rec: MultimodalEvidence) -> NormalizedBehaviorEvidence:
        """Normalize a MultimodalEvidence behavior record."""
        derived = rec.derived_indicators or {}
        raw = rec.raw_evidence or {}
        rating = "high"
        if rec.confidence_score < 0.5:
            rating = "low"
        elif rec.confidence_score < 0.8:
            rating = "medium"

        return NormalizedBehaviorEvidence(
            status=rec.status,
            duration_seconds=float(raw.get("response_duration_seconds", 0.0)),
            speaking_rate_wpm=float(derived.get("speaking_rate_wpm", 0.0)),
            pause_count=int(raw.get("pause_count", 0)),
            filler_word_count=int(raw.get("filler_word_count", 0)),
            speaking_ratio=float(derived.get("speaking_ratio", 1.0)),
            confidence_score=rec.confidence_score,
            quality_rating=rating,
            observations=rec.observations or [],
        )
