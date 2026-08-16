import uuid
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_tts_unauthenticated(client):
    """Verify unauthenticated TTS synthesis request returns 401."""
    resp = client.post(
        "/api/v1/ai/speech/synthesize",
        json={"text": "Explain React Virtual DOM."}
    )
    assert resp.status_code == 401


def test_tts_valid_request(client, auth_headers):
    """Verify valid question text returns 200 with audio binary payload."""
    headers = auth_headers

    payload = {
        "text": "How do you handle database indexing and connection pooling in PostgreSQL?",
        "voice": "default",
        "language": "en",
        "provider": "mock",
        "mock_mode": "success"
    }

    resp = client.post("/api/v1/ai/speech/synthesize", headers=headers, json=payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("audio/")
    assert len(resp.content) > 40
    assert resp.headers.get("x-tts-provider") == "mock"


def test_tts_direct_alias_endpoint(client, auth_headers):
    """Verify direct alias endpoint POST /api/ai/speech/synthesize works identically."""
    headers = auth_headers

    payload = {
        "text": "Can you explain the bias-variance tradeoff in machine learning?",
        "provider": "mock"
    }

    resp = client.post("/api/ai/speech/synthesize", headers=headers, json=payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("audio/")
    assert len(resp.content) > 40


def test_tts_empty_text(client, auth_headers):
    """Verify empty text string returns 400 Bad Request."""
    headers = auth_headers

    resp = client.post(
        "/api/v1/ai/speech/synthesize",
        headers=headers,
        json={"text": "   ", "provider": "mock"}
    )
    assert resp.status_code in [400, 422]


def test_tts_excessively_long_text(client, auth_headers):
    """Verify text exceeding 1000 characters returns 400 Bad Request."""
    headers = auth_headers

    long_text = "A" * 1050
    resp = client.post(
        "/api/v1/ai/speech/synthesize",
        headers=headers,
        json={"text": long_text, "provider": "mock"}
    )
    assert resp.status_code in [400, 422]


def test_tts_provider_failure(client, auth_headers):
    """Verify TTS provider failure returns 502 Bad Gateway."""
    headers = auth_headers

    payload = {
        "text": "Explain Kubernetes pod lifecycle.",
        "provider": "mock",
        "mock_mode": "failure"
    }

    resp = client.post("/api/v1/ai/speech/synthesize", headers=headers, json=payload)
    assert resp.status_code == 502


def test_tts_provider_timeout(client, auth_headers):
    """Verify TTS provider timeout returns 504 Gateway Timeout."""
    headers = auth_headers

    payload = {
        "text": "Explain microservice rate limiting.",
        "provider": "mock",
        "mock_mode": "timeout"
    }

    resp = client.post("/api/v1/ai/speech/synthesize", headers=headers, json=payload)
    assert resp.status_code == 504


def test_mock_tts_provider_deterministic_output(client, auth_headers):
    """Verify MockTTSProvider produces valid deterministic audio binary content."""
    headers = auth_headers

    payload = {
        "text": "Describe your strategy for zero-downtime blue-green deployments.",
        "provider": "mock"
    }

    resp = client.post("/api/v1/ai/speech/synthesize", headers=headers, json=payload)
    assert resp.status_code == 200
    # Check for RIFF/WAVE header
    assert resp.content[:4] == b"RIFF"
    assert b"WAVE" in resp.content[:16]


def test_question_and_follow_up_tts_integration(client, auth_headers):
    """
    Integration Test:
    Verify TTS synthesis works for both main questions and Phase 2 follow-up questions.
    """
    headers = auth_headers

    # 1. Main Question TTS
    main_q_text = "How do you handle memory leak prevention in large-scale React apps?"
    resp_main = client.post(
        "/api/v1/ai/speech/synthesize",
        headers=headers,
        json={"text": main_q_text, "provider": "mock"}
    )
    assert resp_main.status_code == 200
    assert len(resp_main.content) > 40

    # 2. Phase 2 Follow-Up Question TTS
    follow_up_q_text = "Regarding your answer on React memory leaks, how do you handle unmounted component subscriptions?"
    resp_follow_up = client.post(
        "/api/v1/ai/speech/synthesize",
        headers=headers,
        json={"text": follow_up_q_text, "provider": "mock"}
    )
    assert resp_follow_up.status_code == 200
    assert len(resp_follow_up.content) > 40

