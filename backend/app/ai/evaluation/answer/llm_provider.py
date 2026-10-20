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

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
        provider_name: Optional[str] = None
    ):
        self.provider_name = (provider_name or getattr(settings, "AI_PROVIDER", "groq")).lower().strip()
        self.api_key = api_key or getattr(settings, "AI_API_KEY", None)
        self.timeout = timeout or getattr(settings, "AI_TIMEOUT_SECONDS", 20.0)

        # Configure endpoints & models based on provider
        if self.provider_name == "gemini":
            self.api_url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
            self.model = model or "gemini-1.5-flash"
        elif self.provider_name == "groq":
            self.api_url = "https://api.groq.com/openai/v1/chat/completions"
            self.model = model or getattr(settings, "AI_MODEL", None) or "llama-3.3-70b-versatile"
        elif self.provider_name == "ollama":
            self.api_url = "http://localhost:11434/v1/chat/completions"
            self.model = model or "llama3"
        else:  # openai or general
            self.api_url = "https://api.openai.com/v1/chat/completions"
            self.model = model or getattr(settings, "AI_MODEL", None) or "gpt-4o-mini"

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

        # Check for runtime API key or provider override
        runtime_key = meta.get("api_key") or self.api_key
        runtime_provider = (meta.get("provider") or self.provider_name).lower()
        runtime_model = meta.get("model") or self.model

        # Adjust endpoint if runtime provider differs
        target_url = self.api_url
        if runtime_provider == "gemini":
            target_url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
            if not meta.get("model"):
                runtime_model = "gemini-1.5-flash"
        elif runtime_provider == "groq":
            target_url = "https://api.groq.com/openai/v1/chat/completions"
            if not meta.get("model") and runtime_model.startswith("openai/"):
                runtime_model = "llama-3.3-70b-versatile"
        elif runtime_provider in ["openai", "gpt"]:
            target_url = "https://api.openai.com/v1/chat/completions"
            if not meta.get("model"):
                runtime_model = "gpt-4o-mini"

        if not runtime_key:
            logger.warning("No API key available for LLM evaluation. Falling back to heuristic provider.")
            from app.ai.evaluation.answer.heuristic_provider import HeuristicAnswerEvaluationProvider
            return HeuristicAnswerEvaluationProvider().evaluate_answer(question_text, answer_text, meta)

        system_prompt = (
            "You are an expert, objective AI technical interview evaluator. Assess the candidate's answer strictly against "
            "the question prompt and technical requirements.\n"
            "CRITICAL: If the candidate responds with conversational English, off-topic remarks, or vague generic statements "
            "without actual technical domain concepts or correct implementation, assign LOW scores (<35) for relevance, correctness, and technical depth.\n"
            "Return ONLY a raw JSON object with NO markdown or backticks:\n"
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
            '  "strengths": [concise strings identifying verified strengths],\n'
            '  "improvements": [concise, actionable strings detailing what technical details were missing],\n'
            '  "summary": string explaining the exact reason for the score\n'
            "}"
        )

        user_prompt = f"""
Interview Context:
- Domain: {domain}
- Target Role: {job_role}
- Difficulty: {difficulty}
- Expected Topics: {', '.join(expected_topics) if expected_topics else 'N/A'}

Interview Question:
{question_text}

Candidate Answer:
{answer_text}

Evaluate strictly and return JSON:
"""

        headers = {
            "Authorization": f"Bearer {runtime_key}",
            "Content-Type": "application/json"
        }

        # Candidate models for resilience
        candidate_models = [runtime_model]
        if runtime_provider == "groq":
            candidate_models.extend(["llama-3.3-70b-versatile", "llama-3.1-8b-instant"])
        elif runtime_provider == "gemini":
            candidate_models.extend(["gemini-1.5-flash", "gemini-2.0-flash"])
        elif runtime_provider == "openai":
            candidate_models.extend(["gpt-4o-mini", "gpt-4o"])
        candidate_models = list(dict.fromkeys(candidate_models))

        for model_candidate in candidate_models:
            payload = {
                "model": model_candidate,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.2
            }

            try:
                logger.info(f"Initiating AI evaluation request via '{runtime_provider}' model '{model_candidate}'")
                with httpx.Client(timeout=self.timeout) as client:
                    resp = client.post(target_url, headers=headers, json=payload)

                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    return parsed
                elif resp.status_code in [401, 403]:
                    logger.error(f"AI Provider auth failure HTTP {resp.status_code}")
                    break  # Invalid key, fallback
                else:
                    logger.warning(f"AI Provider model '{model_candidate}' error HTTP {resp.status_code}: {resp.text}")
                    continue
            except Exception as e:
                logger.warning(f"Error querying AI provider model '{model_candidate}': {e}")
                continue

        logger.warning("All LLM models failed or timed out. Falling back to heuristic evaluation.")
        from app.ai.evaluation.answer.heuristic_provider import HeuristicAnswerEvaluationProvider
        return HeuristicAnswerEvaluationProvider().evaluate_answer(question_text, answer_text, meta)
