import uuid
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.models.interview import Interview
from app.models.interview_question import InterviewQuestion
from app.models.interview_session import InterviewSession
from app.models.session_question import SessionQuestion

client = TestClient(app)


def helper_register_user():
    email = f"adaptive_candidate_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Adaptive Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def create_test_interview(token: str, counter_questions: bool = True):
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Backend Engineering Interview",
            "job_role": "Backend Developer",
            "interview_type": "Technical",
            "mode": "General",
            "domain": "Backend",
            "difficulty": "Medium",
            "experience_level": "2+",
            "question_count": 2,
            "counter_questions": counter_questions
        }
    )
    assert resp.status_code == 201, resp.text
    interview_data = resp.json()

    # Seed 2 Main Questions for this test interview
    q1_resp = client.post(
        f"/api/v1/interviews/{interview_data['id']}/questions",
        headers=headers,
        json={
            "question_text": "How do you optimize API database query performance?",
            "question_order": 1,
            "question_type": "technical"
        }
    )
    assert q1_resp.status_code == 201

    q2_resp = client.post(
        f"/api/v1/interviews/{interview_data['id']}/questions",
        headers=headers,
        json={
            "question_text": "Explain microservice rate limiting strategies.",
            "question_order": 2,
            "question_type": "technical"
        }
    )
    assert q2_resp.status_code == 201

    return interview_data


def test_interview_counter_questions_setting_persistence():
    token = helper_register_user()

    # Test OFF persistence
    interview_off = create_test_interview(token, counter_questions=False)
    assert interview_off["counter_questions"] is False

    # Test ON persistence
    interview_on = create_test_interview(token, counter_questions=True)
    assert interview_on["counter_questions"] is True


def test_adaptive_follow_up_off_flow():
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    interview = create_test_interview(token, counter_questions=False)

    # Start Session
    sess_resp = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers)
    assert sess_resp.status_code == 201
    session_id = sess_resp.json()["id"]

    client.post(f"/api/v1/sessions/{session_id}/start", headers=headers)

    # Fetch main questions to get Main Q1 ID
    q_list = client.get(f"/api/v1/interviews/{interview['id']}/questions", headers=headers).json()
    q1_id = q_list[0]["id"]

    # Submit answer with technical keywords when adaptive follow-up is OFF
    ans_resp = client.post(
        f"/api/v1/sessions/{session_id}/answers",
        headers=headers,
        json={
            "question_id": q1_id,
            "answer_text": "I added Redis caching to improve database API response time.",
            "started_at": "2026-08-08T10:00:00Z",
            "submitted_at": "2026-08-08T10:01:00Z"
        }
    )
    assert ans_resp.status_code == 201
    res_data = ans_resp.json()

    # Must immediately proceed to Main Q2 with 0 AI counter questions
    assert res_data["interview_complete"] is False
    assert res_data["next_question"]["question_type"] == "main"
    assert res_data["next_question"]["follow_up_depth"] == 0
    assert res_data["next_question"]["id"] == q_list[1]["id"]


def test_adaptive_follow_up_on_and_depth_limits():
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    interview = create_test_interview(token, counter_questions=True)

    # Start Session
    sess_resp = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers)
    session_id = sess_resp.json()["id"]
    client.post(f"/api/v1/sessions/{session_id}/start", headers=headers)

    q_list = client.get(f"/api/v1/interviews/{interview['id']}/questions", headers=headers).json()
    q1_id = q_list[0]["id"]
    q2_id = q_list[1]["id"]

    # 1. Answer Main Q1 -> Expect Counter Q1 (Depth 1)
    ans1 = client.post(
        f"/api/v1/sessions/{session_id}/answers",
        headers=headers,
        json={
            "question_id": q1_id,
            "answer_text": "I implemented Redis caching and query indexing to optimize API performance.",
            "started_at": "2026-08-08T10:00:00Z",
            "submitted_at": "2026-08-08T10:01:00Z"
        }
    ).json()

    assert ans1["interview_complete"] is False
    next_q1 = ans1["next_question"]
    assert next_q1["question_type"] == "counter"
    assert next_q1["follow_up_depth"] == 1
    assert "cache" in next_q1["question_text"].lower() or "invalidation" in next_q1["question_text"].lower() or "indexing" in next_q1["question_text"].lower()
    counter_q1_id = next_q1["id"]

    # 2. Answer Counter Q1 -> Expect Counter Q2 (Depth 2)
    ans2 = client.post(
        f"/api/v1/sessions/{session_id}/answers",
        headers=headers,
        json={
            "question_id": counter_q1_id,
            "answer_text": "I used Redis TTL expiration and database triggers for cache invalidation.",
            "started_at": "2026-08-08T10:01:30Z",
            "submitted_at": "2026-08-08T10:02:30Z"
        }
    ).json()

    assert ans2["interview_complete"] is False
    next_q2 = ans2["next_question"]
    assert next_q2["question_type"] == "counter"
    assert next_q2["follow_up_depth"] == 2
    counter_q2_id = next_q2["id"]

    # 3. Answer Counter Q2 -> Expect MAX depth limit reached -> Next Main Q2 (Depth 0)
    ans3 = client.post(
        f"/api/v1/sessions/{session_id}/answers",
        headers=headers,
        json={
            "question_id": counter_q2_id,
            "answer_text": "We analyzed memory overhead and set maximum memory eviction policies.",
            "started_at": "2026-08-08T10:03:00Z",
            "submitted_at": "2026-08-08T10:04:00Z"
        }
    ).json()

    assert ans3["interview_complete"] is False
    next_q3 = ans3["next_question"]
    assert next_q3["question_type"] == "main"
    assert next_q3["follow_up_depth"] == 0
    assert next_q3["id"] == q2_id

    # 4. Answer Main Q2 (Generic brief answer) -> Expect Interview Completion
    ans4 = client.post(
        f"/api/v1/sessions/{session_id}/answers",
        headers=headers,
        json={
            "question_id": q2_id,
            "answer_text": "Candidate audio response recorded.",
            "started_at": "2026-08-08T10:04:30Z",
            "submitted_at": "2026-08-08T10:05:30Z"
        }
    ).json()

    assert ans4["interview_complete"] is True
    assert ans4["next_question"] is None


def test_session_isolation_for_counter_questions():
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}
    interview = create_test_interview(token, counter_questions=True)

    # Candidate Session A
    sess_a = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()
    client.post(f"/api/v1/sessions/{sess_a['id']}/start", headers=headers)

    # Candidate Session B
    sess_b = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()
    client.post(f"/api/v1/sessions/{sess_b['id']}/start", headers=headers)

    q_list = client.get(f"/api/v1/interviews/{interview['id']}/questions", headers=headers).json()
    q1_id = q_list[0]["id"]

    # Session A submits technical answer
    ans_a = client.post(
        f"/api/v1/sessions/{sess_a['id']}/answers",
        headers=headers,
        json={
            "question_id": q1_id,
            "answer_text": "I used Redis caching to optimize database performance.",
            "started_at": "2026-08-08T10:00:00Z",
            "submitted_at": "2026-08-08T10:01:00Z"
        }
    ).json()

    counter_a_id = ans_a["next_question"]["id"]
    assert ans_a["next_question"]["question_type"] == "counter"

    # Verify via DB query that counter question belongs exclusively to Session A
    db = SessionLocal()
    try:
        session_q_a = db.query(SessionQuestion).filter(SessionQuestion.id == counter_a_id).first()
        assert session_q_a is not None
        assert session_q_a.session_id == sess_a["id"]
        assert session_q_a.session_id != sess_b["id"]
    finally:
        db.close()
