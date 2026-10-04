"""
Deterministic Scoring Configuration & Weights for InterviewIQ (Phase 12).
All weights are centralized, documented, deterministic, and version-stamped.
"""

from typing import Dict, Any

SCORING_VERSION: str = "1.0"

# ─── Top-Level Category Weights ───────────────────────────────────────────────
# Answer Quality is the primary signal (70%).
# Observable presentation telemetry provides supporting evidence (15% each).
CATEGORY_WEIGHTS: Dict[str, float] = {
    "answer_quality": 0.70,
    "communication": 0.15,
    "visual_presentation": 0.15,
}

assert abs(sum(CATEGORY_WEIGHTS.values()) - 1.0) < 1e-6, "Category weights must sum to 1.0"

# ─── Answer Quality Dimension Weights ─────────────────────────────────────────
# Based on the 5 core dimensions produced by AnswerEvaluator
ANSWER_DIMENSION_WEIGHTS: Dict[str, float] = {
    "correctness": 0.25,
    "relevance": 0.20,
    "technical_depth": 0.25,
    "completeness": 0.15,
    "clarity": 0.15,
}

assert abs(sum(ANSWER_DIMENSION_WEIGHTS.values()) - 1.0) < 1e-6, "Answer dimension weights must sum to 1.0"

# ─── Visual Presentation Metric Weights ───────────────────────────────────────
# Objective observable indicators from MediaPipe / AnalyzeFaceTool
VISUAL_METRIC_WEIGHTS: Dict[str, float] = {
    "face_presence": 0.40,     # Ratio of frames face detected
    "camera_alignment": 0.35,  # Direct camera engagement score
    "position_quality": 0.25,  # Framing & centering score
}

assert abs(sum(VISUAL_METRIC_WEIGHTS.values()) - 1.0) < 1e-6, "Visual metric weights must sum to 1.0"

# ─── Communication Behavior Metric Weights ─────────────────────────────────────
# Objective observable indicators from Speech / AnalyzeBehaviorTool
COMMUNICATION_METRIC_WEIGHTS: Dict[str, float] = {
    "speaking_rate": 0.40,     # Pacing (WPM in optimal 120-160 range)
    "filler_words": 0.30,      # Filler word proportion penalty
    "speaking_flow": 0.30,     # Active speech ratio & pause rhythm
}

assert abs(sum(COMMUNICATION_METRIC_WEIGHTS.values()) - 1.0) < 1e-6, "Communication metric weights must sum to 1.0"

# ─── Reliability Multipliers ──────────────────────────────────────────────────
# Sensor measurement quality determines contribution weight
RELIABILITY_MULTIPLIERS: Dict[str, float] = {
    "high": 1.0,
    "medium": 0.8,
    "low": 0.5,
    "unavailable": 0.0,
}

# ─── Performance Category Thresholds ──────────────────────────────────────────
def get_performance_category(overall_score: float) -> str:
    """
    Map deterministic overall score to a standardized performance band.
    """
    s = round(overall_score, 1)
    if s >= 90.0:
        return "Exceptional"
    elif s >= 80.0:
        return "Strong"
    elif s >= 70.0:
        return "Proficient"
    elif s >= 60.0:
        return "Developing"
    else:
        return "Needs Improvement"
