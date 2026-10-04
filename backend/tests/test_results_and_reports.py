"""
Comprehensive test suite for Phase 13: Results Dashboard & Interview Report System.
Validates:
- ResultsService: DTO mapping, 5 answer dimensions, telemetry extraction, no raw DB IDs.
- Results API: GET /api/v1/results/sessions/{session_id}, schema compliance, 200 OK.
- Results Security: Cross-user 403, non-existent session 404, uncomputed evaluation 404.
- ReportService: Server-side PDF compilation with ReportLab, %PDF- magic header, valid size.
- Reports API: GET /api/v1/reports/sessions/{session_id}/pdf, application/pdf header, Content-Disposition.
- Reports Security: Cross-user PDF download 403 Forbidden.
- GenerateInterviewReportTool: Operational tool execution with context.
"""

import uuid
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from main import app
from app.core.database import SessionLocal
from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.interview_question import InterviewQuestion
from app.models.answer import Answer
from app.models.answer_evaluation import AnswerEvaluation
from app.models.multimodal_evidence import MultimodalEvidence
from app.models.final_evaluation import FinalEvaluation
from app.evaluation.evaluator import final_evaluator
from app.services.results_service import results_service
from app.services.report_service import report_service
from app.schemas.results import CandidateResultsDTO
from app.tools.future.contracts import GenerateInterviewReportTool, GenerateInterviewReportInput
from app.tools.base.context import ToolExecutionContext

client = TestClient(app)


def helper_register_user(prefix: str = "res_test") -> tuple[str, str]:
    """Helper to register a unique candidate user and return (token, user_id)."""
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "ResultsPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Alex Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    return data["access_token"], data["user"]["id"]


