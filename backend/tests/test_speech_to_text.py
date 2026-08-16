import io
import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.models.answer import Answer
from app.models.session_question import SessionQuestion

client = TestClient(app)


def helper_register_user(prefix: str = "stt_user"):
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "STT Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def helper_create_interview(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    interview = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Voice Interview Practice",
            "job_role": "Backend Architect",
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
        json={"question_text": "Explain distributed caching invalidation strategies.", "question_order": 1}
    ).json()

    session = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()
    client.post(f"/api/v1/sessions/{session['id']}/start", headers=headers)

    return interview["id"], question["id"], session["id"]


def test_transcribe_unauthenticated():
    """Verify unauthenticated transcription request returns 401."""
    audio_file = ("test_speech.webm", io.BytesIO(b"RIFF mock audio content"), "audio/webm")
    resp = client.post(
        "/api/v1/ai/speech/transcribe",
        files={"file": audio_file}
    )
    assert resp.status_code == 401


def test_transcribe_valid_audio():
    """Verify valid audio upload returns 200 with transcript metadata."""
    token = helper_register_user()
    interview_id, question_id, session_id = helper_create_interview(token)
    headers = {"Authorization": f"Bearer {token}"}

    audio_file = ("candidate_answer.webm", io.BytesIO(b"\x1a\x45\xdf\xa3 mock webm audio stream data"), "audio/webm")
    data = {
        "interview_id": interview_id,
        "question_id": question_id,
        "provider": "mock",
        "mock_mode": "success"
    }

    resp = client.post(
        "/api/v1/ai/speech/transcribe",
        headers=headers,
        files={"file": audio_file},
        data=data
    )
    assert resp.status_code == 200, resp.text
    res_data = resp.json()
    assert "transcript" in res_data or "text" in res_data
    assert len(res_data.get("transcript") or res_data.get("text")) > 5
    assert res_data["provider"] == "mock"


def test_transcribe_direct_alias_endpoint():
    """Verify direct alias endpoint POST /api/ai/speech/transcribe works identically."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    audio_file = ("candidate_answer.webm", io.BytesIO(b"\x1a\x45\xdf\xa3 mock webm audio stream data"), "audio/webm")
    data = {"provider": "mock", "mock_mode": "success"}

    resp = client.post(
        "/api/ai/speech/transcribe",
        headers=headers,
        files={"file": audio_file},
        data=data
    )
    assert resp.status_code == 200, resp.text
    assert "text" in resp.json()


def test_transcribe_unauthorized_interview():
    """Verify User B cannot request audio transcription for User A's interview."""
    token_a = helper_register_user("user_a")
    token_b = helper_register_user("user_b")
    interview_id_a, question_id_a, _ = helper_create_interview(token_a)

    headers_b = {"Authorization": f"Bearer {token_b}"}
    audio_file = ("candidate_answer.webm", io.BytesIO(b"\x1a\x45\xdf\xa3 mock webm audio data"), "audio/webm")
    data = {"interview_id": interview_id_a, "provider": "mock"}

    resp = client.post(
        "/api/v1/ai/speech/transcribe",
        headers=headers_b,
        files={"file": audio_file},
        data=data
    )
    assert resp.status_code == 404


def test_transcribe_invalid_audio_format():
    """Verify unsupported file extension returns 400 validation error."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    invalid_file = ("executable.exe", io.BytesIO(b"MZ binary data"), "application/octet-stream")
    data = {"provider": "mock"}

    resp = client.post(
        "/api/v1/ai/speech/transcribe",
        headers=headers,
        files={"file": invalid_file},
        data=data
    )
    assert resp.status_code == 400


def test_transcribe_empty_file():
    """Verify 0-byte audio buffer returns 400 validation error."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    empty_file = ("empty.webm", io.BytesIO(b""), "audio/webm")
    data = {"provider": "mock"}

    resp = client.post(
        "/api/v1/ai/speech/transcribe",
        headers=headers,
        files={"file": empty_file},
        data=data
    )
    assert resp.status_code == 400


def test_transcribe_provider_failure():
    """Verify STT provider failure returns 502 Bad Gateway."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    audio_file = ("candidate_answer.webm", io.BytesIO(b"\x1a\x45\xdf\xa3 mock webm audio data"), "audio/webm")
    data = {"provider": "mock", "mock_mode": "failure"}

    resp = client.post(
        "/api/v1/ai/speech/transcribe",
        headers=headers,
        files={"file": audio_file},
        data=data
    )
    assert resp.status_code == 502


def test_transcribe_provider_timeout():
    """Verify STT provider timeout returns 504 Gateway Timeout."""
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    audio_file = ("candidate_answer.webm", io.BytesIO(b"\x1a\x45\xdf\xa3 mock webm audio data"), "audio/webm")
    data = {"provider": "mock", "mock_mode": "timeout"}

    resp = client.post(
        "/api/v1/ai/speech/transcribe",
        headers=headers,
        files={"file": audio_file},
        data=data
    )
    assert resp.status_code == 504


def test_voice_answer_pipeline_to_follow_up_engine():
    """
    End-to-End Voice Answer Integration Test:
    1. Transcribe voice audio.
    2. Persist transcript as candidate answer.
    3. Verify Phase 2 Adaptive Follow-Up Engine triggers on voice answer.
    """
    token = helper_register_user()
    interview_id, question_id, session_id = helper_create_interview(token)
    headers = {"Authorization": f"Bearer {token}"}

    # Transcribe audio to get transcript
    audio_file = ("candidate_voice.webm", io.BytesIO(b"\x1a\x45\xdf\xa3 mock candidate audio stream"), "audio/webm")
    stt_resp = client.post(
        "/api/v1/ai/speech/transcribe",
        headers=headers,
        files={"file": audio_file},
        data={"interview_id": interview_id, "question_id": question_id, "provider": "mock", "mock_mode": "success"}
    )
    assert stt_resp.status_code == 200
    transcript_text = stt_resp.json()["text"]

    # Submit answer with transcript
    ans_resp = client.post(
        f"/api/v1/sessions/{session_id}/answers",
        headers=headers,
        json={
            "question_id": question_id,
            "answer_text": transcript_text
        }
    )
    assert ans_resp.status_code == 201
    answer_id = ans_resp.json()["id"]

    # Trigger Phase 2 Adaptive Follow-Up Engine on the voice answer
    follow_up_resp = client.post(
        "/api/v1/ai/follow-up/generate",
        headers=headers,
        json={
            "interview_id": interview_id,
            "question_id": question_id,
            "answer_id": answer_id,
            "provider": "mock"
        }
    )
    assert follow_up_resp.status_code == 200
    f_data = follow_up_resp.json()
    assert f_data["should_follow_up"] is True
    assert f_data["follow_up"]["parent_question_id"] == question_id
