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
        interview_meta={"interview_type": "Technical", "domain": "Frontend", "duration_seconds": 35.0}
    )

    assert 0.0 <= res["relevance_score"] <= 100.0
    assert 0.0 <= res["correctness_score"] <= 100.0
    assert 0.0 <= res["completeness_score"] <= 100.0
    assert 0.0 <= res["clarity_score"] <= 100.0
    assert 0.0 <= res["technical_depth_score"] <= 100.0
    assert 0.0 <= res["grammar_score"] <= 100.0
    assert 0.0 <= res["timing_score"] <= 100.0

    expected_overall = round(
        res["correctness_score"] * 0.25 +
        res["relevance_score"] * 0.15 +
        res["technical_depth_score"] * 0.20 +
        res["completeness_score"] * 0.15 +
        res["communication_score"] * 0.10 +
        res["grammar_score"] * 0.05 +
        res["timing_score"] * 0.10,
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


def test_excellent_answer_evaluation():
    evaluator = AnswerEvaluator()
    res = evaluator.evaluate(
        question_text="Explain database indexing in PostgreSQL.",
        answer_text="PostgreSQL B-Tree and GIN indexes speed up query execution by reducing table scans. Using EXPLAIN ANALYZE helps verify index usage.",
        interview_meta={"interview_type": "Technical", "domain": "Backend", "difficulty": "Hard"}
    )
    assert res["relevance_score"] >= 80.0
    assert res["correctness_score"] >= 80.0
    assert res["clarity_score"] >= 80.0
    assert res["overall_score"] >= 80.0
    assert len(res["strengths"]) >= 1


def test_irrelevant_answer_evaluation():
    evaluator = AnswerEvaluator()
    res = evaluator.evaluate(
        question_text="What is database index query optimization?",
        answer_text="I really enjoy playing football and watching sports on weekends with my friends. The weather is great today.",
        interview_meta={"interview_type": "Technical", "domain": "Backend"}
    )
    assert res["relevance_score"] <= 40.0
    assert "off-topic" in res["summary"].lower() or "failed to address" in res["summary"].lower()


def test_very_short_answer_evaluation():
    evaluator = AnswerEvaluator()
    res = evaluator.evaluate(
        question_text="What is REST?",
        answer_text="Representational State Transfer.",
        interview_meta={"interview_type": "Technical"}
    )
    assert res["overall_score"] > 50.0
    assert res["relevance_score"] >= 80.0


def test_long_answer_evaluation():
    evaluator = AnswerEvaluator()
    long_text = "In software engineering, architectural patterns like microservices and event-driven architecture allow decoupled scaling. " * 30
    res = evaluator.evaluate(
        question_text="Discuss microservices architecture patterns.",
        answer_text=long_text,
        interview_meta={"interview_type": "Technical"}
    )
    assert res["overall_score"] > 70.0
    assert 0.0 <= res["overall_score"] <= 100.0


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


def test_timing_evaluation_deterministic_scoring():
    from app.core.scoring_config import calculate_timing_score
    # Empty answer
    assert calculate_timing_score(0.0, 0, "") == 0.0

    # Rushed answer (<5s with few words)
    rushed_score = calculate_timing_score(3.0, 4, "Too short answer.")
    assert rushed_score == 55.0

    # Optimal answer (30s with 40 words)
    optimal_score = calculate_timing_score(30.0, 40, "Good length response.")
    assert optimal_score == 98.0

    # Extended answer (180s)
    extended_score = calculate_timing_score(180.0, 100, "Very long answer.")
    assert extended_score == 75.0


def test_grammar_evaluation_deterministic_scoring():
    from app.core.scoring_config import calculate_grammar_score
    # Empty
    assert calculate_grammar_score("") == 0.0

    # Well structured sentence with proper capitalization and terminal punctuation
    good_score = calculate_grammar_score("This is a well formed technical explanation with proper structure.")
    assert good_score >= 85.0

    # Repeated words penalty
    repeated_score = calculate_grammar_score("the the the code code fails")
    assert repeated_score < 80.0


def test_behavioral_vs_technical_question_type_scoring():
    from app.core.scoring_config import calculate_weighted_overall_score
    dims = {
        "correctness": 80.0,
        "relevance": 90.0,
        "technical_accuracy": 60.0,
        "completeness": 85.0,
        "communication": 90.0,
        "grammar": 90.0,
        "timing": 95.0,
    }
    tech_overall = calculate_weighted_overall_score(dims, question_type="Technical")
    behav_overall = calculate_weighted_overall_score(dims, question_type="Behavioral")

    assert 0.0 <= tech_overall <= 100.0
    assert 0.0 <= behav_overall <= 100.0
    # Behavioral should weigh communication/relevance higher than technical accuracy
    assert behav_overall >= tech_overall


def test_deterministic_scoring_reproducibility():
    evaluator = AnswerEvaluator()
    q = "Explain caching with Redis in a web application."
    a = "Redis is an in-memory key-value store used to cache database query results and reduce backend load."
    res1 = evaluator.evaluate(question_text=q, answer_text=a, interview_meta={"interview_type": "Technical", "duration_seconds": 25.0})
    res2 = evaluator.evaluate(question_text=q, answer_text=a, interview_meta={"interview_type": "Technical", "duration_seconds": 25.0})

    assert res1["overall_score"] == res2["overall_score"]
    assert res1["correctness_score"] == res2["correctness_score"]
    assert res1["relevance_score"] == res2["relevance_score"]
    assert res1["timing_score"] == res2["timing_score"]
    assert res1["grammar_score"] == res2["grammar_score"]

