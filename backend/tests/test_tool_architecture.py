import uuid
import pytest
from fastapi.testclient import TestClient

from main import app
from app.tools.registry.registry import ToolRegistry, default_registry
from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.tools.base.exceptions import (
    ToolNotFoundError,
    ToolDuplicateRegistrationError,
    ToolValidationError,
)
from app.tools.question_generation.tool import GenerateInterviewQuestionTool
from app.tools.question_generation.schemas import GenerateQuestionInput
from app.tools.follow_up.tool import GenerateFollowUpQuestionTool
from app.tools.follow_up.schemas import FollowUpToolInput
from app.tools.answer_evaluation.tool import EvaluateAnswerTool
from app.tools.answer_evaluation.schemas import EvaluateAnswerToolInput
from app.tools.interview_state.tool import (
    GetInterviewStateTool,
    UpdateInterviewStateTool,
)
from app.tools.interview_state.schemas import (
    GetInterviewStateInput,
    UpdateInterviewStateInput,
)
from app.tools.future.contracts import (
    AnalyzeFaceTool,
    AnalyzeBehaviorTool,
    CalculateFinalEvaluationTool,
    GenerateInterviewReportTool,
)
from app.schemas.session_state import SessionStatus

client = TestClient(app)


def helper_register_user(prefix: str = "tool_test") -> tuple[str, str]:
    """Register a test user and return (token, user_id)."""
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@interviewiq.ai"
    password = "ToolTestPassword123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Tool Test Candidate", "email": email, "password": password}
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    return data["access_token"], data["user"]["id"]


def helper_create_session(headers: dict) -> tuple[str, str]:
    """Create an interview and session, returning (interview_id, session_id)."""
    resp = client.post(
        "/api/v1/interviews",
        headers=headers,
        json={
            "title": "Tool Registry Test Interview",
            "job_role": "Backend Engineer",
            "domain": "Backend",
            "difficulty": "Medium",
            "interview_type": "Technical",
            "question_count": 2,
        }
    )
    assert resp.status_code == 201
    interview_id = resp.json()["id"]

    q_resp = client.post(
        f"/api/v1/interviews/{interview_id}/questions",
        headers=headers,
        json={"question_text": "Explain database indexing in PostgreSQL.", "question_order": 1}
    )
    assert q_resp.status_code == 201

    state_resp = client.post(f"/api/v1/sessions/state/{interview_id}", headers=headers)
    assert state_resp.status_code == 201
    session_id = state_resp.json()["session_id"]

    return interview_id, session_id


# ─── 1. Registry Tests ─────────────────────────────────────────────────────────

def test_registry_registration_and_retrieval():
    """Verify registering a tool and retrieving it by name from ToolRegistry."""
    registry = ToolRegistry()
    tool = GenerateInterviewQuestionTool()

    registry.register(tool)
    assert registry.has_tool("generate_interview_question")
    assert "generate_interview_question" in registry.list_tools()

    retrieved = registry.get("generate_interview_question")
    assert retrieved.name == "generate_interview_question"


def test_registry_rejects_duplicate_registration():
    """Verify ToolDuplicateRegistrationError is raised when registering duplicate tool names."""
    registry = ToolRegistry()
    tool = GenerateInterviewQuestionTool()

    registry.register(tool)
    with pytest.raises(ToolDuplicateRegistrationError):
        registry.register(tool)


def test_registry_raises_on_unknown_tool():
    """Verify ToolNotFoundError is raised when retrieving a non-existent tool name."""
    registry = ToolRegistry()
    with pytest.raises(ToolNotFoundError):
        registry.get("non_existent_tool_xyz")


def test_registry_tool_definitions_format():
    """Verify get_tool_definitions exports valid LLM function calling schemas."""
    definitions = default_registry.get_tool_definitions(include_future=False)
    assert len(definitions) >= 5

    def_map = {d["function"]["name"]: d for d in definitions}
    assert "generate_interview_question" in def_map
    assert "generate_follow_up_question" in def_map
    assert "evaluate_answer" in def_map
    assert "get_interview_state" in def_map
    assert "update_interview_state" in def_map

    q_def = def_map["generate_interview_question"]
    assert q_def["type"] == "function"
    assert "properties" in q_def["function"]["parameters"]


# ─── 2. Question Generation Tool Tests ─────────────────────────────────────────

def test_generate_interview_question_tool_success():
    """Verify Question Generation Tool produces a structured question via mock provider."""
    tool = GenerateInterviewQuestionTool()
    context = ToolExecutionContext(provider_override="mock", mock_mode="success")
    params = GenerateQuestionInput(
        role="Backend Engineer",
        domain="Backend",
        difficulty="Medium",
        interview_type="Technical",
        question_index=1
    )

    result = tool.execute(context, params)
    assert result.success is True
    assert result.data is not None
    assert len(result.data["question_text"]) > 5
    assert result.data["difficulty"] == "Medium"


