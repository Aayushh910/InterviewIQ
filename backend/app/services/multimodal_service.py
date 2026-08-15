import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.answer import Answer
from app.models.interview_session import InterviewSession
from app.schemas.multimodal import (
    AnswerPerformanceCategory,
    VisualObservationsCategory,
    AnswerMultimodalResponse,
    SessionMultimodalResponse
)

logger = logging.getLogger(__name__)

# Configured threshold constants for observable computer-vision signals
FACE_PRESENCE_HIGH_THRESHOLD = 0.85
FACE_PRESENCE_LOW_THRESHOLD = 0.50
CAMERA_ALIGNMENT_STABLE_THRESHOLD = 0.75


def build_answer_performance(eval_record) -> Optional[AnswerPerformanceCategory]:
    if not eval_record:
        return AnswerPerformanceCategory(
            available=False,
            relevance_score=0.0,
            correctness_score=0.0,
            completeness_score=0.0,
            clarity_score=0.0,
            technical_depth_score=0.0,
            communication_score=0.0,
            confidence_score=0.0,
            overall_score=0.0,
            strengths=[],
            improvements=[],
            summary="Answer evaluation has not been completed."
        )

    # Compute communication and confidence metrics safely
    comm_score = getattr(eval_record, "communication_score", None)
    if comm_score is None:
        comm_score = round(eval_record.clarity_score * 0.5 + eval_record.relevance_score * 0.5, 2)

    conf_score = getattr(eval_record, "confidence_score", None)
    if conf_score is None:
        conf_score = round(eval_record.overall_score, 2)

    return AnswerPerformanceCategory(
        available=True,
        relevance_score=float(eval_record.relevance_score),
        correctness_score=float(eval_record.correctness_score),
        completeness_score=float(eval_record.completeness_score),
        clarity_score=float(eval_record.clarity_score),
        technical_depth_score=float(eval_record.technical_depth_score),
        communication_score=float(comm_score),
        confidence_score=float(conf_score),
        overall_score=float(eval_record.overall_score),
        strengths=eval_record.strengths or [],
        improvements=eval_record.improvements or [],
        summary=eval_record.summary
    )


def build_visual_observations(fa_data: Optional[Dict[str, Any]]) -> VisualObservationsCategory:
    if not fa_data or not isinstance(fa_data, dict):
        return VisualObservationsCategory(
            available=False,
            face_detected=False,
            observations=["Facial analysis data is not available for this answer."]
        )

    face_detected = fa_data.get("face_detected", True)
    presence_ratio = fa_data.get("face_presence_ratio")
    alignment_score = fa_data.get("average_camera_alignment")
    pos_quality = fa_data.get("average_position_quality")
    avg_pose = fa_data.get("average_head_pose")
    pose_var = fa_data.get("head_pose_variability")

    # Fallbacks if frame analysis format was saved instead of temporal format
    if presence_ratio is None and face_detected:
        presence_ratio = 1.0 if face_detected else 0.0

    if alignment_score is None and fa_data.get("camera_orientation"):
        alignment_score = fa_data["camera_orientation"].get("alignment_score")

    if pos_quality is None and fa_data.get("face_metrics"):
        pos_quality = fa_data["face_metrics"].get("position_quality")

    if avg_pose is None and fa_data.get("head_pose"):
        avg_pose = fa_data.get("head_pose")

    obs_notes: List[str] = []

    if not face_detected:
        obs_notes.append("No face detected in submitted frame(s).")
    else:
        if presence_ratio is not None:
            if presence_ratio >= FACE_PRESENCE_HIGH_THRESHOLD:
                obs_notes.append(f"Face was visible for most of the response ({int(presence_ratio * 100)}%).")
            elif presence_ratio >= FACE_PRESENCE_LOW_THRESHOLD:
                obs_notes.append(f"Face visibility was moderate during the response ({int(presence_ratio * 100)}%).")
            else:
                obs_notes.append(f"Face visibility was limited during part of the response ({int(presence_ratio * 100)}%).")

        if alignment_score is not None:
            if alignment_score >= CAMERA_ALIGNMENT_STABLE_THRESHOLD:
                obs_notes.append("Camera alignment was generally stable during the response.")
            else:
                obs_notes.append("Camera alignment varied during the response.")

    return VisualObservationsCategory(
        available=True,
        face_detected=bool(face_detected),
        face_presence_ratio=round(float(presence_ratio), 2) if presence_ratio is not None else None,
        camera_alignment_score=round(float(alignment_score), 2) if alignment_score is not None else None,
        position_quality=round(float(pos_quality), 2) if pos_quality is not None else None,
        average_head_pose=avg_pose,
        pose_variability=pose_var,
        observations=obs_notes
    )


