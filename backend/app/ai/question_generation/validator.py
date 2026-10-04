import logging
from typing import Dict, Any, List
from app.ai.evaluation.answer.exceptions import AIValidationError

logger = logging.getLogger(__name__)


def validate_and_parse_questions_response(raw_response: Dict[str, Any], expected_count: int) -> List[Dict[str, Any]]:
    """
    Validate and parse structured JSON response from AI provider.
    Ensures non-empty questions, valid attributes, correct sequence order, and count enforcement.
    """
    if not isinstance(raw_response, dict):
        logger.error(f"Expected dict from AI provider response, got {type(raw_response)}")
        raise AIValidationError("AI provider response must be a valid JSON object.")

    questions_raw = raw_response.get("questions")
    if not isinstance(questions_raw, list):
        logger.error(f"AI response missing 'questions' array. Keys found: {list(raw_response.keys())}")
        raise AIValidationError("AI response format missing 'questions' list.")

    valid_questions = []

    for idx, item in enumerate(questions_raw):
        if not isinstance(item, dict):
            continue

        q_text = str(item.get("question_text") or item.get("question") or "").strip()

        # Reject empty or ridiculously short question strings
        if len(q_text) < 10:
            logger.warning(f"Skipping malformed or truncated AI question item: {item}")
            continue

        q_type = str(item.get("question_type") or item.get("type") or "technical").lower()
        topic = str(item.get("topic") or "General")
        difficulty = str(item.get("difficulty") or "Medium")

        valid_questions.append({
            "question_text": q_text,
            "question_order": len(valid_questions) + 1,
            "question_type": q_type,
            "topic": topic,
            "difficulty": difficulty
        })

    if not valid_questions:
        logger.error("Zero valid questions parsed from AI provider response.")
        raise AIValidationError("AI provider failed to return any valid structured questions.")

    # Return up to expected_count items
    return valid_questions[:expected_count]
