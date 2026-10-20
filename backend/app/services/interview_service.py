from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.interview import Interview
from app.models.interview_question import InterviewQuestion
from app.schemas.interview import InterviewCreate, InterviewUpdate
from app.schemas.question import QuestionCreate


def create_interview(db: Session, user_id: str, data: InterviewCreate) -> Interview:
    """
    Create a new interview configuration strictly bound to the authenticated user.
    """
    title = data.title
    if not title or title == "Technical Interview":
        domain_part = data.domain or data.interview_type or "General"
        title = f"{domain_part} Mock Interview"

    interview = Interview(
        user_id=user_id,
        title=title,
        job_role=data.job_role or "Software Engineer",
        interview_type=data.interview_type or "Technical",
        mode=data.mode or "General",
        domain=data.domain,
        difficulty=data.difficulty or "Medium",
        experience_level=data.experience_level or "2+",
        question_count=data.question_count if data.question_count is not None else 5,
        counter_questions=data.counter_questions if data.counter_questions is not None else True,
        status=data.status or "ready"
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


def get_user_interviews(db: Session, user_id: str) -> List[Interview]:
    """
    Retrieve all interviews belonging to the specified user, enriched with
    latest session ID, authoritative score from FinalEvaluation, duration, and summary.
    """
    interviews = db.query(Interview).filter(Interview.user_id == user_id).order_by(Interview.created_at.desc()).all()

    for item in interviews:
        latest_session = None
        if item.sessions:
            # Sort sessions by created_at descending
            sorted_sessions = sorted(item.sessions, key=lambda s: s.created_at or s.updated_at, reverse=True)
            latest_session = sorted_sessions[0]

        session_id = latest_session.id if latest_session else None
        score = None
        summary = None
        confidence = None
        duration_minutes = 15.0

        if latest_session:
            # Check for authoritative final evaluation
            final_eval = getattr(latest_session, "final_evaluation", None)
            if not final_eval:
                from app.models.final_evaluation import FinalEvaluation
                final_eval = db.query(FinalEvaluation).filter(FinalEvaluation.session_id == latest_session.id).first()

            if final_eval:
                score = round(final_eval.overall_score, 1)
                summary = final_eval.summary
                confidence = round(final_eval.communication_score or 85.0, 1)
            elif latest_session.answers:
                # Fallback to average score of answer evaluations
                eval_scores = [a.evaluation.overall_score for a in latest_session.answers if getattr(a, "evaluation", None) and a.evaluation.overall_score is not None]
                if eval_scores:
                    score = round(sum(eval_scores) / len(eval_scores), 1)
                    summary = "Interview responses evaluated."

            if latest_session.started_at and latest_session.completed_at:
                delta_sec = (latest_session.completed_at - latest_session.started_at).total_seconds()
                duration_minutes = max(1.0, round(delta_sec / 60.0, 1))

        # Attach enriched fields for InterviewResponse serialization
        setattr(item, "session_id", session_id)
        setattr(item, "score", score)
        setattr(item, "duration", f"{int(duration_minutes)} Mins")
        setattr(item, "duration_minutes", duration_minutes)
        setattr(item, "summary", summary or f"{item.domain or item.interview_type or 'Technical'} practice session.")
        setattr(item, "confidence", confidence if confidence is not None else (score or 85.0))
        setattr(item, "typeBadge", item.domain or item.interview_type or "Technical")
        setattr(item, "date", item.created_at.strftime("%Y-%m-%d") if item.created_at else "Today")
        setattr(item, "role", item.job_role or f"{item.domain or 'Software'} Engineer")

    return interviews


def get_interview_by_id(db: Session, interview_id: str, user_id: str) -> Optional[Interview]:
    """
    Retrieve an interview by ID, validating that it belongs to the user.
    """
    return db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == user_id
    ).first()


def update_interview(db: Session, interview_id: str, user_id: str, data: InterviewUpdate) -> Optional[Interview]:
    """
    Update an owned interview's configuration.
    """
    interview = get_interview_by_id(db, interview_id=interview_id, user_id=user_id)
    if not interview:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        if value is not None:
            setattr(interview, field, value)

    db.commit()
    db.refresh(interview)
    return interview


def delete_interview(db: Session, interview_id: str, user_id: str) -> bool:
    """
    Delete an owned interview.
    """
    interview = get_interview_by_id(db, interview_id=interview_id, user_id=user_id)
    if not interview:
        return False

    db.delete(interview)
    db.commit()
    return True


def add_interview_question(db: Session, interview_id: str, user_id: str, data: QuestionCreate) -> Optional[InterviewQuestion]:
    """
    Add a question to an owned interview.
    """
    interview = get_interview_by_id(db, interview_id=interview_id, user_id=user_id)
    if not interview:
        return None

    question = InterviewQuestion(
        interview_id=interview_id,
        question_text=data.question_text,
        question_order=data.question_order,
        question_type=data.question_type
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def get_interview_questions(db: Session, interview_id: str, user_id: str) -> Optional[List[InterviewQuestion]]:
    """
    Get all questions for an owned interview in deterministic order.
    """
    interview = get_interview_by_id(db, interview_id=interview_id, user_id=user_id)
    if not interview:
        return None

    return db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id
    ).order_by(InterviewQuestion.question_order.asc()).all()
