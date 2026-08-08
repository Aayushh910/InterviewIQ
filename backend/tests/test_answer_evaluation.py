import uuid
from fastapi.testclient import TestClient
from main import app
from app.ai.evaluation.answer.evaluator import AnswerEvaluator, clamp_score

client = TestClient(app)


def helper_register_user():
    email = f"eval_candidate_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "TestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Eval Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def create_test_interview_and_session(token: str, interview_type: str = "Technical"):
    headers = {"Authorization": f"Bearer {token}"}
    interview = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": f"{interview_type} Practice",
            "interview_type": interview_type,
            "domain": "Backend",
            "difficulty": "Medium",
            "experience_level": "2+",
            "question_count": 1
        }
    ).json()

    q_resp = client.post(
        f"/api/v1/interviews/{interview['id']}/questions",
        headers=headers,
        json={"question_text": "How do you optimize database query execution?", "question_order": 1}
    ).json()

    sess = client.post(f"/api/v1/interviews/{interview['id']}/sessions", headers=headers).json()
    client.post(f"/api/v1/sessions/{sess['id']}/start", headers=headers)

    return interview, sess, q_resp


def test_score_clamping_and_weighted_formula():
    assert clamp_score(150.0) == 100.0
    assert clamp_score(-20.0) == 0.0
    assert clamp_score(75.5) == 75.5

    evaluator = AnswerEvaluator()
    res = evaluator.evaluate(
        question_text="Explain React Virtual DOM diffing.",
        answer_text="React creates a Virtual DOM tree representation and uses Fiber reconciliation to compare changes efficiently.",
        interview_meta={"interview_type": "Technical", "domain": "Frontend"}
    )

    assert 0.0 <= res["relevance_score"] <= 100.0
    assert 0.0 <= res["correctness_score"] <= 100.0
    assert 0.0 <= res["completeness_score"] <= 100.0
    assert 0.0 <= res["clarity_score"] <= 100.0
    assert 0.0 <= res["technical_depth_score"] <= 100.0

    expected_overall = round(
        res["relevance_score"] * 0.20 +
        res["correctness_score"] * 0.30 +
        res["completeness_score"] * 0.20 +
        res["clarity_score"] * 0.15 +
        res["technical_depth_score"] * 0.15,
        2
    )
    assert res["overall_score"] == expected_overall


def test_empty_answer_evaluation():
    evaluator = AnswerEvaluator()
    res = evaluator.evaluate(
        question_text="How do you handle API rate limiting?",
        answer_text="",
        interview_meta={"interview_type": "Technical"}
    )
    assert res["overall_score"] == 0.0
    assert "No substantive candidate answer" in res["summary"]


def test_answer_evaluation_endpoint_unauthenticated():
    resp = client.post("/api/v1/analysis/evaluation/answer", json={"answer_id": "fake_id"})
    assert resp.status_code == 401


def test_answer_evaluation_api_flow_and_ownership():
    token = helper_register_user()
    headers = {"Authorization": f"Bearer {token}"}

    other_token = helper_register_user()
    other_headers = {"Authorization": f"Bearer {other_token}"}

    interview, session, question = create_test_interview_and_session(token)

    # Submit Answer
    ans_resp = client.post(
        f"/api/v1/sessions/{session['id']}/answers",
        headers=headers,
        json={
            "question_id": question["id"],
            "answer_text": "I used PostgreSQL query indexing, EXPLAIN ANALYZE, and Redis caching to optimize slow API queries."
        }
    )
    assert ans_resp.status_code == 201
    ans_data = ans_resp.json()
    answer_id = ans_data["id"]

    # Verify automatic evaluation attached to submit_answer response
    assert "evaluation" in ans_data
    assert ans_data["evaluation"] is not None
    assert ans_data["evaluation"]["overall_score"] > 50.0
    assert len(ans_data["evaluation"]["strengths"]) >= 1

    # Call POST /api/v1/analysis/evaluation/answer explicitly
    eval_resp = client.post(
        "/api/v1/analysis/evaluation/answer",
        headers=headers,
        json={"answer_id": answer_id}
    )
    assert eval_resp.status_code == 200, eval_resp.text
    eval_data = eval_resp.json()

    assert eval_data["answer_id"] == answer_id
    assert "relevance" in eval_data
    assert "correctness" in eval_data
    assert "completeness" in eval_data
    assert "clarity" in eval_data
    assert "technical_depth" in eval_data
    assert "overall_score" in eval_data
    assert isinstance(eval_data["strengths"], list)
    assert isinstance(eval_data["improvements"], list)

    # Verify security: Unauthorized user cannot evaluate another candidate's answer
    unauth_eval = client.post(
        "/api/v1/analysis/evaluation/answer",
        headers=other_headers,
        json={"answer_id": answer_id}
    )
    assert unauth_eval.status_code in [403, 404]
