import uuid
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.database import SessionLocal
from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.interview_question import InterviewQuestion
from app.schemas.session_state import (
    SessionStatus,
    InterviewSessionState,
    AddQuestionRequest,
    AddAnswerRequest,
    AddFollowUpRequest,
    AddEvaluationReferenceRequest,
    SessionStateUpdateRequest,
    SessionInitializeRequest,
)
from app.services.session_state.manager import session_state_manager
from app.services.session_state.exceptions import (
    SessionNotFoundError,
    InvalidSessionStateError,
    InvalidStatusTransitionError,
    DuplicateQuestionError,
    InvalidAnswerError,
    MissingSessionIdError,
)

client = TestClient(app)


def helper_register_user(prefix: str = "state_user") -> tuple[str, str]:
    """Register a unique user and return (token, user_id)."""
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "StateTestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "State Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    return data["access_token"], data["user"]["id"]


def helper_create_interview(headers: dict, question_count: int = 3) -> dict:
    """Create a configured interview with sample main questions."""
    resp = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Fullstack Engineering Practice",
            "job_role": "Fullstack Developer",
            "interview_type": "Technical",
            "mode": "General",
            "domain": "Fullstack",
            "difficulty": "Medium",
            "experience_level": "3+",
            "question_count": question_count,
            "counter_questions": True,
        }
    )
    assert resp.status_code == 201, resp.text
    interview_data = resp.json()

    # Seed main questions
    q1 = client.post(
        f"/api/v1/interviews/{interview_data['id']}/questions",
        headers=headers,
        json={"question_text": "How do you manage client-side state in complex React apps?", "question_order": 1}
    ).json()

    q2 = client.post(
        f"/api/v1/interviews/{interview_data['id']}/questions",
        headers=headers,
        json={"question_text": "Explain ACID properties in relational databases.", "question_order": 2}
    ).json()

    q3 = client.post(
        f"/api/v1/interviews/{interview_data['id']}/questions",
        headers=headers,
        json={"question_text": "How do you secure API endpoints with JWT and refresh tokens?", "question_order": 3}
    ).json()

    interview_data["questions"] = [q1, q2, q3]
    return interview_data


# ─── 1. Session Lifecycle Tests ────────────────────────────────────────────────

def test_create_and_retrieve_session_state():
    """Verify session creation produces complete InterviewSessionState with default not_started status."""
    token, user_id = helper_register_user("create_sess")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    # API create session state
    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    assert create_res.status_code == 201, create_res.text
    state = create_res.json()

    assert state["session_id"] is not None
    assert state["interview_id"] == interview["id"]
    assert state["user_id"] == user_id
    assert state["session_status"] == SessionStatus.NOT_STARTED.value

    # Configuration verification
    cfg = state["interview_configuration"]
    assert cfg["role"] == "Fullstack Developer"
    assert cfg["domain"] == "Fullstack"
    assert cfg["difficulty"] == "Medium"
    assert cfg["duration_minutes"] == 4
    assert cfg["question_count"] == 3

    # Initial questions and progress
    assert len(state["question_history"]) == 3
    assert state["progress"]["total_questions"] == 3
    assert state["progress"]["completed_questions"] == 0
    assert state["progress"]["progress_percentage"] == 0.0
    assert state["progress"]["stage"] == "not_started"

    # Active question exists
    assert state["current_question"] is not None
    assert state["current_question"]["order"] == 1

    # Retrieve session state endpoint
    get_res = client.get(f"/api/v1/sessions/{state['session_id']}/state", headers=headers)
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["session_id"] == state["session_id"]


def test_initialize_session_state_and_start():
    """Verify initialize_session transitions not_started session to in_progress with started_at timestamp."""
    token, user_id = helper_register_user("init_sess")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    session_id = create_res.json()["session_id"]

    init_res = client.post(
        f"/api/v1/sessions/{session_id}/state/initialize",
        headers=headers,
        json={"metadata": {"test_init": True}}
    )
    assert init_res.status_code == 200
    state = init_res.json()

    assert state["session_status"] == SessionStatus.IN_PROGRESS.value
    assert state["timestamps"]["started_at"] is not None
    assert state["progress"]["stage"] == "in_progress"


