import logging
from typing import Optional, List, Dict
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.interview import Interview
from app.models.interview_question import InterviewQuestion
from app.models.session_question import SessionQuestion
from app.models.answer import Answer
from app.schemas.follow_up import FollowUpResponse, FollowUpItem
from app.ai.providers.factory import get_ai_provider
from app.ai.evaluation.answer.exceptions import AIProviderError, AIProviderTimeoutError, AIValidationError

logger = logging.getLogger(__name__)


def generate_and_store_follow_up_question(
    db: Session,
    user_id: str,
    interview_id: str,
    question_id: str,
    answer_id: str,
    provider_name: Optional[str] = None,
    mock_mode: Optional[str] = None
) -> FollowUpResponse:
    """
    Business service for Phase 2 Follow-Up Question Engine.
    Validates ownership across interview, question, and answer records; enforces follow-up depth limits;
    invokes AI provider to analyze answer; checks for duplicates; and persists follow-up questions to PostgreSQL.
    """
    # 1. Ownership & Existence Verification
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == user_id
    ).first()

    if not interview:
        logger.warning(f"Interview '{interview_id}' not found or unauthorized for user '{user_id}'")
        raise KeyError(f"Interview '{interview_id}' not found or unauthorized.")

    answer = db.query(Answer).filter(
        Answer.id == answer_id
    ).first()

    if not answer:
        logger.warning(f"Answer '{answer_id}' not found.")
        raise KeyError(f"Answer '{answer_id}' not found.")

    if answer.question_id != question_id:
        logger.warning(f"Answer '{answer_id}' question_id mismatch (expected '{question_id}', got '{answer.question_id}')")
        raise ValueError(f"Answer '{answer_id}' does not belong to question '{question_id}'.")

    # 2. Locate Question Details & Determine Follow-up Depth
    current_depth = 0
    main_q_order = 1
    parent_q_id = question_id
    question_text = ""

    main_q = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == question_id,
        InterviewQuestion.interview_id == interview_id
    ).first()

    if main_q:
        current_depth = 0
        main_q_order = main_q.question_order
        parent_q_id = main_q.id
        question_text = main_q.question_text
    else:
        session_q = db.query(SessionQuestion).filter(
            SessionQuestion.id == question_id
        ).first()

        if session_q:
            current_depth = session_q.follow_up_depth
            main_q_order = session_q.question_order
            parent_q_id = session_q.parent_question_id or session_q.id
            question_text = session_q.question_text
        else:
            raise KeyError(f"Question '{question_id}' not found.")

    # 3. Enforce Max Follow-Up Depth Limit Guardrail
    max_limit = getattr(settings, "MAX_FOLLOW_UPS_PER_QUESTION", 2)
    if current_depth >= max_limit:
        logger.info(f"Follow-up depth {current_depth} reached maximum limit of {max_limit} for question '{question_id}'")
        return FollowUpResponse(
            should_follow_up=False,
            reason=f"Maximum follow-up limit ({max_limit}) reached for this question.",
            follow_up=None
        )

    # 4. Enforce Non-Empty Answer Guardrail
    ans_clean = (answer.answer_text or "").strip()
    if len(ans_clean) < 5:
        logger.info(f"Candidate answer text too brief ({len(ans_clean)} chars) for follow-up probing.")
        return FollowUpResponse(
            should_follow_up=False,
            reason="Candidate answer is empty or too short for follow-up probing.",
            follow_up=None
        )

    # 5. Extract Previous Context in Session
    previous_answers = db.query(Answer).filter(
        Answer.session_id == answer.session_id
    ).order_by(Answer.created_at.asc()).all()

    prev_context: List[Dict[str, str]] = []
    for past_ans in previous_answers:
        if past_ans.id == answer_id:
            continue
        past_q_text = "Interview Question"
        past_main_q = db.query(InterviewQuestion).filter(InterviewQuestion.id == past_ans.question_id).first()
        if past_main_q:
            past_q_text = past_main_q.question_text
        else:
            past_session_q = db.query(SessionQuestion).filter(SessionQuestion.id == past_ans.question_id).first()
            if past_session_q:
                past_q_text = past_session_q.question_text

        prev_context.append({
            "q": past_q_text,
            "a": past_ans.answer_text or ""
        })

    # 6. Call AI Provider for Follow-up Decision
    interview_meta = {
        "job_role": interview.job_role or "Software Engineer",
        "interview_type": interview.interview_type or "Technical",
        "mode": interview.mode or "General",
        "domain": interview.domain or interview.interview_type or "General",
        "difficulty": interview.difficulty or "Medium",
        "experience_level": interview.experience_level or "2+"
    }

    selected_provider = provider_name or settings.AI_PROVIDER or "groq"
    ai_provider = get_ai_provider(provider_name=selected_provider, mock_mode=mock_mode)

    should_follow_up, reason, follow_up_q_text, follow_up_type = ai_provider.generate_follow_up(
        interview_meta=interview_meta,
        question_text=question_text,
        answer_text=ans_clean,
        previous_context=prev_context,
        follow_up_depth=current_depth
    )

    if not should_follow_up or not follow_up_q_text:
        return FollowUpResponse(
            should_follow_up=False,
            reason=reason,
            follow_up=None
        )

    # 7. Duplicate Question Prevention
    existing_session_questions = db.query(SessionQuestion).filter(
        SessionQuestion.session_id == answer.session_id
    ).all()

    all_asked_texts = [question_text.lower()] + [sq.question_text.lower() for sq in existing_session_questions]
    proposed_low = follow_up_q_text.lower().strip()

    if any(proposed_low in asked or asked in proposed_low for asked in all_asked_texts):
        logger.info(f"Rejected proposed follow-up question as duplicate of previously asked question.")
        return FollowUpResponse(
            should_follow_up=False,
            reason="Proposed follow-up question duplicates a previously asked question.",
            follow_up=None
        )

    # 8. Persist Follow-Up Question to PostgreSQL as SessionQuestion
    new_session_q = SessionQuestion(
        session_id=answer.session_id,
        interview_id=interview_id,
        parent_question_id=parent_q_id,
        question_text=follow_up_q_text,
        question_type="counter",
        follow_up_depth=current_depth + 1,
        question_order=main_q_order
    )

    db.add(new_session_q)
    db.commit()
    db.refresh(new_session_q)

    logger.info(f"Persisted adaptive follow-up question '{new_session_q.id}' (depth: {new_session_q.follow_up_depth})")

    follow_up_item = FollowUpItem(
        id=new_session_q.id,
        question_text=new_session_q.question_text,
        question_type="counter",
        follow_up_type=follow_up_type or "technical_depth",
        follow_up_depth=new_session_q.follow_up_depth,
        parent_question_id=parent_q_id,
        generation_provider=selected_provider
    )

    return FollowUpResponse(
        should_follow_up=True,
        reason=reason,
        follow_up=follow_up_item
    )
