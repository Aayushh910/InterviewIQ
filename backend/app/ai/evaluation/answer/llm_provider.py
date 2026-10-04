import json
import logging
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings
from app.ai.evaluation.answer.provider import BaseAnswerEvaluationProvider
from app.ai.evaluation.answer.exceptions import AIProviderError, AIProviderTimeoutError

logger = logging.getLogger(__name__)


class LLMAnswerEvaluationProvider(BaseAnswerEvaluationProvider):
    """
    Production-ready LLM Answer Evaluation Provider using OpenAI-compatible API endpoints
    or HTTP-based LLM services. Supports structured JSON evaluation responses, configurable timeouts,
    and safe credential isolation.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, timeout: Optional[float] = None):
        self.api_key = api_key or settings.AI_API_KEY
        self.model = model or settings.AI_MODEL
        self.timeout = timeout or settings.AI_TIMEOUT_SECONDS
        self.api_url = "https://api.openai.com/v1/chat/completions"

    def evaluate_answer(
        self,
        question_text: str,
        answer_text: str,
        interview_meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        meta = interview_meta or {}
        interview_type = meta.get("interview_type", "Technical")
        domain = meta.get("domain", "Software Engineering")
        difficulty = meta.get("difficulty", "Medium")
        job_role = meta.get("job_role", "Candidate")
        expected_topics = meta.get("expected_topics") or []

        if not self.api_key:
            logger.error("AI_API_KEY is not configured for LLMAnswerEvaluationProvider.")
            raise AIProviderError("AI provider authentication key is not configured.")

        system_prompt = (
            "You are an objective AI interview evaluator assessing a candidate response. "
            "Return ONLY a raw JSON object with NO markdown formatting. "
            "JSON structure required:\n"
            "{\n"
            '  "relevance": float (0.0-100.0),\n'
            '  "correctness": float (0.0-100.0),\n'
            '  "completeness": float (0.0-100.0),\n'
            '  "clarity": float (0.0-100.0),\n'
            '  "technical_depth": float (0.0-100.0),\n'
            '  "technical_accuracy": float (0.0-100.0),\n'
            '  "communication": float (0.0-100.0),\n'
            '  "grammar": float (0.0-100.0),\n'
            '  "confidence": float (0.0-1.0),\n'
            '  "strengths": list of concise, actionable strings,\n'
            '  "improvements": list of concise, actionable strings,\n'
            '  "summary": string summary of candidate evaluation\n'
            "}\n\n"
            "Strict Evaluation Guidelines:\n"
            "1. Relevance: Low score (<40) if answer is off-topic or fails to answer the question asked.\n"
            "2. Correctness: Evaluate factual & technical correctness. Do not reward confident false statements.\n"
            "3. Clarity & Communication: Evaluate logical clarity and explanation quality based strictly on the text/transcript provided.\n"
            "4. Confidence: Treat confidence strictly as observable clarity and structured verbal articulation. NEVER diagnose psychological state or internal emotions.\n"
            "5. Do NOT invent candidate details not present in the answer."
        )

        user_prompt = f"""
Interview Context:
- Type: {interview_type}
- Domain: {domain}
- Difficulty: {difficulty}
- Role Target: {job_role}
- Expected Topics: {', '.join(expected_topics) if expected_topics else 'N/A'}

Question:
{question_text}

Candidate Answer:
{answer_text}

Provide structured JSON evaluation:
"""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2
        }

        try:
            logger.info(f"Initiating AI evaluation request via model '{self.model}' with timeout {self.timeout}s")
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(self.api_url, headers=headers, json=payload)

            if resp.status_code == 401:
                logger.error("AI Provider authentication failure (401 Invalid Key)")
                raise AIProviderError("AI Provider authentication failed.")

            if resp.status_code != 200:
                logger.error(f"AI Provider error HTTP {resp.status_code}: {resp.text}")
                raise AIProviderError(f"AI Provider returned HTTP {resp.status_code}")

            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return parsed

        except httpx.TimeoutException:
            logger.error(f"AI Provider timeout after {self.timeout}s")
            raise AIProviderTimeoutError(f"AI provider evaluation timed out after {self.timeout} seconds.")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response from LLM provider: {e}")
            raise AIProviderError("AI provider returned invalid non-JSON output.")
        except httpx.RequestError as e:
            logger.error(f"Network error communicating with AI provider: {e}")
            raise AIProviderError("Network connection to AI provider failed.")
