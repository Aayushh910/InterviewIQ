import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.answer import Answer
from app.models.interview import Interview
from app.models.interview_question import InterviewQuestion
from app.models.interview_session import InterviewSession
from app.schemas.analytics import (
    DimensionMetrics,
    VisualAnalytics,
    CompletionMetrics,
    AnswerHighlight,
    QuestionPerformanceItem,
    InterviewAnalyticsResponse
)

logger = logging.getLogger(__name__)


def categorize_performance(score: Optional[float], status: str) -> str:
    if score is None:
        return "Pending Evaluation"
    if score >= 80.0:
        return "Strong"
    if score >= 60.0:
        return "Good"
    if score >= 40.0:
        return "Developing"
    return "Needs Significant Improvement"


def deduplicate_list(items: List[str]) -> List[str]:
    seen = set()
    result = []
    for item in items:
        cleaned = item.strip()
        lower = cleaned.lower()
        if lower and lower not in seen:
            seen.add(lower)
            result.append(cleaned)
    return result


def get_session_analytics(
    db: Session,
    session_id: str,
    user_id: str
) -> InterviewAnalyticsResponse:
    """
    Retrieve interview session, verify candidate ownership, calculate deterministic dimension averages,
    extract visual computer-vision observations, deduplicate strengths and top improvements,
    and construct structured InterviewAnalyticsResponse.
    """
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session or session.interview.user_id != user_id:
        raise KeyError("Session not found or unauthorized")

    interview = session.interview

    # 1. Fetch questions for interview
    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview.id
    ).order_by(InterviewQuestion.question_order).all()

    # 2. Fetch answers for session
    answers = db.query(Answer).filter(Answer.session_id == session_id).all()
    ans_by_q_id = {ans.question_id: ans for ans in answers}

    q_results: List[QuestionPerformanceItem] = []
    overall_scores: List[float] = []
    relevance_scores: List[float] = []
    correctness_scores: List[float] = []
    clarity_scores: List[float] = []
    comm_scores: List[float] = []
    conf_scores: List[float] = []

    face_ratios: List[float] = []
    align_scores: List[float] = []

    all_strengths: List[str] = []
    all_improvements: List[str] = []

    strongest_item: Optional[tuple[float, AnswerHighlight]] = None
    weakest_item: Optional[tuple[float, AnswerHighlight]] = None

    for q in questions:
        ans = ans_by_q_id.get(q.id)
        if not ans:
            q_results.append(
                QuestionPerformanceItem(
                    question_id=q.id,
                    question_text=q.question_text,
                    evaluation_available=False
                )
            )
            continue

        eval_rec = ans.evaluation
        fa_data = ans.facial_analysis or {}

        item_score = None
        item_rel = None
        item_corr = None
        item_clar = None
        item_comm = None
        item_conf = None
        item_strengths = []
        item_improvements = []
        has_eval = False

        if eval_rec:
            has_eval = True
            item_score = float(eval_rec.overall_score)
            item_rel = float(eval_rec.relevance_score)
            item_corr = float(eval_rec.correctness_score)
            item_clar = float(eval_rec.clarity_score)
            item_comm = float(getattr(eval_rec, "communication_score", eval_rec.clarity_score))
            item_conf = float(getattr(eval_rec, "confidence_score", eval_rec.overall_score))

            item_strengths = eval_rec.strengths or []
            item_improvements = eval_rec.improvements or []

            overall_scores.append(item_score)
            relevance_scores.append(item_rel)
            correctness_scores.append(item_corr)
            clarity_scores.append(item_clar)
            comm_scores.append(item_comm)
            conf_scores.append(item_conf)

            all_strengths.extend(item_strengths)
            all_improvements.extend(item_improvements)

            highlight = AnswerHighlight(
                question_id=q.id,
                question_text=q.question_text,
                answer_id=ans.id,
                answer_score=item_score,
                key_takeaway=eval_rec.summary or (item_strengths[0] if item_strengths else "Evaluated answer response.")
            )

            if strongest_item is None or item_score > strongest_item[0]:
                strongest_item = (item_score, highlight)
            if weakest_item is None or item_score < weakest_item[0]:
                weakest_item = (item_score, highlight)

        # Visual observations
        obs_notes: List[str] = []
        if fa_data and isinstance(fa_data, dict):
            face_detected = fa_data.get("face_detected", True)
            p_ratio = fa_data.get("face_presence_ratio")
            a_score = fa_data.get("average_camera_alignment")

            if p_ratio is None and face_detected:
                p_ratio = 1.0

            if a_score is None and fa_data.get("camera_orientation"):
                a_score = fa_data["camera_orientation"].get("alignment_score")

            if p_ratio is not None:
                face_ratios.append(float(p_ratio))
                obs_notes.append(f"Face presence ratio: {int(float(p_ratio) * 100)}%")
            if a_score is not None:
                align_scores.append(float(a_score))
                obs_notes.append(f"Camera alignment score: {int(float(a_score) * 100)}%")

        q_results.append(
            QuestionPerformanceItem(
                question_id=q.id,
                question_text=q.question_text,
                answer_id=ans.id,
                answer_score=item_score,
                relevance=item_rel,
                correctness=item_corr,
                clarity=item_clar,
                communication=item_comm,
                confidence_indicator=item_conf,
                strengths=item_strengths,
                improvements=item_improvements,
                visual_observations=obs_notes,
                evaluation_available=has_eval
            )
        )

    # Calculate overall metrics
    overall_avg = round(sum(overall_scores) / len(overall_scores), 2) if overall_scores else None
    rel_avg = round(sum(relevance_scores) / len(relevance_scores), 2) if relevance_scores else 0.0
    corr_avg = round(sum(correctness_scores) / len(correctness_scores), 2) if correctness_scores else 0.0
    clar_avg = round(sum(clarity_scores) / len(clarity_scores), 2) if clarity_scores else 0.0
    comm_avg = round(sum(comm_scores) / len(comm_scores), 2) if comm_scores else 0.0
    conf_avg = round(sum(conf_scores) / len(conf_scores), 2) if conf_scores else 0.0

    dim_metrics = None
    if overall_avg is not None:
        dim_metrics = DimensionMetrics(
            answer_quality=overall_avg,
            relevance=rel_avg,
            correctness=corr_avg,
            clarity=clar_avg,
            communication=comm_avg,
            confidence_indicator=conf_avg
        )

    avg_face_p = round(sum(face_ratios) / len(face_ratios), 2) if face_ratios else None
    avg_cam_a = round(sum(align_scores) / len(align_scores), 2) if align_scores else None

    vis_analytics = VisualAnalytics(
        average_face_presence_ratio=avg_face_p,
        average_camera_alignment=avg_cam_a,
        answers_with_facial_data=len(face_ratios)
    )

    comp_metrics = CompletionMetrics(
        total_questions=len(questions),
        answered_questions=len(answers),
        evaluated_answers=len(overall_scores),
        facial_analysis_available=len(face_ratios)
    )

    category = categorize_performance(overall_avg, session.status)

    return InterviewAnalyticsResponse(
        session_id=session.id,
        interview_id=session.interview_id,
        status=session.status,
        overall_score=overall_avg,
        performance_category=category,
        metrics=dim_metrics,
        completion=comp_metrics,
        visual_observations=vis_analytics,
        top_strengths=deduplicate_list(all_strengths)[:5],
        top_improvements=deduplicate_list(all_improvements)[:5],
        strongest_answer=strongest_item[1] if strongest_item else None,
        weakest_answer=weakest_item[1] if weakest_item else None,
        question_results=q_results
    )
