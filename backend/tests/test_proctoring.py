import uuid
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.models.interview_session import InterviewSession
from app.models.proctoring_event import ProctoringEvent
from app.services.session_service import complete_session

client = TestClient(app)


def helper_create_session(headers, domain="Fullstack"):
    """Helper to create an interview and session for testing."""
    int_resp = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": f"{domain} Proctoring Test Interview",
            "job_role": "Software Engineer",
            "interview_type": "Technical",
            "domain": domain,
            "difficulty": "Medium",
            "question_count": 2,
        }
    )
    assert int_resp.status_code == 201
    interview_id = int_resp.json()["id"]

    sess_resp = client.post(
        f"/api/v1/interviews/{interview_id}/sessions",
        headers=headers
    )
    assert sess_resp.status_code == 201
    session_id = sess_resp.json()["id"]

    start_resp = client.post(
        f"/api/v1/sessions/{session_id}/start",
        headers=headers
    )
    assert start_resp.status_code == 200
    return session_id


def test_get_proctoring_config(canonical_user, auth_headers):
    """Verify retrieval of authoritative proctoring policy."""
    session_id = helper_create_session(auth_headers)

    res = client.get(
        f"/api/v1/interviews/{session_id}/proctoring-config",
        headers=auth_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["tab_monitoring_enabled"] is True
    assert data["max_tab_departures"] == 2
    assert data["grace_period_seconds"] == 10.0
    assert data["phone_detection_enabled"] is True
    assert data["gaze_eye_analysis_enabled"] is True
    assert data["policy_mode"] == "warning_only"


def test_submit_valid_proctoring_events(canonical_user, auth_headers):
    """Verify single and batch proctoring event ingestion."""
    session_id = helper_create_session(auth_headers)

    # 1. Submit single valid eye closure event
    single_res = client.post(
        f"/api/v1/interviews/{session_id}/proctoring-events",
        headers=auth_headers,
        json={
            "event_type": "prolonged_eye_closure",
            "confidence": 0.95,
            "duration_seconds": 3.2,
            "metadata": {"eye": "both", "ear": 0.12}
        }
    )
    assert single_res.status_code == 201
    event_data = single_res.json()
    assert event_data["event_type"] == "prolonged_eye_closure"
    assert event_data["session_id"] == session_id
    assert event_data["confidence"] == 0.95
    assert event_data["duration_seconds"] == 3.2

    # 2. Submit batch of events
    batch_res = client.post(
        f"/api/v1/interviews/{session_id}/proctoring-events",
        headers=auth_headers,
        json={
            "events": [
                {
                    "event_type": "off_camera_gaze",
                    "confidence": 0.88,
                    "duration_seconds": 4.5,
                    "metadata": {"direction": "left"}
                },
                {
                    "event_type": "phone_detected",
                    "confidence": 0.76,
                    "duration_seconds": 2.1,
                    "metadata": {"bbox": [0.1, 0.2, 0.3, 0.4]}
                },
                {
                    "event_type": "tab_hidden",
                    "confidence": 1.0,
                    "metadata": {"reason": "tab_switch"}
                }
            ]
        }
    )
    assert batch_res.status_code == 201
    batch_data = batch_res.json()
    assert len(batch_data) == 3


def test_reject_invalid_proctoring_event_type(canonical_user, auth_headers):
    """Verify rejection of unknown or forged proctoring event types."""
    session_id = helper_create_session(auth_headers)

    res = client.post(
        f"/api/v1/interviews/{session_id}/proctoring-events",
        headers=auth_headers,
        json={
            "event_type": "completely_invalid_type",
            "confidence": 0.5
        }
    )
    assert res.status_code == 422


def test_proctoring_summary_aggregation(canonical_user, auth_headers):
    """Verify aggregated metrics and integrity assessment in summary response."""
    session_id = helper_create_session(auth_headers)

    # Ingest varied events
    client.post(
        f"/api/v1/interviews/{session_id}/proctoring-events",
        headers=auth_headers,
        json={
            "events": [
                {
                    "event_type": "prolonged_eye_closure",
                    "duration_seconds": 2.5,
                    "metadata": {"eye_open_percentage": 92.0}
                },
                {
                    "event_type": "off_camera_gaze",
                    "duration_seconds": 5.0,
                    "metadata": {"camera_directed_gaze_percentage": 78.0, "screen_directed_gaze_percentage": 14.0}
                },
                {
                    "event_type": "phone_detected",
                    "duration_seconds": 3.0,
                    "metadata": {"label": "cell phone"}
                },
                {
                    "event_type": "tab_hidden",
                    "metadata": {"departure": 1}
                },
                {
                    "event_type": "fullscreen_exited",
                    "metadata": {"action": "exit"}
                }
            ]
        }
    )

    summary_res = client.get(
        f"/api/v1/interviews/{session_id}/proctoring-summary",
        headers=auth_headers
    )
    assert summary_res.status_code == 200
    summary = summary_res.json()

    assert summary["session_id"] == session_id
    assert summary["tab_departures_count"] == 1
    assert summary["fullscreen_exits_count"] == 1
    assert summary["phone_detection_count"] == 1
    assert summary["phone_detection_total_duration"] == 3.0
    assert summary["off_camera_gaze_intervals"] == 1
    assert summary["longest_off_camera_interval"] == 5.0
    assert summary["prolonged_closure_count"] == 1
    assert summary["total_events_count"] == 5
    assert summary["eye_open_percentage"] == 92.0
    assert summary["camera_directed_gaze_percentage"] == 78.0
    # Flagged because phone was detected
    assert summary["integrity_status"] in ["flagged", "review_required"]


def test_session_policy_termination_idempotent(canonical_user, auth_headers):
    """Verify safe, idempotent automatic termination due to policy violation."""
    session_id = helper_create_session(auth_headers)

    # Terminate session due to tab departure threshold
    term_res = client.post(
        f"/api/v1/interviews/{session_id}/terminate",
        headers=auth_headers,
        json={
            "reason": "proctoring_tab_departures",
            "departure_count": 3,
            "details": {"max_allowed": 2, "elapsed_away_seconds": 15.0}
        }
    )
    assert term_res.status_code == 200
    term_data = term_res.json()
    assert term_data["status"] == "terminated_by_policy"

    # Subsequent termination call is idempotent and safe
    repeat_res = client.post(
        f"/api/v1/interviews/{session_id}/terminate",
        headers=auth_headers,
        json={"reason": "proctoring_tab_departures", "departure_count": 4}
    )
    assert repeat_res.status_code == 200
    assert repeat_res.json()["status"] == "terminated_by_policy"

    # Verify summary reflects termination
    summary_res = client.get(
        f"/api/v1/interviews/{session_id}/proctoring-summary",
        headers=auth_headers
    )
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["termination_reason"] == "proctoring_tab_departures"
    assert summary["integrity_status"] == "flagged"

    # Late proctoring events do not reopen or modify the terminated session
    late_res = client.post(
        f"/api/v1/interviews/{session_id}/proctoring-events",
        headers=auth_headers,
        json={"event_type": "tab_visible", "confidence": 1.0}
    )
    assert late_res.status_code == 201

    check_sess = client.get(
        f"/api/v1/sessions/{session_id}",
        headers=auth_headers
    )
    assert check_sess.status_code == 200
    assert check_sess.json()["status"] == "terminated_by_policy"


def test_proctoring_endpoints_unauthorized_access(auth_headers):
    """Verify endpoints enforce ownership and reject unauthorized cross-user access."""
    # Register second candidate
    user2_email = f"user2_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    user2_resp = client.post(
        "/api/v1/auth/register",
        json={"name": "User Two", "email": user2_email, "password": "User2Password123!"}
    )
    assert user2_resp.status_code == 201
    user2_token = user2_resp.json()["access_token"]
    user2_headers = {"Authorization": f"Bearer {user2_token}"}

    # Session created by candidate 1
    session_id = helper_create_session(auth_headers)

    # Candidate 2 attempts to view config, submit event, view summary, or terminate candidate 1's session
    assert client.get(f"/api/v1/interviews/{session_id}/proctoring-config", headers=user2_headers).status_code == 404
    assert client.post(
        f"/api/v1/interviews/{session_id}/proctoring-events",
        headers=user2_headers,
        json={"event_type": "tab_hidden"}
    ).status_code == 404
    assert client.get(f"/api/v1/interviews/{session_id}/proctoring-summary", headers=user2_headers).status_code == 404
    assert client.post(
        f"/api/v1/interviews/{session_id}/terminate",
        headers=user2_headers,
        json={"reason": "test"}
    ).status_code == 404
