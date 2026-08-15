import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.answer import Answer
from app.models.answer_evaluation import AnswerEvaluation
from app.models.interview_question import InterviewQuestion
from app.models.session_question import SessionQuestion
from app.schemas.evaluation import AnswerEvaluationRequest, AnswerEvaluationResponse
from app.ai.evaluation.answer import evaluator_instance

logger = logging.getLogger(__name__)


def evaluate_answer(
    db: Session,
    answer_id: str,
    user_id: str,
    override_provider: Optional[str] = None
) -> AnswerEvaluationResponse:
    """
    Validate answer ownership, retrieve question & interview context, execute structured answer evaluation,
    persist/update AnswerEvaluation record in PostgreSQL (preventing duplicates), and return evaluation schema.
    """
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise KeyError("Answer not found")

    session = answer.session
    if not session or session.interview.user_id != user_id:
        raise KeyError("Answer not found or unauthorized")

    interview = session.interview

    # 1. Resolve Question Text
    question_text = ""
    main_q = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == answer.question_id,
        InterviewQuestion.interview_id == session.interview_id
    ).first()

    if main_q:
        question_text = main_q.question_text
    else:
        session_q = db.query(SessionQuestion).filter(
            SessionQuestion.id == answer.question_id,
            SessionQuestion.session_id == session.id
        ).first()

        if session_q:
            question_text = session_q.question_text

    # 2. Build Interview Context Metadata
    meta = {
        "interview_type": interview.interview_type,
        "domain": interview.domain,
        "difficulty": interview.difficulty,
        "experience_level": interview.experience_level,
        "mode": interview.mode
    }

    # 3. Execute AI Evaluation Engine
    logger.info(f"Initiating evaluation for answer_id '{answer_id}' (User '{user_id}')")
    eval_res = evaluator_instance.evaluate(
        question_text=question_text,
        answer_text=answer.answer_text or "",
        interview_meta=meta,
        override_provider=override_provider
    )

    # 4. Save or Update AnswerEvaluation in PostgreSQL
    existing_eval = db.query(AnswerEvaluation).filter(
        AnswerEvaluation.answer_id == answer_id
    ).first()

    now = datetime.utcnow()
    if existing_eval:
        existing_eval.relevance_score = eval_res["relevance_score"]
        existing_eval.correctness_score = eval_res["correctness_score"]
        existing_eval.completeness_score = eval_res["completeness_score"]
        existing_eval.clarity_score = eval_res["clarity_score"]
        existing_eval.technical_depth_score = eval_res["technical_depth_score"]
        existing_eval.overall_score = eval_res["overall_score"]
        existing_eval.strengths = eval_res["strengths"]
        existing_eval.improvements = eval_res["improvements"]
        existing_eval.summary = eval_res["summary"]
        existing_eval.evaluator_provider = eval_res["evaluator_provider"]
        existing_eval.updated_at = now
        db.commit()
        db.refresh(existing_eval)
        target_record = existing_eval
    else:
        new_eval = AnswerEvaluation(
            answer_id=answer_id,
            relevance_score=eval_res["relevance_score"],
            correctness_score=eval_res["correctness_score"],
            completeness_score=eval_res["completeness_score"],
            clarity_score=eval_res["clarity_score"],
            technical_depth_score=eval_res["technical_depth_score"],
            overall_score=eval_res["overall_score"],
            strengths=eval_res["strengths"],
            improvements=eval_res["improvements"],
            summary=eval_res["summary"],
            evaluator_provider=eval_res["evaluator_provider"]
        )
        db.add(new_eval)
        db.commit()
        db.refresh(new_eval)
        target_record = new_eval

    return AnswerEvaluationResponse.model_validate(target_record)


def evaluate_direct_answer(
    req: AnswerEvaluationRequest,
    user_id: str,
    db: Optional[Session] = None
) -> AnswerEvaluationResponse:
    """
    Evaluates direct Q&A payload requests (with optional persistence if answer_id is provided).
    """
    if req.answer_id and db is not None:
        return evaluate_answer(db, answer_id=req.answer_id, user_id=user_id, override_provider=req.provider)

    meta = {
        "interview_type": req.interview_type or "Technical",
        "domain": req.domain or "Software Engineering",
        "difficulty": req.difficulty or "Medium",
        "job_role": req.job_role,
        "expected_topics": req.expected_topics or [],
        "mock_mode": req.mock_mode
    }

    eval_res = evaluator_instance.evaluate(
        question_text=req.question or "",
        answer_text=req.answer or "",
        interview_meta=meta,
        override_provider=req.provider
    )

    return AnswerEvaluationResponse(
        id=None,
        answer_id=req.answer_id,
        relevance=eval_res["relevance_score"],
        correctness=eval_res["correctness_score"],
        completeness=eval_res["completeness_score"],
        clarity=eval_res["clarity_score"],
        technical_depth=eval_res["technical_depth_score"],
        relevance_score=eval_res["relevance_score"],
        correctness_score=eval_res["correctness_score"],
        completeness_score=eval_res["completeness_score"],
        clarity_score=eval_res["clarity_score"],
        technical_depth_score=eval_res["technical_depth_score"],
        communication_score=eval_res["communication_score"],
        confidence_score=eval_res["confidence_score"],
        overall_score=eval_res["overall_score"],
        strengths=eval_res["strengths"],
        improvements=eval_res["improvements"],
        summary=eval_res["summary"],
        evaluator_provider=eval_res["evaluator_provider"],
        created_at=datetime.utcnow()
    )
