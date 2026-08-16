from fastapi import APIRouter
from app.api import auth, interviews, answers, analysis, speech, evaluation, ai, multimodal, analytics

api_router = APIRouter(prefix="/api/v1")

# Mount API routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["interviews"])
api_router.include_router(answers.router, tags=["answers"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(speech.router, prefix="/analysis/speech", tags=["speech"])
api_router.include_router(speech.router, prefix="/ai/speech", tags=["Speech Recognition"])
api_router.include_router(evaluation.router, prefix="/analysis/evaluation", tags=["evaluation"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Foundation"])

api_router.include_router(multimodal.router, tags=["Multimodal Intelligence"])
api_router.include_router(analytics.router, tags=["Interview Analytics"])


@api_router.get("/health", status_code=200, tags=["health"])
def health_check():
    """
    Public health status endpoint for InterviewIQ API.
    """
    return {
        "status": "ok",
        "service": "InterviewIQ API"
    }
