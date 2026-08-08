import uuid
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def helper_register_user(name="Test User", email=None):
    if not email:
        email = f"user_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": name, "email": email, "password": password}
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    return data["access_token"], data["user"], email, password


def test_interview_unauthenticated_rejection():
    resp = client.post("/api/v1/interviews", json={"title": "Unauthorized Interview"})
    assert resp.status_code == 401

    resp = client.get("/api/v1/interviews")
    assert resp.status_code == 401


def test_interview_crud_and_ownership():
    token1, user1, _, _ = helper_register_user("User One")
    headers1 = {"Authorization": f"Bearer {token1}"}

    token2, user2, _, _ = helper_register_user("User Two")
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 1. Create interview for User 1
    create_resp = client.post(
        "/api/v1/interviews",
        headers=headers1,
        json={
            "title": "User 1 Frontend Interview",
            "job_role": "Frontend Engineer",
            "interview_type": "Technical",
            "mode": "General",
            "domain": "Frontend",
            "difficulty": "Hard",
            "experience_level": "3+",
            "question_count": 5,
            "counter_questions": True,
            "status": "ready"
        }
    )
    assert create_resp.status_code == 201, create_resp.text
    int1 = create_resp.json()
    assert int1["user_id"] == user1["id"]
    assert int1["title"] == "User 1 Frontend Interview"

    # 2. Get User 1 interviews
    list1 = client.get("/api/v1/interviews", headers=headers1)
    assert list1.status_code == 200
    assert len(list1.json()) >= 1
    assert any(i["id"] == int1["id"] for i in list1.json())

    # 3. User 2 should NOT see User 1's interview in list
    list2 = client.get("/api/v1/interviews", headers=headers2)
    assert list2.status_code == 200
    assert not any(i["id"] == int1["id"] for i in list2.json())

    # 4. User 2 cannot access User 1's interview by ID
    get_unauth = client.get(f"/api/v1/interviews/{int1['id']}", headers=headers2)
    assert get_unauth.status_code == 404

    # 5. User 1 can retrieve own interview
    get_auth = client.get(f"/api/v1/interviews/{int1['id']}", headers=headers1)
    assert get_auth.status_code == 200
    assert get_auth.json()["id"] == int1["id"]

    # 6. User 1 updates owned interview
    patch_resp = client.patch(
        f"/api/v1/interviews/{int1['id']}",
        headers=headers1,
        json={"difficulty": "Easy", "title": "Updated Title"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["difficulty"] == "Easy"
    assert patch_resp.json()["title"] == "Updated Title"

    # 7. User 2 cannot update User 1's interview
    patch_unauth = client.patch(
        f"/api/v1/interviews/{int1['id']}",
        headers=headers2,
        json={"difficulty": "Medium"}
    )
    assert patch_unauth.status_code == 404

    # 8. User 2 cannot delete User 1's interview
    del_unauth = client.delete(f"/api/v1/interviews/{int1['id']}", headers=headers2)
    assert del_unauth.status_code == 404

    # 9. User 1 deletes own interview
    del_auth = client.delete(f"/api/v1/interviews/{int1['id']}", headers=headers1)
    assert del_auth.status_code == 204

    # Verify deleted
    get_after_del = client.get(f"/api/v1/interviews/{int1['id']}", headers=headers1)
    assert get_after_del.status_code == 404


def test_questions_sessions_answers_flow():
    token, user, _, _ = helper_register_user("Candidate Flow")
    headers = {"Authorization": f"Bearer {token}"}

    other_token, _, _, _ = helper_register_user("Other Candidate")
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # 1. Create Interview
    create_int = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "job_role": "Backend Engineer",
            "interview_type": "Technical",
            "domain": "Python",
            "question_count": 2
        }
    )
    assert create_int.status_code == 201
    interview_id = create_int.json()["id"]

    # 2. Add Questions
    q1_resp = client.post(
        f"/api/v1/interviews/{interview_id}/questions",
        headers=headers,
        json={
            "question_text": "What is Python GIL and how does it affect concurrency?",
            "question_order": 1,
            "question_type": "technical"
        }
    )
    assert q1_resp.status_code == 201
    q1 = q1_resp.json()

    q2_resp = client.post(
        f"/api/v1/interviews/{interview_id}/questions",
        headers=headers,
        json={
            "question_text": "How do Python asyncio event loops handle I/O bound tasks?",
            "question_order": 2,
            "question_type": "technical"
        }
    )
    assert q2_resp.status_code == 201
    q2 = q2_resp.json()

    # 3. Retrieve Questions (Verify Ordering)
    get_q_resp = client.get(f"/api/v1/interviews/{interview_id}/questions", headers=headers)
    assert get_q_resp.status_code == 200
    questions = get_q_resp.json()
    assert len(questions) == 2
    assert questions[0]["question_order"] == 1
    assert questions[1]["question_order"] == 2

    # 4. Create Session
    session_resp = client.post(f"/api/v1/interviews/{interview_id}/sessions", headers=headers)
    assert session_resp.status_code == 201
    session_id = session_resp.json()["id"]
    assert session_resp.json()["status"] == "not_started"

    # Verify session retrieval
    get_sess = client.get(f"/api/v1/sessions/{session_id}", headers=headers)
    assert get_sess.status_code == 200
    assert get_sess.json()["status"] == "not_started"

    # Other user cannot access session
    unauth_sess = client.get(f"/api/v1/sessions/{session_id}", headers=other_headers)
    assert unauth_sess.status_code == 404

    # 5. Start Session
    start_resp = client.post(f"/api/v1/sessions/{session_id}/start", headers=headers)
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "in_progress"
    assert start_resp.json()["started_at"] is not None

    # 6. Submit Answer to Question 1
    ans1_resp = client.post(
        f"/api/v1/sessions/{session_id}/answers",
        headers=headers,
        json={
            "question_id": q1["id"],
            "answer_text": "The GIL (Global Interpreter Lock) prevents multiple native threads from executing Python bytecodes simultaneously in CPython."
        }
    )
    assert ans1_resp.status_code == 201
    ans1 = ans1_resp.json()
    assert ans1["answer_text"].startswith("The GIL")

    # 7. Submit Answer to Question 2
    ans2_resp = client.post(
        f"/api/v1/sessions/{session_id}/answers",
        headers=headers,
        json={
            "question_id": q2["id"],
            "answer_text": "Asyncio uses single-threaded event loops with cooperative multitasking for non-blocking I/O operations."
        }
    )
    assert ans2_resp.status_code == 201

    # 8. Retrieve Session Answers
    get_ans = client.get(f"/api/v1/sessions/{session_id}/answers", headers=headers)
    assert get_ans.status_code == 200
    answers = get_ans.json()
    assert len(answers) == 2

    # Get specific answer
    get_ans1 = client.get(f"/api/v1/sessions/{session_id}/answers/{ans1['id']}", headers=headers)
    assert get_ans1.status_code == 200
    assert get_ans1.json()["id"] == ans1["id"]

    # Other user cannot get answers
    unauth_ans = client.get(f"/api/v1/sessions/{session_id}/answers", headers=other_headers)
    assert unauth_ans.status_code == 404

    # 9. Complete Session
    comp_resp = client.post(f"/api/v1/sessions/{session_id}/complete", headers=headers)
    assert comp_resp.status_code == 200
    assert comp_resp.json()["status"] == "completed"
    assert comp_resp.json()["completed_at"] is not None

    # 10. Cannot submit answer to a completed session
    post_comp_ans = client.post(
        f"/api/v1/sessions/{session_id}/answers",
        headers=headers,
        json={
            "question_id": q1["id"],
            "answer_text": "Trying to update answer after session completed."
        }
    )
    assert post_comp_ans.status_code == 400


def test_invalid_question_answer_submission():
    token1, _, _, _ = helper_register_user("User A")
    headers1 = {"Authorization": f"Bearer {token1}"}

    token2, _, _, _ = helper_register_user("User B")
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Create interview & question for User 1
    int1 = client.post("/api/v1/interviews", headers=headers1, json={"title": "Int 1"}).json()
    sess1 = client.post(f"/api/v1/interviews/{int1['id']}/sessions", headers=headers1).json()

    # Create interview & question for User 2
    int2 = client.post("/api/v1/interviews", headers=headers2, json={"title": "Int 2"}).json()
    q2 = client.post(
        f"/api/v1/interviews/{int2['id']}/questions",
        headers=headers2,
        json={"question_text": "Unrelated question", "question_order": 1}
    ).json()

    # Start session 1
    client.post(f"/api/v1/sessions/{sess1['id']}/start", headers=headers1)

    # User 1 attempts to submit User 2's question ID to User 1's session -> must be rejected with 400
    invalid_sub = client.post(
        f"/api/v1/sessions/{sess1['id']}/answers",
        headers=headers1,
        json={
            "question_id": q2["id"],
            "answer_text": "Answering question from another interview"
        }
    )
    assert invalid_sub.status_code == 400
