"""
InterviewIQ Core Scoring Engine Configuration & Deterministic Assessment Framework.
Defines dimension weights, response duration & timing evaluation, grammar assessment,
and deterministic question/session score aggregations.
"""

import re
import math
from typing import Dict, Any, List, Optional


# ─── Configurable Centralized Scoring Weights ─────────────────────────────────

SCORING_WEIGHTS_TECHNICAL: Dict[str, float] = {
    "correctness": 0.25,
    "relevance": 0.15,
    "technical_accuracy": 0.20,
    "completeness": 0.15,
    "communication": 0.10,
    "grammar": 0.05,
    "timing": 0.10,
}

SCORING_WEIGHTS_BEHAVIORAL: Dict[str, float] = {
    "correctness": 0.20,
    "relevance": 0.20,
    "technical_accuracy": 0.15,
    "completeness": 0.20,
    "communication": 0.10,
    "grammar": 0.05,
    "timing": 0.10,
}

# Verify weights sum exactly to 1.0 (100%)
assert abs(sum(SCORING_WEIGHTS_TECHNICAL.values()) - 1.0) < 1e-6, "Technical weights must sum to 1.0"
assert abs(sum(SCORING_WEIGHTS_BEHAVIORAL.values()) - 1.0) < 1e-6, "Behavioral weights must sum to 1.0"


def clamp_score(val: Any, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """
    Safely parse and clamp numeric evaluation scores within valid bounds [0.0, 100.0].
    """
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return min_val
        return max(min_val, min(max_val, f))
    except (ValueError, TypeError):
        return min_val


def calculate_timing_score(
    duration_seconds: Optional[float],
    word_count: int,
    raw_answer: str = ""
) -> float:
    """
    Deterministic evaluation of response timing based on actual answer duration and spoken pace.
    Optimal interview answer pacing is ~120-160 words/min with 15s-90s duration.
    """
    clean_ans = (raw_answer or "").strip()
    if not clean_ans or word_count == 0 or len(clean_ans) < 5:
        return 0.0

    # If duration is missing, estimate from word count assuming standard 135 WPM
    if duration_seconds is None or duration_seconds <= 0:
        estimated_duration = max(5.0, (word_count / 135.0) * 60.0)
        dur = estimated_duration
    else:
        dur = float(duration_seconds)

    # 1. Very short / rushed answers (< 5 seconds with few words)
    if dur < 5.0:
        if word_count < 10:
            return 55.0
        return 75.0

    # 2. Optimal timing range: 15s to 90s
    if 15.0 <= dur <= 90.0:
        if word_count >= 15:
            return 98.0
        return 88.0

    # 3. Concise timing range: 5s to 15s
    if 5.0 <= dur < 15.0:
        if word_count >= 12:
            return 90.0
        return 78.0

    # 4. Extended timing range: 90s to 150s
    if 90.0 < dur <= 150.0:
        return 88.0

    # 5. Overly long timing range (> 150s)
    if dur > 150.0:
        if dur > 240.0:
            return 65.0
        return 75.0

    return 85.0


def calculate_grammar_score(raw_answer: str) -> float:
    """
    Deterministic grammar and linguistic quality scoring.
    Evaluates sentence boundaries, terminal punctuation, capitalization, and structural coherence.
    """
    text = (raw_answer or "").strip()
    if not text or len(text) < 5:
        return 0.0

    words = text.split()
    word_count = len(words)

    score = 85.0

    # 1. Capitalization at start of sentences
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    if sentences:
        capitalized_count = sum(1 for s in sentences if s[0].isupper())
        cap_ratio = capitalized_count / len(sentences)
        if cap_ratio >= 0.8:
            score += 5.0
        elif cap_ratio < 0.4:
            score -= 10.0

    # 2. Proper terminal punctuation
    if text.endswith(('.', '!', '?')):
        score += 5.0
    else:
        score -= 5.0

    # 3. Repeated word penalty (stutter / loop artifacts)
    repeated_count = 0
    for i in range(len(words) - 1):
        if words[i].lower() == words[i + 1].lower() and len(words[i]) > 2:
            repeated_count += 1
    if repeated_count > 2:
        score -= min(15.0, repeated_count * 3.0)

    # 4. Word length and vocabulary richness
    avg_word_len = sum(len(w) for w in words) / max(1, word_count)
    if avg_word_len >= 4.5 and word_count >= 10:
        score += 5.0
    elif avg_word_len < 3.0 and word_count >= 10:
        score -= 5.0

    return round(clamp_score(score), 1)


def get_weights_for_question_type(question_type: Optional[str] = "Technical") -> Dict[str, float]:
    """
    Return the authoritative weight dictionary based on question type.
    """
    q_type = (question_type or "Technical").lower()
    if q_type in ["behavioral", "hr", "situational", "cultural", "general"]:
        return SCORING_WEIGHTS_BEHAVIORAL
    return SCORING_WEIGHTS_TECHNICAL


def calculate_weighted_overall_score(
    dimensions: Dict[str, float],
    question_type: Optional[str] = "Technical"
) -> float:
    """
    Calculate deterministic, mathematically derived overall score from dimension assessments.
    Enforces 0-100 bounding and uniform 2-decimal rounding.
    """
    weights = get_weights_for_question_type(question_type)
    total = 0.0

    for dim, weight in weights.items():
        val = clamp_score(dimensions.get(dim, 0.0))
        total += val * weight

    return round(clamp_score(total), 2)
