import logging
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session

from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.interview_question import InterviewQuestion
from app.models.session_question import SessionQuestion
from app.models.answer import Answer
from app.models.answer_evaluation import AnswerEvaluation
from app.schemas.session_state import (
    InterviewSessionState,
    SessionStatus,
    SessionStateUpdateRequest,
    AddQuestionRequest,
    AddAnswerRequest,
    AddFollowUpRequest,
    AddEvaluationReferenceRequest,
    SessionProgress,
)
from app.services.session_state.exceptions import (
    SessionNotFoundError,
    InvalidSessionStateError,
    DuplicateQuestionError,
    InvalidAnswerError,
)
from app.services.session_state.validator import (
    validate_session_id,
    validate_status_transition,
    validate_new_question,
    validate_new_answer,
)
from app.services.session_state.builder import build_session_state

logger = logging.getLogger(__name__)


class InterviewStateManager:
    """
    Core state manager providing authoritative session lifecycle operations,
    durable persistence in PostgreSQL, state transitions, validation, and progress tracking.
    """

    @staticmethod
    def create_session(db: Session, interview_id: str, user_id: str) -> InterviewSessionState:
        """
        Create a new interview practice session and return its initial state.
        """
        interview = db.query(Interview).filter(
            Interview.id == interview_id,
            Interview.user_id == user_id
        ).first()

        if not interview:
            raise SessionNotFoundError(f"Interview '{interview_id}' not found or unauthorized.")

        session_obj = InterviewSession(
            interview_id=interview_id,
            status=SessionStatus.NOT_STARTED.value,
        )
        db.add(session_obj)
        db.commit()
        db.refresh(session_obj)

        logger.info(f"Created interview session '{session_obj.id}' for interview '{interview_id}'")
        return build_session_state(db, session_obj.id, user_id, session_obj=session_obj)

    @staticmethod
    def initialize_session(
        db: Session,
        session_id: str,
        user_id: str,
        initial_questions: Optional[List[Dict[str, Any]]] = None
    ) -> InterviewSessionState:
        """
        Initialize an interview session, populating initial questions if provided,
        and transitioning status to in_progress if currently not_started.
        """
        validate_session_id(session_id)
        session_obj = db.query(InterviewSession).join(Interview).filter(
            InterviewSession.id == session_id,
            Interview.user_id == user_id
        ).first()

        if not session_obj:
            raise SessionNotFoundError(f"Session '{session_id}' not found or unauthorized.")

        if session_obj.status in [SessionStatus.COMPLETED.value, SessionStatus.ABANDONED.value, SessionStatus.EXPIRED.value]:
            raise InvalidSessionStateError(f"Cannot initialize a '{session_obj.status}' session.")

        # Seed initial questions if provided and none exist yet
        if initial_questions:
            existing_main_count = db.query(InterviewQuestion).filter(
                InterviewQuestion.interview_id == session_obj.interview_id
            ).count()

            if existing_main_count == 0:
                for idx, q_data in enumerate(initial_questions):
                    text = q_data.get("question_text") or q_data.get("text", "")
                    if text:
                        new_q = InterviewQuestion(
                            interview_id=session_obj.interview_id,
                            question_text=text,
                            question_order=q_data.get("question_order", idx + 1),
                            question_type=q_data.get("question_type", "technical")
                        )
                        db.add(new_q)

        from app.services.session_state.store import runtime_store
        # Transition status to in_progress
        if session_obj.status == SessionStatus.NOT_STARTED.value:
            session_obj.status = SessionStatus.IN_PROGRESS.value
            session_obj.started_at = datetime.utcnow()

        db.commit()
        db.refresh(session_obj)

        return build_session_state(db, session_id, user_id, session_obj=session_obj)

    @staticmethod
    def get_session_state(db: Session, session_id: str, user_id: str) -> InterviewSessionState:
        """
        Retrieve the current authoritative InterviewSessionState.
        """
        validate_session_id(session_id)
        return build_session_state(db, session_id, user_id)

    @staticmethod
    def update_session_state(
        db: Session,
        session_id: str,
        user_id: str,
        update_data: SessionStateUpdateRequest
    ) -> InterviewSessionState:
        """
        Update mutable session attributes such as status, active topic, or metadata.
        """
        validate_session_id(session_id)
        session_obj = db.query(InterviewSession).join(Interview).filter(
            InterviewSession.id == session_id,
            Interview.user_id == user_id
        ).first()

        if not session_obj:
            raise SessionNotFoundError(f"Session '{session_id}' not found or unauthorized.")

        from app.services.session_state.store import runtime_store
        if update_data.current_topic:
            runtime_store.set_meta(session_id, "current_topic", update_data.current_topic)
        if update_data.metadata:
            runtime_store.set_meta(session_id, "metadata", update_data.metadata)

        if update_data.status:
            validate_status_transition(session_obj.status, update_data.status)
            session_obj.status = update_data.status

            if update_data.status == SessionStatus.IN_PROGRESS.value and not session_obj.started_at:
                session_obj.started_at = datetime.utcnow()
            elif update_data.status in [SessionStatus.COMPLETED.value, SessionStatus.ABANDONED.value]:
                if not session_obj.completed_at:
                    session_obj.completed_at = datetime.utcnow()

        session_obj.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(session_obj)

        return build_session_state(db, session_id, user_id, session_obj=session_obj)

    @staticmethod
    def add_question(
        db: Session,
        session_id: str,
        user_id: str,
        data: AddQuestionRequest
    ) -> InterviewSessionState:
        """
        Append a new question to the session's interview.
        Validates duplicate avoidance and proper ordering.
        """
        validate_session_id(session_id)
        session_obj = db.query(InterviewSession).join(Interview).filter(
            InterviewSession.id == session_id,
            Interview.user_id == user_id
        ).first()

        if not session_obj:
            raise SessionNotFoundError(f"Session '{session_id}' not found or unauthorized.")

        if session_obj.status in [SessionStatus.COMPLETED.value, SessionStatus.ABANDONED.value, SessionStatus.EXPIRED.value]:
            raise InvalidSessionStateError(f"Cannot add question to '{session_obj.status}' session.")

        # Duplicate check across existing questions
        existing_main = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == session_obj.interview_id
        ).all()
        existing_session = db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session_id
        ).all()

        all_texts = [q.question_text for q in existing_main] + [sq.question_text for sq in existing_session]
        validate_new_question(all_texts, data.question_text)

        order = data.question_order
        if order is None:
            max_order = max([q.question_order for q in existing_main], default=0)
            order = max_order + 1

        new_question = InterviewQuestion(
            interview_id=session_obj.interview_id,
            question_text=data.question_text.strip(),
            question_order=order,
            question_type=data.question_type or "technical",
        )
        db.add(new_question)
        db.commit()

        logger.info(f"Added question '{new_question.id}' (order {order}) to interview '{session_obj.interview_id}'")
        return build_session_state(db, session_id, user_id, session_obj=session_obj)

    @staticmethod
    def add_answer(
        db: Session,
        session_id: str,
        user_id: str,
        data: AddAnswerRequest
    ) -> Tuple[InterviewSessionState, Answer]:
        """
        Record a candidate answer in the session state manager.
        Links answer to target question, updates timestamps, and auto-starts session if not_started.
        """
        validate_session_id(session_id)
        session_obj = db.query(InterviewSession).join(Interview).filter(
            InterviewSession.id == session_id,
            Interview.user_id == user_id
        ).first()

        if not session_obj:
            raise SessionNotFoundError(f"Session '{session_id}' not found or unauthorized.")

        # Valid question IDs in this session
        main_q_ids = [q.id for q in db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == session_obj.interview_id
        ).all()]
        session_q_ids = [sq.id for sq in db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session_id
        ).all()]
        all_valid_ids = main_q_ids + session_q_ids

        validate_new_answer(all_valid_ids, data.question_id, session_obj.status)

        # Auto-start if not started
        now = datetime.utcnow()
        if session_obj.status == SessionStatus.NOT_STARTED.value:
            session_obj.status = SessionStatus.IN_PROGRESS.value
            session_obj.started_at = now

        # Upsert answer record
        existing_answer = db.query(Answer).filter(
            Answer.session_id == session_id,
            Answer.question_id == data.question_id
        ).first()

        if existing_answer:
            existing_answer.answer_text = data.answer_text
            if data.started_at:
                existing_answer.started_at = data.started_at
            existing_answer.submitted_at = data.submitted_at or now
            existing_answer.updated_at = now
            saved_answer = existing_answer
        else:
            saved_answer = Answer(
                session_id=session_id,
                question_id=data.question_id,
                answer_text=data.answer_text,
                started_at=data.started_at or now,
                submitted_at=data.submitted_at or now,
            )
            db.add(saved_answer)

        session_obj.updated_at = now
        db.commit()
        db.refresh(saved_answer)

        updated_state = build_session_state(db, session_id, user_id, session_obj=session_obj)
        return updated_state, saved_answer

    @staticmethod
    def add_follow_up(
        db: Session,
        session_id: str,
        user_id: str,
        data: AddFollowUpRequest
    ) -> InterviewSessionState:
        """
        Record an adaptive counter/follow-up question into the session's question history.
        Enforces depth limits and prevents duplicates.
        """
        validate_session_id(session_id)
        session_obj = db.query(InterviewSession).join(Interview).filter(
            InterviewSession.id == session_id,
            Interview.user_id == user_id
        ).first()

        if not session_obj:
            raise SessionNotFoundError(f"Session '{session_id}' not found or unauthorized.")

        if session_obj.status in [SessionStatus.COMPLETED.value, SessionStatus.ABANDONED.value, SessionStatus.EXPIRED.value]:
            raise InvalidSessionStateError(f"Cannot add follow-up question to '{session_obj.status}' session.")

        # Determine parent question details
        parent_main = db.query(InterviewQuestion).filter(
            InterviewQuestion.id == data.parent_question_id,
            InterviewQuestion.interview_id == session_obj.interview_id
        ).first()

        order = 1
        if parent_main:
            order = parent_main.question_order
        else:
            parent_sess = db.query(SessionQuestion).filter(
                SessionQuestion.id == data.parent_question_id,
                SessionQuestion.session_id == session_id
            ).first()
            if parent_sess:
                order = parent_sess.question_order
            else:
                raise InvalidAnswerError(f"Parent question '{data.parent_question_id}' not found.")

        # Duplicate check
        existing_session_q = db.query(SessionQuestion).filter(
            SessionQuestion.session_id == session_id
        ).all()
        existing_main_q = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == session_obj.interview_id
        ).all()
        all_texts = [sq.question_text for sq in existing_session_q] + [mq.question_text for mq in existing_main_q]
        validate_new_question(all_texts, data.question_text)

        new_session_q = SessionQuestion(
            session_id=session_id,
            interview_id=session_obj.interview_id,
            parent_question_id=data.parent_question_id,
            question_text=data.question_text.strip(),
            question_type="counter",
            follow_up_depth=data.follow_up_depth,
            question_order=data.question_order or order,
        )
        db.add(new_session_q)
        db.commit()
        db.refresh(new_session_q)

        logger.info(f"Recorded follow-up question '{new_session_q.id}' (depth {data.follow_up_depth}) in session '{session_id}'")
        return build_session_state(db, session_id, user_id, session_obj=session_obj)

    @staticmethod
    def add_evaluation_reference(
        db: Session,
        session_id: str,
        user_id: str,
        data: AddEvaluationReferenceRequest
    ) -> InterviewSessionState:
        """
        Record or link an answer evaluation reference in the session state.
        """
        validate_session_id(session_id)
        session_obj = db.query(InterviewSession).join(Interview).filter(
            InterviewSession.id == session_id,
            Interview.user_id == user_id
        ).first()

        if not session_obj:
            raise SessionNotFoundError(f"Session '{session_id}' not found or unauthorized.")

        answer = db.query(Answer).filter(
            Answer.id == data.answer_id,
            Answer.session_id == session_id
        ).first()

        if not answer:
            raise InvalidAnswerError(f"Answer '{data.answer_id}' does not belong to session '{session_id}'.")

        existing_eval = db.query(AnswerEvaluation).filter(
            AnswerEvaluation.answer_id == data.answer_id
        ).first()

        now = datetime.utcnow()
        if existing_eval:
            existing_eval.overall_score = data.overall_score
            if data.relevance_score is not None:
                existing_eval.relevance_score = data.relevance_score
            if data.correctness_score is not None:
                existing_eval.correctness_score = data.correctness_score
            if data.completeness_score is not None:
                existing_eval.completeness_score = data.completeness_score
            if data.clarity_score is not None:
                existing_eval.clarity_score = data.clarity_score
            if data.technical_depth_score is not None:
                existing_eval.technical_depth_score = data.technical_depth_score
            if data.summary:
                existing_eval.summary = data.summary
            existing_eval.evaluator_provider = data.evaluator_provider
            existing_eval.updated_at = now
        else:
            new_eval = AnswerEvaluation(
                answer_id=data.answer_id,
                overall_score=data.overall_score,
                relevance_score=data.relevance_score if data.relevance_score is not None else data.overall_score,
                correctness_score=data.correctness_score if data.correctness_score is not None else data.overall_score,
                completeness_score=data.completeness_score if data.completeness_score is not None else data.overall_score,
                clarity_score=data.clarity_score if data.clarity_score is not None else data.overall_score,
                technical_depth_score=data.technical_depth_score if data.technical_depth_score is not None else data.overall_score,
                summary=data.summary or "Evaluation recorded.",
                evaluator_provider=data.evaluator_provider,
                strengths=[],
                improvements=[],
            )
            db.add(new_eval)

        db.commit()
        return build_session_state(db, session_id, user_id, session_obj=session_obj)

    @staticmethod
    def update_progress(db: Session, session_id: str, user_id: str) -> SessionProgress:
        """
        Compute and return the current progress metrics for the session.
        """
        state = build_session_state(db, session_id, user_id)
        return state.progress

    @staticmethod
    def update_status(
        db: Session,
        session_id: str,
        user_id: str,
        new_status: str
    ) -> InterviewSessionState:
        """
        Transition session status with validation and milestone timestamps.
        """
        validate_session_id(session_id)
        session_obj = db.query(InterviewSession).join(Interview).filter(
            InterviewSession.id == session_id,
            Interview.user_id == user_id
        ).first()

        if not session_obj:
            raise SessionNotFoundError(f"Session '{session_id}' not found or unauthorized.")

        validate_status_transition(session_obj.status, new_status)

        target = new_status.lower().strip()
        now = datetime.utcnow()

        if target == SessionStatus.IN_PROGRESS.value and not session_obj.started_at:
            session_obj.started_at = now
        elif target in [SessionStatus.COMPLETED.value, SessionStatus.ABANDONED.value, SessionStatus.EXPIRED.value]:
            if not session_obj.completed_at:
                session_obj.completed_at = now

        session_obj.status = target
        session_obj.updated_at = now
        db.commit()
        db.refresh(session_obj)

        logger.info(f"Transitioned session '{session_id}' status to '{target}'")
        return build_session_state(db, session_id, user_id, session_obj=session_obj)

    @staticmethod
    def end_session(
        db: Session,
        session_id: str,
        user_id: str,
        reason: str = "completed"
    ) -> InterviewSessionState:
        """
        Finalize and conclude an interview session.
        Idempotent if already in a terminal state.
        """
        validate_session_id(session_id)
        session_obj = db.query(InterviewSession).join(Interview).filter(
            InterviewSession.id == session_id,
            Interview.user_id == user_id
        ).first()

        if not session_obj:
            raise SessionNotFoundError(f"Session '{session_id}' not found or unauthorized.")

        if session_obj.status in [SessionStatus.COMPLETED.value, SessionStatus.ABANDONED.value, SessionStatus.EXPIRED.value]:
            return build_session_state(db, session_id, user_id, session_obj=session_obj)

        target_status = SessionStatus.COMPLETED.value
        if reason.lower() in ["abandoned", "quit", "cancelled"]:
            target_status = SessionStatus.ABANDONED.value
        elif reason.lower() in ["expired", "timeout"]:
            target_status = SessionStatus.EXPIRED.value

        validate_status_transition(session_obj.status, target_status)

        now = datetime.utcnow()
        session_obj.status = target_status
        session_obj.completed_at = now
        session_obj.updated_at = now

        db.commit()
        db.refresh(session_obj)

        logger.info(f"Ended session '{session_id}' with status '{target_status}'")
        return build_session_state(db, session_id, user_id, session_obj=session_obj)


# Module-level singleton instance for clean service imports
session_state_manager = InterviewStateManager()
