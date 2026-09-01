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
    if not clean_ans or word_count == 0 or len(clean_ans) < 3:
        return 0.0

    if duration_seconds is None or duration_seconds <= 0:
        # If timing was not recorded, calculate based on approximate speaking time
        if word_count < 5:
            return 35.0
        elif word_count < 15:
            return 60.0
        return 80.0

    dur = float(duration_seconds)

    # 1. Very short / rushed answers (< 3 seconds or < 6 words)
    if dur < 3.0:
        return 25.0
    if dur < 6.0:
        if word_count < 10:
            return 45.0
        return 65.0

    # 2. Concise range: 6s to 15s
    if 6.0 <= dur < 15.0:
        if word_count >= 15:
            return 85.0
        elif word_count >= 8:
            return 70.0
        return 50.0

    # 3. Optimal timing range: 15s to 90s
    if 15.0 <= dur <= 90.0:
        wpm = (word_count / (dur / 60.0)) if dur > 0 else 0
        if 80 <= wpm <= 180 and word_count >= 15:
            return 98.0
        elif word_count >= 12:
            return 90.0
        return 75.0

    # 4. Extended timing range: 90s to 150s
    if 90.0 < dur <= 150.0:
        return 85.0

    # 5. Overly long timing range (> 150s)
    if dur > 150.0:
        if dur > 240.0:
            return 55.0
        return 70.0

    return 80.0


def calculate_grammar_score(raw_answer: str) -> float:
    """
    Deterministic grammar and linguistic quality scoring.
    Evaluates typos, non-words, missing contractions, grammatical disagreements,
    terminal punctuation, and sentence capitalization.
    """
    text = (raw_answer or "").strip()
    if not text or len(text) < 3:
        return 0.0

    words = text.split()
    word_count = len(words)
    low_text = text.lower()

    score = 90.0

    # 1. Detect common typos and non-words
    typo_patterns = [
        r'\bknwo\b', r'\bteh\b', r'\brecieve\b', r'\bseperate\b', r'\bdefinately\b',
        r'\bdont\b', r'\bcant\b', r'\bwont\b', r'\bdidnt\b', r'\bisnt\b', r'\barent\b',
        r'\bhavent\b', r'\bhasnt\b', r'\bwouldnt\b', r'\bcouldnt\b', r'\bshouldnt\b',
        r'\bplz\b', r'\bthx\b', r'\bgonna\b', r'\bwanna\b', r'\bdunno\b', r'\bidk\b'
    ]

    typo_count = 0
    for pat in typo_patterns:
        if re.search(pat, low_text):
            typo_count += 1

    if typo_count > 0:
        score -= min(45.0, typo_count * 20.0)

    # 2. Detect common broken grammar / syntax phrases
    broken_grammar_patterns = [
        r'\bdont telling\b', r'\bnot telling\b', r'\bis went\b', r'\bhave did\b',
        r'\bme is\b', r'\bthey does\b', r'\bhe do\b', r'\bshe do\b', r'\bknow but dont\b'
    ]
    for bg_pat in broken_grammar_patterns:
        if re.search(bg_pat, low_text):
            score -= 30.0

    # 3. Short fragmented answer penalty
    if word_count <= 4 and typo_count > 0:
        score = min(score, 35.0)

    # 4. Capitalization at start of sentences
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    if sentences:
        capitalized_count = sum(1 for s in sentences if s[0].isupper())
        cap_ratio = capitalized_count / len(sentences)
        if cap_ratio < 0.5:
            score -= 15.0
    else:
        score -= 10.0

    # 5. Proper terminal punctuation
    if not text.endswith(('.', '!', '?')):
        score -= 5.0

    # 6. Repeated word penalty (stutter / loop artifacts)
    repeated_count = 0
    for i in range(len(words) - 1):
        if words[i].lower() == words[i + 1].lower() and len(words[i]) > 2:
            repeated_count += 1
    if repeated_count > 1:
        score -= min(25.0, repeated_count * 10.0)

    return round(clamp_score(score), 1)


