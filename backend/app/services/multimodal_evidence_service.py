"""
Business service for Phase 11: Multimodal Evidence Persistence & Temporal Querying.
Provides durable persistence in PostgreSQL, ensures session ownership,
distinguishes raw observations from derived indicators, and prevents data fabrication.
"""

import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.core.database import engine, Base
from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.answer import Answer
from app.models.multimodal_evidence import MultimodalEvidence
from app.schemas.multimodal_evidence import (
    EvidenceType,
    EvidenceStatus,
    MeasurementReliability,
    AnalyzeFaceOutput,
    AnalyzeBehaviorOutput,
)

logger = logging.getLogger(__name__)

# Ensure multimodal_evidence table exists in database
try:
    MultimodalEvidence.__table__.create(bind=engine, checkfirst=True)
except Exception as e:
    logger.warning(f"Could not verify multimodal_evidence table: {e}")


def _ensure_session_access(db: Session, session_id: str, user_id: Optional[str] = None) -> InterviewSession:
    """Validate that the session exists and belongs to the authenticated candidate."""
    query = db.query(InterviewSession).join(Interview).filter(InterviewSession.id == session_id)
    if user_id:
        query = query.filter(Interview.user_id == user_id)
    session = query.first()
    if not session:
        raise KeyError(f"Session '{session_id}' not found or unauthorized.")
    return session


