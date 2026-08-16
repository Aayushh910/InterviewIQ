from typing import Dict, Any, List, Tuple, Optional

VALID_FOLLOW_UP_TYPES = {
    "clarification",
    "technical_depth",
    "example",
    "reasoning",
    "tradeoff",
    "edge_case",
    "experience",
    "behavioral_probe"
}


def build_follow_up_prompt(
    interview_meta: Dict[str, Any],
    question_text: str,
    answer_text: str,
    previous_context: Optional[List[Dict[str, str]]] = None,
    follow_up_depth: int = 0
) -> Tuple[str, str]:
    """
    Build structured system and user prompts for analyzing a candidate answer and deciding
    whether to ask a contextual follow-up question in a single LLM request.
    """
    job_role = interview_meta.get("job_role", "Candidate")
    interview_type = interview_meta.get("interview_type", "Technical")
    domain = interview_meta.get("domain") or interview_meta.get("interview_type") or "General"
    difficulty = interview_meta.get("difficulty", "Medium")
    experience_level = interview_meta.get("experience_level", "2+")

    system_prompt = (
        "You are an expert AI Interviewer for InterviewIQ. "
        "Your goal is to evaluate candidate answers in real time and decide whether an adaptive follow-up question is necessary.\n\n"
        "Return ONLY a raw JSON object with NO markdown formatting, NO backticks, and NO extra text.\n\n"
        "Allowed follow_up_type categories:\n"
        "- clarification\n"
        "- technical_depth\n"
        "- example\n"
        "- reasoning\n"
        "- tradeoff\n"
        "- edge_case\n"
        "- experience\n"
        "- behavioral_probe\n\n"
        "Strict JSON Response Schema Required:\n"
        "{\n"
        '  "should_follow_up": boolean (true or false),\n'
        '  "reason": "string (concise explanation of your decision)",\n'
        '  "follow_up_question": "string or null (the follow-up question text if true, null if false)",\n'
        '  "follow_up_type": "string or null (one of the allowed categories if true, null if false)"\n'
        "}\n\n"
        "Decision Rules:\n"
        "1. Do NOT always generate a follow-up question. If the answer is complete, clear, and thoroughly addresses the question, set should_follow_up = false.\n"
        "2. Set should_follow_up = true ONLY if the candidate made vague claims, omitted critical technical mechanisms (e.g. invalidation, edge cases, tradeoffs), or presented an opportunity for deeper probing.\n"
        "3. The follow-up question MUST directly connect to the candidate's actual answer and current question.\n"
        "4. Ask exactly ONE clear, concise question. Do NOT ask multiple sub-questions in one prompt.\n"
        "5. Do NOT repeat the original question."
    )

    prev_text = ""
    if previous_context:
        prev_text = "\nPrior Session QA Context:\n" + "\n".join(
            f"- Q: {item.get('q')} | A: {item.get('a')}" for item in previous_context[-3:]
        )

    user_prompt = f"""
INTERVIEW CONTEXT:
- Role: {job_role}
- Type: {interview_type}
- Domain: {domain}
- Difficulty: {difficulty}
- Experience Level: {experience_level} Years
- Follow-up Depth for Current Question: {follow_up_depth}
{prev_text}

CURRENT QUESTION:
"{question_text}"

CANDIDATE ANSWER:
"{answer_text}"

Analyze the answer and produce structured JSON:
"""

    return system_prompt, user_prompt
