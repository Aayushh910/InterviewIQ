import logging
from typing import Dict, Any, List, Optional, Tuple
from app.ai.providers.base import BaseAIProvider
from app.ai.evaluation.answer.exceptions import AIProviderError, AIProviderTimeoutError

logger = logging.getLogger(__name__)


# Standard domain/topic sample question pools for mock mode
MOCK_QUESTION_POOLS = {
    "Frontend": [
        "How does React's Virtual DOM reconciliation diffing algorithm optimize DOM updates?",
        "What are the key trade-offs between Client-Side Rendering (CSR) and Server-Side Rendering (SSR) in Next.js?",
        "How do you handle state normalization and memory leak prevention in large-scale React applications?",
        "Explain the JavaScript event loop, microtasks (Promises), and macrotasks (setTimeout).",
        "What strategies do you use to optimize Core Web Vitals (LCP, INP, CLS) for high-traffic web applications?"
    ],
    "Backend": [
        "How do you design a resilient microservice with rate limiting, circuit breaker, and retry patterns?",
        "Compare REST APIs, gRPC, and GraphQL for inter-service microservice communication.",
        "How do you optimize SQL query execution plans, indexes, and connection pooling in PostgreSQL?",
        "Explain Python's Global Interpreter Lock (GIL) and how async/await differs from multiprocessing in FastAPI.",
        "How do you implement distributed caching with Redis while avoiding cache stampede and invalidation issues?"
    ],
    "Data Science": [
        "Explain the bias-variance tradeoff and how L1/L2 regularization prevents model overfitting.",
        "How do gradient descent optimizers like Adam and SGD differ in convergence speed and local minima traps?",
        "Describe your approach to feature selection and handling imbalanced datasets in classification models.",
        "What are the structural differences between CNNs and Transformer architectures for sequential data?",
        "How do you detect model drift and maintain continuous deployment pipelines for ML models in production?"
    ],
    "DevOps": [
        "How do you design a CI/CD pipeline with automated zero-downtime blue/green deployment strategy?",
        "Explain Kubernetes pod lifecycles, container resource limits, and Horizontal Pod Autoscaling (HPA).",
        "How do you manage Infrastructure as Code (IaC) with Terraform while securing state files?",
        "Describe your monitoring, centralized logging, and alerting strategy for distributed cloud applications.",
        "How do you handle secrets management and zero-trust IAM access policies across multi-cloud environments?"
    ],
    "Behavioral": [
        "Tell me about a time you had a technical disagreement with a colleague and how you resolved it using the STAR method.",
        "Describe a complex project that missed deadlines or failed, and what engineering tradeoffs you learned.",
        "How do you balance product feature delivery velocity against paying down technical debt?",
        "Tell me about a situation where you took initiative to mentor a teammate or improve team engineering practices.",
        "Where do you see your technical leadership trajectory over the next 3 to 5 years?"
    ]
}


class MockProvider(BaseAIProvider):
    """
    Deterministic Mock AI Provider for zero-cost local testing and offline development.
    Supports failure mode testing (mock_mode="failure", "timeout", "malformed").
    """

    def __init__(self, mock_mode: str = "success"):
        self.mock_mode = mock_mode

    def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = True
    ) -> Dict[str, Any]:
        """
        Simulate completion generation for mock mode.
        """
        if self.mock_mode == "failure":
            raise AIProviderError("Mock provider simulated API failure.")
        if self.mock_mode == "timeout":
            raise AIProviderTimeoutError("Mock provider simulated API timeout.")

        return {"status": "success", "mock": True}

    def generate_questions(
        self,
        interview_meta: Dict[str, Any],
        number_of_questions: int
    ) -> List[Dict[str, Any]]:
        """
        Generate mock interview questions based on metadata.
        """
        if self.mock_mode == "failure":
            raise AIProviderError("Mock provider simulated API failure.")
        if self.mock_mode == "timeout":
            raise AIProviderTimeoutError("Mock provider simulated API timeout after 15 seconds.")

        domain = interview_meta.get("domain") or interview_meta.get("interview_type") or "Frontend"
        interview_type = (interview_meta.get("interview_type") or "technical").lower()
        difficulty = interview_meta.get("difficulty") or "Medium"

        pool_key = "Behavioral" if interview_type in ["hr", "behavioral"] else domain
        questions_pool = MOCK_QUESTION_POOLS.get(pool_key, MOCK_QUESTION_POOLS["Frontend"])

        count = max(1, min(number_of_questions, 20))
        results = []

        for i in range(count):
            q_text = questions_pool[i % len(questions_pool)]
            if count > len(questions_pool):
                q_text = f"[{difficulty} {domain}] Question {i + 1}: {q_text}"

            results.append({
                "question_text": q_text,
                "question_order": i + 1,
                "question_type": interview_type if interview_type in ["technical", "behavioral", "hr"] else "technical",
                "topic": domain,
                "difficulty": difficulty
            })

        return results

    def generate_follow_up(
        self,
        interview_meta: Dict[str, Any],
        question_text: str,
        answer_text: str,
        previous_context: Optional[List[Dict[str, str]]] = None,
        follow_up_depth: int = 0
    ) -> Tuple[bool, str, Optional[str], Optional[str]]:
        """
        Generate deterministic mock follow-up decision for testing.
        """
        if self.mock_mode == "failure":
            raise AIProviderError("Mock provider simulated API failure.")
        if self.mock_mode == "timeout":
            raise AIProviderTimeoutError("Mock provider simulated API timeout after 15 seconds.")
        if self.mock_mode == "no_follow_up":
            return False, "Mock mode: Answer was comprehensive and complete.", None, None

        domain = interview_meta.get("domain") or "Technical"
        low_ans = (answer_text or "").lower()

        if "don't know" in low_ans or len(answer_text.strip()) < 5:
            return False, "Candidate answer is too brief or empty for follow-up probing.", None, None

        follow_up_q = f"Regarding your response to '{question_text[:40]}...', what specific trade-offs or edge-case limitations did you encounter in that {domain} scenario?"
        reason = f"Candidate provided a good initial response, but deeper probing on {domain} edge cases and trade-offs is valuable."
        follow_up_type = "technical_depth"

        return True, reason, follow_up_q, follow_up_type

