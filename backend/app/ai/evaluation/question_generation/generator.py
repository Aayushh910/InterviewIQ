import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def generate_adaptive_counter_question(
    main_question_text: str,
    answer_text: str,
    interview_meta: Optional[Dict[str, Any]] = None,
    focus: str = ""
) -> str:
    """
    Generate a relevant counter question dynamically based on candidate's actual transcribed answer,
    interview domain, difficulty, and experience level.
    """
    meta = interview_meta or {}
    domain = meta.get("domain", "Backend")
    interview_type = meta.get("interview_type", "Technical")
    difficulty = meta.get("difficulty", "Medium")
    answer_clean = (answer_text or "").strip()

    # Rule-based / Domain-matched Heuristic Generator for reliable zero-cost local execution
    low_ans = answer_clean.lower()

    if "redis" in low_ans or "cache" in low_ans or "caching" in low_ans:
        return f"What strategy would you use to handle cache invalidation and prevent cache stampede when database records update in your {domain} architecture?"

    if "virtual dom" in low_ans or "react" in low_ans or "fiber" in low_ans:
        return "How do you handle memory leak prevention and key prop reconciliation when rendering large dynamic lists in React?"

    if "microservice" in low_ans or "rate limit" in low_ans or "api" in low_ans:
        return f"How do you implement graceful fallback mechanisms and distributed tracing when a downstream {domain} microservice times out?"

    if "database" in low_ans or "sql" in low_ans or "index" in low_ans:
        return "What query execution plan optimizations or indexing strategies do you apply when dealing with high write throughput?"

    if "star" in low_ans or "conflict" in low_ans or "disagreement" in low_ans or interview_type.lower() == "hr":
        return "Looking back at that scenario, what specific metrics or team feedback proved that your resolution strategy achieved the intended outcome?"

    # Contextual fallbacks based on domain and difficulty
    if difficulty.lower() == "hard":
        return f"What major architectural tradeoffs or edge-case limitations did you encounter when implementing that {domain} approach?"

    return f"Can you elaborate on how you handled error handling, edge cases, and performance tradeoffs in that {domain} implementation?"