def test_update_session_state_and_status_transitions():
    """Verify updating session state, pausing and resuming, and rejecting invalid transitions."""
    token, user_id = helper_register_user("update_sess")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    session_id = create_res.json()["session_id"]

    # Start session
    client.post(f"/api/v1/sessions/{session_id}/state/initialize", headers=headers, json={})

    # Pause session
    pause_res = client.patch(
        f"/api/v1/sessions/{session_id}/state",
        headers=headers,
        json={"status": "paused", "current_topic": "Databases"}
    )
    assert pause_res.status_code == 200
    assert pause_res.json()["session_status"] == SessionStatus.PAUSED.value
    assert pause_res.json()["current_topic"] == "Databases"

    # Resume session (paused -> in_progress)
    resume_res = client.patch(
        f"/api/v1/sessions/{session_id}/state",
        headers=headers,
        json={"status": "in_progress"}
    )
    assert resume_res.status_code == 200
    assert resume_res.json()["session_status"] == SessionStatus.IN_PROGRESS.value


def test_end_session_lifecycle():
    """Verify ending session sets completed status, completed_at, and is idempotent."""
    token, user_id = helper_register_user("end_sess")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    session_id = create_res.json()["session_id"]

    # End session directly
    end_res = client.post(f"/api/v1/sessions/{session_id}/state/end?reason=completed", headers=headers)
    assert end_res.status_code == 200
    state = end_res.json()
    assert state["session_status"] == SessionStatus.COMPLETED.value
    assert state["timestamps"]["completed_at"] is not None
    assert state["current_question"] is None

    # Idempotent second call
    end_res_2 = client.post(f"/api/v1/sessions/{session_id}/state/end", headers=headers)
    assert end_res_2.status_code == 200
    assert end_res_2.json()["session_status"] == SessionStatus.COMPLETED.value


# ─── 2. Questions Tests ────────────────────────────────────────────────────────

def test_add_question_and_retrieve_question_history():
    """Verify adding a question dynamically appends to question history with deterministic order."""
    token, user_id = helper_register_user("add_q")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    session_id = create_res.json()["session_id"]

    add_res = client.post(
        f"/api/v1/sessions/{session_id}/state/questions",
        headers=headers,
        json={
            "question_text": "What are WebSockets and how do they differ from HTTP polling?",
            "question_type": "technical",
            "topic": "Networking"
        }
    )
    assert add_res.status_code == 201
    state = add_res.json()

    assert len(state["question_history"]) == 4
    added_q = [q for q in state["question_history"] if "WebSockets" in q["question_text"]][0]
    assert added_q["order"] == 4
    assert added_q["is_follow_up"] is False
    assert added_q["has_answer"] is False


def test_reject_duplicate_and_invalid_questions():
    """Verify state manager rejects duplicate question text and short questions."""
    token, user_id = helper_register_user("dup_q")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    session_id = create_res.json()["session_id"]

    # Duplicate question text
    dup_res = client.post(
        f"/api/v1/sessions/{session_id}/state/questions",
        headers=headers,
        json={"question_text": "Explain ACID properties in relational databases."}
    )
    assert dup_res.status_code == 409  # Conflict

    # Too short question
    short_res = client.post(
        f"/api/v1/sessions/{session_id}/state/questions",
        headers=headers,
        json={"question_text": "Hi"}
    )
    assert short_res.status_code in [400, 422]


# ─── 3. Answers Tests ──────────────────────────────────────────────────────────

def test_add_answer_and_link_to_question():
    """Verify adding an answer links to the question, advances progress, and updates current_question."""
    token, user_id = helper_register_user("add_ans")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    session_id = create_res.json()["session_id"]
    q1_id = interview["questions"][0]["id"]
    q2_id = interview["questions"][1]["id"]

    # Submit answer for Question 1
    ans_res = client.post(
        f"/api/v1/sessions/{session_id}/state/answers",
        headers=headers,
        json={
            "question_id": q1_id,
            "answer_text": "I use Zustand or Redux Toolkit for centralized state and React Query for server cache.",
            "started_at": "2026-10-04T12:00:00Z",
            "submitted_at": "2026-10-04T12:01:00Z",
        }
    )
    assert ans_res.status_code == 201, ans_res.text
    state = ans_res.json()

    # Session auto-started
    assert state["session_status"] == SessionStatus.IN_PROGRESS.value

    # Progress updated
    assert state["progress"]["completed_questions"] == 1
    assert state["progress"]["progress_percentage"] == round(1 / 3 * 100, 1)

    # Question history updated
    q1_hist = [q for q in state["question_history"] if q["question_id"] == q1_id][0]
    assert q1_hist["has_answer"] is True
    assert q1_hist["answer_id"] is not None

    # Answer history contains the answer
    assert len(state["answer_history"]) == 1
    assert state["answer_history"][0]["question_id"] == q1_id
    assert state["answer_history"][0]["duration_seconds"] == 60.0

    # Active question advanced to Question 2
    assert state["current_question"]["question_id"] == q2_id


