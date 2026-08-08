import logging
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models.answer import Answer
from app.models.interview_question import InterviewQuestion
from app.models.session_question import SessionQuestion
from app.schemas.answer import AnswerCreate, AnswerSubmitResponse, AnswerResponse
from app.schemas.question import NextQuestionInfo
from app.services.session_service import get_session_by_id
from app.services.answer_evaluation_service import evaluate_answer as service_evaluate_answer
from app.ai.evaluation.question_generation import (
    should_generate_counter_question,
    generate_adaptive_counter_question,
)

logger = logging.getLogger(__name__)


def submit_answer(db: Session, session_id: str, user_id: str, data: AnswerCreate) -> AnswerSubmitResponse:
    """
    Validate session and question ownership, create/update candidate answer, evaluate the answer,
    and dynamically determine the next question (either an adaptive counter question or the next main question).
    """
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        raise KeyError("Session not found or unauthorized")

    if session.status == "completed" or session.status == "abandoned":
        raise ValueError("Cannot submit answer for a closed or abandoned session")

    # If session is still not_started, auto-start it on first answer submission
    if session.status == "not_started":
        session.status = "in_progress"
        session.started_at = datetime.utcnow()

    interview = session.interview
    if not interview:
        raise ValueError("Session interview configuration not found")

    # 1. Locate Target Question (search InterviewQuestion first, then SessionQuestion)
    main_q_order = 1
    current_depth = 0
    parent_q_id = data.question_id
    question_text = ""
    is_valid_question = False

    main_q = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == data.question_id,
        InterviewQuestion.interview_id == session.interview_id
    ).first()

    if main_q:
        is_valid_question = True
        main_q_order = main_q.question_order
        current_depth = 0
        parent_q_id = main_q.id
        question_text = main_q.question_text
    else:
        session_q = db.query(SessionQuestion).filter(
            SessionQuestion.id == data.question_id,
            SessionQuestion.session_id == session_id
        ).first()

        if session_q:
            is_valid_question = True
            main_q_order = session_q.question_order
            current_depth = session_q.follow_up_depth
            parent_q_id = session_q.parent_question_id or session_q.id
            question_text = session_q.question_text

    if not is_valid_question:
        raise ValueError("Question does not belong to the interview of this session")

    # 2. Save / Update Answer Record in PostgreSQL
    existing_answer = db.query(Answer).filter(
        Answer.session_id == session_id,
        Answer.question_id == data.question_id
    ).first()

    now = datetime.utcnow()
    if existing_answer:
        existing_answer.answer_text = data.answer_text
        if data.started_at:
            existing_answer.started_at = data.started_at
        existing_answer.submitted_at = data.submitted_at or now
        db.commit()
        db.refresh(existing_answer)
        saved_answer = existing_answer
    else:
        saved_answer = Answer(
            session_id=session_id,
            question_id=data.question_id,
            answer_text=data.answer_text,
            started_at=data.started_at or now,
            submitted_at=data.submitted_at or now
        )
        db.add(saved_answer)
        db.commit()
        db.refresh(saved_answer)

    answer_schema = AnswerResponse.model_validate(saved_answer)

    # 3. Evaluate Candidate Answer Automatically
    evaluation_schema = None
    try:
        evaluation_schema = service_evaluate_answer(db, answer_id=saved_answer.id, user_id=user_id)
    except Exception as e:
        logger.warning(f"Automatic answer evaluation notice: {e}")

    # 4. Evaluate Adaptive Follow-up / Counter Question Logic
    adaptive_enabled = getattr(interview, "counter_questions", True)
    next_question_info: Optional[NextQuestionInfo] = None
    interview_complete = False

    if adaptive_enabled:
        should_follow_up, focus = should_generate_counter_question(
            main_question_text=question_text,
            answer_text=data.answer_text or "",
            follow_up_depth=current_depth
        )

        if should_follow_up:
            meta = {
                "interview_type": interview.interview_type,
                "domain": interview.domain,
                "difficulty": interview.difficulty,
                "experience_level": interview.experience_level,
                "mode": interview.mode
            }
            counter_text = generate_adaptive_counter_question(
                main_question_text=question_text,
                answer_text=data.answer_text or "",
                interview_meta=meta,
                focus=focus
            )

            if counter_text:
                new_session_q = SessionQuestion(
                    session_id=session_id,
                    interview_id=session.interview_id,
                    parent_question_id=parent_q_id,
                    question_text=counter_text,
                    question_type="counter",
                    follow_up_depth=current_depth + 1,
                    question_order=main_q_order
                )
                db.add(new_session_q)
                db.commit()
                db.refresh(new_session_q)

                next_question_info = NextQuestionInfo(
                    id=new_session_q.id,
                    question_text=new_session_q.question_text,
                    question_type="counter",
                    parent_question_id=parent_q_id,
                    follow_up_depth=current_depth + 1
                )
                return AnswerSubmitResponse(
                    id=saved_answer.id,
                    session_id=saved_answer.session_id,
                    question_id=saved_answer.question_id,
                    answer_text=saved_answer.answer_text,
                    started_at=saved_answer.started_at,
                    submitted_at=saved_answer.submitted_at,
                    created_at=saved_answer.created_at,
                    updated_at=saved_answer.updated_at,
                    answer=answer_schema,
                    evaluation=evaluation_schema,
                    next_question=next_question_info,
                    interview_complete=False
                )

    # 5. Fallback / Next Main Question Resolution
    next_main_q = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == session.interview_id,
        InterviewQuestion.question_order > main_q_order
    ).order_by(InterviewQuestion.question_order.asc()).first()

    if next_main_q:
        next_question_info = NextQuestionInfo(
            id=next_main_q.id,
            question_text=next_main_q.question_text,
            question_type="main",
            parent_question_id=None,
            follow_up_depth=0
        )
        interview_complete = False
    else:
        next_question_info = None
        interview_complete = True

    return AnswerSubmitResponse(
        id=saved_answer.id,
        session_id=saved_answer.session_id,
        question_id=saved_answer.question_id,
        answer_text=saved_answer.answer_text,
        started_at=saved_answer.started_at,
        submitted_at=saved_answer.submitted_at,
        created_at=saved_answer.created_at,
        updated_at=saved_answer.updated_at,
        answer=answer_schema,
        evaluation=evaluation_schema,
        next_question=next_question_info,
        interview_complete=interview_complete
    )


def get_session_answers(db: Session, session_id: str, user_id: str) -> Optional[List[Answer]]:
    """
    Get all answers for an owned interview session.
    """
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        return None

    return db.query(Answer).filter(
        Answer.session_id == session_id
    ).order_by(Answer.created_at.asc()).all()


def get_answer_by_id(db: Session, answer_id: str, session_id: str, user_id: str) -> Optional[Answer]:
    """
    Retrieve a specific answer verifying ownership.
    """
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        return None

    return db.query(Answer).filter(
        Answer.id == answer_id,
        Answer.session_id == session_id
    ).first()
