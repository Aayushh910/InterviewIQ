import uuid
from datetime import timedelta
from fastapi.testclient import TestClient
from main import app
from app.core.security import create_access_token

client = TestClient(app)


def test_user_registration_and_login_flow():
    unique_suffix = uuid.uuid4().hex[:8]
    test_email = f"candidate_{unique_suffix}@interviewiq.ai"
    test_password = "SecurePassword123!"

    # 1. Register candidate account
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Candidate",
            "email": test_email,
            "password": test_password
        }
    )
    assert reg_response.status_code == 201, reg_response.text
    reg_data = reg_response.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == test_email
    assert "hashed_password" not in reg_data["user"]
    assert "password" not in reg_data["user"]

    # 2. Reject duplicate email registration
    dup_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Duplicate Candidate",
            "email": test_email,
            "password": test_password
        }
    )
    assert dup_response.status_code == 400

    # 3. Successful Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": test_password
        }
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    token = login_data["access_token"]
    assert token is not None

    # 4. Reject Login with wrong password
    wrong_pwd_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": "WrongPassword!"
        }
    )
    assert wrong_pwd_response.status_code == 401

    # 5. Get current user profile with valid JWT
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == test_email
    assert me_data["name"] == "Test Candidate"
    assert "hashed_password" not in me_data

    # 6. Reject /auth/me with missing header
    no_auth_response = client.get("/api/v1/auth/me")
    assert no_auth_response.status_code == 401

    # 7. Reject /auth/me with invalid token
    bad_token_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_jwt_token_payload"}
    )
    assert bad_token_response.status_code == 401

    # 8. Reject /auth/me with expired token
    expired_token = create_access_token(subject="nonexistent-id", expires_delta=timedelta(seconds=-10))
    expired_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert expired_response.status_code == 401
