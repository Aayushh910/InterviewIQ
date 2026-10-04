"""
Comprehensive test suite for Phase 10: Groq Interview Agent & Tool Orchestrator.
Uses MockProvider for deterministic, zero-cost, network-isolated validation.
"""

import uuid
import pytest
from fastapi.testclient import TestClient

from main import app
from app.agents.interview import (
    InterviewAgent,
    AgentAction,
    AgentDecision,
    AgentTurnRequest,
    AgentTurnResponse,
    interview_agent,
)
from app.tools.registry.registry import default_registry
from app.ai.providers.mock_provider import MockProvider

client = TestClient(app)


def helper_register_user(prefix: str = "agent_test") -> tuple[str, str]:
    """Register a test user and return (token, user_id)."""
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "AgentTestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Agent Test Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    return data["access_token"], data["user"]["id"]


def helper_create_session(headers: dict) -> tuple[str, str]:
    """Create an interview and session, returning (interview_id, session_id)."""
    resp = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Agent Orchestrator Test Interview",
            "job_role": "Frontend Engineer",
            "domain": "Frontend",
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
        json={"question_text": "Explain React's Virtual DOM reconciliation diffing algorithm.", "question_order": 1}
    )
    assert q_resp.status_code == 201
    q_data = q_resp.json()

    state_resp = client.post(f"/api/v1/sessions/state/{interview_id}", headers=headers)
    assert state_resp.status_code == 201
    session_id = state_resp.json()["session_id"]

    return interview_id, session_id


# ─── 1. Agent Initialization & Tool Discovery ─────────────────────────────────

def test_agent_initialization_and_exposed_tools():
    """Verify InterviewAgent exposes only operational tools and hides future contracts."""
    agent = InterviewAgent()
    exposed = agent.get_exposed_tools()
    tool_names = [t["function"]["name"] for t in exposed]

    # Must expose the 5 Phase 9 operational tools
    expected_operational = [
        "generate_interview_question",
        "generate_follow_up_question",
        "evaluate_answer",
        "get_interview_state",
        "update_interview_state",
    ]
    for op_tool in expected_operational:
        assert op_tool in tool_names, f"Expected operational tool '{op_tool}' missing from agent"

    # Must NOT expose future placeholder tools
    forbidden_future = [
        "analyze_face",
        "analyze_behavior",
        "calculate_final_evaluation",
        "generate_interview_report",
    ]
    for future_tool in forbidden_future:
        assert future_tool not in tool_names, f"Future tool '{future_tool}' was improperly exposed to agent"


def test_agent_capabilities_endpoint():
    """Verify GET /api/v1/agent/capabilities endpoint."""
    token, _ = helper_register_user("cap_test")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/agent/capabilities", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["agent_name"] == "InterviewIQ Groq Interview Agent"
    assert data["provider"] == "Groq"
    assert data["future_contracts_exposed"] is False
    assert data["hard_iteration_limit"] == 4
    assert "generate_interview_question" in data["operational_tools"]
    assert "analyze_face" not in data["operational_tools"]


# ─── 2. Question Generation Flow ──────────────────────────────────────────────

