from fastapi import APIRouter
from app.api import auth, interviews, answers, session_state, tools, analysis, speech, evaluation, ai, multimodal, analytics, resumes, agent

api_router = APIRouter(prefix="/api/v1")

# Mount API routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["interviews"])
api_router.include_router(resumes.router, tags=["Resumes"])
api_router.include_router(answers.router, tags=["answers"])
api_router.include_router(session_state.router, prefix="/sessions", tags=["Interview Session State"])
api_router.include_router(tools.router, prefix="/tools", tags=["Tool Registry"])
api_router.include_router(agent.router, prefix="/agent", tags=["Interview Agent"])
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
