"""
Context builder for the InterviewIQ Groq Interview Agent.
Assembles bounded, sanitized runtime context from authoritative InterviewSessionState.
Filters out internal database keys, credentials, and unrelated session data.
"""

from typing import Dict, Any, List, Optional
from app.schemas.session_state import InterviewSessionState, QuestionHistoryItem


class AgentContextBuilder:
    """
    Constructs bounded, privacy-safe, token-efficient context for the Groq Interview Agent.
    """

    @staticmethod
    def build_context_dict(state: InterviewSessionState) -> Dict[str, Any]:
        """
        Build a sanitized dictionary representation of relevant session state.
        """
        cfg = state.interview_configuration

        # Bound question history to the last 6 items
        recent_questions = [
            {
                "question_id": q.question_id,
                "order": q.order,
                "type": q.question_type,
                "text": q.question_text,
                "is_follow_up": q.is_follow_up,
                "follow_up_depth": q.follow_up_depth,
                "has_answer": q.has_answer,
            }
            for q in state.question_history[-6:]
        ]

        # Bound answer history to the last 3 items with truncated text
        recent_answers = []
        for a in state.answer_history[-3:]:
            ans_text = a.answer_text or ""
            truncated_text = ans_text[:250] + ("..." if len(ans_text) > 250 else "")
            eval_ref = a.evaluation_reference or {}
            recent_answers.append({
                "answer_id": a.answer_id,
                "question_id": a.question_id,
                "answer_preview": truncated_text,
                "status": a.status,
                "score": eval_ref.get("overall_score") if isinstance(eval_ref, dict) else None,
            })

        # Recent evaluation summaries
        recent_evals = [
            {
                "question_id": ev.question_id,
                "overall_score": ev.overall_score,
                "summary": ev.summary,
            }
            for ev in state.evaluation_history[-3:]
        ]

        return {
            "session_id": state.session_id,
            "session_status": state.session_status,
            "configuration": {
                "role": cfg.role,
                "domain": cfg.domain,
                "difficulty": cfg.difficulty,
                "interview_type": cfg.interview_type,
                "experience_level": cfg.experience_level,
                "target_question_count": cfg.question_count,
                "counter_questions_enabled": cfg.counter_questions,
                "duration_minutes": cfg.duration_minutes,
            },
            "progress": {
                "current_question_index": state.progress.current_question_index,
                "total_questions": state.progress.total_questions,
                "completed_questions": state.progress.completed_questions,
                "progress_percentage": state.progress.progress_percentage,
                "current_follow_up_depth": state.progress.current_follow_up_depth,
            },
            "timing": {
                "elapsed_seconds": round(state.remaining_time.elapsed_seconds, 1),
                "remaining_seconds": round(state.remaining_time.remaining_seconds, 1),
                "is_expired": state.remaining_time.is_expired,
            },
            "current_question": {
                "question_id": state.current_question.question_id,
                "text": state.current_question.question_text,
                "order": state.current_question.order,
                "is_follow_up": state.current_question.is_follow_up,
                "follow_up_depth": state.current_question.follow_up_depth,
            } if state.current_question else None,
            "recent_questions": recent_questions,
            "recent_answers": recent_answers,
            "recent_evaluations": recent_evals,
            "covered_topics": state.covered_topics[:8],
        }

    @staticmethod
    def build_context_summary(state: InterviewSessionState) -> str:
        """
        Render a concise, human/model-readable text block summarizing session status.
        """
        c = AgentContextBuilder.build_context_dict(state)
        cfg = c["configuration"]
        prog = c["progress"]
        timing = c["timing"]

        lines = [
            f"- Role & Domain: {cfg['role']} ({cfg['domain']}) | Level: {cfg['difficulty']} ({cfg['experience_level']})",
            f"- Status: {c['session_status']} | Remaining Time: {timing['remaining_seconds']}s (Expired: {timing['is_expired']})",
            f"- Progress: Question {prog['current_question_index']} of {prog['total_questions']} (Completed: {prog['completed_questions']}, Follow-up depth: {prog['current_follow_up_depth']})",
            f"- Counter Questions Allowed: {cfg['counter_questions_enabled']}",
        ]

        if c["current_question"]:
            cq = c["current_question"]
            followup_tag = f" [Follow-up depth {cq['follow_up_depth']}]" if cq["is_follow_up"] else ""
            lines.append(f"- Active Question ({cq['order']}){followup_tag}: \"{cq['text']}\"")
        else:
            lines.append("- Active Question: None (needs initialization/next question)")

        if c["recent_evaluations"]:
            last_eval = c["recent_evaluations"][-1]
            lines.append(f"- Latest Evaluation: Score {last_eval['overall_score']}/100 - \"{last_eval['summary']}\"")

        # Bounded Multimodal Telemetry (Phase 11)
        if state.face_analysis_references:
            last_face = state.face_analysis_references[-1]
            face_ratio = f"{round(last_face.face_presence_ratio * 100)}%" if last_face.face_presence_ratio is not None else "N/A"
            alignment = f"{round(last_face.camera_alignment * 100)}%" if last_face.camera_alignment is not None else "N/A"
            lines.append(f"- Recent Visual Telemetry: Face Presence {face_ratio}, Camera Alignment {alignment}")

        if state.behavior_analysis_references:
            last_beh = state.behavior_analysis_references[-1]
            wpm = f"{round(last_beh.wpm, 1)} WPM" if last_beh.wpm is not None else "N/A"
            obs = f" ({'; '.join(last_beh.observations[:2])})" if last_beh.observations else ""
            lines.append(f"- Recent Behavioral Telemetry: Pace {wpm}{obs}")

        if c["covered_topics"]:
            lines.append(f"- Covered Topics: {', '.join(c['covered_topics'])}")

        return "\n".join(lines)
