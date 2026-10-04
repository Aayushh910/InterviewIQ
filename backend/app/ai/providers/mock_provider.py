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
    Supports failure mode testing (mock_mode="failure", "timeout", "rate_limit", "malformed", "invalid_tool_call").
    """

    def __init__(self, mock_mode: str = "success", configured_responses: Optional[List[Dict[str, Any]]] = None):
        self.mock_mode = mock_mode
        self.configured_responses: List[Dict[str, Any]] = list(configured_responses) if configured_responses else []
        self.call_history: List[Dict[str, Any]] = []

    def set_mock_mode(self, mode: str) -> None:
        self.mock_mode = mode

    def add_configured_response(self, response: Dict[str, Any]) -> None:
        self.configured_responses.append(response)

    def generate_chat_with_tools(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = "auto",
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """
        Deterministic mock implementation of chat completions with tool calling.
        """
        import json
        self.call_history.append({"messages": messages, "tools": tools})

        if self.mock_mode == "failure":
            raise AIProviderError("Mock provider simulated API failure.")
        if self.mock_mode == "timeout":
            raise AIProviderTimeoutError("Mock provider simulated API timeout.")
        if self.mock_mode == "rate_limit":
            raise AIProviderError("Groq API rate limit exceeded. Please try again shortly.")

        # Check for preconfigured response queue
        if self.configured_responses:
            return self.configured_responses.pop(0)

        if self.mock_mode == "invalid_tool_call":
            return {
                "content": None,
                "tool_calls": [{
                    "id": "call_invalid_999",
                    "type": "function",
                    "function": {
                        "name": "non_existent_tool_xyz",
                        "arguments": json.dumps({"param": "invalid"})
                    }
                }],
                "finish_reason": "tool_calls"
            }

        if self.mock_mode == "malformed_json_args":
            return {
                "content": None,
                "tool_calls": [{
                    "id": "call_bad_json_888",
                    "type": "function",
                    "function": {
                        "name": "evaluate_answer",
                        "arguments": "{not valid json at all!"
                    }
                }],
                "finish_reason": "tool_calls"
            }

        if self.mock_mode == "malformed":
            return {
                "content": "This is raw unstructured plain text that is NOT valid JSON decision format.",
                "tool_calls": [],
                "finish_reason": "stop"
            }

        if self.mock_mode == "infinite_loop":
            # Always request another tool call to trigger max iterations safety limit
            return {
                "content": None,
                "tool_calls": [{
                    "id": f"call_loop_{len(self.call_history)}",
                    "type": "function",
                    "function": {
                        "name": "get_interview_state",
                        "arguments": "{}"
                    }
                }],
                "finish_reason": "tool_calls"
            }

        if self.mock_mode == "direct_response":
            return {
                "content": json.dumps({
                    "action": "CONTINUE",
                    "reasoning": "Mock provider direct reasoning without tool calls.",
                    "response_to_candidate": "Proceeding with the session.",
                    "tool_call_used": None,
                    "metadata": {}
                }),
                "tool_calls": [],
                "finish_reason": "stop"
            }

        # Check recent messages for tool results
        last_tool_msg = next((m for m in reversed(messages) if m.get("role") == "tool"), None)

        if last_tool_msg:
            # A tool just returned a result!
            # If evaluate_answer returned, maybe follow up or continue
            tool_content = last_tool_msg.get("content", "{}")
            try:
                result_data = json.loads(tool_content) if isinstance(tool_content, str) else tool_content
            except Exception:
                result_data = {}

            tool_name = last_tool_msg.get("name", "")

            if tool_name == "evaluate_answer" or "overall_score" in str(tool_content):
                if self.mock_mode == "follow_up":
                    # Request follow up tool
                    return {
                        "content": None,
                        "tool_calls": [{
                            "id": "call_follow_up_1",
                            "type": "function",
                            "function": {
                                "name": "generate_follow_up_question",
                                "arguments": json.dumps({
                                    "parent_question_text": "Explain React Virtual DOM reconciliation.",
                                    "candidate_answer_text": "It compares two virtual trees and updates only changed nodes.",
                                    "role": "Frontend Engineer",
                                    "domain": "Frontend",
                                    "difficulty": "Medium",
                                    "follow_up_depth": 0
                                })
                            }
                        }],
                        "finish_reason": "tool_calls"
                    }
                else:
                    return {
                        "content": json.dumps({
                            "action": "CONTINUE",
                            "reasoning": "Answer was successfully evaluated. Candidate demonstrated solid understanding.",
                            "response_to_candidate": "Great explanation. Let's move forward.",
                            "tool_call_used": "evaluate_answer",
                            "metadata": {"score": 85.0}
                        }),
                        "tool_calls": [],
                        "finish_reason": "stop"
                    }

            if tool_name == "generate_follow_up_question" or "should_follow_up" in str(tool_content):
                return {
                    "content": json.dumps({
                        "action": "FOLLOW_UP",
                        "reasoning": "Generated an adaptive follow-up probing technical trade-offs.",
                        "response_to_candidate": "Can you elaborate on how React batches state updates during reconciliation?",
                        "tool_call_used": "generate_follow_up_question",
                        "metadata": {"depth": 1}
                    }),
                    "tool_calls": [],
                    "finish_reason": "stop"
                }

            if tool_name == "generate_interview_question" or "question_text" in str(tool_content):
                return {
                    "content": json.dumps({
                        "action": "ASK_QUESTION",
                        "reasoning": "Generated the next interview question.",
                        "response_to_candidate": "Here is your next question.",
                        "tool_call_used": "generate_interview_question",
                        "metadata": {}
                    }),
                    "tool_calls": [],
                    "finish_reason": "stop"
                }

            if tool_name == "analyze_face":
                return {
                    "content": json.dumps({
                        "action": "CONTINUE",
                        "reasoning": "Observed candidate visual presence and camera alignment telemetry.",
                        "response_to_candidate": "Visual presence telemetry recorded.",
                        "tool_call_used": "analyze_face",
                        "metadata": {"face_detected": True}
                    }),
                    "tool_calls": [],
                    "finish_reason": "stop"
                }

            if tool_name == "analyze_behavior":
                return {
                    "content": json.dumps({
                        "action": "CONTINUE",
                        "reasoning": "Observed candidate speech pacing and communication metrics.",
                        "response_to_candidate": "Communication telemetry recorded.",
                        "tool_call_used": "analyze_behavior",
                        "metadata": {"wpm": 136.0}
                    }),
                    "tool_calls": [],
                    "finish_reason": "stop"
                }

            # Generic tool completed
            return {
                "content": json.dumps({
                    "action": "CONTINUE",
                    "reasoning": f"Tool '{tool_name}' completed successfully.",
                    "response_to_candidate": "Tool operation completed.",
                    "tool_call_used": tool_name,
                    "metadata": {}
                }),
                "tool_calls": [],
                "finish_reason": "stop"
            }

        # First message turn (no tool messages yet):
        user_msg = next((m.get("content", "") for m in reversed(messages) if m.get("role") == "user"), "")

        low_msg = user_msg.lower()
        if self.mock_mode == "mock_analyze_face" or "request_face_analysis" in low_msg:
            return {
                "content": None,
                "tool_calls": [{
                    "id": "call_face_mock_1",
                    "type": "function",
                    "function": {
                        "name": "analyze_face",
                        "arguments": json.dumps({
                            "session_id": "test_session_id"
                        })
                    }
                }],
                "finish_reason": "tool_calls"
            }

        if self.mock_mode == "mock_analyze_behavior" or "request_behavior_analysis" in low_msg:
            return {
                "content": None,
                "tool_calls": [{
                    "id": "call_behavior_mock_1",
                    "type": "function",
                    "function": {
                        "name": "analyze_behavior",
                        "arguments": json.dumps({
                            "session_id": "test_session_id",
                            "transcript": "I built an event-driven system with decoupled microservices."
                        })
                    }
                }],
                "finish_reason": "tool_calls"
            }

        if "candidate answer" in low_msg or "candidate_answer" in low_msg or "evaluate this answer" in low_msg or "answer_text" in low_msg:
            # Extract question text if available
            q_text = "Explain how React handles reconciliation."
            if 'active question: "' in low_msg:
                try:
                    start_idx = user_msg.find('ACTIVE QUESTION: "') + len('ACTIVE QUESTION: "')
                    end_idx = user_msg.find('"', start_idx)
                    if end_idx != -1:
                        q_text = user_msg[start_idx:end_idx]
                except Exception:
                    pass

            ans_text = "React uses a virtual DOM diffing algorithm to update changed nodes efficiently."
            if 'candidate answer: "' in low_msg:
                try:
                    start_idx = user_msg.find('CANDIDATE ANSWER: "') + len('CANDIDATE ANSWER: "')
                    end_idx = user_msg.find('"', start_idx)
                    if end_idx != -1:
                        ans_text = user_msg[start_idx:end_idx]
                except Exception:
                    pass

            # Candidate answered, call evaluate_answer tool
            return {
                "content": None,
                "tool_calls": [{
                    "id": "call_eval_1",
                    "type": "function",
                    "function": {
                        "name": "evaluate_answer",
                        "arguments": json.dumps({
                            "question_text": q_text,
                            "candidate_answer_text": ans_text
                        })
                    }
                }],
                "finish_reason": "tool_calls"
            }

        if "end_interview" in user_msg.lower() or "limit reached" in user_msg.lower():
            return {
                "content": json.dumps({
                    "action": "END_INTERVIEW",
                    "reasoning": "Interview limit reached or completion requested.",
                    "response_to_candidate": "Thank you for completing the interview.",
                    "tool_call_used": None,
                    "metadata": {}
                }),
                "tool_calls": [],
                "finish_reason": "stop"
            }

        # Default start / ask question
        return {
            "content": None,
            "tool_calls": [{
                "id": "call_gen_q_1",
                "type": "function",
                "function": {
                    "name": "generate_interview_question",
                    "arguments": json.dumps({
                        "role": "Software Engineer",
                        "domain": "Frontend",
                        "difficulty": "Medium",
                        "interview_type": "Technical",
                        "question_index": 1
                    })
                }
            }],
            "finish_reason": "tool_calls"
        }

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