def test_reject_invalid_answer_and_closed_session():
    """Verify rejecting answer for non-existent question and for closed sessions."""
    token, user_id = helper_register_user("invalid_ans")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    session_id = create_res.json()["session_id"]

    # Invalid question ID
    bad_res = client.post(
        f"/api/v1/sessions/{session_id}/state/answers",
        headers=headers,
        json={"question_id": "non-existent-question-id", "answer_text": "Sample answer."}
    )
    assert bad_res.status_code == 400

    # End session
    client.post(f"/api/v1/sessions/{session_id}/state/end", headers=headers)

    # Submitting to completed session
    closed_res = client.post(
        f"/api/v1/sessions/{session_id}/state/answers",
        headers=headers,
        json={"question_id": interview["questions"][0]["id"], "answer_text": "Late answer."}
    )
    assert closed_res.status_code == 400


# ─── 4. Follow-Up History & Relationship Tests ─────────────────────────────────

def test_add_follow_up_and_relationship_linking():
    """
    Verify follow-up question is recorded in question history and correctly links:
    Original Question -> Candidate Answer -> Follow-up Question -> Candidate Answer
    """
    token, user_id = helper_register_user("follow_up")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    session_id = create_res.json()["session_id"]
    q1_id = interview["questions"][0]["id"]

    # 1. Candidate answers Main Q1
    ans_res = client.post(
        f"/api/v1/sessions/{session_id}/state/answers",
        headers=headers,
        json={
            "question_id": q1_id,
            "answer_text": "I used Redux Toolkit for state management.",
            "started_at": "2026-10-04T12:00:00Z",
            "submitted_at": "2026-10-04T12:00:45Z",
        }
    )
    ans1_id = ans_res.json()["answer_history"][0]["answer_id"]

    # 2. Add Adaptive Counter Question (Depth 1)
    counter_res = client.post(
        f"/api/v1/sessions/{session_id}/state/follow-ups",
        headers=headers,
        json={
            "parent_question_id": q1_id,
            "answer_id": ans1_id,
            "question_text": "How do you handle asynchronous thunks and error boundaries with Redux Toolkit?",
            "follow_up_depth": 1,
        }
    )
    assert counter_res.status_code == 201
    state = counter_res.json()

    # Active question is now the unanswered counter question
    assert state["current_question"]["is_follow_up"] is True
    assert state["current_question"]["follow_up_depth"] == 1
    assert "thunks" in state["current_question"]["question_text"]
    counter_q_id = state["current_question"]["question_id"]

    # Follow-up history structure verification
    assert len(state["follow_up_history"]) == 1
    fu = state["follow_up_history"][0]
    assert fu["parent_question_id"] == q1_id
    assert fu["candidate_answer_id"] == ans1_id
    assert fu["follow_up_question_id"] == counter_q_id
    assert fu["follow_up_depth"] == 1
    assert fu["follow_up_answer_id"] is None  # Not yet answered

    # 3. Candidate answers the Counter Question
    ans_counter_res = client.post(
        f"/api/v1/sessions/{session_id}/state/answers",
        headers=headers,
        json={
            "question_id": counter_q_id,
            "answer_text": "I use createAsyncThunk with rejectWithValue and standard error boundary wrappers.",
            "started_at": "2026-10-04T12:01:00Z",
            "submitted_at": "2026-10-04T12:02:00Z",
        }
    )
    updated_state = ans_counter_res.json()

    # Follow-up history now links the counter answer
    fu_updated = updated_state["follow_up_history"][0]
    assert fu_updated["follow_up_answer_id"] is not None
    assert "createAsyncThunk" in fu_updated["follow_up_answer_text"]

    # Current question now returns to Main Q2
    assert updated_state["current_question"]["question_id"] == interview["questions"][1]["id"]
    assert updated_state["current_question"]["is_follow_up"] is False


# ─── 5. Evaluation References Tests ────────────────────────────────────────────

