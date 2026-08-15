from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.api import ai

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


@app.get("/")
def root():
    """
    Root endpoint indicating backend application availability.
    """
    return {
        "message": "InterviewIQ API is running"
    }
