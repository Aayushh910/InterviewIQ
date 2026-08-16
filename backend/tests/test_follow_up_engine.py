import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.models.session_question import SessionQuestion
from app.models.answer import Answer

client = TestClient(app)


def helper_register_user(prefix: str = "followup_user"):
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Follow-Up Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def helper_create_interview_and_session(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    interview = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Backend Follow-Up Practice",
            "job_role": "Senior Backend Developer",
            "interview_type": "Technical",
            "domain": "Backend",
            "difficulty": "Hard",
            "experience_level": "5+",
            "question_count": 3
        }
    ).json()

    question = client.post(
        f"/api/v1/interviews/{interview['id']}/questions",
        headers=headers,
        json={"question_text": "How do you design a high-concurrency caching layer using Redis?", "question_order": 1}
    ).json()

    session = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()
    client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

    ans_resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers",
        headers=headers,
        json={
            "question_id": question["id"],
            "answer_text": "I would use Redis with cache-aside pattern to store user session data."
        }
    ).json()

    return interview["id"], question["id"], session["id"], ans_resp["id"]


def test_follow_up_unauthenticated():
    """Verify unauthenticated request is rejected with HTTP 401."""
    resp = client.post(
        "/api/v1/ai/follow-up/generate",
        json={"interview_id": "inv_123", "question_id": "q_123", "answer_id": "ans_123"}
    )
    assert resp.status_code == 401


def test_generate_follow_up_valid_request():
    """Verify valid candidate answer triggers follow-up decision and returns persisted follow-up question."""
    token = helper_register_user()
    interview_id, question_id, session_id, answer_id = helper_create_interview_and_session(token)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "interview_id": interview_id,
        "question_id": question_id,
        "answer_id": answer_id,
        "provider": "mock",
        "mock_mode": "success"
    }

    resp = client.post("/api/v1/ai/follow-up/generate", headers=headers, json=payload)
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert data["should_follow_up"] is True
    assert "reason" in data
    assert data["follow_up"] is not None

    f_item = data["follow_up"]
    assert f_item["parent_question_id"] == question_id
    assert f_item["follow_up_depth"] == 1
    assert len(f_item["question_text"]) > 10
    assert f_item["generation_provider"] == "mock"


