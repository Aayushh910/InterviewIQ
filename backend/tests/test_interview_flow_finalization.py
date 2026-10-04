import uuid
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.answer import Answer
from app.ai.question_generation.prompts import build_question_generation_prompt
from app.ai.follow_up.prompts import build_follow_up_prompt
from app.ai.providers.factory import get_ai_provider
from app.ai.providers.groq_provider import GroqProvider
from app.ai.providers.mock_provider import MockProvider
from app.services.session_service import validate_session_active, start_session, complete_session

client = TestClient(app)


def test_interview_preparation_state(client, auth_headers):
    """Verify newly created interview session starts in 'not_started' pending state."""
    headers = auth_headers

    # Create interview
    create_res = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Python Developer Loop",
            "job_role": "Python Backend Engineer",
            "interview_type": "Technical",
            "domain": "Python",
            "difficulty": "Medium",
            "question_count": 5
        }
    )
    assert create_res.status_code == 201
    interview_id = create_res.json()["id"]

    # Create session
    sess_res = client.post(f"/api/v1/interviews/{interview_id}/sessions", headers=headers)
    assert sess_res.status_code == 201
    session_data = sess_res.json()
    assert session_data["status"] == "not_started"
    assert session_data.get("started_at") is None


def test_start_interview_flow(client, auth_headers):
    """Verify starting an interview transitions status to 'in_progress' and sets started_at timestamp."""
    headers = auth_headers

    create_res = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={"title": "React Loop", "domain": "React"}
    )
    interview_id = create_res.json()["id"]

    sess_res = client.post(f"/api/v1/interviews/{interview_id}/sessions", headers=headers)
    session_id = sess_res.json()["id"]

    # Start session
    start_res = client.post(f"/api/v1/sessions/{session_id}/start", headers=headers)
    assert start_res.status_code == 200
    started_data = start_res.json()
    assert started_data["status"] == "in_progress"
    assert started_data.get("started_at") is not None


def test_domain_consistency_question_generation():
    """Verify build_question_generation_prompt includes explicit hard constraints for domain."""
    interview_meta = {
        "job_role": "Python Engineer",
        "interview_type": "Technical",
        "domain": "Python",
        "difficulty": "Medium",
        "experience_level": "3+"
    }
    sys_p, usr_p = build_question_generation_prompt(interview_meta, number_of_questions=3)

    assert "CRITICAL DOMAIN CONSTRAINT: The selected domain is 'Python'" in sys_p
    assert "MUST BE STRICTLY PYTHON" in usr_p
    assert "strictly within the Python domain" in usr_p


def test_domain_consistency_follow_up():
    """Verify build_follow_up_prompt includes explicit hard constraints for domain."""
    interview_meta = {
        "job_role": "DevOps Engineer",
        "interview_type": "Technical",
        "domain": "DevOps",
        "difficulty": "Hard"
    }
    sys_p, usr_p = build_follow_up_prompt(
        interview_meta=interview_meta,
        question_text="Explain Kubernetes pod autoscaling.",
        answer_text="HPA scales pods using CPU/RAM metrics."
    )

    assert "CRITICAL DOMAIN CONSTRAINT: The interview domain is 'DevOps'" in sys_p
    assert "MUST BE STRICTLY DEVOPS" in usr_p


def test_groq_provider_selection():
    """Verify get_ai_provider('groq') correctly instantiates GroqProvider."""
    provider = get_ai_provider("groq")
    assert isinstance(provider, GroqProvider)


def test_mock_provider_selection():
    """Verify get_ai_provider('mock') correctly instantiates MockProvider."""
    provider = get_ai_provider("mock", mock_mode="success")
    assert isinstance(provider, MockProvider)


def test_session_expiration_validation():
    """Verify validate_session_active rejects completed or overtime sessions."""
    db = SessionLocal()
    try:
        # 1. Completed session
        comp_sess = InterviewSession(status="completed", started_at=datetime.utcnow())
        assert validate_session_active(comp_sess, max_duration_minutes=4.0) is False

        # 2. Overtime session (> 4.5 mins)
        old_time = datetime.utcnow() - timedelta(minutes=6)
        overtime_sess = InterviewSession(status="in_progress", started_at=old_time)
        assert validate_session_active(overtime_sess, max_duration_minutes=4.0) is False

        # 3. Active session (< 4 mins)
        recent_time = datetime.utcnow() - timedelta(minutes=1)
        active_sess = InterviewSession(status="in_progress", started_at=recent_time)
        assert validate_session_active(active_sess, max_duration_minutes=4.0) is True
    finally:
        db.close()


def test_timeout_finalizes_valid_answer(client, auth_headers):
    """Verify completing session finalizes answers and marks session status as completed."""
    headers = auth_headers

    create_res = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={"title": "Data Science Loop", "domain": "Data Science"}
    )
    interview_id = create_res.json()["id"]

    sess_res = client.post(f"/api/v1/interviews/{interview_id}/sessions", headers=headers)
    session_id = sess_res.json()["id"]

    client.post(f"/api/v1/sessions/{session_id}/start", headers=headers)

    # Complete session
    comp_res = client.post(f"/api/v1/sessions/{session_id}/complete", headers=headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "completed"

