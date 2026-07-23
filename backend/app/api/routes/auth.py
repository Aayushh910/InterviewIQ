from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import create_access_token
from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.schemas.user import UserCreate,UserLogin
from app.services.user_service import UserService
from app.models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = UserService.get_user_by_email(db, user.email)

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = UserService.create_user(db, user)
    
    access_token = create_access_token(
        data={"sub": str(new_user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(new_user.id),
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "is_verified": new_user.is_verified,
        }
    }


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    authenticated_user = UserService.authenticate_user(
        db,
        user.email,
        user.password
    )

    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={"sub": str(authenticated_user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(authenticated_user.id),
            "full_name": authenticated_user.full_name,
            "email": authenticated_user.email,
            "role": authenticated_user.role,
            "is_verified": authenticated_user.is_verified,
        }
    }

@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "is_verified": current_user.is_verified,
    }