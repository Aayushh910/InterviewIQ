import logging
from typing import Dict, Any, Optional
from app.ai.evaluation.answer.provider import BaseAnswerEvaluationProvider

logger = logging.getLogger(__name__)


class HeuristicAnswerEvaluationProvider(BaseAnswerEvaluationProvider):
    """
    Deterministic domain-aware answer evaluation provider for development and testing.
    Analyzes semantic relevance, correctness indicators, completeness, clarity, communication, and technical depth.
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

        raw_ans = (answer_text or "").strip()
        low_ans = raw_ans.lower()
        low_q = (question_text or "").lower()

        # 1. Handle Empty / Placeholder Answers
        if not raw_ans or len(raw_ans) < 5 or "candidate audio response recorded" in low_ans or "no answer provided" in low_ans:
            return {
                "relevance": 0.0,
                "correctness": 0.0,
                "completeness": 0.0,
                "clarity": 0.0,
                "technical_depth": 0.0,
                "communication": 0.0,
                "confidence": 0.0,
                "strengths": [],
                "improvements": ["Provide a detailed verbal answer explaining your technical reasoning or experience."],
                "summary": "No substantive candidate answer was recorded for this question."
            }

        # 2. Check for Irrelevant Answers (No keyword / concept overlap with question)
        import re
        clean_q_text = re.sub(r'[^\w\s]', ' ', low_q)
        clean_ans_text = re.sub(r'[^\w\s]', ' ', low_ans)

        q_words = set(w for w in clean_q_text.split() if len(w) > 3 and w not in {"what", "how", "why", "when", "explain", "describe", "does", "with", "from", "that", "this", "your"})
        ans_words = set(w for w in clean_ans_text.split() if len(w) > 3)
        common_words = q_words.intersection(ans_words)

        # Check for stem overlap (e.g. index/indexing, postgres/postgresql)
        stem_matches = 0
        for qw in q_words:
            if any(qw[:5] in aw or aw[:5] in qw for aw in ans_words):
                stem_matches += 1

        # Off-topic checks (e.g. talking about weather, sports, or random noise when asking about code/system)
        off_topic_indicators = ["weather", "banana", "football", "pizza", "nba", "movie", "random text", "lorem ipsum"]
        is_explicit_off_topic = any(ot in low_ans for ot in off_topic_indicators) and not common_words

        if (len(q_words) >= 2 and len(common_words) == 0 and len(raw_ans.split()) > 4 and is_explicit_off_topic) or ("irrelevant" in low_ans and len(common_words) == 0):
            return {
                "relevance": 20.0,
                "correctness": 30.0,
                "completeness": 25.0,
                "clarity": 60.0,
                "technical_depth": 15.0,
                "communication": 50.0,
                "confidence": 0.3,
                "strengths": ["Response was grammatically structured."],
                "improvements": [
                    f"Directly address the question prompt '{question_text[:50]}...' instead of tangential topics."
                ],
                "summary": "The candidate response was largely off-topic and failed to address the asked question."
            }

        # 3. Check for Direct Concise Exact Answers (e.g. REST, acronyms, simple technical definitions)
        is_short_exact = False
        if len(raw_ans) < 60 and ("rest" in low_q or "dom" in low_q or "gil" in low_q or "polymorphism" in low_q or "what is" in low_q):
            if any(term in low_ans for term in ["representational", "virtual dom", "global interpreter lock", "objects", "forms", "override", "transfer"]):
                is_short_exact = True

        if is_short_exact:
            return {
                "relevance": 95.0,
                "correctness": 90.0,
                "completeness": 75.0,
                "clarity": 95.0,
                "technical_depth": 70.0,
                "communication": 90.0,
                "confidence": 0.9,
                "strengths": ["Direct, precise, and accurate definition provided."],
                "improvements": ["Consider elaborating further on practical tradeoffs or implementation architecture."],
                "summary": "Concise and accurate answer answering the core technical definition."
            }

        # 4. Standard Evaluation Scoring
        # A. Relevance Score
        relevance_score = 75.0
        if len(common_words) >= 2 or stem_matches >= 2 or any(k in low_ans for k in ["because", "approach", "strategy", "algorithm", "solution", "process", "instance"]):
            relevance_score = 90.0
        elif len(common_words) >= 1 or stem_matches >= 1:
            relevance_score = 82.0

        # B. Correctness & Technical Depth
        correctness_score = 75.0
        depth_score = 70.0

        tech_indicators = [
            "redis", "cache", "caching", "database", "index", "sql", "postgres",
            "microservice", "rate limit", "virtual dom", "fiber", "reconciliation",
            "memoization", "useeffect", "async", "await", "thread", "concurrency",
            "docker", "kubernetes", "aws", "jwt", "auth", "security", "star", "polymorphism",
            "inheritance", "encapsulation", "abstraction", "interface", "pattern"
        ]

        matched_tech = [t for t in tech_indicators if t in low_ans]
        if matched_tech:
            correctness_score = min(98.0, 80.0 + len(matched_tech) * 4.0)
            depth_score = min(95.0, 75.0 + len(matched_tech) * 5.0)

        # C. Completeness
        word_count = len(raw_ans.split())
        if word_count > 60:
            completeness_score = 92.0
        elif word_count > 30:
            completeness_score = 84.0
        elif word_count > 10:
            completeness_score = 75.0
        else:
            completeness_score = 60.0

        # D. Clarity & Communication
        clarity_score = 85.0
        if word_count > 10 and not raw_ans.endswith("."):
            clarity_score = 80.0
        communication_score = round((clarity_score + completeness_score) / 2.0, 1)
        confidence_score = round(min(1.0, max(0.4, (correctness_score + clarity_score) / 200.0)), 2)

        # 5. Generate Structured Strengths & Improvements
        strengths = []
        improvements = []

        if matched_tech:
            strengths.append(f"Demonstrated technical awareness of key domain concepts ({', '.join(matched_tech[:3])}).")
        else:
            strengths.append("Addressed the question prompt with clear structural phrasing.")

        if word_count > 30:
            strengths.append("Provided a detailed explanation with contextual background.")

        if depth_score < 80:
            improvements.append(f"Elaborate more on specific architectural tradeoffs or concrete implementation details for {domain}.")

        if completeness_score < 75:
            improvements.append("Expand on practical code examples, performance outcomes, or failure handling.")

        if not improvements:
            improvements.append("Include quantitative performance metrics or production benchmarks.")

        summary_text = (
            f"A solid {interview_type.lower()} response for {domain} ({difficulty} level) "
            f"demonstrating clear communication and relevant technical concepts."
        )

        return {
            "relevance": round(relevance_score, 1),
            "correctness": round(correctness_score, 1),
            "completeness": round(completeness_score, 1),
            "clarity": round(clarity_score, 1),
            "technical_depth": round(depth_score, 1),
            "communication": communication_score,
            "confidence": confidence_score,
            "strengths": strengths,
            "improvements": improvements,
            "summary": summary_text
        }