def test_generate_interview_question_tool_validation_error():
    """Verify ToolValidationError when invalid parameters are supplied."""
    tool = GenerateInterviewQuestionTool()
    with pytest.raises(ToolValidationError):
        tool.validate_params({"question_index": -1})  # ge=1 constraint violated


def test_generate_interview_question_tool_ai_failure():
    """Verify safe failure handling when AI provider simulates failure."""
    tool = GenerateInterviewQuestionTool()
    context = ToolExecutionContext(provider_override="mock", mock_mode="failure")
    params = GenerateQuestionInput(domain="Frontend", role="Frontend Developer")

    result = tool.execute(context, params)
    assert result.success is False
    assert "failed" in (result.error or "").lower() or "failure" in (result.error or "").lower()


# ─── 3. Follow-Up Question Tool Tests ──────────────────────────────────────────

def test_generate_follow_up_question_tool_success():
    """Verify Follow-Up Tool generates an adaptive counter-question for good answers."""
    tool = GenerateFollowUpQuestionTool()
    context = ToolExecutionContext(provider_override="mock", mock_mode="success")
    params = FollowUpToolInput(
        parent_question_text="How do you handle microservice state consistency?",
        candidate_answer_text="I used the Saga pattern with choreography and event sourcing via Kafka.",
        domain="Backend",
        role="Backend Engineer",
        follow_up_depth=0
    )

    result = tool.execute(context, params)
    assert result.success is True
    data = result.data
    assert data["should_follow_up"] is True
    assert data["follow_up_question"] is not None
    assert data["follow_up_depth"] == 1


def test_generate_follow_up_question_tool_depth_limit():
    """Verify Follow-Up Tool enforces max follow-up depth limit (2)."""
    tool = GenerateFollowUpQuestionTool()
    context = ToolExecutionContext(provider_override="mock", mock_mode="success")
    params = FollowUpToolInput(
        parent_question_text="Explain React hooks.",
        candidate_answer_text="Hooks allow functional components to use state.",
        follow_up_depth=2  # At max limit
    )

    result = tool.execute(context, params)
    assert result.success is True
    assert result.data["should_follow_up"] is False
    assert "limit" in result.data["reason"].lower()


def test_generate_follow_up_question_tool_brief_answer():
    """Verify Follow-Up Tool avoids follow-up probing on brief/empty answers."""
    tool = GenerateFollowUpQuestionTool()
    context = ToolExecutionContext(provider_override="mock", mock_mode="success")
    params = FollowUpToolInput(
        parent_question_text="Explain Kubernetes networking.",
        candidate_answer_text="No.",
        follow_up_depth=0
    )

    result = tool.execute(context, params)
    assert result.success is True
    assert result.data["should_follow_up"] is False
    assert "too brief" in result.data["reason"].lower() or "empty" in result.data["reason"].lower()


# ─── 4. Answer Evaluation Tool Tests ───────────────────────────────────────────

def test_evaluate_answer_tool_success():
    """Verify Answer Evaluation Tool produces structured multi-dimensional scores."""
    tool = EvaluateAnswerTool()
    context = ToolExecutionContext(provider_override="mock", mock_mode="success")
    params = EvaluateAnswerToolInput(
        question_text="Explain the differences between SQL and NoSQL databases.",
        candidate_answer_text="SQL databases are relational and structured using ACID transactions, while NoSQL databases scale horizontally and use flexible document or key-value stores.",
        domain="Backend",
        difficulty="Medium",
        duration_seconds=35.0
    )

    result = tool.execute(context, params)
    assert result.success is True
    data = result.data
    assert "overall_score" in data
    assert "relevance_score" in data
    assert "correctness_score" in data
    assert "completeness_score" in data
    assert "clarity_score" in data
    assert "technical_depth_score" in data
    assert isinstance(data["strengths"], list)
    assert isinstance(data["improvements"], list)
    assert len(data["summary"]) > 0


def test_evaluate_answer_tool_ai_failure():
    """Verify Answer Evaluation Tool handles simulated AI evaluator failure cleanly."""
    tool = EvaluateAnswerTool()
    context = ToolExecutionContext(provider_override="mock", mock_mode="failure")
    params = EvaluateAnswerToolInput(
        question_text="Explain Docker networking.",
        candidate_answer_text="Bridge and overlay networks connect containers."
    )

    result = tool.execute(context, params)
    assert result.success is False
    assert result.error is not None


# ─── 5. Interview State Tools Tests ────────────────────────────────────────────

