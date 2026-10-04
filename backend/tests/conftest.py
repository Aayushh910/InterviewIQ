import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.auth_service import get_user_by_email, register_user
from app.core.security import create_access_token

CANONICAL_TEST_USER_EMAIL = "dev@interviewiq.ai"
CANONICAL_TEST_USER_PASSWORD = "DevPassword123!"



@pytest.fixture(scope="session")
def db_session():
    """
    Session-level database session fixture for test execution.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def canonical_user(db_session):
    """
    Canonical development/test user fixture reused across normal feature tests.
    """
    user = get_user_by_email(db_session, CANONICAL_TEST_USER_EMAIL)
    if not user:
        user_in = UserCreate(
            email=CANONICAL_TEST_USER_EMAIL,
            password=CANONICAL_TEST_USER_PASSWORD,
            name="Canonical Dev Candidate"
        )
        user = register_user(db_session, user_in)
    return user


@pytest.fixture(scope="session")
def auth_token(canonical_user):
    """
    Fixture providing signed JWT access token for the canonical test user.
    """
    return create_access_token(subject=canonical_user.id)


@pytest.fixture(scope="session")
def auth_headers(auth_token):
    """
    Fixture providing Authorization Bearer headers for API requests.
    """
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def client():
    """
    FastAPI TestClient fixture.
    """
    return TestClient(app)
