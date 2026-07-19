from sqlalchemy.orm import sessionmaker

from app.database.database import engine


SessionLocal = sessionmaker(

    autocommit=False,

    autoflush=False,

    bind=engine
)