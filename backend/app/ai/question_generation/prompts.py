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
    counter_questions = interview_meta.get("counter_questions", True)

    system_prompt = (
        "You are an expert AI Technical and Behavioral Interviewer for InterviewIQ, an advanced mock-interview platform. "
        "Your task is to generate realistic, industry-grade, non-duplicative, and high-quality interview questions. "
        "Return ONLY a raw JSON object with NO markdown formatting, NO backticks, and NO conversational text.\n\n"
        "Strict JSON Schema Required:\n"
        "{\n"
        '  "questions": [\n'
        "    {\n"
        '      "question_text": "string (the exact interview question)",\n'
        '      "question_order": integer (1-indexed sequence),\n'
        '      "question_type": "string (e.g. technical, behavioral, situational)",\n'
        '      "topic": "string (specific technical concept or architectural component tested)",\n'
        '      "difficulty": "string (Easy | Medium | Hard)"\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Generation Guidelines:\n"
        f"1. CRITICAL DOMAIN CONSTRAINT: The candidate selected technical domain '{domain}'. ALL generated questions MUST be directly and deeply focused on '{domain}'. Do NOT switch to unrelated programming languages, frameworks, or technologies under any circumstances.\n"
        f"2. DIFFICULTY & EXPERIENCE: Tailor the depth strictly for a candidate with '{experience_level}' years experience at '{difficulty}' level.\n"
        "3. Avoid generic textbook trivia. Ask practical, scenario-driven questions involving architecture, performance, edge cases, or real-world problem solving.\n"
        "4. Do NOT include answers, explanations, or solutions in the output.\n"
        "5. Do NOT include offensive, inappropriate, or unsafe content.\n"
        f"6. Generate exactly {number_of_questions} distinct questions."
    )

    user_prompt = f"""
Candidate & Interview Configuration:
- Target Job Role: {job_role}
- Interview Type: {interview_type}
- Technical Domain: {domain}
- Difficulty Level: {difficulty}
- Candidate Experience Level: {experience_level} Years
- Interview Mode: {mode}
- Adaptive Follow-up / Counter Questions: {'Enabled' if counter_questions else 'Disabled'}
- Number of Questions Requested: {number_of_questions}

Generate exactly {number_of_questions} interview questions strictly within the '{domain}' domain tailored for {experience_level} experience at {difficulty} difficulty in the required JSON format:
"""


    return system_prompt, user_prompt
