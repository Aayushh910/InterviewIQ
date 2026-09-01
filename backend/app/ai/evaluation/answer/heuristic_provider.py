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

        # ─── 4. Extract Question Keywords and Measure Semantic Overlap ─────────
        clean_q_text = re.sub(r'[^\w\s]', ' ', low_q)
        clean_ans_text = re.sub(r'[^\w\s]', ' ', low_ans)

        stop_words = {
            "what", "how", "why", "when", "where", "which", "explain", "describe",
            "does", "with", "from", "that", "this", "your", "would", "could", "should",
            "have", "been", "about", "using", "into", "their", "there", "these", "those"
        }
        q_words = set(w for w in clean_q_text.split() if len(w) > 3 and w not in stop_words)
        ans_words = set(w for w in clean_ans_text.split() if len(w) > 3)
        common_words = q_words.intersection(ans_words)

        stem_matches = 0
        for qw in q_words:
            if any(qw[:4] in aw or aw[:4] in qw for aw in ans_words if len(aw) >= 4):
                stem_matches += 1

        # Check explicit off-topic terms
        off_topic_indicators = ["weather", "banana", "football", "pizza", "nba", "movie", "random text", "lorem ipsum", "yesterday i went"]
        is_explicit_off_topic = any(ot in low_ans for ot in off_topic_indicators) and not common_words

        if (len(q_words) >= 2 and len(common_words) == 0 and stem_matches == 0 and len(raw_ans.split()) > 3 and is_explicit_off_topic) or ("irrelevant" in low_ans and len(common_words) == 0):
            return {
                "relevance": 10.0,
                "correctness": 10.0,
                "technical_depth": 5.0,
                "technical_accuracy": 5.0,
                "completeness": 10.0,
                "clarity": 50.0,
                "communication": 30.0,
                "confidence": 0.2,
                "strengths": ["Clear sentence structure."],
                "improvements": [
                    f"Directly address the question prompt '{question_text[:60]}...' instead of unrelated topics."
                ],
                "summary": "The candidate response was completely off-topic and failed to address the question asked.",
                "recommended_response": recommended_resp
            }

        # ─── 5. Check for Direct Concise Exact Technical Definitions ───────────
        is_short_exact = False
        if len(raw_ans) < 70 and any(k in low_q for k in ["rest", "virtual dom", "gil", "polymorphism", "acid", "what is"]):
            if any(term in low_ans for term in ["representational state", "virtual dom", "global interpreter lock", "atomicity", "objects", "forms", "override"]):
                is_short_exact = True

        if is_short_exact:
            return {
                "relevance": 95.0,
                "correctness": 92.0,
                "technical_depth": 75.0,
                "technical_accuracy": 90.0,
                "completeness": 75.0,
                "clarity": 95.0,
                "communication": 90.0,
                "confidence": 0.9,
                "strengths": ["Direct, precise, and accurate technical definition provided."],
                "improvements": ["Consider elaborating further on practical production tradeoffs or implementation details."],
                "summary": "Concise and accurate answer defining the core technical concept.",
                "recommended_response": recommended_resp
            }

        # ─── 6. Comprehensive Semantic & Technical Depth Assessment ───────────
        words = raw_ans.split()
        word_count = len(words)

        # Technical concept dictionary across software engineering, ML, databases, web
        tech_dictionary = [
            "redis", "cache", "caching", "database", "index", "indexes", "indexing", "sql", "postgres", "postgresql",
            "microservice", "microservices", "saga", "rate limit", "virtual dom", "fiber", "reconciliation",
            "memoization", "useeffect", "async", "await", "thread", "concurrency", "mutex", "lock",
            "docker", "kubernetes", "aws", "jwt", "oauth", "auth", "security", "star", "polymorphism",
            "inheritance", "encapsulation", "abstraction", "interface", "pattern", "acid", "mvcc", "b-tree",
            "gin", "gist", "explain analyze", "precision", "recall", "f1", "f1-score", "pr-auc", "roc-auc",
            "regularization", "overfitting", "underfitting", "bias", "variance", "cross-validation", "latency",
            "throughput", "horizontal scaling", "sharding", "replication", "partitioning", "consistency"
        ]

        matched_tech = [t for t in tech_dictionary if t in low_ans]
        has_reasoning = any(k in low_ans for k in ["because", "therefore", "in order to", "enables", "reduces", "improves", "tradeoff", "specifically", "compared to"])

        # Base scores determined strictly from concept matches and question overlap
        if len(common_words) == 0 and stem_matches == 0 and len(matched_tech) == 0:
            # Low correlation answer
            relevance_score = 25.0
            correctness_score = 20.0
            depth_score = 15.0
            completeness_score = min(40.0, word_count * 1.5)
            clarity_score = 65.0
            summary_text = "The response did not address the required technical concepts for this question."
        elif len(common_words) >= 1 or stem_matches >= 1 or len(matched_tech) >= 1:
            # Partial to Strong Answer
            tech_count = len(matched_tech)
            overlap_count = max(len(common_words), stem_matches)

            relevance_score = min(98.0, 50.0 + overlap_count * 15.0 + (10.0 if has_reasoning else 0.0))
            correctness_score = min(98.0, 45.0 + tech_count * 12.0 + overlap_count * 8.0)
            depth_score = min(95.0, 40.0 + tech_count * 15.0 + (15.0 if word_count > 30 else 0.0))

            if word_count > 50:
                completeness_score = min(95.0, 75.0 + (15.0 if has_reasoning else 5.0))
            elif word_count > 25:
                completeness_score = min(85.0, 60.0 + tech_count * 5.0)
            elif word_count > 10:
                completeness_score = min(75.0, 45.0 + tech_count * 6.0)
            else:
                completeness_score = 40.0

            clarity_score = 85.0 if raw_ans.endswith(('.', '!', '?')) else 75.0

            if correctness_score >= 80.0:
                summary_text = f"A solid and technically sound response demonstrating strong understanding of {domain} concepts."
            else:
                summary_text = f"A partially correct response addressing {domain} fundamentals but missing key technical details."
        else:
            relevance_score = 40.0
            correctness_score = 35.0
            depth_score = 30.0
            completeness_score = 35.0
            clarity_score = 70.0
            summary_text = "The response provided limited relevant context for the question."

        communication_score = round((clarity_score + completeness_score) / 2.0, 1)
        confidence_score = round(min(1.0, max(0.2, (correctness_score + clarity_score) / 200.0)), 2)

        # ─── 7. Generate Strengths & Improvements ──────────────────────────────
        strengths = []
        improvements = []

        if matched_tech:
            strengths.append(f"Demonstrated technical awareness of key domain concepts ({', '.join(matched_tech[:3])}).")
        elif len(common_words) >= 1:
            strengths.append("Directly addressed the primary question subject matter.")
        else:
            strengths.append("Articulated response in complete sentences.")

        if word_count > 30 and has_reasoning:
            strengths.append("Structured the explanation with supporting causal reasoning.")

        if depth_score < 75:
            improvements.append(f"Deepen technical explanation with concrete architecture or algorithm details for {domain}.")

        if completeness_score < 75:
            improvements.append("Cover edge cases, performance tradeoffs, and production reliability considerations.")

        if not improvements:
            improvements.append("Consider citing quantitative benchmarks or production failure modes.")

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
