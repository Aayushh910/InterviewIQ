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
    Retrieve all interviews belonging to the specified user.
    """
    return db.query(Interview).filter(Interview.user_id == user_id).order_by(Interview.created_at.desc()).all()


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
