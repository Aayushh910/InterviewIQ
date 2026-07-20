from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import create_access_token
from app.database.database import get_db
from app.schemas.user import UserCreate,UserLogin
from app.services.user_service import UserService

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

    UserService.create_user(db, user)

    return {
        "message": "User created successfully"
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
        "token_type": "bearer"
    }