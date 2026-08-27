import json
import logging
from typing import Dict, Any, List, Optional, Tuple
import httpx

from app.core.config import settings
from app.ai.providers.base import BaseAIProvider
from app.ai.evaluation.answer.exceptions import AIProviderError, AIProviderTimeoutError, AIValidationError

logger = logging.getLogger(__name__)


class GroqProvider(BaseAIProvider):
    """
    Groq AI Provider integration using Groq's high-speed OpenAI-compatible API endpoint.
    Supports structured JSON generation, configurable timeouts, and rate limit resilience.
    """

    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
        **kwargs
    ):

        self.api_key = api_key or settings.AI_API_KEY
        self.model = model or settings.AI_MODEL or "llama-3.3-70b-versatile"
        self.timeout = timeout or settings.AI_TIMEOUT_SECONDS or 15.0

    def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = True
    ) -> Dict[str, Any]:
        """
        Send completion request to Groq API and parse response.
        """
        if not self.api_key:
            logger.error("AI_API_KEY is not configured for GroqProvider.")
            raise AIProviderError("Groq AI provider API key is missing or not configured.")

        sys_prompt = system_prompt or "You are an AI system for InterviewIQ. Respond with valid JSON."
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        candidate_models = [self.model, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
        # Deduplicate preserving order
        candidate_models = list(dict.fromkeys(candidate_models))

        last_error = None
        for current_model in candidate_models:
            payload: Dict[str, Any] = {
                "model": current_model,
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3
            }

            if json_mode:
                payload["response_format"] = {"type": "json_object"}

            try:
                logger.info(f"Initiating Groq API completion request (model: '{current_model}', timeout: {self.timeout}s)")
                with httpx.Client(timeout=self.timeout) as client:
                    resp = client.post(self.GROQ_API_URL, headers=headers, json=payload)

                if resp.status_code == 401:
                    logger.error("Groq API authentication failure (HTTP 401)")
                    raise AIProviderError("Groq API authentication failed. Invalid API key.")

                if resp.status_code == 429:
                    logger.error("Groq API rate limit exceeded (HTTP 429)")
                    raise AIProviderError("Groq API rate limit exceeded. Please try again shortly.")

                if resp.status_code != 200:
                    logger.warning(f"Groq API model '{current_model}' returned HTTP {resp.status_code}: {resp.text}. Trying next model...")
                    last_error = f"HTTP {resp.status_code}: {resp.text}"
                    continue

                data = resp.json()
                content = data["choices"][0]["message"]["content"]

                if json_mode:
                    try:
                        parsed = json.loads(content)
                        return parsed
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse JSON response from Groq API: {e}")
                        raise AIValidationError("Groq AI provider returned invalid non-JSON output.")

                return {"raw_text": content}

            except (httpx.TimeoutException, httpx.RequestError) as e:
                logger.warning(f"Network error on Groq model '{current_model}': {e}")
                last_error = str(e)
                continue

        raise AIProviderError(f"All Groq models failed. Last error: {last_error}")

    def generate_questions(
        self,
        interview_meta: Dict[str, Any],
        number_of_questions: int
    ) -> List[Dict[str, Any]]:
        """
        Generate structured interview questions via Groq AI provider.
        """
        from app.ai.question_generation.prompts import build_question_generation_prompt

        sys_prompt, user_prompt = build_question_generation_prompt(interview_meta, number_of_questions)
        response_dict = self.generate_completion(
            prompt=user_prompt,
            system_prompt=sys_prompt,
            json_mode=True
        )

        from app.ai.question_generation.validator import validate_and_parse_questions_response
        return validate_and_parse_questions_response(response_dict, expected_count=number_of_questions)

    def generate_follow_up(
        self,
        interview_meta: Dict[str, Any],
        question_text: str,
        answer_text: str,
        previous_context: Optional[List[Dict[str, str]]] = None,
        follow_up_depth: int = 0
    ) -> Tuple[bool, str, Optional[str], Optional[str]]:
        """
        Analyze candidate answer and generate adaptive follow-up decision tuple via Groq API:
        (should_follow_up, reason, follow_up_question, follow_up_type).
        """
        from app.ai.follow_up.prompts import build_follow_up_prompt
        from app.ai.follow_up.validator import validate_and_parse_follow_up_response

        sys_prompt, user_prompt = build_follow_up_prompt(
            interview_meta=interview_meta,
            question_text=question_text,
            answer_text=answer_text,
            previous_context=previous_context,
            follow_up_depth=follow_up_depth
        )

        response_dict = self.generate_completion(
            prompt=user_prompt,
            system_prompt=sys_prompt,
            json_mode=True
        )

        return validate_and_parse_follow_up_response(response_dict)

