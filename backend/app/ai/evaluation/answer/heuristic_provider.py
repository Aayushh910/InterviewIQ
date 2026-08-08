import logging
from typing import Dict, Any, Optional
from app.ai.evaluation.answer.provider import BaseAnswerEvaluationProvider

logger = logging.getLogger(__name__)


class HeuristicAnswerEvaluationProvider(BaseAnswerEvaluationProvider):
    """
    Deterministic domain-aware answer evaluation provider for development and testing.
    Analyzes semantic relevance, correctness indicators, completeness, clarity, and technical depth.
    """

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
        experience_level = meta.get("experience_level", "2+")

        raw_ans = (answer_text or "").strip()

        # 1. Handle Empty / Placeholder Answers
        if not raw_ans or len(raw_ans) < 5 or "candidate audio response recorded" in raw_ans.lower():
            return {
                "relevance": 0.0,
                "correctness": 0.0,
                "completeness": 0.0,
                "clarity": 0.0,
                "technical_depth": 0.0,
                "strengths": [],
                "improvements": ["Provide a detailed verbal answer explaining your technical reasoning or experience."],
                "summary": "No substantive candidate answer was recorded for this question."
            }

        low_ans = raw_ans.lower()
        low_q = (question_text or "").lower()

        # 2. Check for Direct Concise Exact Answers (e.g. REST, acronyms, simple technical definitions)
        is_short_exact = False
        if len(raw_ans) < 45 and ("rest" in low_q or "dom" in low_q or "gil" in low_q or "what is" in low_q):
            if any(term in low_ans for term in ["representational", "virtual dom", "global interpreter lock", "transfer"]):
                is_short_exact = True

        if is_short_exact:
            return {
                "relevance": 95.0,
                "correctness": 90.0,
                "completeness": 75.0,
                "clarity": 95.0,
                "technical_depth": 70.0,
                "strengths": ["Direct, precise, and accurate definition provided."],
                "improvements": ["Consider elaborating further on practical tradeoffs or architecture."],
                "summary": "Concise and accurate answer answering the core technical definition."
            }

        # 3. Standard Evaluation Scoring
        # A. Relevance (Keyword & Question context overlap)
        relevance_score = 70.0
        q_words = set(w for w in low_q.split() if len(w) > 3)
        ans_words = set(w for w in low_ans.split() if len(w) > 3)
        common_words = q_words.intersection(ans_words)

        if len(common_words) >= 2 or any(k in low_ans for k in ["because", "approach", "strategy", "algorithm", "solution", "process"]):
            relevance_score = 88.0
        elif len(common_words) >= 1:
            relevance_score = 80.0

        # B. Correctness & Technical Depth (Domain-Matched Keywords)
        correctness_score = 75.0
        depth_score = 70.0

        tech_indicators = [
            "redis", "cache", "caching", "database", "index", "sql", "postgres",
            "microservice", "rate limit", "virtual dom", "fiber", "reconciliation",
            "memoization", "useeffect", "async", "await", "thread", "concurrency",
            "docker", "kubernetes", "aws", "jwt", "auth", "security", "star", "conflict"
        ]

        matched_tech = [t for t in tech_indicators if t in low_ans]
        if matched_tech:
            correctness_score = min(98.0, 80.0 + len(matched_tech) * 5.0)
            depth_score = min(95.0, 75.0 + len(matched_tech) * 6.0)

        # HR / Behavioral Special Handling
        if interview_type.lower() == "hr" or "star" in low_q or "time you" in low_q:
            star_keywords = ["situation", "task", "action", "result", "team", "resolved", "outcome", "learned"]
            star_matches = [k for k in star_keywords if k in low_ans]
            correctness_score = min(95.0, 75.0 + len(star_matches) * 5.0)
            depth_score = min(90.0, 70.0 + len(star_matches) * 5.0)

        # C. Completeness (Length and structural elaboration)
        word_count = len(raw_ans.split())
        if word_count > 60:
            completeness_score = 90.0
        elif word_count > 30:
            completeness_score = 82.0
        elif word_count > 15:
            completeness_score = 75.0
        else:
            completeness_score = 65.0

        # D. Clarity (Sentence structure and coherence)
        clarity_score = 85.0
        if len(raw_ans) > 20 and not raw_ans.endswith("."):
            clarity_score = 80.0

        # 4. Generate Structured Feedback Strengths & Improvements
        strengths = []
        improvements = []

        if matched_tech:
            strengths.append(f"Demonstrated technical awareness of relevant concepts ({', '.join(matched_tech[:3])}).")
        else:
            strengths.append("Addressed the question prompt directly with structured response.")

        if word_count > 30:
            strengths.append("Provided a detailed explanation with contextual context.")

        if depth_score < 80:
            improvements.append(f"Elaborate more on specific architectural tradeoffs or implementation details for {domain}.")

        if completeness_score < 80:
            improvements.append("Expand on concrete outcomes, failure handling, or practical code examples.")

        if not improvements:
            improvements.append("Quantify the overall impact or performance benchmarks of your solution.")

        summary_text = (
            f"A solid and relevant {interview_type.lower()} response for {domain} ({difficulty} level) "
            f"demonstrating clear communication and relevant technical concepts."
        )

        return {
            "relevance": round(relevance_score, 1),
            "correctness": round(correctness_score, 1),
            "completeness": round(completeness_score, 1),
            "clarity": round(clarity_score, 1),
            "technical_depth": round(depth_score, 1),
            "strengths": strengths,
            "improvements": improvements,
            "summary": summary_text
        }
