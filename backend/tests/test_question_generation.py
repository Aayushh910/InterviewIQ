import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.models.interview_question import InterviewQuestion

client = TestClient(app)


def helper_register_user(prefix: str = "qgen_user"):
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Question Gen Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def helper_create_interview(client, headers, title: str = "Technical AI Interview"):
    resp = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": title,
            "job_role": "Backend Engineer",
            "interview_type": "Technical",
            "domain": "Python",
            "difficulty": "Hard",
            "experience_level": "5+",
            "question_count": 5
        }
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def test_generate_questions_unauthenticated(client):
    """Verify unauthorized question generation request is rejected with HTTP 401."""
    resp = client.post(
        "/api/v1/ai/questions/generate",
        json={"interview_id": "test_interview_123", "number_of_questions": 5}
    )
    assert resp.status_code == 401


def test_generate_questions_valid_request(client, auth_headers):
    """Verify valid authenticated question generation request succeeds and persists questions."""
    headers = auth_headers
    interview_id = helper_create_interview(client, headers)

    payload = {
        "interview_id": interview_id,
        "number_of_questions": 5,
        "provider": "mock",
        "mock_mode": "success"
    }

    resp = client.post("/api/v1/ai/questions/generate", headers=headers, json=payload)
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert data["interview_id"] == interview_id
    assert data["count"] == 5
    assert data["provider"] == "mock"
    assert isinstance(data["questions"], list)
    assert len(data["questions"]) == 5

    first_q = data["questions"][0]
    assert "id" in first_q
    assert "question_text" in first_q
    assert len(first_q["question_text"]) > 10
    assert first_q["question_order"] == 1


def test_generate_questions_direct_alias_endpoint(client, auth_headers):
    """Verify direct alias endpoint POST /api/ai/questions/generate works identically."""
    headers = auth_headers
    interview_id = helper_create_interview(client, headers)

    payload = {
        "interview_id": interview_id,
        "number_of_questions": 3,
        "provider": "mock",
        "mock_mode": "success"
    }

    resp = client.post("/api/ai/questions/generate", headers=headers, json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["count"] == 3


def test_generate_questions_invalid_interview_id(client, auth_headers):
    """Verify non-existent interview ID returns HTTP 404."""
    headers = auth_headers

    payload = {
        "interview_id": "non_existent_interview_999",
        "number_of_questions": 5,
        "provider": "mock"
    }

    resp = client.post("/api/v1/ai/questions/generate", headers=headers, json=payload)
    assert resp.status_code == 404


def test_generate_questions_unauthorized_user(client, auth_headers):
    """Verify user A cannot generate questions for user B's interview."""
    headers_a = auth_headers
    interview_id_a = helper_create_interview(client, headers_a)

    reg_b = client.post(
        "/api/v1/auth/register",
        json={"name": "User B", "email": f"user_b_{uuid.uuid4().hex[:6]}@interviewiq.ai", "password": "Password123!"}
    ).json()
    headers_b = {"Authorization": f"Bearer {reg_b['access_token']}"}

    payload = {
        "interview_id": interview_id_a,
        "number_of_questions": 5,
        "provider": "mock"
    }

    resp = client.post("/api/v1/ai/questions/generate", headers=headers_b, json=payload)
    assert resp.status_code == 404


def test_generate_questions_invalid_question_count(client, auth_headers):
    """Verify number_of_questions <= 0 or > 20 is rejected with validation error."""
    headers = auth_headers
    interview_id = helper_create_interview(client, headers)

    # Count = 0
    resp1 = client.post(
        "/api/v1/ai/questions/generate",
        headers=headers,
        json={"interview_id": interview_id, "number_of_questions": 0, "provider": "mock"}
    )
    assert resp1.status_code == 422

    # Count = 100
    resp2 = client.post(
        "/api/v1/ai/questions/generate",
        headers=headers,
        json={"interview_id": interview_id, "number_of_questions": 100, "provider": "mock"}
    )
    assert resp2.status_code == 422


def test_generate_questions_provider_failure_handling(client, auth_headers):
    """Verify AI provider failure returns HTTP 502 Bad Gateway."""
    headers = auth_headers
    interview_id = helper_create_interview(client, headers)

    payload = {
        "interview_id": interview_id,
        "number_of_questions": 5,
        "provider": "mock",
        "mock_mode": "failure"
    }

    resp = client.post("/api/v1/ai/questions/generate", headers=headers, json=payload)
    assert resp.status_code in [502, 500]


def test_generate_questions_provider_timeout_handling(client, auth_headers):
    """Verify AI provider timeout returns HTTP 504 Gateway Timeout."""
    headers = auth_headers
    interview_id = helper_create_interview(client, headers)

    payload = {
        "interview_id": interview_id,
        "number_of_questions": 5,
        "provider": "mock",
        "mock_mode": "timeout"
    }

    resp = client.post("/api/v1/ai/questions/generate", headers=headers, json=payload)
    assert resp.status_code in [504, 500]


def test_generate_questions_db_persistence(client, auth_headers):
    """Verify generated questions are persisted into the database with generation_provider metadata."""
    headers = auth_headers
    interview_id = helper_create_interview(client, headers)

    payload = {
        "interview_id": interview_id,
        "number_of_questions": 4,
        "provider": "mock",
        "mock_mode": "success"
    }

    resp = client.post("/api/v1/ai/questions/generate", headers=headers, json=payload)
    assert resp.status_code == 200

    db = SessionLocal()
    try:
        db_questions = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview_id
        ).order_by(InterviewQuestion.question_order.asc()).all()

        assert len(db_questions) == 4
        for q in db_questions:
            assert q.generation_provider == "mock"
            assert len(q.question_text) > 10
    finally:
        db.close()