def generate_multimodal_insights(
    perf: AnswerPerformanceCategory,
    vis: VisualObservationsCategory
) -> tuple[List[str], List[str]]:
    insights: List[str] = []
    recs: List[str] = []

    # Content insights
    if perf.available:
        if perf.overall_score >= 80.0:
            insights.append("The answer demonstrated high technical relevance and strong communication clarity.")
        elif perf.overall_score >= 60.0:
            insights.append("The response addressed the core topic well, with room for additional technical depth.")
        else:
            insights.append("The response was partial or off-topic; adding concrete architectural examples will improve scores.")

        if perf.improvements:
            recs.extend(perf.improvements[:2])

    # Visual insights
    if vis.available and vis.face_detected:
        if vis.face_presence_ratio is not None and vis.face_presence_ratio >= FACE_PRESENCE_HIGH_THRESHOLD:
            if perf.available and perf.overall_score >= 75.0:
                insights.append("Answer content quality was strong while face visibility and camera alignment remained high.")
            else:
                insights.append("Face presence remained high throughout the response delivery.")
        elif vis.face_presence_ratio is not None and vis.face_presence_ratio < FACE_PRESENCE_LOW_THRESHOLD:
            insights.append("Face presence ratio decreased during part of the response.")
            recs.append("Ensure your web camera is positioned directly front-facing and well-lit during practice sessions.")

    if not recs:
        recs.append("Practice explaining key concepts using structured STAR format (Situation, Task, Action, Result).")

    return insights, recs


def get_answer_multimodal_analysis(
    db: Session,
    session_id: str,
    answer_id: str,
    user_id: str
) -> AnswerMultimodalResponse:
    """
    Retrieve answer record, verify session ownership, aggregate Phase 2 AnswerEvaluation
    and Phase 4 FacialAnalysis metrics, and generate structured answer-level multimodal response.
    """
    answer = db.query(Answer).filter(
        Answer.id == answer_id,
        Answer.session_id == session_id
    ).first()

    if not answer:
        raise KeyError("Answer not found")

    session = answer.session
    if not session or session.interview.user_id != user_id:
        raise KeyError("Answer not found or unauthorized")

    perf = build_answer_performance(answer.evaluation)
    vis = build_visual_observations(answer.facial_analysis)
    insights, recs = generate_multimodal_insights(perf, vis)

    return AnswerMultimodalResponse(
        answer_id=answer.id,
        session_id=answer.session_id,
        question_id=answer.question_id,
        answer_text=answer.answer_text,
        answer_performance=perf,
        visual_observations=vis,
        combined_insights=insights,
        recommendations=recs
    )


def get_session_multimodal_analysis(
    db: Session,
    session_id: str,
    user_id: str
) -> SessionMultimodalResponse:
    """
    Retrieve all answers for an owned interview session, aggregate answer-level multimodal metrics,
    and compute interview-level summary analytics.
    """
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session or session.interview.user_id != user_id:
        raise KeyError("Session not found or unauthorized")

    answers = db.query(Answer).filter(Answer.session_id == session_id).all()

    analyses: List[AnswerMultimodalResponse] = []
    scores: List[float] = []
    face_ratios: List[float] = []

    for ans in answers:
        analysis = get_answer_multimodal_analysis(db, session_id=session_id, answer_id=ans.id, user_id=user_id)
        analyses.append(analysis)

        if analysis.answer_performance and analysis.answer_performance.available:
            scores.append(analysis.answer_performance.overall_score)

        if analysis.visual_observations and analysis.visual_observations.available:
            if analysis.visual_observations.face_presence_ratio is not None:
                face_ratios.append(analysis.visual_observations.face_presence_ratio)

    avg_score = round(sum(scores) / len(scores), 2) if scores else None
    avg_face = round(sum(face_ratios) / len(face_ratios), 2) if face_ratios else None

    if avg_score is not None and avg_score >= 80.0:
        summary = f"Strong overall interview session performance across {len(answers)} answered question(s) (Avg Score: {avg_score}/100)."
    elif avg_score is not None and avg_score >= 60.0:
        summary = f"Solid interview session performance across {len(answers)} question(s) (Avg Score: {avg_score}/100) with minor area improvements."
    elif avg_score is not None:
        summary = f"Interview session completed with {len(answers)} question(s) (Avg Score: {avg_score}/100). Further technical practice recommended."
    else:
        summary = f"Interview session contains {len(answers)} answer(s) awaiting evaluation."

    return SessionMultimodalResponse(
        session_id=session.id,
        interview_id=session.interview_id,
        total_answers=len(answers),
        evaluated_answers=len(scores),
        average_answer_score=avg_score,
        average_face_presence=avg_face,
        session_summary=summary,
        answer_analyses=analyses
    )
