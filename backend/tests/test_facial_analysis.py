import os
import uuid
import cv2
import numpy as np
from fastapi.testclient import TestClient
from main import app
from app.ai.facial.analyzer import FacialAnalyzer
from app.ai.facial.landmarker import FaceLandmarkerManager
from app.ai.facial.head_pose import estimate_head_pose
from app.ai.facial.gaze import estimate_camera_alignment
from app.ai.facial.config import MODEL_PATH

client = TestClient(app)


def helper_register_user():
    email = f"facial_candidate_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Facial Candidate", "email": email, "password": password}
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


def test_facial_imports_and_model_existence():
    assert cv2 is not None
    assert np is not None
    assert os.path.exists(MODEL_PATH), f"Model asset missing at {MODEL_PATH}"

    landmarker_mgr = FaceLandmarkerManager.get_instance()
    assert landmarker_mgr is not None


def test_synthetic_head_pose_mathematics():
    """
    Deterministic unit tests validating head pose Euler angle decomposition and camera alignment.
    """
    # Helper to test decomposition
    def decompose_rvec(rvec):
        rmat, _ = cv2.Rodrigues(rvec)
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)
        pitch, yaw, roll = angles[0], angles[1], angles[2]
        if roll > 90:
            roll -= 180
        elif roll < -90:
            roll += 180
        return {"yaw": round(float(yaw), 2), "pitch": round(float(pitch), 2), "roll": round(float(roll), 2)}

    # 1. Front-Facing (Identity)
    pose_front = decompose_rvec(np.array([0.0, 0.0, 0.0]))
    assert abs(pose_front["yaw"]) < 1.0
    assert abs(pose_front["pitch"]) < 1.0
    assert abs(pose_front["roll"]) < 1.0
    align_front = estimate_camera_alignment(pose_front)
    assert align_front["alignment_score"] > 0.95

    # 2. Turn Left (-20 deg Yaw)
    rmat_left = cv2.Rodrigues(np.array([0.0, np.radians(-20), 0.0]))[0]
    rvec_left = cv2.Rodrigues(rmat_left)[0]
    pose_left = decompose_rvec(rvec_left)
    assert pose_left["yaw"] < -15.0
    assert abs(pose_left["pitch"]) < 1.0

    # 3. Turn Right (+20 deg Yaw)
    rmat_right = cv2.Rodrigues(np.array([0.0, np.radians(20), 0.0]))[0]
    rvec_right = cv2.Rodrigues(rmat_right)[0]
    pose_right = decompose_rvec(rvec_right)
    assert pose_right["yaw"] > 15.0

    # 4. Look Up (-15 deg Pitch)
    rmat_up = cv2.Rodrigues(np.array([np.radians(-15), 0.0, 0.0]))[0]
    rvec_up = cv2.Rodrigues(rmat_up)[0]
    pose_up = decompose_rvec(rvec_up)
    assert pose_up["pitch"] < -10.0

    # 5. Tilt Right (+15 deg Roll)
    rmat_tilt = cv2.Rodrigues(np.array([0.0, 0.0, np.radians(15)]))[0]
    rvec_tilt = cv2.Rodrigues(rmat_tilt)[0]
    pose_tilt = decompose_rvec(rvec_tilt)
    assert pose_tilt["roll"] > 10.0


def test_no_face_analysis():
    analyzer = FacialAnalyzer()
    no_face_bytes = generate_no_face_image_bytes()
    result = analyzer.analyze_image_bytes(no_face_bytes)

    assert result["face_detected"] is False
    assert result["face_count"] == 0
    assert result["face_metrics"] is None
    assert result["head_pose"] is None
    assert result["camera_orientation"] is None


def test_valid_face_analysis_and_head_pose_correction():
    analyzer = FacialAnalyzer()
    face_bytes = generate_valid_face_image_bytes()
    result = analyzer.analyze_image_bytes(face_bytes)

    assert result["face_detected"] is True
    assert result["face_count"] == 1
    assert result["face_metrics"] is not None

    metrics = result["face_metrics"]
    assert 0.0 <= metrics["center_x"] <= 1.0
    assert 0.0 <= metrics["center_y"] <= 1.0
    assert 0.0 <= metrics["width"] <= 1.0
    assert 0.0 <= metrics["height"] <= 1.0
    assert 0.0 <= metrics["position_quality"] <= 1.0

    pose = result["head_pose"]
    assert isinstance(pose["yaw"], float)
    assert isinstance(pose["pitch"], float)
    assert isinstance(pose["roll"], float)

    # Critical geometry check: front-facing test face must NOT produce ~180 pitch
    assert abs(pose["pitch"]) < 30.0, f"Pitch {pose['pitch']} is suspicious for front-facing image"
    assert abs(pose["yaw"]) < 30.0
    assert abs(pose["roll"]) < 30.0

    orientation = result["camera_orientation"]
    assert orientation["alignment_score"] > 0.70, f"Alignment score {orientation['alignment_score']} is suspicious"


def test_facial_api_unauthenticated_rejection():
    face_bytes = generate_valid_face_image_bytes()
    response = client.post(
        "/api/v1/analysis/facial",
        files={"file": ("test.jpg", face_bytes, "image/jpeg")}
    )
    assert response.status_code == 401


def test_facial_api_invalid_and_empty_files():
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    empty_resp = client.post(
        "/api/v1/analysis/facial",
        headers=headers,
        files={"file": ("empty.jpg", b"", "image/jpeg")}
    )
    assert empty_resp.status_code == 400

    corrupt_resp = client.post(
        "/api/v1/analysis/facial",
        headers=headers,
        files={"file": ("corrupt.jpg", b"NOT_AN_IMAGE_BUFFER", "image/jpeg")}
    )
    assert corrupt_resp.status_code == 400

    txt_resp = client.post(
        "/api/v1/analysis/facial",
        headers=headers,
        files={"file": ("test.txt", b"plain text data", "text/plain")}
    )
    assert txt_resp.status_code == 400


def test_facial_api_authenticated_success():
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    face_bytes = generate_valid_face_image_bytes()

    response = client.post(
        "/api/v1/analysis/facial",
        headers=headers,
        files={"file": ("candidate.jpg", face_bytes, "image/jpeg")}
    )
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["face_detected"] is True
    assert data["face_count"] == 1
    assert "face_metrics" in data
    assert "head_pose" in data
    assert "camera_orientation" in data
    assert data["head_pose"]["pitch"] < 30.0
    assert data["camera_orientation"]["alignment_score"] > 0.70
