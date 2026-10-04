"""
Deterministic Scoring Engine for InterviewIQ (Phase 12).
Pure mathematical evaluation functions:
- Never calls Groq or external LLMs
- Never accesses the database
- Independent of system clock or random state
- Idempotent and 100% reproducible for identical inputs
"""

import math
from typing import List, Dict, Any, Optional, Tuple

from app.evaluation.config import (
    SCORING_VERSION,
    CATEGORY_WEIGHTS,
    ANSWER_DIMENSION_WEIGHTS,
    VISUAL_METRIC_WEIGHTS,
    COMMUNICATION_METRIC_WEIGHTS,
    RELIABILITY_MULTIPLIERS,
    get_performance_category,
)
from app.evaluation.schemas import (
    AggregatedSessionEvidence,
    QuestionEvidenceBundle,
    NormalizedAnswerEvidence,
    NormalizedVisualEvidence,
    NormalizedBehaviorEvidence,
    PerQuestionScore,
    FinalEvaluationResult,
)


class DeterministicScoringEngine:
    """
    Core mathematical scoring engine implementing weighted, reliability-aware aggregation.
    """

    @classmethod
    def evaluate_session(
        cls,
        evidence: AggregatedSessionEvidence,
        evaluation_id: str = "eval-temp",
    ) -> FinalEvaluationResult:
        """
        Produce a complete, deterministic, reproducible final interview evaluation from evidence.
        """
        per_question_scores: List[PerQuestionScore] = []
        all_strengths: List[str] = []
        all_improvements: List[str] = []

        total_ans_score_weighted = 0.0
        total_ans_weight = 0.0

        valid_visual_scores: List[float] = []
        valid_comm_scores: List[float] = []

        # 1. Process Per-Question Evaluations
        for bundle in evidence.questions:
            q_score, ans_s, vis_s, comm_s = cls.score_question_bundle(
                bundle=bundle,
                session_visual=evidence.session_visual,
                session_behavior=evidence.session_behavior,
            )
            per_question_scores.append(q_score)

            # Weighting by question type: main questions count as 1.0, counter questions count as 0.75
            q_weight = 1.0 if bundle.question_type == "main" else 0.75

            if bundle.answer and bundle.answer.has_evaluation:
                total_ans_score_weighted += ans_s * q_weight
                total_ans_weight += q_weight
                all_strengths.extend(bundle.answer.strengths)
                all_improvements.extend(bundle.answer.improvements)

            if vis_s is not None:
                valid_visual_scores.append(vis_s)
            if comm_s is not None:
                valid_comm_scores.append(comm_s)

        # 2. Compute Top-Level Category Averages
        if total_ans_weight > 0:
            avg_answer_score = round(total_ans_score_weighted / total_ans_weight, 1)
        else:
            avg_answer_score = 0.0

        # Visual score aggregation (use per-question average, or fallback to session visual)
        avg_visual_score: Optional[float] = None
        if valid_visual_scores:
            avg_visual_score = round(sum(valid_visual_scores) / len(valid_visual_scores), 1)
        elif evidence.session_visual and evidence.session_visual.status == "available":
            session_vis_calc = cls.compute_visual_score(evidence.session_visual)
            if session_vis_calc is not None:
                avg_visual_score = round(session_vis_calc, 1)

        # Communication score aggregation (use per-question average, or fallback to session behavior)
        avg_comm_score: Optional[float] = None
        if valid_comm_scores:
            avg_comm_score = round(sum(valid_comm_scores) / len(valid_comm_scores), 1)
        elif evidence.session_behavior and evidence.session_behavior.status == "available":
            session_beh_calc = cls.compute_behavior_score(evidence.session_behavior)
            if session_beh_calc is not None:
                avg_comm_score = round(session_beh_calc, 1)

        # 3. Dynamic Weight Renormalization Across Available Categories
        # (Missing evidence is NEVER treated as zero; weights renormalize dynamically)
        available_components: Dict[str, float] = {}
        target_weights: Dict[str, float] = {}

        # Answer Quality is mandatory
        available_components["answer_quality"] = avg_answer_score
        target_weights["answer_quality"] = CATEGORY_WEIGHTS["answer_quality"]

        if avg_comm_score is not None:
            available_components["communication"] = avg_comm_score
            target_weights["communication"] = CATEGORY_WEIGHTS["communication"]

        if avg_visual_score is not None:
            available_components["visual_presentation"] = avg_visual_score
            target_weights["visual_presentation"] = CATEGORY_WEIGHTS["visual_presentation"]

        total_target_weight = sum(target_weights.values())
        applied_weights: Dict[str, float] = {}
        overall_score_accum = 0.0

        for comp_name, comp_val in available_components.items():
            renorm_weight = round(target_weights[comp_name] / total_target_weight, 4)
            applied_weights[comp_name] = renorm_weight
            overall_score_accum += comp_val * renorm_weight

        overall_score = round(min(100.0, max(0.0, overall_score_accum)), 1)
        perf_category = get_performance_category(overall_score)

        # 4. Synthesize Deduplicated Strengths & Areas for Improvement
        clean_strengths = cls._deduplicate_items(all_strengths, max_items=4)
        clean_improvements = cls._deduplicate_items(all_improvements, max_items=4)

        # 5. Evidence Coverage & Reliability Statistics
        coverage = {
            "total_questions": evidence.total_questions,
            "answered_questions": evidence.answered_questions_count,
            "completion_ratio": round(evidence.answered_questions_count / max(1, evidence.total_questions), 2),
            "has_visual_evidence": avg_visual_score is not None,
            "has_behavioral_evidence": avg_comm_score is not None,
        }

        reliability = {
            "visual_quality": evidence.session_visual.quality_rating if evidence.session_visual else "unavailable",
            "behavior_quality": evidence.session_behavior.quality_rating if evidence.session_behavior else "unavailable",
            "answer_evaluation_coverage": f"{evidence.answered_questions_count}/{evidence.total_questions}",
        }

        category_scores = {
            "answer_quality": avg_answer_score,
            "communication": avg_comm_score if avg_comm_score is not None else 0.0,
            "visual_presentation": avg_visual_score if avg_visual_score is not None else 0.0,
        }

        # 6. Generate Deterministic Summary
        summary = cls._generate_summary(
            category=perf_category,
            overall_score=overall_score,
            answer_score=avg_answer_score,
            comm_score=avg_comm_score,
            vis_score=avg_visual_score,
            answered_count=evidence.answered_questions_count,
            total_count=evidence.total_questions,
        )

        return FinalEvaluationResult(
            evaluation_id=evaluation_id,
            session_id=evidence.session_id,
            interview_id=evidence.interview_id,
            user_id=evidence.user_id,
            overall_score=overall_score,
            answer_quality_score=avg_answer_score,
            communication_score=avg_comm_score,
            visual_presentation_score=avg_visual_score,
            performance_category=perf_category,
            category_scores=category_scores,
            applied_weights=applied_weights,
            evidence_coverage=coverage,
            evidence_reliability=reliability,
            per_question_breakdown=per_question_scores,
            strengths=clean_strengths,
            improvements=clean_improvements,
            summary=summary,
            scoring_version=SCORING_VERSION,
        )

    @classmethod
    def score_question_bundle(
        cls,
        bundle: QuestionEvidenceBundle,
        session_visual: Optional[NormalizedVisualEvidence] = None,
        session_behavior: Optional[NormalizedBehaviorEvidence] = None,
    ) -> Tuple[PerQuestionScore, float, Optional[float], Optional[float]]:
        """
        Evaluate a single question bundle and return (PerQuestionScore, ans_score, vis_score, comm_score).
        """
        ans_score = 0.0
        strengths = []
        improvements = []

        if bundle.answer:
            ans_score = cls.compute_answer_score(bundle.answer)
            strengths = bundle.answer.strengths
            improvements = bundle.answer.improvements

        # Resolve visual telemetry (question-specific or session fallback)
        vis_evidence = bundle.visual or session_visual
        vis_score = cls.compute_visual_score(vis_evidence)

        # Resolve behavior telemetry (question-specific or session fallback)
        beh_evidence = bundle.behavior or session_behavior
        comm_score = cls.compute_behavior_score(beh_evidence)

        # Dynamic combination for this question
        components: Dict[str, float] = {"answer": ans_score}
        weights: Dict[str, float] = {"answer": CATEGORY_WEIGHTS["answer_quality"]}

        if vis_score is not None:
            components["visual"] = vis_score
            weights["visual"] = CATEGORY_WEIGHTS["visual_presentation"]

        if comm_score is not None:
            components["communication"] = comm_score
            weights["communication"] = CATEGORY_WEIGHTS["communication"]

        total_w = sum(weights.values())
        combined = sum(components[k] * (weights[k] / total_w) for k in components)
        combined_score = round(min(100.0, max(0.0, combined)), 1)

        availability = {
            "answer_evaluated": bool(bundle.answer and bundle.answer.has_evaluation),
            "visual_available": vis_score is not None,
            "behavior_available": comm_score is not None,
        }

        q_score = PerQuestionScore(
            question_id=bundle.question_id,
            question_text=bundle.question_text,
            question_type=bundle.question_type,
            answer_id=bundle.answer.answer_id if bundle.answer else None,
            answer_score=ans_score,
            visual_score=vis_score,
            communication_score=comm_score,
            combined_score=combined_score,
            evidence_availability=availability,
            strengths=strengths,
            improvements=improvements,
        )

        return q_score, ans_score, vis_score, comm_score

    @classmethod
    def compute_answer_score(cls, norm_answer: NormalizedAnswerEvidence) -> float:
        """
        Compute deterministic answer score based on 5 core dimensions.
        """
        if not norm_answer or not norm_answer.answer_text.strip():
            return 0.0

        if not norm_answer.has_evaluation:
            return norm_answer.overall_answer_score

        # Combine 5 dimensions using centralized ANSWER_DIMENSION_WEIGHTS
        score = (
            norm_answer.correctness_score * ANSWER_DIMENSION_WEIGHTS["correctness"] +
            norm_answer.relevance_score * ANSWER_DIMENSION_WEIGHTS["relevance"] +
            norm_answer.technical_depth_score * ANSWER_DIMENSION_WEIGHTS["technical_depth"] +
            norm_answer.completeness_score * ANSWER_DIMENSION_WEIGHTS["completeness"] +
            norm_answer.clarity_score * ANSWER_DIMENSION_WEIGHTS["clarity"]
        )

        # If individual dimension scores are zeros but overall_answer_score is present, use overall_answer_score
        if score == 0.0 and norm_answer.overall_answer_score > 0.0:
            score = norm_answer.overall_answer_score

        return round(min(100.0, max(0.0, score)), 1)

    @classmethod
    def compute_visual_score(cls, norm_visual: Optional[NormalizedVisualEvidence]) -> Optional[float]:
        """
        Compute deterministic visual presentation score.
        Returns None if evidence is missing or unavailable (never treats missing evidence as 0).
        """
        if norm_visual is None or norm_visual.status in ["unavailable", "insufficient_quality"]:
            if norm_visual and norm_visual.status == "insufficient_quality" and norm_visual.face_detected:
                pass  # Evaluate with low reliability multiplier below
            else:
                return None

        if norm_visual.status == "no_face_detected":
            # Zero faces detected: presentation engagement is 0 for this sample
            return 0.0

        # Sub-indicator calculations (0.0 - 100.0 scale)
        presence = (norm_visual.face_presence_ratio or 1.0) * 100.0
        alignment = (norm_visual.camera_alignment or 0.8) * 100.0
        position = (norm_visual.position_quality or 0.8) * 100.0

        raw_score = (
            presence * VISUAL_METRIC_WEIGHTS["face_presence"] +
            alignment * VISUAL_METRIC_WEIGHTS["camera_alignment"] +
            position * VISUAL_METRIC_WEIGHTS["position_quality"]
        )

        # Apply reliability multiplier
        rel_multiplier = RELIABILITY_MULTIPLIERS.get(norm_visual.quality_rating, 1.0)
        final_score = raw_score * rel_multiplier

        return round(min(100.0, max(0.0, final_score)), 1)

    @classmethod
    def compute_behavior_score(cls, norm_behavior: Optional[NormalizedBehaviorEvidence]) -> Optional[float]:
        """
        Compute deterministic communication/speech behavior score.
        Returns None if evidence is missing or unavailable.
        """
        if norm_behavior is None or norm_behavior.status == "unavailable":
            return None

        # 1. Speaking Pacing Score (optimal range ~120 - 160 WPM)
        wpm = norm_behavior.speaking_rate_wpm
        if 115.0 <= wpm <= 165.0:
            pacing_score = 100.0
        elif 90.0 <= wpm < 115.0 or 165.0 < wpm <= 185.0:
            pacing_score = 88.0
        elif 70.0 <= wpm < 90.0 or 185.0 < wpm <= 210.0:
            pacing_score = 72.0
        elif wpm == 0.0:
            pacing_score = 50.0
        else:
            pacing_score = 55.0

        # 2. Filler Word Density Penalty
        # Approximate words from duration & wpm (or fallback to word density)
        fillers = norm_behavior.filler_word_count
        if fillers <= 1:
            filler_score = 100.0
        elif fillers <= 3:
            filler_score = 85.0
        elif fillers <= 5:
            filler_score = 70.0
        else:
            filler_score = max(40.0, 70.0 - (fillers - 5) * 6.0)

        # 3. Speaking Flow / Active Ratio
        ratio = norm_behavior.speaking_ratio
        if 0.70 <= ratio <= 0.92:
            flow_score = 98.0
        elif 0.50 <= ratio < 0.70:
            flow_score = 84.0
        elif ratio > 0.92:
            flow_score = 88.0  # minimal natural pause transitions
        else:
            flow_score = 65.0

        raw_score = (
            pacing_score * COMMUNICATION_METRIC_WEIGHTS["speaking_rate"] +
            filler_score * COMMUNICATION_METRIC_WEIGHTS["filler_words"] +
            flow_score * COMMUNICATION_METRIC_WEIGHTS["speaking_flow"]
        )

        rel_multiplier = RELIABILITY_MULTIPLIERS.get(norm_behavior.quality_rating, 1.0)
        final_score = raw_score * rel_multiplier

        return round(min(100.0, max(0.0, final_score)), 1)

    @staticmethod
    def _deduplicate_items(items: List[str], max_items: int = 4) -> List[str]:
        """Deduplicate items while preserving original ordering."""
        seen = set()
        deduped = []
        for it in items:
            clean = it.strip()
            if clean and clean.lower() not in seen:
                seen.add(clean.lower())
                deduped.append(clean)
                if len(deduped) >= max_items:
                    break
        return deduped

    @staticmethod
    def _generate_summary(
        category: str,
        overall_score: float,
        answer_score: float,
        comm_score: Optional[float],
        vis_score: Optional[float],
        answered_count: int,
        total_count: int,
    ) -> str:
        """
        Generate a neutral, objective, explainable performance summary.
        """
        summary_parts = [
            f"Candidate achieved an overall performance score of {overall_score}/100 ({category}), "
            f"completing {answered_count} of {total_count} interview questions."
        ]

        summary_parts.append(
            f"Technical and answer quality averaged {answer_score}/100 across evaluated responses."
        )

        telemetry_notes = []
        if comm_score is not None:
            telemetry_notes.append(f"communication pacing and structure scored {comm_score}/100")
        if vis_score is not None:
            telemetry_notes.append(f"visual camera engagement scored {vis_score}/100")

        if telemetry_notes:
            summary_parts.append(f"Supporting telemetry indicated that {', and '.join(telemetry_notes)}.")
        else:
            summary_parts.append("Evaluation was derived exclusively from candidate answer content as multimodal telemetry was not recorded.")

        return " ".join(summary_parts)
