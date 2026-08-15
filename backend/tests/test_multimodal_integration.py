import uuid
import pytest
import cv2
import numpy as np
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def helper_register_user():
    email = f"multimodal_user_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Multimodal Candidate", "email": email, "password": password}
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


def create_interview_session_and_answers(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    interview = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Multimodal Architecture Interview",
            "interview_type": "Technical",
            "domain": "Backend",
            "difficulty": "Hard",
            "experience_level": "3+",
            "question_count": 2
        }
    ).json()

    q1 = client.post(
        f"/api/v1/interviews/{interview['id']}/questions",
        headers=headers,
        json={"question_text": "Explain database indexing and B-Tree structures.", "question_order": 1}
    ).json()

    q2 = client.post(
        f"/api/v1/interviews/{interview['id']}/questions",
        headers=headers,
        json={"question_text": "How do you handle distributed caching with Redis?", "question_order": 2}
    ).json()

    session = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()
    client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

    ans1_resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers",
        headers=headers,
        json={
            "question_id": q1["id"],
            "answer_text": "B-Tree indexes optimize logarithmic lookup times, reducing full table scans for high-cardinality columns in PostgreSQL databases."
        }
    ).json()

    ans2_resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers",
        headers=headers,
        json={
            "question_id": q2["id"],
            "answer_text": "We use Redis Sentinel for high availability and cache invalidation strategies using key TTL expiration."
        }
    ).json()

    return session, ans1_resp["id"], ans2_resp["id"]


def test_multimodal_full_analysis_success():
    """Test full answer multimodal analysis with both evaluation and facial metrics attached."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    session, ans1_id, ans2_id = create_interview_session_and_answers(token)

    # Attach facial analysis frame to answer 1
    face_bytes = generate_valid_face_image_bytes()
    client.post(
        f"/api/v1/sessions/{session['id']}/answers/{ans1_id}/facial",
        headers=headers,
        files={"file": ("frame.jpg", face_bytes, "image/jpeg")}
    )

    resp = client.get(
        f"/api/v1/sessions/{session['id']}/answers/{ans1_id}/multimodal",
        headers=headers
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["answer_id"] == ans1_id
    assert data["session_id"] == session["id"]

    # Answer Performance
    assert data["answer_performance"] is not None
    assert data["answer_performance"]["available"] is True
    assert data["answer_performance"]["overall_score"] >= 0.0

    # Visual Observations
    assert data["visual_observations"] is not None
    assert data["visual_observations"]["available"] is True
    assert data["visual_observations"]["face_detected"] is True

    # Combined Insights
    assert len(data["combined_insights"]) > 0
    assert len(data["recommendations"]) > 0


def test_multimodal_missing_facial_data_handling():
    """Test answer multimodal analysis when facial analysis data is missing."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    session, ans1_id, ans2_id = create_interview_session_and_answers(token)

    # Do not attach facial data to answer 2
    resp = client.get(
        f"/api/v1/sessions/{session['id']}/answers/{ans2_id}/multimodal",
        headers=headers
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["answer_id"] == ans2_id
    assert data["answer_performance"]["available"] is True
    assert data["visual_observations"]["available"] is False
    assert "not available" in data["visual_observations"]["observations"][0].lower()


def test_multimodal_session_aggregation_success():
    """Test session-level multimodal analysis aggregating multiple candidate answers."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    session, ans1_id, ans2_id = create_interview_session_and_answers(token)

    # Attach facial analysis to answer 1
    face_bytes = generate_valid_face_image_bytes()
    client.post(
        f"/api/v1/sessions/{session['id']}/answers/{ans1_id}/facial",
        headers=headers,
        files={"file": ("frame.jpg", face_bytes, "image/jpeg")}
    )

    resp = client.get(
        f"/api/v1/sessions/{session['id']}/multimodal",
        headers=headers
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["session_id"] == session["id"]
    assert data["total_answers"] == 2
    assert data["evaluated_answers"] == 2
    assert data["average_answer_score"] is not None
    assert data["average_answer_score"] >= 0.0
    assert len(data["answer_analyses"]) == 2


def test_multimodal_ownership_protection():
    """User B cannot access User A's multimodal analysis."""
    token_a = helper_register_user()
    token_b = helper_register_user()
    headers_b = {"Authorization": f"Bearer {token_b}"}

    session_a, ans1_id_a, ans2_id_a = create_interview_session_and_answers(token_a)

    resp = client.get(
        f"/api/v1/sessions/{session_a['id']}/answers/{ans1_id_a}/multimodal",
        headers=headers_b
    )
    assert resp.status_code in [403, 404]

    session_resp = client.get(
        f"/api/v1/sessions/{session_a['id']}/multimodal",
        headers=headers_b
    )
    assert session_resp.status_code in [403, 404]


def test_multimodal_responsible_privacy_language_check():
    """Verify multimodal insights contain no unsupported psychological claims."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    session, ans1_id, ans2_id = create_interview_session_and_answers(token)

    face_bytes = generate_valid_face_image_bytes()
    client.post(
        f"/api/v1/sessions/{session['id']}/answers/{ans1_id}/facial",
        headers=headers,
        files={"file": ("frame.jpg", face_bytes, "image/jpeg")}
    )

    resp = client.get(
        f"/api/v1/sessions/{session['id']}/answers/{ans1_id}/multimodal",
        headers=headers
    ).json()

    full_text = " ".join(resp["combined_insights"] + resp["recommendations"] + resp["visual_observations"]["observations"]).lower()

    # Must NOT contain psychological state claims
    assert "lying" not in full_text
    assert "nervous" not in full_text
    assert "depressed" not in full_text
    assert "emotionally unstable" not in full_text
    assert "psychologically stressed" not in full_text
