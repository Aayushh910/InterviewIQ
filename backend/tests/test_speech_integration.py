import os
import uuid
import wave
import struct
import tempfile
import pytest
from fastapi.testclient import TestClient
from main import app
from app.ai.speech.audio import validate_audio_buffer
from app.ai.speech.transcriber import SpeechTranscriberManager

client = TestClient(app)


def helper_register_user():
    email = f"speech_int_user_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Speech Pipeline Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def generate_synthetic_wav_bytes(duration_sec=1.0, sample_rate=16000):
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_path = tmp.name
    tmp.close()

    try:
        with wave.open(tmp_path, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            num_samples = int(duration_sec * sample_rate)
            data = struct.pack("<" + ("h" * num_samples), *([0] * num_samples))
            wav_file.writeframes(data)

        with open(tmp_path, "rb") as f:
            wav_bytes = f.read()

        return wav_bytes
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def create_test_interview_and_session(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    interview = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Voice Pipeline Mock Interview",
            "interview_type": "Technical",
            "domain": "Backend",
            "difficulty": "Medium",
            "experience_level": "2+",
            "question_count": 1
        }
    ).json()

    question = client.post(
        f"/api/v1/interviews/{interview['id']}/questions",
        headers=headers,
        json={"question_text": "Explain Python concurrency models.", "question_order": 1}
    ).json()

    session = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()
    client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

    return interview, session, question


def test_speech_integration_empty_audio_rejection():
    """Test 2: Empty audio buffer must fail safely with HTTP 400."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/v1/analysis/speech/transcribe",
        headers=headers,
        files={"file": ("empty.wav", b"", "audio/wav")}
    )
    assert resp.status_code == 400
    assert "empty" in resp.json()["detail"].lower()


def test_speech_integration_invalid_audio_type():
    """Test 3: Invalid audio MIME type must be rejected with HTTP 400."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/v1/analysis/speech/transcribe",
        headers=headers,
        files={"file": ("document.pdf", b"%PDF-1.4 sample content", "application/pdf")}
    )
    assert resp.status_code == 400
    assert "unsupported" in resp.json()["detail"].lower()


def test_speech_integration_transcription_success():
    """Test 1: Audio file is successfully validated and transcribed."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    wav_bytes = generate_synthetic_wav_bytes(duration_sec=1.0)

    resp = client.post(
        "/api/v1/analysis/speech/transcribe",
        headers=headers,
        files={"file": ("voice_answer.wav", wav_bytes, "audio/wav")}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "text" in data
    assert "language" in data
    assert data["duration_seconds"] >= 0.5


def test_speech_integration_audio_answer_submission_pipeline(monkeypatch):
    """
    Tests 7, 8, 9, 12: Full pipeline (Audio -> Transcript -> Answer -> Evaluation -> DB persistence).
    Submits audio recording to POST /api/v1/sessions/{session_id}/answers/audio.
    """
    def mock_transcribe(self, audio_path, language=None):
        return {
            "text": "I used PostgreSQL query indexing, EXPLAIN ANALYZE, and Redis caching to optimize slow API queries.",
            "language": "en",
            "duration_seconds": 2.5,
            "segments": None
        }
    monkeypatch.setattr(SpeechTranscriberManager, "transcribe", mock_transcribe)

    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    interview, session, question = create_test_interview_and_session(token)
    wav_bytes = generate_synthetic_wav_bytes(duration_sec=1.5)

    resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers/audio",
        headers=headers,
        data={"question_id": question["id"]},
        files={"file": ("candidate_voice.wav", wav_bytes, "audio/wav")}
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()

    # Test 7: Transcript associated with correct question & session
    assert data["session_id"] == session["id"]
    assert data["question_id"] == question["id"]
    assert "answer_text" in data["answer"]
    assert "PostgreSQL query indexing" in data["answer"]["answer_text"]

    # Test 8 & 9: Phase 2 Evaluation triggered and persisted
    assert "evaluation" in data
    assert data["evaluation"] is not None
    assert "overall_score" in data["evaluation"]
    assert data["evaluation"]["overall_score"] >= 50.0
    assert "relevance" in data["evaluation"]
    assert "correctness" in data["evaluation"]


def test_speech_integration_ownership_protection():
    """Test 10: Candidate B cannot submit audio to Candidate A's session."""
    user_a_token = helper_register_user()
    user_b_token = helper_register_user()

    headers_b = {"Authorization": f"Bearer {user_b_token}"}
    interview_a, session_a, question_a = create_test_interview_and_session(user_a_token)
    wav_bytes = generate_synthetic_wav_bytes(duration_sec=1.0)

    # Candidate B tries to submit audio to Candidate A's session
    resp = client.post(
        f"/api/v1/sessions/{session_a['id']}/answers/audio",
        headers=headers_b,
        data={"question_id": question_a["id"]},
        files={"file": ("unauthorized_voice.wav", wav_bytes, "audio/wav")}
    )
    assert resp.status_code in [403, 404]


def test_speech_integration_duplicate_submission_deduplication(monkeypatch):
    """Test 11: Repeated audio submissions update existing Answer and Evaluation without duplicate DB rows."""
    def mock_transcribe(self, audio_path, language=None):
        return {
            "text": "I used PostgreSQL query indexing and Redis caching.",
            "language": "en",
            "duration_seconds": 2.0,
            "segments": None
        }
    monkeypatch.setattr(SpeechTranscriberManager, "transcribe", mock_transcribe)

    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    interview, session, question = create_test_interview_and_session(token)
    wav_bytes = generate_synthetic_wav_bytes(duration_sec=1.0)

    # First audio submission
    resp1 = client.post(
        f"/api/v1/sessions/{session['id']}/answers/audio",
        headers=headers,
        data={"question_id": question["id"]},
        files={"file": ("first_take.wav", wav_bytes, "audio/wav")}
    ).json()
    answer_id_1 = resp1["id"]
    eval_id_1 = resp1["evaluation"]["id"]

    # Second audio submission (re-take answer)
    resp2 = client.post(
        f"/api/v1/sessions/{session['id']}/answers/audio",
        headers=headers,
        data={"question_id": question["id"]},
        files={"file": ("retake_voice.wav", wav_bytes, "audio/wav")}
    ).json()

    assert resp2["id"] == answer_id_1  # Same answer record updated
    assert resp2["evaluation"]["id"] == eval_id_1  # Same evaluation record updated
