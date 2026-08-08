from fastapi.testclient import TestClient
from main import app
from app.core.database import verify_db_connection

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "InterviewIQ API is running"}


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "InterviewIQ API"}


def test_database_connection():
    is_connected = verify_db_connection()
    assert is_connected is True, "PostgreSQL database connection failed"
