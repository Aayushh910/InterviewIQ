from typing import Dict, Any, Tuple


def build_question_generation_prompt(interview_meta: Dict[str, Any], number_of_questions: int) -> Tuple[str, str]:
    """
    Build structured system and user prompts for generating interview questions via external LLM provider.
    """
    job_role = interview_meta.get("job_role", "Software Engineer")
    interview_type = interview_meta.get("interview_type", "Technical")
    domain = interview_meta.get("domain") or interview_meta.get("interview_type") or "General"
    difficulty = interview_meta.get("difficulty", "Medium")
    experience_level = interview_meta.get("experience_level", "2+")
    mode = interview_meta.get("mode", "General")

    system_prompt = (
        "You are an expert AI Interviewer for InterviewIQ, an advanced mock-interview platform. "
        "Your task is to generate realistic, professional, non-duplicative, and high-quality interview questions. "
        "Return ONLY a raw JSON object with NO markdown formatting, NO backticks, and NO conversational text.\n\n"
        "Strict JSON Schema Required:\n"
        "{\n"
        '  "questions": [\n'
        "    {\n"
        '      "question_text": "string (the exact interview question)",\n'
        '      "question_order": integer (1-indexed sequence),\n'
        '      "question_type": "string (e.g. technical, behavioral, hr, situational)",\n'
        '      "topic": "string (e.g. domain or concept tested)",\n'
        '      "difficulty": "string (e.g. Easy, Medium, Hard)"\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Generation Guidelines:\n"
        "1. Match the candidate's job role, domain, difficulty, and experience level.\n"
        "2. Avoid generic or trivial questions unless difficulty is Easy.\n"
        "3. Do NOT include answers or solutions in the output.\n"
        "4. Do NOT include offensive, inappropriate, or unsafe content.\n"
        "5. Ensure each question is distinct and covers key technical or behavioral competencies."
    )

    user_prompt = f"""
Candidate & Interview Context:
- Target Job Role: {job_role}
- Interview Type: {interview_type}
- Technical Domain: {domain}
- Difficulty Level: {difficulty}
- Target Experience Level: {experience_level} Years
- Mode: {mode}
- Number of Questions Requested: {number_of_questions}

Generate exactly {number_of_questions} interview questions in the required JSON format:
"""

    return system_prompt, user_prompt
