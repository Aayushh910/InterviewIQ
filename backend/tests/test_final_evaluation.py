"""
Comprehensive test suite for Phase 12: Final Evaluation & Deterministic Scoring.
Validates:
- EvidenceAggregator: retrieves, validates, normalizes multi-source interview signals.
- DeterministicScoringEngine: pure mathematical scoring, 5 answer dimensions, visual/behavioral
  telemetry, reliability-aware weighting, dynamic weight renormalization for missing evidence.
- FinalEvaluator: idempotency, persistence in final_evaluations table, force_recalculate.
- CalculateFinalEvaluationTool: operational status, ToolRegistry discovery, context execution.
- HTTP API endpoints: POST / GET /api/v1/evaluation/sessions/{session_id}/final.
- Premature evaluation guards (unstarted session, no answers, unauthorized cross-user).
"""

import uuid
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from main import app
from app.core.database import SessionLocal
from app.tools.registry.registry import default_registry
from app.tools.base.context import ToolExecutionContext
from app.tools.final_evaluation.tool import CalculateFinalEvaluationTool
from app.tools.final_evaluation.schemas import CalculateFinalEvaluationInput
from app.models.final_evaluation import FinalEvaluation
from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.interview_question import InterviewQuestion
from app.models.answer import Answer
from app.models.answer_evaluation import AnswerEvaluation
from app.models.multimodal_evidence import MultimodalEvidence
from app.evaluation.config import SCORING_VERSION, CATEGORY_WEIGHTS, get_performance_category
from app.evaluation.schemas import (
    NormalizedAnswerEvidence,
    NormalizedVisualEvidence,
    NormalizedBehaviorEvidence,
    QuestionEvidenceBundle,
    AggregatedSessionEvidence,
)
from app.evaluation.evidence_aggregator import EvidenceAggregator
from app.evaluation.scoring_engine import DeterministicScoringEngine
from app.evaluation.evaluator import final_evaluator
from app.evaluation.exceptions import (
    SessionNotFoundError,
    UnauthorizedEvaluationError,
    SessionNotCompleteError,
    InsufficientEvidenceError,
)
from app.agents.interview.agent import InterviewAgent
from app.agents.interview.schemas import AgentTurnRequest, AgentAction

client = TestClient(app)


def helper_register_user(prefix: str = "eval_test") -> tuple[str, str]:
    """Helper to register a unique candidate user."""
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "EvaluationPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Eval Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    return data["access_token"], data["user"]["id"]


def helper_create_and_populate_session(
    db: Session,
    user_id: str,
    status: str = "completed",
    num_questions: int = 2,
    with_evaluations: bool = True,
    with_multimodal: bool = True,
) -> tuple[Interview, InterviewSession]:
    """Helper to create a real persistent session with questions, answers, evaluations, and multimodal telemetry."""
    # 1. Interview
    interview = Interview(
        user_id=user_id,
        title="Senior Python Backend Interview",
        job_role="Backend Engineer",
        domain="Backend",
        difficulty="Hard",
        interview_type="Technical",
        question_count=num_questions,
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    # 2. Session
    session = InterviewSession(
        interview_id=interview.id,
        status=status,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow() if status == "completed" else None,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 3. Questions, Answers, Evaluations
    for i in range(1, num_questions + 1):
        q = InterviewQuestion(
            interview_id=interview.id,
            question_text=f"Technical Question {i}: Explain database indexing and query optimization.",
            question_order=i,
            question_type="technical",
        )
        db.add(q)
        db.commit()
        db.refresh(q)

        ans = Answer(
            session_id=session.id,
            question_id=q.id,
            answer_text=(
                f"Answer {i}: Database indexes use B-Trees to provide O(log n) lookups. "
                "Composite indexes optimize queries filtering across multiple columns."
            ),
            started_at=datetime.utcnow(),
            submitted_at=datetime.utcnow(),
        )
        db.add(ans)
        db.commit()
        db.refresh(ans)

        if with_evaluations:
            eval_record = AnswerEvaluation(
                answer_id=ans.id,
                correctness_score=85.0 + i * 2,
                relevance_score=90.0,
                technical_depth_score=80.0 + i,
                completeness_score=85.0,
                clarity_score=90.0,
                overall_score=86.0 + i,
                strengths=["Accurate B-Tree explanation", "Clear query optimization terminology"],
                improvements=["Could mention hash index use-cases"],
                summary=f"Strong answer to question {i}.",
                evaluator_provider="heuristic",
            )
            db.add(eval_record)

        if with_multimodal:
            face_ev = MultimodalEvidence(
                session_id=session.id,
                question_id=q.id,
                answer_id=ans.id,
                evidence_type="face",
                status="available",
                confidence_score=0.95,
                raw_evidence={"face_detected": True, "position_quality": 0.88},
                derived_indicators={"face_presence_ratio": 0.96, "camera_alignment": 0.85},
                observations=["Maintained direct camera alignment."],
                recorded_at=datetime.utcnow(),
            )
            beh_ev = MultimodalEvidence(
                session_id=session.id,
                question_id=q.id,
                answer_id=ans.id,
                evidence_type="behavior",
                status="available",
                confidence_score=0.92,
                raw_evidence={"response_duration_seconds": 38.0, "pause_count": 3, "filler_word_count": 2},
                derived_indicators={"speaking_rate_wpm": 138.0, "speaking_ratio": 0.86},
                observations=["Optimal speaking pace of 138 WPM."],
                recorded_at=datetime.utcnow(),
            )
            db.add(face_ev)
            db.add(beh_ev)

    db.commit()
    db.refresh(session)
    return interview, session


# ─── 1. Evidence Aggregator Tests ─────────────────────────────────────────────

def test_aggregator_complete_evidence():
    """Verify aggregator collects and normalizes complete multi-source session signals."""
    _, user_id = helper_register_user("agg_complete")
    db: Session = SessionLocal()
    try:
        _, session = helper_create_and_populate_session(db, user_id=user_id, num_questions=2)
        evidence = EvidenceAggregator.aggregate_session_evidence(db, session_id=session.id, user_id=user_id)

        assert evidence.session_id == session.id
        assert evidence.total_questions == 2
        assert evidence.answered_questions_count == 2
        assert len(evidence.questions) == 2

        q1 = evidence.questions[0]
        assert q1.answer is not None
        assert q1.answer.has_evaluation is True
        assert q1.answer.correctness_score > 0
        assert q1.visual is not None
        assert q1.visual.face_detected is True
        assert q1.behavior is not None
        assert q1.behavior.speaking_rate_wpm > 0
    finally:
        db.close()


def test_aggregator_unstarted_session_rejected():
    """Verify aggregator rejects premature evaluation on an unstarted session."""
    _, user_id = helper_register_user("agg_unstarted")
    db: Session = SessionLocal()
    try:
        _, session = helper_create_and_populate_session(db, user_id=user_id, status="not_started", num_questions=1)
        with pytest.raises(SessionNotCompleteError):
            EvidenceAggregator.aggregate_session_evidence(db, session_id=session.id, user_id=user_id)
    finally:
        db.close()


def test_aggregator_unauthorized_access_rejected():
    """Verify aggregator rejects evaluation requests across different users."""
    _, user_id1 = helper_register_user("agg_user1")
    _, user_id2 = helper_register_user("agg_user2")
    db: Session = SessionLocal()
    try:
        _, session = helper_create_and_populate_session(db, user_id=user_id1, num_questions=1)
        with pytest.raises(UnauthorizedEvaluationError):
            EvidenceAggregator.aggregate_session_evidence(db, session_id=session.id, user_id=user_id2)
    finally:
        db.close()


# ─── 2. Deterministic Scoring Engine Tests ────────────────────────────────────

def test_scoring_engine_pure_determinism():
    """Verify identical evidence produces exact identical scores across repeated runs."""
    bundle = QuestionEvidenceBundle(
        question_id="q-1",
        question_text="Explain async/await in Python.",
        answer=NormalizedAnswerEvidence(
            question_id="q-1",
            question_text="Explain async/await in Python.",
            answer_id="ans-1",
            answer_text="async and await define coroutines managed by the event loop.",
            correctness_score=90.0,
            relevance_score=90.0,
            technical_depth_score=85.0,
            completeness_score=85.0,
            clarity_score=90.0,
            overall_answer_score=88.5,
            strengths=["Concise definition"],
            improvements=[],
        ),
        visual=NormalizedVisualEvidence(
            status="available",
            face_detected=True,
            face_presence_ratio=0.95,
            camera_alignment=0.88,
            position_quality=0.85,
            confidence_score=0.95,
            quality_rating="high",
        ),
        behavior=NormalizedBehaviorEvidence(
            status="available",
            duration_seconds=30.0,
            speaking_rate_wpm=135.0,
            pause_count=3,
            filler_word_count=1,
            speaking_ratio=0.85,
            confidence_score=0.95,
            quality_rating="high",
        ),
    )

    evidence = AggregatedSessionEvidence(
        session_id="sess-det-1",
        interview_id="int-1",
        user_id="user-1",
        session_status="completed",
        total_questions=1,
        answered_questions_count=1,
        questions=[bundle],
    )

    # Run scoring multiple times
    res1 = DeterministicScoringEngine.evaluate_session(evidence, evaluation_id="test-1")
    res2 = DeterministicScoringEngine.evaluate_session(evidence, evaluation_id="test-1")

    assert res1.overall_score == res2.overall_score
    assert res1.answer_quality_score == res2.answer_quality_score
    assert res1.communication_score == res2.communication_score
    assert res1.visual_presentation_score == res2.visual_presentation_score
    assert res1.performance_category == res2.performance_category
    assert res1.applied_weights == res2.applied_weights
    assert res1.summary == res2.summary


def test_scoring_engine_missing_evidence_renormalization():
    """Verify missing visual and behavioral telemetry dynamically renormalizes weights instead of scoring 0."""
    # Bundle with Answer ONLY (no camera or speech telemetry)
    bundle_ans_only = QuestionEvidenceBundle(
        question_id="q-text-only",
        question_text="Explain SQL ACID properties.",
        answer=NormalizedAnswerEvidence(
            question_id="q-text-only",
            question_text="Explain SQL ACID properties.",
            answer_id="ans-text-only",
            answer_text="Atomicity, Consistency, Isolation, Durability guarantee transaction reliability.",
            correctness_score=80.0,
            relevance_score=80.0,
            technical_depth_score=80.0,
            completeness_score=80.0,
            clarity_score=80.0,
            overall_answer_score=80.0,
        ),
        visual=None,
        behavior=None,
    )

    evidence = AggregatedSessionEvidence(
        session_id="sess-ans-only",
        interview_id="int-1",
        user_id="user-1",
        session_status="completed",
        total_questions=1,
        answered_questions_count=1,
        questions=[bundle_ans_only],
    )

    res = DeterministicScoringEngine.evaluate_session(evidence, evaluation_id="test-ans-only")

    # With no visual and no behavior evidence, Answer Quality weight must be 1.0 (100%)
    assert res.applied_weights["answer_quality"] == 1.0
    assert "visual_presentation" not in res.applied_weights
    assert "communication" not in res.applied_weights
    assert res.visual_presentation_score is None
    assert res.communication_score is None
    assert res.overall_score == 80.0, "Overall score must equal answer score when multimodal telemetry is missing"


def test_scoring_engine_performance_categories():
    """Verify standardized grade categories map correctly across score boundaries."""
    assert get_performance_category(95.0) == "Exceptional"
    assert get_performance_category(90.0) == "Exceptional"
    assert get_performance_category(85.0) == "Strong"
    assert get_performance_category(80.0) == "Strong"
    assert get_performance_category(75.0) == "Proficient"
    assert get_performance_category(70.0) == "Proficient"
    assert get_performance_category(65.0) == "Developing"
    assert get_performance_category(60.0) == "Developing"
    assert get_performance_category(55.0) == "Needs Improvement"
    assert get_performance_category(0.0) == "Needs Improvement"


# ─── 3. Final Evaluator Service & Idempotency Tests ────────────────────────────

def test_evaluator_service_persistence_and_idempotency():
    """Verify FinalEvaluator persists results and returns cached result idempotently without duplication."""
    _, user_id = helper_register_user("eval_idemp")
    db: Session = SessionLocal()
    try:
        _, session = helper_create_and_populate_session(db, user_id=user_id, num_questions=2)

        # 1. First evaluation: calculates and creates FinalEvaluation record
        res1 = final_evaluator.evaluate_interview_session(db, session_id=session.id, user_id=user_id)
        assert res1.overall_score > 0
        assert res1.performance_category in ["Exceptional", "Strong", "Proficient"]
        assert res1.scoring_version == SCORING_VERSION

        # Verify record exists in DB
        db_record = db.query(FinalEvaluation).filter(FinalEvaluation.session_id == session.id).first()
        assert db_record is not None
        assert db_record.id == res1.evaluation_id

        # 2. Second evaluation: idempotency returns existing without creating a duplicate row
        res2 = final_evaluator.evaluate_interview_session(db, session_id=session.id, user_id=user_id, force_recalculate=False)
        assert res2.evaluation_id == res1.evaluation_id
        assert res2.overall_score == res1.overall_score

        # Ensure only 1 record exists in DB for this session
        count = db.query(FinalEvaluation).filter(FinalEvaluation.session_id == session.id).count()
        assert count == 1

        # 3. Third evaluation: force_recalculate updates the existing row
        res3 = final_evaluator.evaluate_interview_session(db, session_id=session.id, user_id=user_id, force_recalculate=True)
        assert res3.evaluation_id == res1.evaluation_id
        count_after = db.query(FinalEvaluation).filter(FinalEvaluation.session_id == session.id).count()
        assert count_after == 1
    finally:
        db.close()


def test_evaluator_service_get_final_evaluation():
    """Verify get_final_evaluation retrieves stored evaluation correctly."""
    _, user_id = helper_register_user("eval_get")
    db: Session = SessionLocal()
    try:
        _, session = helper_create_and_populate_session(db, user_id=user_id, num_questions=1)
        created = final_evaluator.evaluate_interview_session(db, session_id=session.id, user_id=user_id)

        retrieved = final_evaluator.get_final_evaluation(db, session_id=session.id, user_id=user_id)
        assert retrieved is not None
        assert retrieved.evaluation_id == created.evaluation_id
        assert retrieved.overall_score == created.overall_score
    finally:
        db.close()


# ─── 4. Tool Registry & CalculateFinalEvaluationTool Tests ─────────────────────

def test_calculate_final_evaluation_tool_in_registry():
    """Verify CalculateFinalEvaluationTool is operational and exposed in ToolRegistry."""
    assert default_registry.has_tool("calculate_final_evaluation")
    tool = default_registry.get("calculate_final_evaluation")
    assert tool.is_future_contract is False

    # Operational tools exposed to agent (include_future=False) must include calculate_final_evaluation
    op_defs = default_registry.get_tool_definitions(include_future=False)
    op_names = [t["function"]["name"] for t in op_defs]
    assert "calculate_final_evaluation" in op_names
    assert "generate_interview_report" not in op_names  # Only report generation remains future contract


def test_calculate_final_evaluation_tool_execution():
    """Verify CalculateFinalEvaluationTool executes successfully via ToolExecutionContext."""
    _, user_id = helper_register_user("tool_eval_user")
    db: Session = SessionLocal()
    try:
        _, session = helper_create_and_populate_session(db, user_id=user_id, num_questions=2)

        tool = CalculateFinalEvaluationTool()
        context = ToolExecutionContext(db=db, user_id=user_id)
        params = CalculateFinalEvaluationInput(session_id=session.id)

        result = tool.execute(context, params)
        assert result.success is True
        data = result.data
        assert data["overall_score"] > 0
        assert data["performance_category"] in ["Exceptional", "Strong", "Proficient", "Developing"]
        assert len(data["category_scores"]) > 0
        assert data["scoring_version"] == "1.0"
    finally:
        db.close()


# ─── 5. HTTP API Endpoints Tests ───────────────────────────────────────────────

def test_http_calculate_and_get_final_evaluation():
    """Verify POST and GET /api/v1/evaluation/sessions/{session_id}/final API routes."""
    token, user_id = helper_register_user("http_eval_user")
    headers = {"Authorization": f"Bearer {token}"}
    db: Session = SessionLocal()
    try:
        _, session = helper_create_and_populate_session(db, user_id=user_id, num_questions=2)
        session_id = session.id
    finally:
        db.close()

    # 1. POST calculate final evaluation
    post_resp = client.post(
        f"/api/v1/evaluation/sessions/{session_id}/final",
        headers=headers,
        json={"force_recalculate": False}
    )
    assert post_resp.status_code == 200, post_resp.text
    eval_data = post_resp.json()
    assert eval_data["session_id"] == session_id
    assert eval_data["overall_score"] > 0
    assert "answer_quality_score" in eval_data
    assert "performance_category" in eval_data

    # 2. GET retrieved final evaluation
    get_resp = client.get(
        f"/api/v1/evaluation/sessions/{session_id}/final",
        headers=headers
    )
    assert get_resp.status_code == 200, get_resp.text
    retrieved_data = get_resp.json()
    assert retrieved_data["evaluation_id"] == eval_data["evaluation_id"]
    assert retrieved_data["overall_score"] == eval_data["overall_score"]


# ─── 6. InterviewAgent Final Evaluation Integration Tests ──────────────────────

def test_agent_invokes_calculate_final_evaluation():
    """Verify InterviewAgent can invoke calculate_final_evaluation on completed interview turn."""
    token, user_id = helper_register_user("agent_eval_user")
    headers = {"Authorization": f"Bearer {token}"}
    db: Session = SessionLocal()
    try:
        _, session = helper_create_and_populate_session(db, user_id=user_id, num_questions=2)
        session_id = session.id

        agent = InterviewAgent()
        req = AgentTurnRequest(
            session_id=session_id,
            user_message="All questions have been completed. Please calculate the final evaluation and conclude the session.",
            max_iterations=3,
        )

        response = agent.orchestrate_turn(
            db=db,
            user_id=user_id,
            request=req,
            provider_override="mock",
            mock_mode="mock_calculate_final_evaluation",
        )

        assert response.decision is not None
        assert "calculate_final_evaluation" in response.tools_executed
        assert response.decision.action == AgentAction.END_INTERVIEW
    finally:
        db.close()