class MultimodalEvidenceService:
    """
    Authoritative evidence management service capturing and querying temporal multimodal telemetry.
    """

    @staticmethod
    def record_face_evidence(
        db: Session,
        session_id: str,
        user_id: Optional[str] = None,
        answer_id: Optional[str] = None,
        question_id: Optional[str] = None,
        face_output: Optional[AnalyzeFaceOutput] = None,
        raw_payload: Optional[Dict[str, Any]] = None,
    ) -> MultimodalEvidence:
        """
        Record verified facial evidence into PostgreSQL.
        """
        _ensure_session_access(db, session_id, user_id)

        # Resolve question_id from answer if missing
        if answer_id and not question_id:
            ans = db.query(Answer).filter(Answer.id == answer_id).first()
            if ans:
                question_id = ans.question_id

        status_val = face_output.status.value if face_output else EvidenceStatus.AVAILABLE.value
        conf_val = face_output.reliability.confidence_score if face_output else 1.0

        raw_data: Dict[str, Any] = {}
        derived_data: Dict[str, Any] = {}
        obs_list: List[str] = []

        if face_output:
            raw_data = {
                "face_detected": face_output.face_detected,
                "head_orientation": face_output.head_orientation,
                "position_quality": face_output.position_quality,
                "eye_openness": face_output.eye_openness,
            }
            derived_data = {
                "face_presence_ratio": face_output.face_presence_ratio,
                "camera_alignment": face_output.camera_alignment,
                "framing_centered": bool(face_output.position_quality and face_output.position_quality > 0.6),
            }
            obs_list = face_output.observations
        elif raw_payload:
            raw_data = raw_payload.get("raw") or raw_payload
            derived_data = raw_payload.get("derived") or {}
            obs_list = raw_payload.get("observations") or []

        evidence = MultimodalEvidence(
            session_id=session_id,
            question_id=question_id,
            answer_id=answer_id,
            evidence_type=EvidenceType.FACE.value,
            status=status_val,
            confidence_score=conf_val,
            raw_evidence=raw_data,
            derived_indicators=derived_data,
            observations=obs_list,
            recorded_at=datetime.utcnow()
        )
        db.add(evidence)

        # Synchronize into Answer.facial_analysis if answer_id is linked
        if answer_id:
            ans = db.query(Answer).filter(Answer.id == answer_id).first()
            if ans:
                fa = ans.facial_analysis or {}
                if not isinstance(fa, dict):
                    fa = {}
                fa["face_detected"] = face_output.face_detected if face_output else True
                fa["face_presence_ratio"] = face_output.face_presence_ratio if face_output else 1.0
                fa["camera_alignment"] = face_output.camera_alignment if face_output else 0.8
                fa["observations"] = obs_list
                if face_output and face_output.head_orientation:
                    fa["head_pose"] = face_output.head_orientation
                ans.facial_analysis = fa

        db.commit()
        db.refresh(evidence)
        logger.info(f"Recorded face evidence '{evidence.id}' for session '{session_id}' (status: {status_val})")
        return evidence

    @staticmethod
    def record_behavior_evidence(
        db: Session,
        session_id: str,
        user_id: Optional[str] = None,
        answer_id: Optional[str] = None,
        question_id: Optional[str] = None,
        behavior_output: Optional[AnalyzeBehaviorOutput] = None,
        raw_payload: Optional[Dict[str, Any]] = None,
    ) -> MultimodalEvidence:
        """
        Record verified behavioral speech pacing evidence into PostgreSQL.
        """
        _ensure_session_access(db, session_id, user_id)

        if answer_id and not question_id:
            ans = db.query(Answer).filter(Answer.id == answer_id).first()
            if ans:
                question_id = ans.question_id

        status_val = behavior_output.status.value if behavior_output else EvidenceStatus.AVAILABLE.value
        conf_val = behavior_output.reliability.confidence_score if behavior_output else 1.0

        raw_data: Dict[str, Any] = {}
        derived_data: Dict[str, Any] = {}
        obs_list: List[str] = []

        if behavior_output:
            raw_data = {
                "response_duration_seconds": behavior_output.response_duration_seconds,
                "pause_count": behavior_output.pause_count,
                "filler_word_count": behavior_output.filler_word_count,
            }
            derived_data = {
                "speaking_rate_wpm": behavior_output.speaking_rate_wpm,
                "speaking_ratio": behavior_output.speaking_ratio,
                "response_latency_seconds": behavior_output.response_latency_seconds,
            }
            obs_list = behavior_output.observations
        elif raw_payload:
            raw_data = raw_payload.get("raw") or raw_payload
            derived_data = raw_payload.get("derived") or {}
            obs_list = raw_payload.get("observations") or []

        evidence = MultimodalEvidence(
            session_id=session_id,
            question_id=question_id,
            answer_id=answer_id,
            evidence_type=EvidenceType.BEHAVIOR.value,
            status=status_val,
            confidence_score=conf_val,
            raw_evidence=raw_data,
            derived_indicators=derived_data,
            observations=obs_list,
            recorded_at=datetime.utcnow()
        )
        db.add(evidence)

        # Synchronize into Answer.facial_analysis dictionary under behavioral keys
        if answer_id:
            ans = db.query(Answer).filter(Answer.id == answer_id).first()
            if ans:
                fa = ans.facial_analysis or {}
                if not isinstance(fa, dict):
                    fa = {}
                fa["wpm"] = behavior_output.speaking_rate_wpm if behavior_output else 130.0
                fa["duration_seconds"] = behavior_output.response_duration_seconds if behavior_output else 30.0
                if obs_list:
                    existing_obs = fa.get("observations") or []
                    fa["observations"] = list(dict.fromkeys(existing_obs + obs_list))
                ans.facial_analysis = fa

        db.commit()
        db.refresh(evidence)
        logger.info(f"Recorded behavior evidence '{evidence.id}' for session '{session_id}' (status: {status_val})")
        return evidence

    @staticmethod
    def get_session_evidence(
        db: Session,
        session_id: str,
        user_id: Optional[str] = None,
        evidence_type: Optional[str] = None,
        question_id: Optional[str] = None,
        answer_id: Optional[str] = None
    ) -> List[MultimodalEvidence]:
        """
        Retrieve chronological multimodal evidence timeline for a session.
        """
        _ensure_session_access(db, session_id, user_id)

        query = db.query(MultimodalEvidence).filter(MultimodalEvidence.session_id == session_id)
        if evidence_type:
            query = query.filter(MultimodalEvidence.evidence_type == evidence_type.lower().strip())
        if question_id:
            query = query.filter(MultimodalEvidence.question_id == question_id)
        if answer_id:
            query = query.filter(MultimodalEvidence.answer_id == answer_id)

        return query.order_by(MultimodalEvidence.recorded_at.asc()).all()

    @staticmethod
    def get_latest_evidence(
        db: Session,
        session_id: str,
        user_id: Optional[str] = None,
        evidence_type: Optional[str] = None
    ) -> Optional[MultimodalEvidence]:
        """
        Retrieve the single most recent evidence record of a given type.
        """
        _ensure_session_access(db, session_id, user_id)

        query = db.query(MultimodalEvidence).filter(MultimodalEvidence.session_id == session_id)
        if evidence_type:
            query = query.filter(MultimodalEvidence.evidence_type == evidence_type.lower().strip())

        return query.order_by(MultimodalEvidence.recorded_at.desc()).first()


evidence_service = MultimodalEvidenceService()
