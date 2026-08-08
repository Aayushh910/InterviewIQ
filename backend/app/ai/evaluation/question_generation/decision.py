import logging
from typing import Tuple
from app.ai.evaluation.question_generation.config import MAX_FOLLOW_UPS_PER_QUESTION

logger = logging.getLogger(__name__)


def should_generate_counter_question(
    main_question_text: str,
    answer_text: str,
    follow_up_depth: int = 0
) -> Tuple[bool, str]:
    """
    Determine if an adaptive counter question should be asked for this candidate response.
    Hard Backend Rule: If current follow_up_depth >= MAX_FOLLOW_UPS_PER_QUESTION, return False.
    """
    if follow_up_depth >= MAX_FOLLOW_UPS_PER_QUESTION:
        logger.info(
            f"Follow-up depth limit reached ({follow_up_depth} >= {MAX_FOLLOW_UPS_PER_QUESTION}). Skipping counter question."
        )
        return False, ""

    if not answer_text or len(answer_text.strip()) < 10:
        return False, ""

    clean_answer = answer_text.strip().lower()

    # Generic or empty placeholder responses skip counter questions
    if "candidate audio response recorded" in clean_answer or "no answer provided" in clean_answer:
        return False, ""

    # Technical / domain keywords trigger adaptive follow-up
    tech_keywords = [
        "redis", "cache", "caching", "virtual dom", "fiber", "state", "redux", "api",
        "microservice", "rate limit", "graphql", "rest", "database", "index", "sql",
        "postgres", "docker", "kubernetes", "aws", "security", "jwt", "star", "conflict",
        "performance", "memory leak", "thread", "async", "queue", "kafka"
    ]

    for kw in tech_keywords:
        if kw in clean_answer:
            return True, kw

    # If response has substantial length (> 30 chars), probe for details
    if len(clean_answer) >= 30:
        return True, "implementation_details"

    return False, ""
