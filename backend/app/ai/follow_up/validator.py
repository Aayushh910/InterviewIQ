import logging
from typing import Dict, Any, Tuple, Optional
from app.ai.follow_up.prompts import VALID_FOLLOW_UP_TYPES
from app.ai.evaluation.answer.exceptions import AIValidationError

logger = logging.getLogger(__name__)


def validate_and_parse_follow_up_response(
    raw_response: Dict[str, Any]
) -> Tuple[bool, str, Optional[str], Optional[str]]:
    """
    Validate structured AI provider response for follow-up decision.
    Returns Tuple of (should_follow_up, reason, follow_up_question, follow_up_type).
    """
    if not isinstance(raw_response, dict):
        logger.error(f"Expected dict response from AI provider, got {type(raw_response)}")
        raise AIValidationError("AI provider response must be a JSON object.")

    should_follow_up = bool(raw_response.get("should_follow_up", False))
    reason = str(raw_response.get("reason") or "Analysis completed.").strip()

    if not should_follow_up:
        return False, reason, None, None

    question_text = str(raw_response.get("follow_up_question") or raw_response.get("question") or "").strip()

    if len(question_text) < 10:
        logger.warning(f"AI requested follow-up but provided empty/truncated question text: '{question_text}'")
        return False, "AI proposed follow-up but question text was invalid.", None, None

    raw_type = str(raw_response.get("follow_up_type") or raw_response.get("type") or "technical_depth").lower().strip()
    if raw_type not in VALID_FOLLOW_UP_TYPES:
        logger.info(f"Mapping unrecognized follow_up_type '{raw_type}' to 'technical_depth'")
        raw_type = "technical_depth"

    return True, reason, question_text, raw_type
