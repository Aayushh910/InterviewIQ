from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class GenerateQuestionInput(BaseModel):
    """
    Input schema for the generate_interview_question tool.
    """
    role: str = Field(default="Software Engineer", description="Target job role")
    domain: str = Field(default="Frontend", description="Domain or technology stack")
    difficulty: str = Field(default="Medium", description="Target difficulty (Easy, Medium, Hard)")
    interview_type: str = Field(default="Technical", description="Interview category (Technical, HR, etc.)")
    experience_level: Optional[str] = Field(default="2+", description="Candidate experience level")
    topic: Optional[str] = Field(default=None, description="Specific subtopic focus")
    previous_questions: List[str] = Field(default_factory=list, description="Question texts already asked to prevent duplicates")
    question_index: int = Field(default=1, ge=1, description="Question index in the interview sequence")

    model_config = ConfigDict(from_attributes=True)


class GenerateQuestionOutput(BaseModel):
    """
    Output schema for the generate_interview_question tool.
    """
    question_text: str = Field(..., description="Generated question text")
    question_type: str = Field(default="technical", description="Question category")
    topic: str = Field(..., description="Topic of the question")
    difficulty: str = Field(..., description="Difficulty level")
    provider: str = Field(default="groq", description="AI provider that generated the question")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional generation metadata")

    model_config = ConfigDict(from_attributes=True)
