from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, Token, ResetPasswordRequest
from app.services.auth_service import register_user, authenticate_user, build_token_response, reset_user_password
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=201)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user candidate account and return JWT access token.
    """
    user = register_user(db, user_in)
    return build_token_response(user)


@router.post("/signup", response_model=Token, status_code=201)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Signup endpoint alias matching frontend auth API contract.
    """
    user = register_user(db, user_in)
    return build_token_response(user)


@router.post("/login", response_model=Token)
def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user credentials and return JWT access token.
    """
    user = authenticate_user(db, login_in.email, login_in.password)
    return build_token_response(user)


@router.post("/reset-password", response_model=Token)
def reset_password(reset_in: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset user password and return new JWT access token.
    """
    user = reset_user_password(db, reset_in.email, reset_in.password)
    return build_token_response(user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Return currently authenticated user profile information.
    """
    return {
        "id": current_user.id,
        "name": current_user.name or "Alex Rivera",
        "email": current_user.email,
        "role": current_user.role or "Senior Full-Stack Candidate",
        "avatar": current_user.avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        "isAdmin": bool(current_user.is_admin),
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }
