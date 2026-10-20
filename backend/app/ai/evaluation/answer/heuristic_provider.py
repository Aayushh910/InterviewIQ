import re
import logging
from typing import Dict, Any, Optional
from app.ai.evaluation.answer.provider import BaseAnswerEvaluationProvider
from app.core.scoring_config import generate_recommended_response

logger = logging.getLogger(__name__)


class HeuristicAnswerEvaluationProvider(BaseAnswerEvaluationProvider):
    """
    Deterministic domain-aware answer evaluation provider.
    Rigorously analyzes candidate transcripts against question requirements,
    penalizes non-answers/evasions, detects domain mismatches, and produces
    question-specific recommended responses and diagnostic critiques.
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

        recommended_resp = generate_recommended_response(question_text, domain, difficulty)

        # ─── 1. Handle Empty / Placeholder Answers ───────────────────────────
        if not raw_ans or len(raw_ans) < 3 or "candidate audio response recorded" in low_ans or "no answer provided" in low_ans:
            return {
                "relevance": 0.0,
                "correctness": 0.0,
                "technical_depth": 0.0,
                "technical_accuracy": 0.0,
                "completeness": 0.0,
                "clarity": 0.0,
                "communication": 0.0,
                "confidence": 0.0,
                "strengths": [],
                "improvements": ["Provide a substantive verbal or written answer explaining your reasoning."],
                "summary": "No candidate answer was submitted for this question.",
                "recommended_response": recommended_resp
            }

        # ─── 2. Detect Evasions, Refusals, "I don't know", and Non-Answers ────
        non_answer_patterns = [
            r"\bi\s*(?:don'?t|dont|do\s*not|cannot|cant|can'?t)\s*(?:know|knwo|remember|recall|understand)\b",
            r"\b(?:dont|don'?t)\s*(?:know|knwo)\b",
            r"\b(?:no\s*idea|no\s*clue|not\s*sure|have\s*no\s*clue|have\s*no\s*idea)\b",
            r"\b(?:dont\s*telling|not\s*telling|wont\s*tell|will\s*not\s*tell)\b",
            r"\b(?:skip|pass|no\s*comment|no\s*answer)\b",
            r"\b(?:dunno|idk)\b"
        ]

        is_non_answer = any(re.search(pat, low_ans) for pat in non_answer_patterns)

        if is_non_answer:
            return {
                "relevance": 0.0,
                "correctness": 0.0,
                "technical_depth": 0.0,
                "technical_accuracy": 0.0,
                "completeness": 0.0,
                "clarity": 40.0 if len(raw_ans.split()) <= 6 else 20.0,
                "communication": 20.0,
                "confidence": 0.1,
                "strengths": ["Candidate directly acknowledged a knowledge gap."],
                "improvements": [
                    f"Review foundational concepts for {domain} questions and practice articulating structured technical explanations."
                ],
                "summary": "The candidate stated they did not know the answer or declined to answer.",
                "recommended_response": recommended_resp
            }

        # ─── 3. Detect Domain / Category Mismatch (e.g. Regression metrics for Classification) ─
        is_classification_q = any(k in low_q for k in ["imbalanced", "classification", "binary classifier", "classifier", "fraud detection"])
        is_regression_ans = any(k in low_ans for k in ["rmse", "mae", "mse", "r2", "r-squared", "mean squared", "mean absolute"])
        has_class_metric = any(k in low_ans for k in ["precision", "recall", "f1", "auc", "roc", "confusion matrix", "smote", "pr-auc"])

        if is_classification_q and is_regression_ans and not has_class_metric:
            return {
                "relevance": 15.0,
                "correctness": 10.0,
                "technical_depth": 20.0,
                "technical_accuracy": 10.0,
                "completeness": 15.0,
                "clarity": 75.0,
                "communication": 45.0,
                "confidence": 0.3,
                "strengths": ["Mentioned standard regression evaluation metrics (RMSE/MAE/MSE/R²)."],
                "improvements": [
                    "For imbalanced binary classification, apply classification metrics like PR-AUC, F1-Score, and Recall rather than regression residuals."
                ],
                "summary": "Candidate provided regression metrics (RMSE/MAE) which do not apply to classification problems.",
                "recommended_response": recommended_resp
            }

        # ─── 4. Extract Real Domain / Technical Question Keywords ──────────────
        clean_q_text = re.sub(r'[^\w\s]', ' ', low_q)
        clean_ans_text = re.sub(r'[^\w\s]', ' ', low_ans)

        common_fillers = {
            "what", "how", "why", "when", "where", "which", "explain", "describe",
            "does", "with", "from", "that", "this", "your", "would", "could", "should",
            "have", "been", "about", "using", "into", "their", "there", "these", "those",
            "tell", "handle", "example", "make", "made", "good", "well", "work", "working",
            "like", "just", "very", "much", "many", "some", "time", "project", "team",
            "people", "thing", "things", "used", "uses", "different", "better", "need",
            "help", "sure", "think", "know", "also", "want", "look", "come", "give", "call",
            "first", "next", "after", "before", "each", "other", "same", "able", "case", "cases"
        }

        q_words = set(w for w in clean_q_text.split() if len(w) > 3 and w not in common_fillers)
        ans_words = set(w for w in clean_ans_text.split() if len(w) > 3 and w not in common_fillers)
        common_words = q_words.intersection(ans_words)

        # ─── 5. Check for Direct Concise Exact Technical Definitions ───────────
        is_short_exact = False
        if len(raw_ans) < 90 and any(k in low_q for k in ["rest", "virtual dom", "gil", "polymorphism", "acid", "what is"]):
            if any(term in low_ans for term in ["representational state", "virtual dom", "global interpreter lock", "atomicity", "objects", "forms", "override"]):
                is_short_exact = True

        if is_short_exact:
            return {
                "relevance": 92.0,
                "correctness": 90.0,
                "technical_depth": 75.0,
                "technical_accuracy": 88.0,
                "completeness": 75.0,
                "clarity": 92.0,
                "communication": 90.0,
                "confidence": 0.9,
                "strengths": ["Direct, accurate technical definition matching the core concept."],
                "improvements": ["Elaborate on production tradeoffs, edge cases, and real-world implementation."],
                "summary": f"Concise and accurate answer defining the core technical concept for {domain}.",
                "recommended_response": recommended_resp
            }

        # ─── 6. Comprehensive Semantic & Technical Depth Assessment ───────────
        words = raw_ans.split()
        word_count = len(words)

        tech_dictionary = [
            "redis", "cache", "caching", "database", "index", "indexes", "indexing", "sql", "postgres", "postgresql",
            "microservice", "microservices", "saga", "rate limit", "virtual dom", "fiber", "reconciliation",
            "memoization", "useeffect", "async", "await", "thread", "concurrency", "mutex", "lock",
            "docker", "kubernetes", "aws", "jwt", "oauth", "auth", "security", "star", "polymorphism",
            "inheritance", "encapsulation", "abstraction", "interface", "pattern", "acid", "mvcc", "b-tree",
            "gin", "gist", "explain analyze", "precision", "recall", "f1", "f1-score", "pr-auc", "roc-auc",
            "regularization", "overfitting", "underfitting", "bias", "variance", "cross-validation", "latency",
            "throughput", "horizontal scaling", "sharding", "replication", "partitioning", "consistency",
            "props", "state", "redux", "zustand", "context", "lifecycle", "webpack", "vite", "typescript",
            "closure", "prototype", "event loop", "callback", "promise", "debounce", "throttle", "rest", "graphql"
        ]

        matched_tech = [t for t in tech_dictionary if t in low_ans]
        has_reasoning = any(k in low_ans for k in ["because", "therefore", "in order to", "enables", "reduces", "improves", "tradeoff", "specifically", "compared to", "result in", "leads to"])

        # Check if user spoke conversational English without real domain substance
        tech_count = len(matched_tech)
        common_count = len(common_words)

        if tech_count == 0 and common_count == 0:
            # Conversational English only, no domain technical keywords
            relevance_score = 22.0
            correctness_score = 18.0
            depth_score = 15.0
            completeness_score = min(30.0, word_count * 1.0)
            clarity_score = 75.0 if word_count >= 5 else 40.0
            summary_text = (
                f"The response was delivered in conversational English, but was off-topic and failed to address the technical "
                f"concepts, terminology, and architectural details required for this {domain} question."
            )
            strengths = ["Clear sentence structure and verbal delivery."] if word_count >= 5 else []
            improvements = [
                f"Directly explain technical mechanisms and use appropriate {domain} terminology instead of generic conversational remarks.",
                "Detail the step-by-step implementation, architectural components, or algorithmic logic."
            ]
        elif tech_count == 0 and common_count == 1:
            # Bare minimum single keyword mentioned without technical backing
            relevance_score = 42.0
            correctness_score = 36.0
            depth_score = 30.0
            completeness_score = min(50.0, 25.0 + word_count * 0.8)
            clarity_score = 78.0
            summary_text = (
                f"The answer mentioned the question subject but provided limited technical depth or concrete {domain} implementation details."
            )
            strengths = ["Identified the primary topic of the question prompt."]
            improvements = [
                f"Provide concrete architecture, code patterns, or algorithms specific to {domain}.",
                "Explain the underlying mechanisms and trade-offs rather than high-level surface statements."
            ]
        else:
            # Genuine technical answer with domain terms and topic overlap
            relevance_score = min(96.0, 45.0 + common_count * 12.0 + tech_count * 10.0 + (10.0 if has_reasoning else 0.0))
            correctness_score = min(96.0, 40.0 + tech_count * 14.0 + common_count * 8.0)
            depth_score = min(95.0, 35.0 + tech_count * 14.0 + (15.0 if word_count > 30 else 5.0))

            if word_count > 45:
                completeness_score = min(95.0, 65.0 + tech_count * 6.0 + (10.0 if has_reasoning else 0.0))
            elif word_count > 20:
                completeness_score = min(85.0, 50.0 + tech_count * 5.0)
            else:
                completeness_score = min(70.0, 35.0 + tech_count * 6.0)

            clarity_score = 88.0 if raw_ans.endswith(('.', '!', '?')) else 78.0

            if correctness_score >= 80.0:
                summary_text = f"Solid technical response demonstrating deep understanding of {domain} concepts with clear reasoning."
            else:
                summary_text = f"Partially complete answer addressing {domain} fundamentals with good technical awareness."

            strengths = []
            if matched_tech:
                strengths.append(f"Demonstrated technical awareness of key domain concepts ({', '.join(matched_tech[:3])}).")
            if has_reasoning:
                strengths.append("Structured response with clear causal reasoning and analytical justification.")
            if common_count >= 1:
                strengths.append("Directly addressed the technical requirements in the question.")

            improvements = []
            if depth_score < 75:
                improvements.append(f"Deepen technical explanation with production-grade edge cases and architectural constraints in {domain}.")
            if completeness_score < 75:
                improvements.append("Cover practical tradeoffs, error handling, and performance scalability.")
            if not improvements:
                improvements.append("Consider citing quantitative production benchmarks or failure modes.")

        communication_score = round((clarity_score + completeness_score) / 2.0, 1)
        confidence_score = round(min(1.0, max(0.15, (correctness_score + clarity_score) / 200.0)), 2)

        return {
            "relevance": round(relevance_score, 1),
            "correctness": round(correctness_score, 1),
            "technical_depth": round(depth_score, 1),
            "technical_accuracy": round(depth_score, 1),
            "completeness": round(completeness_score, 1),
            "clarity": round(clarity_score, 1),
            "communication": communication_score,
            "confidence": confidence_score,
            "strengths": strengths,
            "improvements": improvements,
            "summary": summary_text,
            "recommended_response": recommended_resp
        }
