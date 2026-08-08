from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency supplying a SQLAlchemy database session.
    Closes the session cleanly after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_db_connection() -> bool:
    """
    Safe utility function to test database connectivity.
    Returns True if reachable, False otherwise without raising unhandled exceptions or logging secrets.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
