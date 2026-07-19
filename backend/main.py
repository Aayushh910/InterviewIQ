from fastapi import FastAPI
from sqlalchemy import text

from app.database.base import Base
from app.database.database import engine

# ✅ Import all models here BEFORE create_all() is called.
# This registers each model's table with Base.metadata.
import app.models.user  # noqa: F401

app = FastAPI(
    title="InterviewIQ API",
    version="1.0.0"
)


@app.on_event("startup")
def startup_db():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("✅ Database connected successfully!")

    except Exception as e:
        print("❌ Database connection failed!")
        print(e)


@app.get("/")
def root():
    return {
        "message": "InterviewIQ Backend Running",
    }