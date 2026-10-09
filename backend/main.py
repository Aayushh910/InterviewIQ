from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.api import ai, speech

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS for the frontend origin
origins = list(set([settings.FRONTEND_URL] + settings.ALLOWED_ORIGINS))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(ai.router, prefix="/api/ai", tags=["AI Foundation Direct Alias"])
app.include_router(speech.router, prefix="/api/ai/speech", tags=["Speech Recognition Direct Alias"])



@app.on_event("startup")
def init_db_tables():
    """Ensure newly introduced tables and columns exist on application startup."""
    from sqlalchemy import text
    from app.core.database import engine
    from app.models.multimodal_evidence import MultimodalEvidence
    from app.models.final_evaluation import FinalEvaluation
    from app.models.proctoring_event import ProctoringEvent
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS termination_reason VARCHAR(100)"))
        MultimodalEvidence.__table__.create(bind=engine, checkfirst=True)
        FinalEvaluation.__table__.create(bind=engine, checkfirst=True)
        ProctoringEvent.__table__.create(bind=engine, checkfirst=True)
    except Exception:
        pass


@app.get("/")
def root():
    """
    Root endpoint indicating backend application availability.
    """
    return {
        "message": "InterviewIQ API is running"
    }