def test_agent_question_generation_flow():
    """Verify agent invokes generate_interview_question tool and returns ASK_QUESTION decision."""
    token, _ = helper_register_user("qgen_test")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    payload = {
        "session_id": session_id,
        "user_message": "Candidate is ready to start. Generate the next question.",
    }

    resp = client.post(
        "/api/v1/agent/orchestrate?provider_override=mock&mock_mode=success",
        headers=headers,
        json=payload
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["session_id"] == session_id
    assert data["decision"]["action"] == "ASK_QUESTION"
    assert "generate_interview_question" in data["tools_executed"]
    assert data["fallback_applied"] is False


# ─── 3. Answer Evaluation Flow ────────────────────────────────────────────────

def test_agent_answer_evaluation_flow():
    """Verify candidate answer triggers evaluate_answer tool and state synchronization."""
    token, _ = helper_register_user("ans_test")
    headers = {"Authorization": f"Bearer {token}"}
    interview_id, session_id = helper_create_session(headers)

    # Retrieve current question ID
    st_resp = client.get(f"/api/v1/sessions/{session_id}/state", headers=headers)
    q_id = st_resp.json()["current_question"]["question_id"]

    payload = {
        "session_id": session_id,
        "question_id": q_id,
        "candidate_answer": "React creates a lightweight in-memory tree copy. When state updates, it diffs the virtual DOM with the previous snapshot and updates changed DOM nodes.",
        "duration_seconds": 35.0,
    }

    resp = client.post(
        "/api/v1/agent/orchestrate?provider_override=mock&mock_mode=success",
        headers=headers,
        json=payload
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["decision"]["action"] in ["CONTINUE", "ASK_QUESTION", "FOLLOW_UP"]
    assert "evaluate_answer" in data["tools_executed"]
    assert data["fallback_applied"] is False


# ─── 4. Follow-Up Flow ────────────────────────────────────────────────────────

def test_agent_follow_up_generation_flow():
    """Verify agent can execute evaluate_answer and generate_follow_up_question sequentially."""
    token, _ = helper_register_user("fu_test")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    st_resp = client.get(f"/api/v1/sessions/{session_id}/state", headers=headers)
    q_id = st_resp.json()["current_question"]["question_id"]

    payload = {
        "session_id": session_id,
        "question_id": q_id,
        "candidate_answer": "Virtual DOM uses a diffing algorithm.",
    }

    resp = client.post(
        "/api/v1/agent/orchestrate?provider_override=mock&mock_mode=follow_up",
        headers=headers,
        json=payload
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["decision"]["action"] == "FOLLOW_UP"
    assert "evaluate_answer" in data["tools_executed"]
    assert "generate_follow_up_question" in data["tools_executed"]
    assert data["fallback_applied"] is False


# ─── 5. Loop Safety & Hard Max Iteration Limit ─────────────────────────────────

def test_agent_loop_safety_prevents_infinite_loop():
    """Verify executor enforces max_iterations limit when model loops continuously."""
    token, _ = helper_register_user("loop_test")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    payload = {
        "session_id": session_id,
        "user_message": "Continue",
        "max_iterations": 3,
    }

    resp = client.post(
        "/api/v1/agent/orchestrate?provider_override=mock&mock_mode=infinite_loop",
        headers=headers,
        json=payload
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["iterations_count"] == 3
    assert data["fallback_applied"] is True
    assert "Max iterations exceeded" in data["error"]
    assert data["decision"]["action"] in ["CONTINUE", "END_INTERVIEW"]


# ─── 6. AI Provider Failure & Fallback Handling ───────────────────────────────

def test_agent_provider_timeout_fallback():
    """Verify timeout from AI provider triggers safe fallback without crashing."""
    token, _ = helper_register_user("to_test")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    payload = {"session_id": session_id}

    resp = client.post(
        "/api/v1/agent/orchestrate?provider_override=mock&mock_mode=timeout",
        headers=headers,
        json=payload
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["fallback_applied"] is True
    assert "timeout" in data["error"].lower()
    assert data["decision"]["action"] in ["CONTINUE", "END_INTERVIEW"]


def test_agent_provider_rate_limit_fallback():
    """Verify rate limit from AI provider triggers safe fallback."""
    token, _ = helper_register_user("rl_test")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    payload = {"session_id": session_id}

    resp = client.post(
        "/api/v1/agent/orchestrate?provider_override=mock&mock_mode=rate_limit",
        headers=headers,
        json=payload
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["fallback_applied"] is True
    assert "rate limit" in data["error"].lower()


def test_agent_malformed_response_handling():
    """Verify unstructured/malformed output from LLM is gracefully wrapped into CONTINUE decision."""
    token, _ = helper_register_user("mal_test")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    payload = {"session_id": session_id}

    resp = client.post(
        "/api/v1/agent/orchestrate?provider_override=mock&mock_mode=malformed",
        headers=headers,
        json=payload
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["decision"]["action"] == "CONTINUE"
    assert data["fallback_applied"] is False


def test_agent_invalid_tool_call_handled():
    """Verify model requesting an unknown tool is handled with tool error message and no crash."""
    token, _ = helper_register_user("bad_tool_test")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    payload = {"session_id": session_id}

    resp = client.post(
        "/api/v1/agent/orchestrate?provider_override=mock&mock_mode=invalid_tool_call",
        headers=headers,
        json=payload
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    # The tool execution was recorded as failed
    assert len(data["tool_records"]) > 0
    assert data["tool_records"][0]["success"] is False


# ─── 7. Security & Authorization ──────────────────────────────────────────────

def test_agent_cross_user_session_access_rejected():
    """Verify a user cannot orchestrate another user's session (must return 404)."""
    token_a, _ = helper_register_user("user_a")
    token_b, _ = helper_register_user("user_b")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    _, session_id = helper_create_session(headers_a)

    payload = {"session_id": session_id}

    # User B attempts to access User A's session
    resp = client.post(
        "/api/v1/agent/orchestrate?provider_override=mock&mock_mode=success",
        headers=headers_b,
        json=payload
    )
    assert resp.status_code == 404, resp.text


def test_agent_nonexistent_session_rejected():
    """Verify orchestrating a non-existent session returns 404."""
    token, _ = helper_register_user("nonexist_test")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {"session_id": str(uuid.uuid4())}

    resp = client.post(
        "/api/v1/agent/orchestrate?provider_override=mock&mock_mode=success",
        headers=headers,
        json=payload
    )
    assert resp.status_code == 404


# ─── 8. State Authority & Completion Flow ─────────────────────────────────────

def test_agent_end_interview_flow():
    """Verify END_INTERVIEW decision transitions session status to completed."""
    token, _ = helper_register_user("end_test")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    payload = {
        "session_id": session_id,
        "user_message": "All questions have been answered. Please end_interview.",
    }

    resp = client.post(
        "/api/v1/agent/orchestrate?provider_override=mock&mock_mode=success",
        headers=headers,
        json=payload
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["decision"]["action"] == "END_INTERVIEW"
    assert data["session_status"] == "completed"

    # Verify session state from state manager is actually completed
    st_resp = client.get(f"/api/v1/sessions/{session_id}/state", headers=headers)
    assert st_resp.status_code == 200
    assert st_resp.json()["session_status"] == "completed"
