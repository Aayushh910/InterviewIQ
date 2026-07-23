from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.base import Base
from app.database.database import engine
from app.api.routes import auth

import app.models.user

app = FastAPI(
    title="InterviewIQ API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")

@app.on_event("startup")
def startup_db():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        Base.metadata.create_all(bind=engine)

        print(" Database connected successfully!")
        print(" Tables created successfully!")

    except Exception as e:
        print("❌ Database connection failed!")
        print(e)


@app.get("/")
def root():
    return {
        "message": "InterviewIQ Backend Running",
    }