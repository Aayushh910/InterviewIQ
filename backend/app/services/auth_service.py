from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password, create_access_token


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    Retrieve user record by email address.
    """
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """
    Retrieve user record by unique identifier.
    """
    return db.query(User).filter(User.id == user_id).first()


def register_user(db: Session, user_in: UserCreate) -> User:
    """
    Create and store a new candidate account with hashed password.
    """
    normalized_email = user_in.email.lower().strip()
    existing_user = get_user_by_email(db, normalized_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )

    # Determine Display Name from incoming payload options
    display_name = user_in.name or user_in.fullName
    if not display_name and (user_in.first_name or user_in.last_name):
        display_name = f"{user_in.first_name or ''} {user_in.last_name or ''}".strip()
    if not display_name:
        display_name = normalized_email.split("@")[0].capitalize()

    is_admin = normalized_email == "admin@interviewiq.ai"

    user = User(
        email=normalized_email,
        name=display_name,
        hashed_password=hash_password(user_in.password),
        role="Senior Full-Stack Candidate",
        is_admin=is_admin,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Authenticate user credentials against stored bcrypt password hashes.
    """
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account."
        )
    return user


def reset_user_password(db: Session, email: str, new_password: str) -> User:
    """
    Reset and store new hashed password for user by email.
    """
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found."
        )
    user.hashed_password = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user


def build_token_response(user: User) -> dict:
    """
    Generate JWT access token and return token response payload.
    """
    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name or "Alex Rivera",
            "email": user.email,
            "role": user.role or "Senior Full-Stack Candidate",
            "avatar": user.avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            "isAdmin": bool(user.is_admin),
            "is_active": user.is_active,
            "created_at": user.created_at
        }
    }
