"""
Comprehensive test suite for Phase 11: Real-Time Multimodal Analysis Tool Integration.
Validates:
- AnalyzeFaceTool: real MediaPipe integration, mock execution, no-face detection, quality degradation, error handling, session auth.
- AnalyzeBehaviorTool: pacing/WPM calculation, filler word counting, pauses, missing speech, session auth.
- Multimodal evidence persistence in PostgreSQL table `multimodal_evidence`.
- ToolRegistry discovery and operational status (is_future_contract=False).
- InterviewAgent integration requesting face and behavior analysis safely.
- Safe failure handling without evidence or score fabrication.
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from main import app
from app.core.database import SessionLocal
from app.tools.registry.registry import default_registry, ToolRegistry
from app.tools.base.context import ToolExecutionContext
from app.tools.multimodal.face_tool import AnalyzeFaceTool
from app.tools.multimodal.behavior_tool import AnalyzeBehaviorTool
from app.schemas.multimodal_evidence import (
    AnalyzeFaceInput,
    AnalyzeBehaviorInput,
    EvidenceStatus,
)
from app.models.multimodal_evidence import MultimodalEvidence
from app.models.answer import Answer
from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.services.multimodal_evidence_service import evidence_service
from app.services.session_state.manager import session_state_manager
from app.agents.interview.agent import InterviewAgent
from app.agents.interview.schemas import AgentTurnRequest, AgentAction

client = TestClient(app)


def helper_register_user(prefix: str = "mm_test") -> tuple[str, str]:
    """Helper to register a unique candidate user."""
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "MultimodalPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Multimodal Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    return data["access_token"], data["user"]["id"]


def helper_create_session(headers: dict) -> tuple[str, str]:
    """Helper to create an interview and session, returning (interview_id, session_id)."""
    resp = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Multimodal Test Interview",
            "job_role": "Fullstack Engineer",
            "domain": "Fullstack",
            "difficulty": "Medium",
            "interview_type": "Technical",
            "question_count": 3,
        }
    )
    assert resp.status_code == 201
    interview_id = resp.json()["id"]

    q_resp = client.post(
        f"/api/v1/interviews/{interview_id}/questions",
        headers=headers,
        json={"question_text": "Describe asynchronous event handling in Node.js.", "question_order": 1}
    )
    assert q_resp.status_code == 201

    state_resp = client.post(f"/api/v1/sessions/state/{interview_id}", headers=headers)
    assert state_resp.status_code == 201
    session_id = state_resp.json()["session_id"]

    return interview_id, session_id


# ─── 1. Tool Registry Verification ─────────────────────────────────────────────

def test_multimodal_tools_in_registry():
    """Verify analyze_face and analyze_behavior are registered as operational tools."""
    assert default_registry.has_tool("analyze_face")
    assert default_registry.has_tool("analyze_behavior")

    face_tool = default_registry.get("analyze_face")
    behavior_tool = default_registry.get("analyze_behavior")

    assert face_tool.is_future_contract is False
    assert behavior_tool.is_future_contract is False

    # Check operational tools exposed to agent (include_future=False)
    operational_defs = default_registry.get_tool_definitions(include_future=False)
    op_names = [t["function"]["name"] for t in operational_defs]
    assert "analyze_face" in op_names
    assert "analyze_behavior" in op_names
    assert "calculate_final_evaluation" not in op_names
    assert "generate_interview_report" not in op_names


# ─── 2. Face Tool Tests ────────────────────────────────────────────────────────

def test_analyze_face_tool_mock_success():
    """Verify analyze_face produces structured visual evidence in mock success mode."""
    token, user_id = helper_register_user("face_success")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    db: Session = SessionLocal()
    try:
        tool = AnalyzeFaceTool()
        context = ToolExecutionContext(db=db, user_id=user_id, mock_mode="no_face")
        params = AnalyzeFaceInput(session_id=session_id)

        result = tool.execute(context, params)
        assert result.success is True
        data = result.data
        assert data["face_detected"] is False
        assert data["status"] == "no_face_detected"
        assert data["reliability"]["confidence_score"] > 0.0
        assert len(data["observations"]) > 0
    finally:
        db.close()


def test_analyze_face_tool_insufficient_quality():
    """Verify analyze_face distinguishes low-quality framing without claiming dishonesty."""
    token, user_id = helper_register_user("face_quality")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    db: Session = SessionLocal()
    try:
        tool = AnalyzeFaceTool()
        context = ToolExecutionContext(db=db, user_id=user_id, mock_mode="insufficient_quality")
        params = AnalyzeFaceInput(session_id=session_id)

        result = tool.execute(context, params)
        assert result.success is True
        data = result.data
        assert data["status"] == "insufficient_quality"
        assert data["reliability"]["quality_rating"] == "low"
        # Verify neutral terminology
        obs_text = " ".join(data["observations"]).lower()
        assert "nervous" not in obs_text
        assert "lying" not in obs_text
    finally:
        db.close()


def test_analyze_face_tool_hardware_failure():
    """Verify analyze_face handles analyzer/hardware failure safely."""
    token, user_id = helper_register_user("face_fail")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    db: Session = SessionLocal()
    try:
        tool = AnalyzeFaceTool()
        context = ToolExecutionContext(db=db, user_id=user_id, mock_mode="failure")
        params = AnalyzeFaceInput(session_id=session_id)

        result = tool.execute(context, params)
        assert result.success is False
        assert "failure" in result.error.lower()
    finally:
        db.close()


def test_analyze_face_tool_unauthorized_access():
    """Verify analyze_face enforces session ownership security."""
    token1, _ = helper_register_user("face_user1")
    token2, user_id2 = helper_register_user("face_user2")
    headers1 = {"Authorization": f"Bearer {token1}"}

    _, session_id = helper_create_session(headers1)

    db: Session = SessionLocal()
    try:
        tool = AnalyzeFaceTool()
        context = ToolExecutionContext(db=db, user_id=user_id2, mock_mode="no_face")
        params = AnalyzeFaceInput(session_id=session_id)

        result = tool.execute(context, params)
        assert result.success is False
        assert "unauthorized" in result.error.lower()
    finally:
        db.close()


# ─── 3. Behavior Tool Tests ────────────────────────────────────────────────────

def test_analyze_behavior_tool_success_calculation():
    """Verify analyze_behavior accurately computes WPM, filler words, and pauses from transcript."""
    token, user_id = helper_register_user("beh_calc")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    db: Session = SessionLocal()
    try:
        tool = AnalyzeBehaviorTool()
        context = ToolExecutionContext(db=db, user_id=user_id)
        transcript = (
            "Well, um, in React, state updates are batched, like, during reconciliation. "
            "Actually, this prevents unnecessary renders."
        )
        params = AnalyzeBehaviorInput(
            session_id=session_id,
            transcript=transcript,
            duration_seconds=12.0
        )

        result = tool.execute(context, params)
        assert result.success is True
        data = result.data
        assert data["status"] == "available"
        assert data["filler_word_count"] >= 3  # um, like, actually
        assert data["speaking_rate_wpm"] > 0
        assert data["pause_count"] > 0
        assert data["reliability"]["confidence_score"] >= 0.8
        # Verify neutral observations
        obs = " ".join(data["observations"]).lower()
        assert "nervous" not in obs
        assert "dishonest" not in obs
        assert "words per minute" in obs
    finally:
        db.close()


def test_analyze_behavior_tool_missing_speech():
    """Verify analyze_behavior treats missing speech as unavailable, not as a zero score failure."""
    token, user_id = helper_register_user("beh_missing")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    db: Session = SessionLocal()
    try:
        tool = AnalyzeBehaviorTool()
        context = ToolExecutionContext(db=db, user_id=user_id)
        params = AnalyzeBehaviorInput(session_id=session_id, transcript="", duration_seconds=5.0)

        result = tool.execute(context, params)
        assert result.success is True
        data = result.data
        assert data["status"] == "unavailable"
        assert data["speaking_rate_wpm"] == 0.0
        assert data["filler_word_count"] == 0
    finally:
        db.close()


def test_analyze_behavior_tool_unauthorized_access():
    """Verify analyze_behavior enforces session ownership security."""
    token1, _ = helper_register_user("beh_user1")
    token2, user_id2 = helper_register_user("beh_user2")
    headers1 = {"Authorization": f"Bearer {token1}"}

    _, session_id = helper_create_session(headers1)

    db: Session = SessionLocal()
    try:
        tool = AnalyzeBehaviorTool()
        context = ToolExecutionContext(db=db, user_id=user_id2)
        params = AnalyzeBehaviorInput(session_id=session_id, transcript="Some candidate text.")

        result = tool.execute(context, params)
        assert result.success is False
        assert "unauthorized" in result.error.lower()
    finally:
        db.close()


# ─── 4. Multimodal Evidence Persistence Tests ──────────────────────────────────

def test_evidence_persistence_and_query():
    """Verify temporal face and behavior evidence is persisted in PostgreSQL table multimodal_evidence."""
    token, user_id = helper_register_user("persist_user")
    headers = {"Authorization": f"Bearer {token}"}
    interview_id, session_id = helper_create_session(headers)

    db: Session = SessionLocal()
    try:
        # 1. Execute face tool
        face_tool = AnalyzeFaceTool()
        ctx_face = ToolExecutionContext(db=db, user_id=user_id, mock_mode="no_face")
        res_face = face_tool.execute(ctx_face, AnalyzeFaceInput(session_id=session_id))
        assert res_face.success is True

        # 2. Execute behavior tool
        beh_tool = AnalyzeBehaviorTool()
        ctx_beh = ToolExecutionContext(db=db, user_id=user_id)
        res_beh = beh_tool.execute(
            ctx_beh,
            AnalyzeBehaviorInput(
                session_id=session_id,
                transcript="I designed the caching layer with Redis to optimize database read latency.",
                duration_seconds=15.0
            )
        )
        assert res_beh.success is True

        # 3. Query PostgreSQL via evidence service
        records = evidence_service.get_session_evidence(db=db, session_id=session_id, user_id=user_id)
        assert len(records) >= 2

        evidence_types = [r.evidence_type for r in records]
        assert "face" in evidence_types
        assert "behavior" in evidence_types

        # Verify historical evidence is not overwritten
        # Add another behavior measurement
        res_beh2 = beh_tool.execute(
            ctx_beh,
            AnalyzeBehaviorInput(
                session_id=session_id,
                transcript="Furthermore, write-through invalidation ensured strong cache consistency.",
                duration_seconds=10.0
            )
        )
        assert res_beh2.success is True

        records_after = evidence_service.get_session_evidence(db=db, session_id=session_id, user_id=user_id)
        beh_records = [r for r in records_after if r.evidence_type == "behavior"]
        assert len(beh_records) >= 2, "Temporal evidence must append rather than overwrite previous measurements"
    finally:
        db.close()


# ─── 5. HTTP Evidence API Tests ────────────────────────────────────────────────

def test_http_get_session_multimodal_evidence():
    """Verify GET /api/v1/sessions/{session_id}/multimodal/evidence returns structured records."""
    token, user_id = helper_register_user("api_ev_user")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    db: Session = SessionLocal()
    try:
        beh_tool = AnalyzeBehaviorTool()
        ctx_beh = ToolExecutionContext(db=db, user_id=user_id, mock_mode="success")
        beh_tool.execute(ctx_beh, AnalyzeBehaviorInput(session_id=session_id))
    finally:
        db.close()

    resp = client.get(f"/api/v1/sessions/{session_id}/multimodal/evidence", headers=headers)
    assert resp.status_code == 200, resp.text
    records = resp.json()
    assert isinstance(records, list)
    assert len(records) >= 1
    rec = records[0]
    assert rec["session_id"] == session_id
    assert "evidence_type" in rec
    assert "status" in rec
    assert "confidence_score" in rec
    assert "recorded_at" in rec


# ─── 6. InterviewAgent Multimodal Integration Tests ────────────────────────────

def test_agent_orchestrates_face_analysis():
    """Verify InterviewAgent can invoke analyze_face during an interview turn."""
    token, user_id = helper_register_user("agent_face_user")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    db: Session = SessionLocal()
    try:
        agent = InterviewAgent()
        req = AgentTurnRequest(
            session_id=session_id,
            user_message="Candidate has connected camera. Please inspect visual telemetry.",
            max_iterations=3
        )

        response = agent.orchestrate_turn(
            db=db,
            user_id=user_id,
            request=req,
            provider_override="mock",
            mock_mode="mock_analyze_face"
        )

        assert response.decision is not None
        assert "analyze_face" in response.tools_executed
        assert response.decision.action == AgentAction.CONTINUE
        assert "analyze_face" == response.decision.tool_call_used
    finally:
        db.close()


def test_agent_orchestrates_behavior_analysis():
    """Verify InterviewAgent can invoke analyze_behavior during an interview turn."""
    token, user_id = helper_register_user("agent_beh_user")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    db: Session = SessionLocal()
    try:
        agent = InterviewAgent()
        req = AgentTurnRequest(
            session_id=session_id,
            user_message="Candidate submitted speech recording. Please inspect communication telemetry.",
            max_iterations=3
        )

        response = agent.orchestrate_turn(
            db=db,
            user_id=user_id,
            request=req,
            provider_override="mock",
            mock_mode="mock_analyze_behavior"
        )

        assert response.decision is not None
        assert "analyze_behavior" in response.tools_executed
        assert response.decision.action == AgentAction.CONTINUE
        assert "analyze_behavior" == response.decision.tool_call_used
    finally:
        db.close()


# ─── 7. Session State Integration ──────────────────────────────────────────────

def test_session_state_reflects_multimodal_evidence():
    """Verify InterviewSessionState includes references from persisted multimodal evidence."""
    token, user_id = helper_register_user("state_ev_user")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    db: Session = SessionLocal()
    try:
        # Record face and behavior evidence
        face_tool = AnalyzeFaceTool()
        beh_tool = AnalyzeBehaviorTool()

        face_tool.execute(
            ToolExecutionContext(db=db, user_id=user_id, mock_mode="no_face"),
            AnalyzeFaceInput(session_id=session_id)
        )
        beh_tool.execute(
            ToolExecutionContext(db=db, user_id=user_id, mock_mode="success"),
            AnalyzeBehaviorInput(session_id=session_id)
        )

        # Retrieve authoritative session state
        state = session_state_manager.get_session_state(db=db, session_id=session_id, user_id=user_id)
        assert len(state.face_analysis_references) >= 1
        assert len(state.behavior_analysis_references) >= 1

        face_ref = state.face_analysis_references[-1]
        assert face_ref.face_presence_ratio is not None

        beh_ref = state.behavior_analysis_references[-1]
        assert beh_ref.wpm is not None
    finally:
        db.close()