@pytest.fixture(scope="module")
def populated_session():
    """Module-scoped fixture to create and evaluate an interview session once."""
    db: Session = SessionLocal()
    token, user_id = helper_register_user("mod_owner")

    interview = Interview(
        user_id=user_id,
        title="Full Stack Python & React Interview",
        job_role="Full Stack Engineer",
        domain="Full Stack",
        difficulty="Medium",
        interview_type="Technical",
        question_count=2,
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    session = InterviewSession(
        interview_id=interview.id,
        status="completed",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    for i in range(2):
        iq = InterviewQuestion(
            interview_id=interview.id,
            question_text=f"Explain technical concept {i + 1} and its trade-offs.",
            question_order=i + 1,
            question_type="technical",
        )
        db.add(iq)
        db.commit()
        db.refresh(iq)

        ans = Answer(
            session_id=session.id,
            question_id=iq.id,
            answer_text=f"Here is my structured answer for question {i + 1} addressing trade-offs.",
            started_at=datetime.utcnow(),
            submitted_at=datetime.utcnow(),
        )
        db.add(ans)
        db.commit()
        db.refresh(ans)

        eval_rec = AnswerEvaluation(
            answer_id=ans.id,
            overall_score=85.0 + (i * 3.0),
            correctness_score=88.0,
            relevance_score=90.0,
            technical_depth_score=84.0,
            completeness_score=82.0,
            clarity_score=86.0,
            strengths=[f"Strong conceptual clarity on topic {i + 1}", "Direct and concise answer"],
            improvements=[f"Provide deeper architectural trade-offs on topic {i + 1}"],
            summary=f"Solid performance on question {i + 1}.",
            evaluator_provider="heuristic",
        )
        db.add(eval_rec)

        vis_ev = MultimodalEvidence(
            session_id=session.id,
            question_id=iq.id,
            answer_id=ans.id,
            evidence_type="face",
            status="available",
            confidence_score=0.95,
            raw_evidence={"face_detected": True, "position_quality": 0.90},
            derived_indicators={"face_presence_ratio": 0.96, "camera_alignment": 0.92, "position_quality": 0.90},
            observations=["Consistent eye contact and framing"],
        )
        beh_ev = MultimodalEvidence(
            session_id=session.id,
            question_id=iq.id,
            answer_id=ans.id,
            evidence_type="behavior",
            status="available",
            confidence_score=0.95,
            raw_evidence={"response_duration_seconds": 45.0, "pause_count": 2, "filler_word_count": 1},
            derived_indicators={"speaking_rate_wpm": 142.0, "speaking_ratio": 0.88},
            observations=["Smooth conversational cadence"],
        )
        db.add_all([vis_ev, beh_ev])
        db.commit()

    # Calculate authoritative Phase 12 evaluation
    final_eval = final_evaluator.evaluate_interview_session(db, session.id, user_id)

    data = {
        "db": db,
        "token": token,
        "user_id": user_id,
        "interview": interview,
        "session": session,
        "final_eval": final_eval,
    }
    yield data
    db.close()


# ─── 1. Results Service Unit Tests ────────────────────────────────────────────

def test_results_service_mapping(populated_session):
    db = populated_session["db"]
    session_id = populated_session["session"].id
    user_id = populated_session["user_id"]
    final_eval = populated_session["final_eval"]

    dto = results_service.get_candidate_results(db, session_id, user_id)
    assert isinstance(dto, CandidateResultsDTO)

    # Core assertions
    assert dto.session_id == session_id
    assert dto.overall_score == final_eval.overall_score
    assert dto.performance_category == final_eval.performance_category
    assert dto.evaluation_summary == final_eval.summary
    assert dto.report_version == "1.0"
    assert dto.pdf_download_url == f"/api/v1/reports/sessions/{session_id}/pdf"

    # Answer Quality 5 dimensions
    assert dto.answer_quality.score == final_eval.answer_quality_score
    assert len(dto.answer_quality.dimensions) == 5
    dim_keys = [d.dimension_key for d in dto.answer_quality.dimensions]
    assert "correctness" in dim_keys
    assert "technical_depth" in dim_keys
    assert "relevance" in dim_keys
    assert "completeness" in dim_keys
    assert "clarity" in dim_keys

    # Communication breakdown
    assert dto.communication.is_available is True
    assert dto.communication.score == final_eval.communication_score
    assert dto.communication.signals.speaking_rate_wpm is not None
    assert dto.communication.signals.filler_word_count is not None

    # Visual breakdown
    assert dto.visual_presentation.is_available is True
    assert dto.visual_presentation.score == final_eval.visual_presentation_score
    assert dto.visual_presentation.signals.face_presence_pct is not None
    assert dto.visual_presentation.signals.camera_alignment_pct is not None

    # Questions mapping (NO raw DB IDs)
    assert len(dto.questions) == 2
    for q in dto.questions:
        assert q.question_number in [1, 2]
        assert q.question_type in ["Main Question", "Follow-up Question"]
        assert not hasattr(q, "question_id")  # Verified no DB ID leakage
        assert not hasattr(q, "answer_id")
        assert q.combined_score > 0
        assert q.answer_score > 0

    # Strengths & Improvements
    assert len(dto.strengths) > 0
    assert len(dto.improvements) > 0

    # Transparency
    assert dto.transparency.scoring_version == "1.0"
    assert len(dto.transparency.methodology) > 0


def test_results_service_missing_telemetry_renormalization():
    db = SessionLocal()
    try:
        _, user_id = helper_register_user("res_notel")
        interview = Interview(
            user_id=user_id,
            title="Frontend Minimal Session",
            job_role="Frontend Engineer",
            domain="Frontend",
            difficulty="Easy",
            interview_type="Technical",
            question_count=1,
        )
        db.add(interview)
        db.commit()
        db.refresh(interview)

        session = InterviewSession(
            interview_id=interview.id,
            status="completed",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        iq = InterviewQuestion(
            interview_id=interview.id,
            question_text="What is React virtual DOM?",
            question_order=1,
            question_type="technical",
        )
        db.add(iq)
        db.commit()
        db.refresh(iq)

        ans = Answer(
            session_id=session.id,
            question_id=iq.id,
            answer_text="Virtual DOM is a lightweight JS representation of the real DOM.",
            started_at=datetime.utcnow(),
            submitted_at=datetime.utcnow(),
        )
        db.add(ans)
        db.commit()
        db.refresh(ans)

        eval_rec = AnswerEvaluation(
            answer_id=ans.id,
            overall_score=88.0,
            correctness_score=90.0,
            relevance_score=92.0,
            technical_depth_score=85.0,
            completeness_score=84.0,
            clarity_score=89.0,
            strengths=["Clear concise definition"],
            improvements=["Mention reconciliation algorithm"],
            summary="Strong basic response.",
            evaluator_provider="heuristic",
        )
        db.add(eval_rec)
        db.commit()

        final_eval = final_evaluator.evaluate_interview_session(db, session.id, user_id)
        assert final_eval.communication_score is None
        assert final_eval.visual_presentation_score is None

        dto = results_service.get_candidate_results(db, session.id, user_id)
        assert dto.communication.is_available is False
        assert dto.communication.score is None
        assert dto.visual_presentation.is_available is False
        assert dto.visual_presentation.score is None

        # Weight should renormalize dynamically to 100% answer quality
        assert dto.answer_quality.applied_weight_pct == 100.0
        assert dto.overall_score == final_eval.answer_quality_score
    finally:
        db.close()


# ─── 2. Results API HTTP Tests ────────────────────────────────────────────────

def test_results_api_success(populated_session):
    session_id = populated_session["session"].id
    token = populated_session["token"]

    resp = client.get(
        f"/api/v1/results/sessions/{session_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["session_id"] == session_id
    assert "overall_score" in data
    assert "performance_category" in data
    assert "answer_quality" in data
    assert "communication" in data
    assert "visual_presentation" in data
    assert "questions" in data
    assert "strengths" in data
    assert "improvements" in data
    assert "evidence_coverage" in data
    assert "transparency" in data


def test_results_api_unauthorized_cross_user(populated_session):
    session_id = populated_session["session"].id
    intruder_token, _ = helper_register_user("intruder")

    # Intruder user attempts to access owner's session results
    resp = client.get(
        f"/api/v1/results/sessions/{session_id}",
        headers={"Authorization": f"Bearer {intruder_token}"}
    )
    assert resp.status_code == 403
    assert "Unauthorized" in resp.json()["detail"]


def test_results_api_session_not_found():
    token, _ = helper_register_user("res_404")
    fake_session_id = str(uuid.uuid4())
    resp = client.get(
        f"/api/v1/results/sessions/{fake_session_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 404


def test_results_api_missing_evaluation():
    db = SessionLocal()
    try:
        token, user_id = helper_register_user("res_noeval")
        interview = Interview(
            user_id=user_id,
            title="Unfinished Interview",
            job_role="Engineer",
            domain="Backend",
            difficulty="Easy",
            interview_type="Technical",
            question_count=1,
        )
        db.add(interview)
        db.commit()
        db.refresh(interview)

        session = InterviewSession(
            interview_id=interview.id,
            status="completed",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # Do NOT compute final evaluation
        resp = client.get(
            f"/api/v1/results/sessions/{session.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 404
        assert "Final evaluation has not yet been generated" in resp.json()["detail"]
    finally:
        db.close()


# ─── 3. Report Service PDF Generation Tests ───────────────────────────────────

def test_report_service_pdf_generation(populated_session):
    db = populated_session["db"]
    session_id = populated_session["session"].id
    user_id = populated_session["user_id"]

    pdf_bytes = report_service.generate_pdf_report(db, session_id, user_id)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2000  # Multi-page valid document
    assert pdf_bytes.startswith(b"%PDF-")  # Valid PDF standard magic bytes


def test_reports_api_download_pdf_success(populated_session):
    session_id = populated_session["session"].id
    token = populated_session["token"]

    resp = client.get(
        f"/api/v1/reports/sessions/{session_id}/pdf",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert f"InterviewIQ_Report_{session_id[:8]}.pdf" in resp.headers.get("content-disposition", "")
    assert resp.content.startswith(b"%PDF-")


def test_reports_api_cross_user_forbidden(populated_session):
    session_id = populated_session["session"].id
    intruder_token, _ = helper_register_user("pdf_intruder")

    # Cross-user download attempt
    resp = client.get(
        f"/api/v1/reports/sessions/{session_id}/pdf",
        headers={"Authorization": f"Bearer {intruder_token}"}
    )
    assert resp.status_code == 403


# ─── 4. Tool Registry Tool Test ───────────────────────────────────────────────

def test_generate_interview_report_tool(populated_session):
    db = populated_session["db"]
    session_id = populated_session["session"].id
    user_id = populated_session["user_id"]

    tool = GenerateInterviewReportTool()
    assert tool.name == "generate_interview_report"
    assert tool.is_future_contract is False

    context = ToolExecutionContext(user_id=user_id, session_id=session_id, db=db)
    params = GenerateInterviewReportInput(session_id=session_id, include_pdf=True)
    result = tool.execute(context, params)

    assert result.success is True
    assert "report_id" in result.data
    assert "report_url" in result.data
    assert f"/api/v1/reports/sessions/{session_id}/pdf" in result.data["report_url"]
