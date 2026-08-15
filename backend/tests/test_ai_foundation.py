import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from app.ai.evaluation.answer.evaluator import AnswerEvaluator
from app.ai.evaluation.answer.mock_provider import MockAnswerEvaluationProvider
from app.ai.evaluation.answer.exceptions import AIProviderError, AIProviderTimeoutError, AIValidationError

client = TestClient(app)


def helper_register_user():
    email = f"ai_foundation_user_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "AI Foundation Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def create_test_interview_session_and_answer(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    interview = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "AI Foundation Interview",
            "interview_type": "Technical",
            "domain": "Software Engineering",
            "difficulty": "Medium",
            "experience_level": "3+",
            "question_count": 1
        }
    ).json()

    question = client.post(
        f"/api/v1/interviews/{interview['id']}/questions",
        headers=headers,
        json={"question_text": "What is dependency injection?", "question_order": 1}
    ).json()

    session = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()
    client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

    ans_resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers",
        headers=headers,
        json={
            "question_id": question["id"],
            "answer_text": "Dependency injection is a software design pattern where an object receives its dependencies from external code rather than creating them internally."
        }
    ).json()

    return session, question, ans_resp["id"]


def test_ai_foundation_unauthenticated_request():
    """Verify unauthorized requests are rejected with HTTP 401."""
    resp = client.post(
        "/api/v1/ai/evaluate-answer",
        json={
            "question": "What is object-oriented programming?",
            "answer": "Object-oriented programming is a programming paradigm based on objects that contain data and methods."
        }
    )
    assert resp.status_code == 401


def test_ai_foundation_valid_direct_question_answer_request():
    """Verify valid Q&A request produces structured evaluation information."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "question": "What is object-oriented programming?",
        "answer": "Object-oriented programming is a programming paradigm based on objects that contain data and methods."
    }

    resp = client.post("/api/v1/ai/evaluate-answer", headers=headers, json=payload)
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert "relevance" in data or "relevance_score" in data
    assert "correctness" in data or "correctness_score" in data
    assert "clarity" in data or "clarity_score" in data
    assert "communication_score" in data
    assert "confidence_score" in data
    assert "overall_score" in data
    assert isinstance(data["strengths"], list)
    assert isinstance(data["improvements"], list)
    assert isinstance(data["summary"], str)
    assert len(data["summary"]) > 0
    assert "evaluator_provider" in data


def test_ai_foundation_direct_alias_endpoint():
    """Verify direct alias endpoint POST /api/ai/evaluate-answer works identically."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "question": "Explain REST API design principles.",
        "answer": "REST APIs use stateless communication, standard HTTP verbs, resource endpoints, and JSON response formats."
    }

    resp = client.post("/api/ai/evaluate-answer", headers=headers, json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["overall_score"] > 0.0


def test_ai_foundation_invalid_payload_request():
    """Verify missing/invalid payload fields are rejected with HTTP 400."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    # Empty body missing all required fields
    resp = client.post("/api/v1/ai/evaluate-answer", headers=headers, json={})
    assert resp.status_code == 422 or resp.status_code == 400


def test_ai_foundation_provider_failure_handling():
    """Verify provider failure is handled safely returning controlled error."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "question": "Explain concurrency in Python.",
        "answer": "Python uses asyncio and threading for concurrency.",
        "provider": "mock",
        "mock_mode": "failure"
    }

    evaluator = AnswerEvaluator()
    with pytest.raises(AIProviderError):
        evaluator.evaluate(
            question_text=payload["question"],
            answer_text=payload["answer"],
            interview_meta={"provider": "mock", "mock_mode": "failure"}
        )

    resp = client.post("/api/v1/ai/evaluate-answer", headers=headers, json=payload)
    assert resp.status_code in [502, 500]


def test_ai_foundation_provider_timeout_handling():
    """Verify provider timeout is handled safely returning HTTP 504."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "question": "Explain distributed caching.",
        "answer": "Redis is commonly used as a distributed cache.",
        "provider": "mock",
        "mock_mode": "timeout"
    }

    evaluator = AnswerEvaluator()
    with pytest.raises(AIProviderTimeoutError):
        evaluator.evaluate(
            question_text=payload["question"],
            answer_text=payload["answer"],
            interview_meta={"provider": "mock", "mock_mode": "timeout"}
        )

    resp = client.post("/api/v1/ai/evaluate-answer", headers=headers, json=payload)
    assert resp.status_code in [504, 500]


def test_ai_foundation_malformed_response_validation():
    """Verify malformed AI provider response is caught by validation layer."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "question": "What is SQL indexing?",
        "answer": "Indexing speeds up query lookups.",
        "provider": "mock",
        "mock_mode": "malformed"
    }

    # AnswerEvaluator clamps and sanitizes numeric scores safely
    evaluator = AnswerEvaluator()
    res = evaluator.evaluate(
        question_text=payload["question"],
        answer_text=payload["answer"],
        interview_meta={"provider": "mock", "mock_mode": "malformed"}
    )
    assert res["relevance_score"] == 0.0
    assert isinstance(res["strengths"], list)


def test_ai_foundation_database_persistence_and_deduplication():
    """Verify valid evaluation persists to AnswerEvaluation model and updates without duplicates."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    session, question, answer_id = create_test_interview_session_and_answer(token)

    # First evaluation via POST /api/v1/ai/evaluate-answer
    resp1 = client.post(
        "/api/v1/ai/evaluate-answer",
        headers=headers,
        json={"answer_id": answer_id}
    )
    assert resp1.status_code == 200, resp1.text
    data1 = resp1.json()
    assert data1["answer_id"] == answer_id
    eval_id_1 = data1["id"]

    # Re-evaluate same answer_id to verify update and deduplication
    resp2 = client.post(
        "/api/v1/ai/evaluate-answer",
        headers=headers,
        json={"answer_id": answer_id}
    )
    assert resp2.status_code == 200, resp2.text
    data2 = resp2.json()
    assert data2["answer_id"] == answer_id
    assert data2["id"] == eval_id_1  # Same primary key record updated, no duplicate created
