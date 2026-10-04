from pydantic import BaseModel, EmailStr
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """
    Schema for user authentication requests.
    """
    email: EmailStr
    password: str


class Token(BaseModel):
    """
    Schema for JWT token payload responses matching frontend AuthContext expectations.
    """
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ResetPasswordRequest(BaseModel):
    """
    Schema for resetting account password.
    """
    email: EmailStr
    password: str
