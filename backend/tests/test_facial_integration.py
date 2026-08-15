import os
import uuid
import tempfile
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def helper_register_user():
    email = f"facial_int_user_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Facial Integration Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def generate_no_face_image_bytes():
    img = np.zeros((300, 300, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()


def generate_valid_face_image_bytes():
    img = np.full((400, 400, 3), 240, dtype=np.uint8)
    cv2.ellipse(img, (200, 200), (80, 110), 0, 0, 360, (180, 180, 180), -1)
    cv2.circle(img, (170, 170), 12, (50, 50, 50), -1)
    cv2.circle(img, (230, 170), 12, (50, 50, 50), -1)
    cv2.line(img, (200, 180), (200, 210), (50, 50, 50), 3)
    cv2.ellipse(img, (200, 240), (30, 15), 0, 0, 180, (50, 50, 50), 3)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()


def generate_synthetic_face_video_bytes(fps=10.0, num_frames=20, include_face=True):
    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    tmp_path = tmp.name
    tmp.close()

    try:
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(tmp_path, fourcc, fps, (400, 400))

        for i in range(num_frames):
            img = np.full((400, 400, 3), 240, dtype=np.uint8)
            if include_face:
                x_offset = int(i * 2)
                cv2.ellipse(img, (200 + x_offset, 200), (80, 110), 0, 0, 360, (180, 180, 180), -1)
                cv2.circle(img, (170 + x_offset, 170), 12, (50, 50, 50), -1)
                cv2.circle(img, (230 + x_offset, 170), 12, (50, 50, 50), -1)
                cv2.line(img, (200 + x_offset, 180), (200 + x_offset, 210), (50, 50, 50), 3)
                cv2.ellipse(img, (200 + x_offset, 240), (30, 15), 0, 0, 180, (50, 50, 50), 3)
            out.write(img)

        out.release()

        with open(tmp_path, "rb") as f:
            video_bytes = f.read()

        return video_bytes
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def create_test_interview_session_and_answer(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    interview = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Facial Integration Interview",
            "interview_type": "Technical",
            "domain": "Frontend",
            "difficulty": "Medium",
            "experience_level": "2+",
            "question_count": 1
        }
    ).json()

    question = client.post(
        f"/api/v1/interviews/{interview['id']}/questions",
        headers=headers,
        json={"question_text": "How do you handle state management in React?", "question_order": 1}
    ).json()

    session = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()
    client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

    ans_resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers",
        headers=headers,
        json={
            "question_id": question["id"],
            "answer_text": "I use React useState and Context API for local state, and Redux Toolkit for global application state."
        }
    ).json()

    return session, question, ans_resp["id"]


def test_facial_integration_frame_attachment():
    """Attach single-frame facial analysis to an existing candidate answer."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    session, question, answer_id = create_test_interview_session_and_answer(token)
    face_bytes = generate_valid_face_image_bytes()

    resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers/{answer_id}/facial",
        headers=headers,
        files={"file": ("frame.jpg", face_bytes, "image/jpeg")}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["id"] == answer_id
    assert data["facial_analysis"] is not None
    assert data["facial_analysis"]["face_detected"] is True
    assert data["facial_analysis"]["face_count"] == 1
    assert "head_pose" in data["facial_analysis"]
    assert "camera_orientation" in data["facial_analysis"]


def test_facial_integration_no_face_frame_handling():
    """Verify no-face frame is recorded safely without crashing."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    session, question, answer_id = create_test_interview_session_and_answer(token)
    no_face_bytes = generate_no_face_image_bytes()

    resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers/{answer_id}/facial",
        headers=headers,
        files={"file": ("blank.jpg", no_face_bytes, "image/jpeg")}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["id"] == answer_id
    assert data["facial_analysis"] is not None
    assert data["facial_analysis"]["face_detected"] is False
    assert data["facial_analysis"]["face_count"] == 0


def test_facial_integration_temporal_video_attachment():
    """Attach temporal video facial analysis to an existing candidate answer."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    session, question, answer_id = create_test_interview_session_and_answer(token)
    video_bytes = generate_synthetic_face_video_bytes(fps=10.0, num_frames=20, include_face=True)

    resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers/{answer_id}/facial/video",
        headers=headers,
        files={"file": ("answer_clip.mp4", video_bytes, "video/mp4")}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["id"] == answer_id
    assert data["facial_analysis"] is not None
    assert data["facial_analysis"]["duration_seconds"] == 2.0
    assert data["facial_analysis"]["face_presence_ratio"] == 1.0
    assert "average_head_pose" in data["facial_analysis"]
    assert "head_pose_variability" in data["facial_analysis"]


def test_facial_integration_ownership_protection():
    """User B cannot submit facial frame to User A's answer."""
    token_a = helper_register_user()
    token_b = helper_register_user()
    headers_b = {"Authorization": f"Bearer {token_b}"}

    session_a, question_a, answer_id_a = create_test_interview_session_and_answer(token_a)
    face_bytes = generate_valid_face_image_bytes()

    resp = client.post(
        f"/api/v1/sessions/{session_a['id']}/answers/{answer_id_a}/facial",
        headers=headers_b,
        files={"file": ("frame.jpg", face_bytes, "image/jpeg")}
    )
    assert resp.status_code in [403, 404]


def test_facial_integration_failure_isolation():
    """
    Verify facial analysis failure does NOT corrupt or delete candidate answer or Phase 2 evaluation.
    """
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    session, question, answer_id = create_test_interview_session_and_answer(token)

    # Submit invalid corrupted image to facial endpoint
    corrupt_resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers/{answer_id}/facial",
        headers=headers,
        files={"file": ("bad.jpg", b"INVALID_IMAGE_BYTES", "image/jpeg")}
    )
    assert corrupt_resp.status_code == 400

    # Verify original answer and Phase 2 evaluation are still intact and readable
    get_ans = client.get(
        f"/api/v1/sessions/{session['id']}/answers/{answer_id}",
        headers=headers
    )
    assert get_ans.status_code == 200
    ans_data = get_ans.json()
    assert ans_data["answer_text"] is not None
    assert len(ans_data["answer_text"]) > 0


def test_facial_integration_responsible_privacy_language_check():
    """Verify facial analysis contains only observable CV metrics, not psychological claims."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    session, question, answer_id = create_test_interview_session_and_answer(token)
    face_bytes = generate_valid_face_image_bytes()

    resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers/{answer_id}/facial",
        headers=headers,
        files={"file": ("frame.jpg", face_bytes, "image/jpeg")}
    )
    assert resp.status_code == 200
    fa = resp.json()["facial_analysis"]

    # Must contain computer-vision observable fields
    assert "face_detected" in fa
    assert "face_count" in fa
    assert "head_pose" in fa
    assert "camera_orientation" in fa

    # Must NOT contain pseudoscience or psychological claims
    assert "nervous" not in fa
    assert "lying" not in fa
    assert "stress_diagnosis" not in fa