def generate_recommended_response(question_text: str, domain: Optional[str] = "Software Engineering", difficulty: Optional[str] = "Medium") -> str:
    """
    Generates a concise, high-quality domain-accurate model answer tailored to the specific question prompt.
    """
    q_low = (question_text or "").lower()

    # Machine Learning / Data Science
    if "imbalanced" in q_low or ("binary classifier" in q_low and "metric" in q_low):
        return "For imbalanced binary classification, standard accuracy is misleading. Recommended metrics include Precision-Recall AUC (PR-AUC), F1-Score (or F-beta for recall prioritization), Recall at fixed False Positive Rate, and ROC-AUC along with cost-sensitive confusion matrix analysis."
    if "rmse" in q_low or "mae" in q_low or "r2" in q_low or "regression metric" in q_low:
        return "Regression models are evaluated using RMSE (Root Mean Squared Error) to penalize large errors, MAE (Mean Absolute Error) for robust median residuals, and R² (Coefficient of Determination) to quantify variance explained relative to a baseline mean predictor."
    if "overfitting" in q_low or "regularization" in q_low:
        return "Overfitting occurs when a model learns noise rather than generalized patterns. Mitigate it using L1/L2 regularization, dropout in neural nets, tree pruning/early stopping, cross-validation, and expanding training data with data augmentation."
    if "bias" in q_low and "variance" in q_low:
        return "The bias-variance tradeoff balances underfitting and overfitting: high bias models underfit by making overly simplistic assumptions, whereas high variance models overfit training noise. Ensemble methods like Random Forests reduce variance, while Gradient Boosting reduces bias."
    if "precision" in q_low and "recall" in q_low:
        return "Precision measures the accuracy of positive predictions (True Positives / (True Positives + False Positives)), while Recall measures the ability to find all positive instances (True Positives / (True Positives + False Negatives)). The harmonic mean is the F1-score."

    # Frontend / React / Web
    if "virtual dom" in q_low or ("react" in q_low and "diff" in q_low):
        return "React's Virtual DOM is a lightweight in-memory representation of the real DOM. When state updates, React runs Fiber reconciliation using an O(n) heuristic diffing algorithm to compare trees and batch only the minimal set of real DOM mutations."
    if "useeffect" in q_low or "lifecycle" in q_low or "hook" in q_low:
        return "useEffect encapsulates side effects in functional React components. It accepts an effect callback and a dependency array: omitting dependencies runs on every render, an empty array runs once on mount, and returning a cleanup function tears down subscriptions/timers."
    if "state management" in q_low or "redux" in q_low or "zustand" in q_low:
        return "Global state management centralizes application state outside component hierarchies. Redux uses an immutable store with pure reducers and action dispatchers, while modern alternatives like Zustand offer lightweight hook-based stores with minimal boilerplate."
    if "dom" in q_low and "event" in q_low:
        return "The DOM event flow progresses in three phases: Capturing (event travels down from Window to the target), Target (event executes on target element), and Bubbling (event bubbles back up to Window). Event delegation leverages bubbling by attaching a single listener to a parent element."

    # Backend / Distributed Systems / Databases
    if "indexing" in q_low or "index" in q_low or "b-tree" in q_low:
        return "Database indexes create balanced tree (B-Tree) or hash structures on table columns to replace sequential full-table scans with O(log n) lookups. In PostgreSQL, index efficacy is verified using EXPLAIN ANALYZE, while composite indexes optimize multi-column filters."
    if "acid" in q_low:
        return "ACID guarantees transactional database reliability: Atomicity ensures all-or-nothing execution via write-ahead logging; Consistency maintains schema constraints; Isolation prevents dirty/non-repeatable reads using concurrency control (MVCC); and Durability commits writes permanently to disk."
    if "rest" in q_low:
        return "REST (Representational State Transfer) is an architectural style utilizing stateless client-server communication over HTTP. It standardizes statelessness, uniform interfaces (CRUD via GET, POST, PUT, DELETE), JSON representations, and standard HTTP status codes."
    if "microservice" in q_low or "saga" in q_low or "distributed" in q_low:
        return "Microservices decouple monolithic architectures into independently deployable, domain-bounded services communicating via REST, gRPC, or event streams. Distributed transactions use the Saga pattern with compensating actions to maintain eventual consistency."
    if "caching" in q_low or "redis" in q_low:
        return "Redis is an in-memory data store used for low-latency caching, session management, and rate limiting. Key caching strategies include Cache-Aside (read-through), Write-Through, and TTL eviction policies (LRU/LFU) to prevent stale database queries."

    # Behavioral / Leadership / Situational
    if "conflict" in q_low or "disagreement" in q_low:
        return "A strong STAR response: describe the specific technical disagreement, emphasize active listening and objective benchmark data, explain the collaborative alignment reached, and conclude with the positive measurable team outcome."
    if "challenge" in q_low or "difficult project" in q_low:
        return "Structure using the STAR framework: outline the high-stakes situation, define your specific technical responsibility, explain the structured problem-solving actions taken under pressure, and highlight the quantifiable impact achieved."

    # Generic High-Quality Default tailored to domain
    return f"A comprehensive {domain} response should define the core concept, explain the underlying technical mechanism, discuss architectural tradeoffs, and provide a concrete production implementation example."


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