def test_generate_follow_up_direct_alias_endpoint():
    """Verify direct alias endpoint POST /api/ai/follow-up/generate works identically."""
    token = helper_register_user()
    interview_id, question_id, session_id, answer_id = helper_create_interview_and_session(token)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "interview_id": interview_id,
        "question_id": question_id,
        "answer_id": answer_id,
        "provider": "mock",
        "mock_mode": "success"
    }

    resp = client.post("/api/ai/follow-up/generate", headers=headers, json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["should_follow_up"] is True


def test_generate_follow_up_no_follow_up_needed():
    """Verify mock mode 'no_follow_up' returns should_follow_up=false."""
    token = helper_register_user()
    interview_id, question_id, session_id, answer_id = helper_create_interview_and_session(token)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "interview_id": interview_id,
        "question_id": question_id,
        "answer_id": answer_id,
        "provider": "mock",
        "mock_mode": "no_follow_up"
    }

    resp = client.post("/api/v1/ai/follow-up/generate", headers=headers, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["should_follow_up"] is False
    assert data["follow_up"] is None


def test_generate_follow_up_unauthorized_user():
    """Verify user B cannot request follow-up for user A's interview."""
    token_user_a = helper_register_user("user_a")
    token_user_b = helper_register_user("user_b")

    interview_id_a, question_id_a, session_id_a, answer_id_a = helper_create_interview_and_session(token_user_a)

    headers_b = {"Authorization": f"Bearer {token_user_b}"}
    payload = {
        "interview_id": interview_id_a,
        "question_id": question_id_a,
        "answer_id": answer_id_a,
        "provider": "mock"
    }

    resp = client.post("/api/v1/ai/follow-up/generate", headers=headers_b, json=payload)
    assert resp.status_code == 404


def test_generate_follow_up_empty_answer():
    """Verify short or empty candidate answer yields should_follow_up=false without provider errors."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    interview = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={"title": "Short Answer Test", "job_role": "Developer"}
    ).json()

    question = client.post(
        f"/api/v1/interviews/{interview['id']}/questions",
        headers=headers,
        json={"question_text": "Explain quantum computing algorithms.", "question_order": 1}
    ).json()

    session = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()
    client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

    ans_resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers",
        headers=headers,
        json={"question_id": question["id"], "answer_text": "N/A"}
    ).json()

    payload = {
        "interview_id": interview["id"],
        "question_id": question["id"],
        "answer_id": ans_resp["id"],
        "provider": "mock"
    }

    resp = client.post("/api/v1/ai/follow-up/generate", headers=headers, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["should_follow_up"] is False
    assert "short" in data["reason"].lower() or "empty" in data["reason"].lower()


def test_generate_follow_up_max_limit_reached():
    """Verify follow-up depth limit (MAX_FOLLOW_UPS_PER_QUESTION=2) stops follow-up chain."""
    token = helper_register_user()
    interview_id, question_id, session_id, answer_id = helper_create_interview_and_session(token)
    headers = {"Authorization": f"Bearer {token}"}

    # Depth 1 follow-up
    res1 = client.post(
        "/api/v1/ai/follow-up/generate",
        headers=headers,
        json={"interview_id": interview_id, "question_id": question_id, "answer_id": answer_id, "provider": "mock"}
    ).json()

    follow_up_1_id = res1["follow_up"]["id"]

    # Submit answer to follow-up 1
    ans_2_resp = client.post(
        f"/api/v1/sessions/{session_id}/answers",
        headers=headers,
        json={"question_id": follow_up_1_id, "answer_text": "I used LRU cache eviction and pub-sub invalidation."}
    ).json()

    # Depth 2 follow-up
    res2 = client.post(
        "/api/v1/ai/follow-up/generate",
        headers=headers,
        json={"interview_id": interview_id, "question_id": follow_up_1_id, "answer_id": ans_2_resp["id"], "provider": "mock"}
    ).json()

    follow_up_2_id = res2["follow_up"]["id"]

    # Submit answer to follow-up 2
    ans_3_resp = client.post(
        f"/api/v1/sessions/{session_id}/answers",
        headers=headers,
        json={"question_id": follow_up_2_id, "answer_text": "We monitored cache hit rates using Prometheus metrics."}
    ).json()

    # Depth 3 attempt (should be rejected because max limit = 2)
    res3 = client.post(
        "/api/v1/ai/follow-up/generate",
        headers=headers,
        json={"interview_id": interview_id, "question_id": follow_up_2_id, "answer_id": ans_3_resp["id"], "provider": "mock"}
    ).json()

    assert res3["should_follow_up"] is False
    assert "limit" in res3["reason"].lower()


def test_generate_follow_up_provider_failure_handling():
    """Verify AI provider failure returns HTTP 502 Bad Gateway."""
    token = helper_register_user()
    interview_id, question_id, session_id, answer_id = helper_create_interview_and_session(token)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "interview_id": interview_id,
        "question_id": question_id,
        "answer_id": answer_id,
        "provider": "mock",
        "mock_mode": "failure"
    }

    resp = client.post("/api/v1/ai/follow-up/generate", headers=headers, json=payload)
    assert resp.status_code in [502, 500]


def test_generate_follow_up_provider_timeout_handling():
    """Verify AI provider timeout returns HTTP 504 Gateway Timeout."""
    token = helper_register_user()
    interview_id, question_id, session_id, answer_id = helper_create_interview_and_session(token)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "interview_id": interview_id,
        "question_id": question_id,
        "answer_id": answer_id,
        "provider": "mock",
        "mock_mode": "timeout"
    }

    resp = client.post("/api/v1/ai/follow-up/generate", headers=headers, json=payload)
    assert resp.status_code in [504, 500]


def test_generate_follow_up_db_persistence():
    """Verify follow-up question is persisted to SessionQuestion with correct relationships."""
    token = helper_register_user()
    interview_id, question_id, session_id, answer_id = helper_create_interview_and_session(token)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "interview_id": interview_id,
        "question_id": question_id,
        "answer_id": answer_id,
        "provider": "mock"
    }

    resp = client.post("/api/v1/ai/follow-up/generate", headers=headers, json=payload)
    assert resp.status_code == 200
    follow_up_id = resp.json()["follow_up"]["id"]

    db = SessionLocal()
    try:
        session_q = db.query(SessionQuestion).filter(SessionQuestion.id == follow_up_id).first()
        assert session_q is not None
        assert session_q.session_id == session_id
        assert session_q.interview_id == interview_id
        assert session_q.parent_question_id == question_id
        assert session_q.follow_up_depth == 1
        assert session_q.question_type == "counter"
        assert len(session_q.question_text) > 10
    finally:
        db.close()
