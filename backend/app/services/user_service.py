from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password


class UserService:

    @staticmethod
    def get_user_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def create_user(db: Session, user_data: UserCreate):

        hashed_password = hash_password(user_data.password)
        
        full_name = f"{user_data.first_name} {user_data.last_name}"

        new_user = User(
            full_name=full_name,
            email=user_data.email,
            password=hashed_password,
            phone=user_data.phone,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str):

        user = UserService.get_user_by_email(db, email)

        if not user:
            return None

        if not verify_password(password, str(user.password)):
            return None

        return user