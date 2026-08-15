import uuid
import pytest
import cv2
import numpy as np
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def helper_register_user():
    email = f"analytics_user_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Analytics Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def generate_valid_face_image_bytes():
    img = np.full((400, 400, 3), 240, dtype=np.uint8)
    cv2.ellipse(img, (200, 200), (80, 110), 0, 0, 360, (180, 180, 180), -1)
    cv2.circle(img, (170, 170), 12, (50, 50, 50), -1)
    cv2.circle(img, (230, 170), 12, (50, 50, 50), -1)
    cv2.line(img, (200, 180), (200, 210), (50, 50, 50), 3)
    cv2.ellipse(img, (200, 240), (30, 15), 0, 0, 180, (50, 50, 50), 3)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()


def create_interview_and_session_with_evaluations(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    interview = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Full Analytics Test Interview",
            "interview_type": "Technical",
            "domain": "Systems Architecture",
            "difficulty": "Hard",
            "experience_level": "4+",
            "question_count": 2
        }
    ).json()

    q1 = client.post(
        f"/api/v1/interviews/{interview['id']}/questions",
        headers=headers,
        json={"question_text": "Explain ACID properties in transactional databases.", "question_order": 1}
    ).json()

    q2 = client.post(
        f"/api/v1/interviews/{interview['id']}/questions",
        headers=headers,
        json={"question_text": "What are microservices saga patterns for distributed transactions?", "question_order": 2}
    ).json()

    session = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()
    client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

    # Submit Answer 1
    ans1_resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers",
        headers=headers,
        json={
            "question_id": q1["id"],
            "answer_text": "Atomicity, Consistency, Isolation, and Durability guarantee reliable database transactions using write-ahead logs and WAL checkpointing."
        }
    ).json()

    # Submit Answer 2
    ans2_resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers",
        headers=headers,
        json={
            "question_id": q2["id"],
            "answer_text": "Saga patterns handle distributed transactions via choreography or orchestration using compensating actions."
        }
    ).json()

    return session, ans1_resp["id"], ans2_resp["id"]


def test_session_analytics_completed_interview_success():
    """Test full session analytics calculation with evaluated answers and facial data."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    session, ans1_id, ans2_id = create_interview_and_session_with_evaluations(token)

    # Attach facial analysis frame to answer 1
    face_bytes = generate_valid_face_image_bytes()
    client.post(
        f"/api/v1/sessions/{session['id']}/answers/{ans1_id}/facial",
        headers=headers,
        files={"file": ("frame.jpg", face_bytes, "image/jpeg")}
    )

    resp = client.get(
        f"/api/v1/sessions/{session['id']}/analytics",
        headers=headers
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["session_id"] == session["id"]
    assert data["overall_score"] is not None
    assert data["overall_score"] >= 0.0
    assert data["performance_category"] in ["Strong", "Good", "Developing", "Needs Significant Improvement"]

    # Metrics
    assert data["metrics"] is not None
    assert "answer_quality" in data["metrics"]
    assert "relevance" in data["metrics"]
    assert "correctness" in data["metrics"]
    assert "clarity" in data["metrics"]

    # Completion
    assert data["completion"]["total_questions"] == 2
    assert data["completion"]["answered_questions"] == 2
    assert data["completion"]["evaluated_answers"] == 2

    # Visual Analytics
    assert data["visual_observations"]["answers_with_facial_data"] == 1
    assert data["visual_observations"]["average_face_presence_ratio"] is not None

    # Highlights & Breakdown
    assert len(data["question_results"]) == 2
    assert data["strongest_answer"] is not None
    assert data["weakest_answer"] is not None


def test_session_analytics_incomplete_session_handling():
    """Test analytics calculation when session has no submitted answers."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    interview = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={"title": "Empty Session Interview", "interview_type": "Technical", "question_count": 1}
    ).json()
    client.post(
        f"/api/v1/interviews/{interview['id']}/questions",
        headers=headers,
        json={"question_text": "What is REST?", "question_order": 1}
    )
    session = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()

    resp = client.get(
        f"/api/v1/sessions/{session['id']}/analytics",
        headers=headers
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["session_id"] == session["id"]
    assert data["overall_score"] is None
    assert data["performance_category"] == "Pending Evaluation"
    assert data["completion"]["answered_questions"] == 0
    assert data["completion"]["evaluated_answers"] == 0


def test_session_analytics_ownership_protection():
    """User B cannot access User A's session analytics."""
    token_a = helper_register_user()
    token_b = helper_register_user()
    headers_b = {"Authorization": f"Bearer {token_b}"}

    session_a, ans1_id, ans2_id = create_interview_and_session_with_evaluations(token_a)

    resp = client.get(
        f"/api/v1/sessions/{session_a['id']}/analytics",
        headers=headers_b
    )
    assert resp.status_code in [403, 404]


def test_session_analytics_responsible_privacy_language_check():
    """Verify session analytics contain no unsupported psychological claims."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    session, ans1_id, ans2_id = create_interview_and_session_with_evaluations(token)

    resp = client.get(
        f"/api/v1/sessions/{session['id']}/analytics",
        headers=headers
    ).json()

    full_text = " ".join(resp["top_strengths"] + resp["top_improvements"]).lower()

    assert "lying" not in full_text
    assert "nervous" not in full_text
    assert "depressed" not in full_text
    assert "emotionally unstable" not in full_text
