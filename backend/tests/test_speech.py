import os
import uuid
import wave
import struct
import tempfile
from fastapi.testclient import TestClient
from main import app
from app.ai.speech.audio import validate_audio_buffer
from app.ai.speech.transcriber import SpeechTranscriberManager
from app.services.speech_service import transcribe_speech_audio

client = TestClient(app)


def helper_register_user():
    email = f"speech_candidate_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Speech Candidate", "email": email, "password": password}
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


def test_audio_validation():
    # Empty audio
    is_valid, err = validate_audio_buffer(b"")
    assert is_valid is False
    assert "empty" in err.lower()

    # Oversized audio (> 25MB)
    huge_bytes = b"0" * (26 * 1024 * 1024)
    is_valid, err = validate_audio_buffer(huge_bytes)
    assert is_valid is False
    assert "exceeds" in err.lower()

    # Unsupported format
    is_valid, err = validate_audio_buffer(b"sample_data", filename="test.txt", content_type="text/plain")
    assert is_valid is False
    assert "unsupported" in err.lower()

    # Valid WAV audio
    wav_bytes = generate_synthetic_wav_bytes()
    is_valid, err = validate_audio_buffer(wav_bytes, filename="audio.wav", content_type="audio/wav")
    assert is_valid is True
    assert err == ""


def test_transcriber_manager_singleton():
    manager1 = SpeechTranscriberManager.get_instance()
    manager2 = SpeechTranscriberManager.get_instance()
    assert manager1 is manager2


def test_speech_api_unauthenticated():
    wav_bytes = generate_synthetic_wav_bytes()
    resp = client.post(
        "/api/v1/analysis/speech/transcribe",
        files={"file": ("speech.wav", wav_bytes, "audio/wav")}
    )
    assert resp.status_code == 401


def test_speech_api_invalid_files():
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    empty_resp = client.post(
        "/api/v1/analysis/speech/transcribe",
        headers=headers,
        files={"file": ("empty.wav", b"", "audio/wav")}
    )
    assert empty_resp.status_code == 400

    txt_resp = client.post(
        "/api/v1/analysis/speech/transcribe",
        headers=headers,
        files={"file": ("test.txt", b"plain text data", "text/plain")}
    )
    assert txt_resp.status_code == 400


def test_speech_api_authenticated_transcription():
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    wav_bytes = generate_synthetic_wav_bytes(duration_sec=1.0)

    resp = client.post(
        "/api/v1/analysis/speech/transcribe",
        headers=headers,
        files={"file": ("candidate_speech.wav", wav_bytes, "audio/wav")}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert "text" in data
    assert "language" in data
    assert "duration_seconds" in data
    assert data["duration_seconds"] >= 0.5
    assert data["language"] == "en"