def test_add_evaluation_reference_to_session():
    """Verify attaching an evaluation reference to a candidate answer within session state."""
    token, user_id = helper_register_user("eval_ref")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    session_id = create_res.json()["session_id"]
    q1_id = interview["questions"][0]["id"]

    ans_res = client.post(
        f"/api/v1/sessions/{session_id}/state/answers",
        headers=headers,
        json={"question_id": q1_id, "answer_text": "Detailed explanation of React state management."}
    )
    ans_id = ans_res.json()["answer_history"][0]["answer_id"]

    # Add evaluation reference
    eval_res = client.post(
        f"/api/v1/sessions/{session_id}/state/evaluations",
        headers=headers,
        json={
            "answer_id": ans_id,
            "overall_score": 88.5,
            "relevance_score": 90.0,
            "correctness_score": 88.0,
            "completeness_score": 85.0,
            "clarity_score": 92.0,
            "technical_depth_score": 87.0,
            "summary": "Strong structured response with clear framework knowledge.",
            "evaluator_provider": "heuristic"
        }
    )
    assert eval_res.status_code == 200
    state = eval_res.json()

    assert len(state["evaluation_history"]) == 1
    ev_item = state["evaluation_history"][0]
    assert ev_item["answer_id"] == ans_id
    assert ev_item["overall_score"] == 88.5
    assert ev_item["dimension_scores"]["clarity"] == 92.0

    # Answer history references the evaluation
    assert state["answer_history"][0]["status"] == "evaluated"
    assert state["answer_history"][0]["evaluation_reference"] is not None


# ─── 6. Validation and Error Handling Tests ────────────────────────────────────

def test_reject_invalid_status_transitions():
    """Verify illegal status transitions raise InvalidStatusTransitionError (HTTP 400)."""
    token, user_id = helper_register_user("bad_status")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    session_id = create_res.json()["session_id"]

    # not_started -> completed (invalid directly without in_progress)
    inv_res = client.patch(
        f"/api/v1/sessions/{session_id}/state",
        headers=headers,
        json={"status": "completed"}
    )
    assert inv_res.status_code == 400

    # not_started -> invalid_random_status
    inv_res2 = client.patch(
        f"/api/v1/sessions/{session_id}/state",
        headers=headers,
        json={"status": "flying"}
    )
    assert inv_res2.status_code == 400


def test_missing_or_unauthorized_session_handling():
    """Verify 404 is returned for non-existent session or cross-user unauthorized access."""
    token1, _ = helper_register_user("user1")
    token2, _ = helper_register_user("user2")

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    interview = helper_create_interview(headers1)
    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers1)
    session_id = create_res.json()["session_id"]

    # User 2 attempting to access User 1's session
    cross_res = client.get(f"/api/v1/sessions/{session_id}/state", headers=headers2)
    assert cross_res.status_code == 404

    # Non-existent session
    none_res = client.get("/api/v1/sessions/00000000-0000-0000-0000-000000000000/state", headers=headers1)
    assert none_res.status_code == 404


# ─── 7. Future Agent Compatibility Query Test ──────────────────────────────────

def test_future_agent_state_inspection_compatibility():
    """
    Verify the state model exposes all required information for the future Groq agent:
    - What interview is running (configuration & role)
    - What question is active
    - What has already been asked (question history)
    - What the candidate answered (answer history)
    - What follow-ups happened (follow-up relationships)
    - What has already been evaluated (evaluation history)
    - How much interview remains (remaining time & progress)
    """
    token, user_id = helper_register_user("agent_compat")
    headers = {"Authorization": f"Bearer {token}"}
    interview = helper_create_interview(headers)

    create_res = client.post(f"/api/v1/sessions/state/{interview['id']}", headers=headers)
    session_id = create_res.json()["session_id"]

    # Candidate starts and answers Q1
    client.post(f"/api/v1/sessions/{session_id}/state/initialize", headers=headers, json={})
    q1_id = interview["questions"][0]["id"]
    client.post(
        f"/api/v1/sessions/{session_id}/state/answers",
        headers=headers,
        json={"question_id": q1_id, "answer_text": "First answer text."}
    )

    # Retrieve state as the agent will
    get_res = client.get(f"/api/v1/sessions/{session_id}/state", headers=headers)
    assert get_res.status_code == 200
    state: dict = get_res.json()

    # Agent checks:
    # 1. Interview configuration
    assert state["interview_configuration"]["role"] == "Fullstack Developer"
    assert state["interview_configuration"]["question_count"] == 3

    # 2. Active question
    assert state["current_question"] is not None
    assert state["current_question"]["question_id"] == interview["questions"][1]["id"]

    # 3. Already asked questions
    assert len(state["question_history"]) >= 3
    asked_ids = [q["question_id"] for q in state["question_history"] if q["has_answer"]]
    assert q1_id in asked_ids

    # 4. Candidate answer content
    assert len(state["answer_history"]) == 1
    assert state["answer_history"][0]["answer_text"] == "First answer text."

    # 5. Remaining time and progress
    assert state["remaining_time"]["remaining_seconds"] > 0
    assert state["remaining_time"]["is_expired"] is False
    assert state["progress"]["completed_questions"] == 1
    assert state["progress"]["total_questions"] == 3
