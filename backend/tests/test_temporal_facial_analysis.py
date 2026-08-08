import os
import uuid
import tempfile
import cv2
import numpy as np
from fastapi.testclient import TestClient
from main import app
from app.ai.facial.video import VideoProcessor
from app.ai.facial.temporal import TemporalFacialAggregator

client = TestClient(app)


def helper_register_user():
    email = f"temporal_candidate_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Temporal Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def generate_synthetic_face_video_bytes(fps=10.0, num_frames=20, include_face=True):
    """
    Generate synthetic MP4 video file bytes.
    """
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


def test_temporal_aggregator_unit_math():
    # 1. Empty observations
    res_empty = TemporalFacialAggregator.aggregate_observations([], duration_seconds=10.0)
    assert res_empty["frames_sampled"] == 0
    assert res_empty["face_presence_ratio"] == 0.0
    assert res_empty["average_head_pose"] is None

    # 2. No face detected in any frame
    no_face_obs = [
        {"timestamp_seconds": 0.0, "face_detected": False},
        {"timestamp_seconds": 0.5, "face_detected": False},
    ]
    res_no_face = TemporalFacialAggregator.aggregate_observations(no_face_obs, duration_seconds=1.0)
    assert res_no_face["frames_sampled"] == 2
    assert res_no_face["frames_with_face"] == 0
    assert res_no_face["face_presence_ratio"] == 0.0
    assert res_no_face["average_head_pose"] is None

    # 3. Known numeric observations (yaw = 0.0, 10.0, 20.0 -> avg 10.0, sample std 10.0)
    known_obs = [
        {"timestamp_seconds": 0.0, "face_detected": True, "position_quality": 0.9, "camera_alignment": 0.9, "yaw": 0.0, "pitch": 0.0, "roll": 0.0},
        {"timestamp_seconds": 0.5, "face_detected": True, "position_quality": 0.9, "camera_alignment": 0.8, "yaw": 10.0, "pitch": 0.0, "roll": 0.0},
        {"timestamp_seconds": 1.0, "face_detected": True, "position_quality": 0.9, "camera_alignment": 0.7, "yaw": 20.0, "pitch": 0.0, "roll": 0.0},
    ]
    res_known = TemporalFacialAggregator.aggregate_observations(known_obs, duration_seconds=1.5)
    assert res_known["frames_sampled"] == 3
    assert res_known["frames_with_face"] == 3
    assert res_known["face_presence_ratio"] == 1.0
    assert res_known["average_head_pose"]["yaw"] == 10.0
    assert res_known["head_pose_variability"]["yaw"] == 10.0
    assert res_known["average_camera_alignment"] == 0.8


def test_video_processor_sampling():
    video_bytes = generate_synthetic_face_video_bytes(fps=10.0, num_frames=20, include_face=True)
    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    tmp_path = tmp.name
    tmp.write(video_bytes)
    tmp.close()

    try:
        with VideoProcessor(tmp_path) as proc:
            meta = proc.get_metadata()
            assert meta["width"] == 400
            assert meta["height"] == 400
            assert meta["native_fps"] == 10.0
            assert meta["total_frames"] == 20
            assert meta["duration_seconds"] == 2.0

            # Sample at 2 FPS -> expect ~4 sampled frames
            samples = list(proc.sample_frames(sample_fps=2.0))
            assert len(samples) >= 3
            timestamps = [s[0] for s in samples]
            assert timestamps == sorted(timestamps)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_facial_video_api_unauthenticated():
    video_bytes = generate_synthetic_face_video_bytes()
    resp = client.post(
        "/api/v1/analysis/facial/video",
        files={"file": ("test.mp4", video_bytes, "video/mp4")}
    )
    assert resp.status_code == 401


def test_facial_video_api_invalid_and_empty():
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    # Empty video
    empty_resp = client.post(
        "/api/v1/analysis/facial/video",
        headers=headers,
        files={"file": ("empty.mp4", b"", "video/mp4")}
    )
    assert empty_resp.status_code == 400

    # Corrupted buffer
    corrupt_resp = client.post(
        "/api/v1/analysis/facial/video",
        headers=headers,
        files={"file": ("corrupt.mp4", b"NOT_A_VIDEO_BUFFER", "video/mp4")}
    )
    assert corrupt_resp.status_code == 400

    # Unsupported MIME type
    txt_resp = client.post(
        "/api/v1/analysis/facial/video",
        headers=headers,
        files={"file": ("file.txt", b"plain text data", "text/plain")}
    )
    assert txt_resp.status_code == 400


def test_facial_video_api_authenticated_success():
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    video_bytes = generate_synthetic_face_video_bytes(fps=10.0, num_frames=20, include_face=True)

    resp = client.post(
        "/api/v1/analysis/facial/video",
        headers=headers,
        files={"file": ("interview_answer.mp4", video_bytes, "video/mp4")}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["duration_seconds"] == 2.0
    assert data["frames_sampled"] >= 3
    assert data["frames_with_face"] >= 3
    assert data["face_presence_ratio"] == 1.0
    assert data["average_camera_alignment"] > 0.70
    assert "average_head_pose" in data
    assert "head_pose_variability" in data