def test_get_interview_state_tool():
    """Verify GetInterviewStateTool retrieves Phase 8 state model."""
    token, user_id = helper_register_user("state_tool")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    # Execute via default registry through API
    resp = client.post(
        "/api/v1/tools/get_interview_state/execute",
        headers=headers,
        json={"session_id": session_id}
    )
    assert resp.status_code == 200, resp.text
    result = resp.json()
    assert result["success"] is True
    data = result["data"]
    assert data["session_id"] == session_id
    assert data["session_status"] == SessionStatus.NOT_STARTED.value
    assert data["progress"]["total_questions"] == 2


def test_get_interview_state_tool_missing_or_unauthorized_session():
    """Verify GetInterviewStateTool fails safely for unauthorized or missing session IDs."""
    token1, _ = helper_register_user("user_a")
    token2, _ = helper_register_user("user_b")
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    _, session_id = helper_create_session(headers1)

    # User 2 tries to access User 1's session
    resp = client.post(
        "/api/v1/tools/get_interview_state/execute",
        headers=headers2,
        json={"session_id": session_id}
    )
    assert resp.status_code == 200
    result = resp.json()
    assert result["success"] is False
    assert "not found" in result["error"].lower() or "unauthorized" in result["error"].lower()


def test_update_interview_state_tool():
    """Verify UpdateInterviewStateTool updates status and topic using Phase 8 manager."""
    token, user_id = helper_register_user("update_tool")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    # Start session first via Phase 8 state endpoint
    client.post(f"/api/v1/sessions/{session_id}/state/initialize", headers=headers, json={})

    # Update to paused with topic via tool
    resp = client.post(
        "/api/v1/tools/update_interview_state/execute",
        headers=headers,
        json={
            "session_id": session_id,
            "status": "paused",
            "current_topic": "PostgreSQL Optimization"
        }
    )
    assert resp.status_code == 200
    result = resp.json()
    assert result["success"] is True
    assert result["data"]["session_status"] == "paused"
    assert result["data"]["current_topic"] == "PostgreSQL Optimization"


def test_update_interview_state_tool_invalid_transition():
    """Verify UpdateInterviewStateTool rejects invalid lifecycle status transitions."""
    token, user_id = helper_register_user("invalid_trans")
    headers = {"Authorization": f"Bearer {token}"}
    _, session_id = helper_create_session(headers)

    # Attempt illegal transition: not_started -> completed directly
    resp = client.post(
        "/api/v1/tools/update_interview_state/execute",
        headers=headers,
        json={
            "session_id": session_id,
            "status": "completed"
        }
    )
    assert resp.status_code == 200
    result = resp.json()
    assert result["success"] is False
    assert "cannot transition" in result["error"].lower() or "illegal" in result["error"].lower()


# ─── 6. Future-Ready Tool Contracts Tests ──────────────────────────────────────

def test_future_tool_contracts_are_non_executing():
    """Verify remaining future tool contracts are registered, flagged, and do not execute fake scoring."""
    future_tools = [
        CalculateFinalEvaluationTool(),
        GenerateInterviewReportTool(),
    ]

    for tool in future_tools:
        assert tool.is_future_contract is True
        context = ToolExecutionContext()
        params = tool.input_schema(session_id="dummy-session-123")
        res = tool.execute(context, params)
        assert res.success is False
        assert "future-ready contract" in res.error

    # Phase 11 graduated tools are operational
    assert AnalyzeFaceTool().is_future_contract is False
    assert AnalyzeBehaviorTool().is_future_contract is False


# ─── 7. Tool Discovery HTTP Endpoints ──────────────────────────────────────────

def test_tool_discovery_api_endpoints():
    """Verify HTTP API GET /api/v1/tools exposes registered tools for future agent discovery."""
    token, _ = helper_register_user("discovery_user")
    headers = {"Authorization": f"Bearer {token}"}

    # List all core tools
    resp = client.get("/api/v1/tools", headers=headers)
    assert resp.status_code == 200
    tools_list = resp.json()
    names = [t["function"]["name"] for t in tools_list]
    assert "generate_interview_question" in names
    assert "generate_follow_up_question" in names
    assert "evaluate_answer" in names
    assert "get_interview_state" in names
    assert "update_interview_state" in names

    # Get single tool definition
    single_resp = client.get("/api/v1/tools/generate_interview_question", headers=headers)
    assert single_resp.status_code == 200
    data = single_resp.json()
    assert data["function"]["name"] == "generate_interview_question"
    assert "properties" in data["function"]["parameters"]

    # 404 for unknown tool
    err_resp = client.get("/api/v1/tools/non_existent_tool_123", headers=headers)
    assert err_resp.status_code == 404
