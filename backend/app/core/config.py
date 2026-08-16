from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central application settings loaded from environment variables or .env file.
    """
    APP_NAME: str = "InterviewIQ API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/interviewiq"
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # JWT Authentication Secrets
    SECRET_KEY: str = "e83918a209fb3b194019a842b109e20a48b59c72019485e920b182049182390a"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 4320

    # Facial Analysis Settings
    FACE_LANDMARKER_MODEL_PATH: str = "models/face_landmarker.task"
    MAX_FACES: int = 1
    MIN_FACE_DETECTION_CONFIDENCE: float = 0.5
    MIN_FACE_PRESENCE_CONFIDENCE: float = 0.5
    MIN_TRACKING_CONFIDENCE: float = 0.5

    # Temporal Video Analysis Settings
    FACIAL_ANALYSIS_SAMPLE_FPS: float = 2.0
    MAX_VIDEO_SIZE_MB: int = 100
    MAX_VIDEO_DURATION_SECONDS: int = 300

    # Speech-to-Text Analysis Settings
    STT_PROVIDER: str = "groq"
    STT_API_KEY: Optional[str] = None
    STT_MODEL: str = "whisper-large-v3-turbo"
    STT_TIMEOUT_SECONDS: float = 30.0
    STT_MODEL_SIZE: str = "tiny"
    STT_DEVICE: str = "cpu"
    STT_COMPUTE_TYPE: str = "int8"
    STT_LANGUAGE: str = "en"
    MAX_AUDIO_SIZE_MB: int = 25
    MAX_AUDIO_DURATION_SECONDS: int = 300

    # Text-to-Speech Analysis Settings
    TTS_PROVIDER: str = "mock"
    TTS_API_KEY: Optional[str] = None
    TTS_MODEL: str = "default"
    TTS_VOICE: str = "default"
    TTS_LANGUAGE: str = "en"
    TTS_TIMEOUT_SECONDS: float = 30.0





    # Adaptive Counter-Question Settings
    MAX_FOLLOW_UPS_PER_QUESTION: int = 2
    LLM_PROVIDER: str = "local"

    # Answer Evaluation Settings & Weights
    EVALUATION_WEIGHT_RELEVANCE: float = 0.20
    EVALUATION_WEIGHT_CORRECTNESS: float = 0.30
    EVALUATION_WEIGHT_COMPLETENESS: float = 0.20
    EVALUATION_WEIGHT_CLARITY: float = 0.15
    EVALUATION_WEIGHT_TECHNICAL_DEPTH: float = 0.15
    EVALUATION_PROVIDER: str = "heuristic"

    # AI Provider Core Configuration
    AI_PROVIDER: str = "groq"
    AI_API_KEY: Optional[str] = None
    AI_MODEL: str = "llama-3.3-70b-versatile"
    AI_TIMEOUT_SECONDS: float = 15.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
