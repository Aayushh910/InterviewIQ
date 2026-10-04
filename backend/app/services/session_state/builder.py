from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.interview_question import InterviewQuestion
from app.models.session_question import SessionQuestion
from app.models.answer import Answer
from app.models.answer_evaluation import AnswerEvaluation
from app.models.multimodal_evidence import MultimodalEvidence
from app.schemas.session_state import (
    InterviewSessionState,
    InterviewConfiguration,
    QuestionHistoryItem,
    AnswerHistoryItem,
    FollowUpHistoryItem,
    EvaluationReferenceItem,
    FaceAnalysisReferenceItem,
    BehaviorAnalysisReferenceItem,
    SessionProgress,
    SessionTimestamps,
    RemainingTimeInfo,
    SessionStatus,
)
from app.services.session_state.exceptions import SessionNotFoundError


def build_session_state(
    db: Session,
    session_id: str,
    user_id: str,
    session_obj: Optional[InterviewSession] = None
) -> InterviewSessionState:
    """
    Constructs the authoritative, single-source-of-truth InterviewSessionState
    from persistent relational entities in PostgreSQL.
    """
    if not session_obj:
        session_obj = db.query(InterviewSession).join(Interview).filter(
            InterviewSession.id == session_id,
            Interview.user_id == user_id
        ).first()

    if not session_obj:
        raise SessionNotFoundError(f"Interview session '{session_id}' not found or unauthorized.")

    interview = session_obj.interview
    if not interview:
        raise SessionNotFoundError(f"Interview configuration for session '{session_id}' not found.")

    # 1. Map Interview Configuration
    duration_mins = 4  # Default 4-minute standard interview duration
    config = InterviewConfiguration(
        interview_type=interview.interview_type or "Technical",
        role=interview.job_role or "Software Engineer",
        domain=interview.domain or "Frontend",
        difficulty=interview.difficulty or "Medium",
        experience_level=interview.experience_level or "2+",
        duration_minutes=duration_mins,
        question_count=interview.question_count or 5,
        counter_questions=getattr(interview, "counter_questions", True),
        mode=interview.mode or "General",
    )

    # 2. Fetch Questions & Answers
    main_questions: List[InterviewQuestion] = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview.id
    ).order_by(InterviewQuestion.question_order.asc()).all()

    session_questions: List[SessionQuestion] = db.query(SessionQuestion).filter(
        SessionQuestion.session_id == session_id
    ).order_by(SessionQuestion.created_at.asc()).all()

    answers: List[Answer] = db.query(Answer).filter(
        Answer.session_id == session_id
    ).order_by(Answer.created_at.asc()).all()

    multimodal_evidence_list: List[MultimodalEvidence] = []
    try:
        multimodal_evidence_list = db.query(MultimodalEvidence).filter(
            MultimodalEvidence.session_id == session_id
        ).order_by(MultimodalEvidence.recorded_at.asc()).all()
    except Exception:
        multimodal_evidence_list = []

    # Index lookups
    answers_by_qid: Dict[str, Answer] = {a.question_id: a for a in answers}
    main_q_by_id: Dict[str, InterviewQuestion] = {mq.id: mq for mq in main_questions}
    session_q_by_id: Dict[str, SessionQuestion] = {sq.id: sq for sq in session_questions}

    # 3. Assemble Unified Question History
    question_history: List[QuestionHistoryItem] = []

    for mq in main_questions:
        has_ans = mq.id in answers_by_qid
        ans_id = answers_by_qid[mq.id].id if has_ans else None
        question_history.append(
            QuestionHistoryItem(
                question_id=mq.id,
                question_text=mq.question_text,
                question_type="main",
                topic=interview.domain,
                difficulty=interview.difficulty,
                order=mq.question_order,
                timestamp=mq.created_at,
                is_follow_up=False,
                follow_up_depth=0,
                parent_question_id=None,
                has_answer=has_ans,
                answer_id=ans_id,
            )
        )

    for sq in session_questions:
        has_ans = sq.id in answers_by_qid
        ans_id = answers_by_qid[sq.id].id if has_ans else None
        question_history.append(
            QuestionHistoryItem(
                question_id=sq.id,
                question_text=sq.question_text,
                question_type="counter",
                topic=interview.domain,
                difficulty=interview.difficulty,
                order=sq.question_order,
                timestamp=sq.created_at,
                is_follow_up=True,
                follow_up_depth=sq.follow_up_depth,
                parent_question_id=sq.parent_question_id,
                has_answer=has_ans,
                answer_id=ans_id,
            )
        )

    # Sort question history logically: main question followed by its counter questions
    question_history.sort(key=lambda q: (q.order, q.follow_up_depth, q.timestamp or datetime.min))

    # 4. Assemble Answer History & Evaluation References
    answer_history: List[AnswerHistoryItem] = []
    evaluation_history: List[EvaluationReferenceItem] = []
    face_analysis_references: List[FaceAnalysisReferenceItem] = []
    behavior_analysis_references: List[BehaviorAnalysisReferenceItem] = []

    for ans in answers:
        duration_sec = None
        if ans.started_at and ans.submitted_at:
            duration_sec = max(0.0, (ans.submitted_at - ans.started_at).total_seconds())

        eval_ref = None
        if ans.evaluation:
            ev: AnswerEvaluation = ans.evaluation
            eval_ref = {
                "evaluation_id": ev.id,
                "overall_score": ev.overall_score,
                "relevance_score": ev.relevance_score,
                "correctness_score": ev.correctness_score,
                "completeness_score": ev.completeness_score,
                "clarity_score": ev.clarity_score,
                "technical_depth_score": ev.technical_depth_score,
                "summary": ev.summary,
                "evaluator_provider": ev.evaluator_provider,
            }
            evaluation_history.append(
                EvaluationReferenceItem(
                    evaluation_id=ev.id,
                    answer_id=ans.id,
                    question_id=ans.question_id,
                    overall_score=ev.overall_score,
                    dimension_scores={
                        "relevance": ev.relevance_score,
                        "correctness": ev.correctness_score,
                        "completeness": ev.completeness_score,
                        "clarity": ev.clarity_score,
                        "technical_depth": ev.technical_depth_score,
                    },
                    summary=ev.summary,
                    evaluator_provider=ev.evaluator_provider,
                    created_at=ev.created_at,
                )
            )

        facial_ref = None
        behavioral_ref = None
        # 4b. Multimodal Facial & Behavioral References
        if ans.facial_analysis and isinstance(ans.facial_analysis, dict):
            fa = ans.facial_analysis
            presence = fa.get("face_presence_ratio")
            alignment = fa.get("camera_alignment")
            observations = fa.get("observations") or []
            conf = fa.get("confidence_indicator")
            wpm = fa.get("wpm")

            facial_ref = {
                "has_metrics": True,
                "face_presence_ratio": presence,
                "camera_alignment": alignment,
            }
            face_analysis_references.append(
                FaceAnalysisReferenceItem(
                    answer_id=ans.id,
                    has_frame_metrics=bool(fa.get("frame_metrics")),
                    has_temporal_metrics=bool(fa.get("temporal_metrics") or presence is not None),
                    face_presence_ratio=presence,
                    camera_alignment=alignment,
                    visual_observations=observations,
                )
            )

            if observations or conf is not None or wpm is not None:
                behavioral_ref = {
                    "observations": observations,
                    "confidence_indicator": conf,
                    "wpm": wpm,
                }
                behavior_analysis_references.append(
                    BehaviorAnalysisReferenceItem(
                        answer_id=ans.id,
                        observations=observations,
                        confidence_indicator=conf,
                        wpm=wpm,
                    )
                )

        # Supplement with dedicated MultimodalEvidence records for this answer
        ans_face_ev = [ev for ev in multimodal_evidence_list if ev.answer_id == ans.id and ev.evidence_type == "face"]
        if ans_face_ev:
            latest_face = ans_face_ev[-1]
            presence = latest_face.derived_indicators.get("face_presence_ratio")
            alignment = latest_face.derived_indicators.get("camera_alignment")
            observations = latest_face.observations or []
            facial_ref = {
                "has_metrics": True,
                "face_presence_ratio": presence,
                "camera_alignment": alignment,
            }
            if not any(f.answer_id == ans.id for f in face_analysis_references):
                face_analysis_references.append(
                    FaceAnalysisReferenceItem(
                        answer_id=ans.id,
                        has_frame_metrics=bool(latest_face.raw_evidence.get("head_orientation")),
                        has_temporal_metrics=bool(presence is not None),
                        face_presence_ratio=presence,
                        camera_alignment=alignment,
                        visual_observations=observations,
                    )
                )

        ans_beh_ev = [ev for ev in multimodal_evidence_list if ev.answer_id == ans.id and ev.evidence_type == "behavior"]
        if ans_beh_ev:
            latest_beh = ans_beh_ev[-1]
            wpm = latest_beh.derived_indicators.get("speaking_rate_wpm")
            obs = latest_beh.observations or []
            behavioral_ref = {
                "observations": obs,
                "confidence_indicator": latest_beh.confidence_score,
                "wpm": wpm,
            }
            if not any(b.answer_id == ans.id for b in behavior_analysis_references):
                behavior_analysis_references.append(
                    BehaviorAnalysisReferenceItem(
                        answer_id=ans.id,
                        observations=obs,
                        confidence_indicator=latest_beh.confidence_score,
                        wpm=wpm,
                    )
                )

        status_val = "evaluated" if eval_ref else ("submitted" if ans.answer_text else "pending")
        answer_history.append(
            AnswerHistoryItem(
                answer_id=ans.id,
                question_id=ans.question_id,
                answer_text=ans.answer_text,
                started_at=ans.started_at,
                submitted_at=ans.submitted_at,
                duration_seconds=duration_sec,
                status=status_val,
                evaluation_reference=eval_ref,
                facial_analysis_reference=facial_ref,
                behavior_analysis_reference=behavioral_ref,
            )
        )

    # 4c. Session-level Multimodal Evidence (not tied to a specific answer)
    for ev in multimodal_evidence_list:
        if not ev.answer_id:
            if ev.evidence_type == "face":
                face_analysis_references.append(
                    FaceAnalysisReferenceItem(
                        answer_id=f"session-{ev.id[:8]}",
                        has_frame_metrics=bool(ev.raw_evidence.get("head_orientation")),
                        has_temporal_metrics=bool(ev.derived_indicators.get("face_presence_ratio") is not None),
                        face_presence_ratio=ev.derived_indicators.get("face_presence_ratio"),
                        camera_alignment=ev.derived_indicators.get("camera_alignment"),
                        visual_observations=ev.observations or [],
                    )
                )
            elif ev.evidence_type == "behavior":
                behavior_analysis_references.append(
                    BehaviorAnalysisReferenceItem(
                        answer_id=f"session-{ev.id[:8]}",
                        observations=ev.observations or [],
                        confidence_indicator=ev.confidence_score,
                        wpm=ev.derived_indicators.get("speaking_rate_wpm"),
                    )
                )

    # 5. Assemble Follow-Up Progression History
    follow_up_history: List[FollowUpHistoryItem] = []
    for sq in session_questions:
        parent_id = sq.parent_question_id
        parent_text = ""
        parent_ans_id = None
        parent_ans_text = None

        if parent_id in main_q_by_id:
            parent_text = main_q_by_id[parent_id].question_text
        elif parent_id in session_q_by_id:
            parent_text = session_q_by_id[parent_id].question_text

        if parent_id in answers_by_qid:
            parent_ans = answers_by_qid[parent_id]
            parent_ans_id = parent_ans.id
            parent_ans_text = parent_ans.answer_text

        sq_ans = answers_by_qid.get(sq.id)

        follow_up_history.append(
            FollowUpHistoryItem(
                follow_up_id=sq.id,
                parent_question_id=parent_id or sq.id,
                parent_question_text=parent_text,
                candidate_answer_id=parent_ans_id,
                candidate_answer_text=parent_ans_text,
                follow_up_decision="generated",
                follow_up_question_id=sq.id,
                follow_up_question_text=sq.question_text,
                follow_up_depth=sq.follow_up_depth,
                follow_up_answer_id=sq_ans.id if sq_ans else None,
                follow_up_answer_text=sq_ans.answer_text if sq_ans else None,
            )
        )

    # 6. Active Question Determination
    current_q_item: Optional[QuestionHistoryItem] = None
    if session_obj.status not in [SessionStatus.COMPLETED.value, SessionStatus.ABANDONED.value, SessionStatus.EXPIRED.value]:
        # Priority 1: Unanswered counter question
        for q in question_history:
            if q.is_follow_up and not q.has_answer:
                current_q_item = q
                break

        # Priority 2: Unanswered main question
        if not current_q_item:
            for q in question_history:
                if not q.is_follow_up and not q.has_answer:
                    current_q_item = q
                    break

    # 7. Progress Calculation
    total_q_target = config.question_count or len(main_questions) or 5
    completed_main_q = sum(1 for q in question_history if not q.is_follow_up and q.has_answer)
    progress_pct = round((completed_main_q / max(1, total_q_target)) * 100, 1)

    cur_idx = min(completed_main_q, total_q_target - 1) if current_q_item else total_q_target
    cur_depth = current_q_item.follow_up_depth if current_q_item else 0

    progress = SessionProgress(
        current_question_index=cur_idx,
        total_questions=total_q_target,
        completed_questions=completed_main_q,
        progress_percentage=min(100.0, progress_pct),
        current_follow_up_depth=cur_depth,
        stage=session_obj.status,
    )

    # 8. Timestamps & Remaining Time
    now = datetime.utcnow()
    last_act = session_obj.updated_at or session_obj.created_at
    if answers:
        latest_ans_time = max(
            [a.submitted_at or a.created_at for a in answers if a.submitted_at or a.created_at],
            default=last_act
        )
        if latest_ans_time and latest_ans_time > last_act:
            last_act = latest_ans_time

    timestamps = SessionTimestamps(
        created_at=session_obj.created_at,
        started_at=session_obj.started_at,
        completed_at=session_obj.completed_at,
        last_active_at=last_act,
        current_question_started_at=None,
    )

    total_sec = config.duration_minutes * 60
    elapsed_sec = 0.0
    rem_sec = float(total_sec)
    is_exp = False

    if session_obj.started_at:
        if session_obj.completed_at:
            elapsed_sec = max(0.0, (session_obj.completed_at - session_obj.started_at).total_seconds())
            rem_sec = max(0.0, total_sec - elapsed_sec)
        else:
            elapsed_sec = max(0.0, (now - session_obj.started_at).total_seconds())
            rem_sec = max(0.0, total_sec - elapsed_sec)
            is_exp = elapsed_sec > (total_sec + 30.0)

    remaining_time = RemainingTimeInfo(
        total_duration_seconds=total_sec,
        elapsed_seconds=round(elapsed_sec, 1),
        remaining_seconds=round(rem_sec, 1),
        is_expired=is_exp,
    )

    # 9. Topics Covered & Runtime Metadata
    from app.services.session_state.store import runtime_store
    meta = runtime_store.get_meta(session_obj.id)
    override_topic = meta.get("current_topic")

    topics_list = [config.domain] if config.domain else []
    if override_topic and override_topic not in topics_list:
        topics_list.append(override_topic)
    for q in question_history:
        if q.topic and q.topic not in topics_list:
            topics_list.append(q.topic)

    current_topic = override_topic or (current_q_item.topic if current_q_item else (config.domain or "General"))

    return InterviewSessionState(
        session_id=session_obj.id,
        interview_id=interview.id,
        user_id=user_id,
        session_status=session_obj.status,
        interview_configuration=config,
        current_question=current_q_item,
        question_history=question_history,
        answer_history=answer_history,
        follow_up_history=follow_up_history,
        evaluation_history=evaluation_history,
        current_topic=current_topic,
        covered_topics=topics_list,
        progress=progress,
        timestamps=timestamps,
        remaining_time=remaining_time,
        face_analysis_references=face_analysis_references,
        behavior_analysis_references=behavior_analysis_references,
        metadata=meta.get("metadata", {}),
    )

