import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import logging
from app.core.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.auth_service import get_user_by_email, register_user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_canonical_user")

CANONICAL_EMAIL = "dev@interviewiq.ai"
CANONICAL_PASSWORD = "DevPassword123!"



def seed_canonical_user():
    db = SessionLocal()
    try:
        user = get_user_by_email(db, CANONICAL_EMAIL)
        if not user:
            logger.info(f"Creating canonical development user '{CANONICAL_EMAIL}'...")
            user_in = UserCreate(
                email=CANONICAL_EMAIL,
                password=CANONICAL_PASSWORD,
                name="Canonical Dev Candidate"
            )
            user = register_user(db, user_in)
            logger.info(f"Canonical user created successfully (id: '{user.id}')")
        else:
            logger.info(f"Canonical user '{CANONICAL_EMAIL}' already exists (id: '{user.id}')")

        print("\n--- Development User Summary ---")
        print(f"Canonical User Email: {CANONICAL_EMAIL}")
        print(f"Canonical User ID:    {user.id}")
        print("--------------------------------\n")
    finally:
        db.close()


if __name__ == "__main__":
    seed_canonical_user()
