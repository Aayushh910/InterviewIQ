"""
AnalyzeBehaviorTool: Real executable multimodal behavioral/speech analysis tool for InterviewIQ.
Collects and structures objective communication telemetry (speaking duration, WPM, pauses, filler words)
without psychological inferences or score fabrication.
"""

import re
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.tools.base.tool import BaseTool
from app.tools.base.context import ToolExecutionContext
from app.tools.base.result import ToolResult
from app.schemas.multimodal_evidence import (
    AnalyzeBehaviorInput,
    AnalyzeBehaviorOutput,
    EvidenceStatus,
    MeasurementReliability,
)
from app.services.multimodal_evidence_service import evidence_service
from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.answer import Answer

logger = logging.getLogger(__name__)

# Common filler words and multi-word filler patterns in interview speech
COMMON_FILLER_WORDS = {
    "um", "uh", "er", "ah", "like", "basically", "actually", "literally", "honestly"
}
COMMON_FILLER_PHRASES = [
    "you know", "sort of", "kind of", "i mean", "at the end of the day"
]


class AnalyzeBehaviorTool(BaseTool):
    """
    Executable multimodal tool collecting objective speech pacing, duration,
    filler word occurrences, and response timing for an interview session.
    """
    name: str = "analyze_behavior"
    description: str = (
        "Collect objective behavioral communication evidence (speaking duration, "
        "words per minute, pause indicators, and filler words) for a candidate answer."
    )
    input_schema = AnalyzeBehaviorInput
    output_schema = AnalyzeBehaviorOutput
    category: str = "behavioral_analysis"
    is_future_contract: bool = False

    def execute(self, context: ToolExecutionContext, params: AnalyzeBehaviorInput) -> ToolResult:
        mock_mode = context.mock_mode or context.metadata.get("mock_mode")
        db: Optional[Session] = context.db

        session_id = params.session_id.strip()

        # 1. Authorization & Session Verification
        if db:
            session = db.query(InterviewSession).join(Interview).filter(
                InterviewSession.id == session_id
            ).first()
            if not session:
                return ToolResult(
                    tool_name=self.name,
                    success=False,
                    error=f"Session '{session_id}' not found."
                )
            if context.user_id and str(session.interview.user_id) != str(context.user_id):
                return ToolResult(
                    tool_name=self.name,
                    success=False,
                    error=f"Unauthorized access to session '{session_id}'."
                )

        # 2. Mock Mode Handling for Deterministic Testing
        if mock_mode == "failure":
            return ToolResult(
                tool_name=self.name,
                success=False,
                error="Mock speech analyzer simulated hardware/pipeline failure."
            )

        if mock_mode == "missing_speech":
            out = AnalyzeBehaviorOutput(
                status=EvidenceStatus.UNAVAILABLE,
                response_duration_seconds=0.0,
                speaking_rate_wpm=0.0,
                pause_count=0,
                filler_word_count=0,
                speaking_ratio=0.0,
                response_latency_seconds=None,
                reliability=MeasurementReliability(
                    confidence_score=0.9,
                    quality_rating="high",
                    notes="Audio sample active; zero intelligible speech detected."
                ),
                observations=["No speech signal or transcript detected for this response segment."]
            )
            if db:
                try:
                    evidence_service.record_behavior_evidence(
                        db=db,
                        session_id=session_id,
                        user_id=context.user_id,
                        answer_id=params.answer_id,
                        question_id=params.question_id,
                        behavior_output=out
                    )
                except Exception as e:
                    logger.warning(f"Could not persist mock behavior evidence: {e}")
            return ToolResult(tool_name=self.name, success=True, data=out.model_dump())

        if mock_mode == "success":
            out = AnalyzeBehaviorOutput(
                status=EvidenceStatus.AVAILABLE,
                response_duration_seconds=42.5,
                speaking_rate_wpm=136.0,
                pause_count=4,
                filler_word_count=2,
                speaking_ratio=0.88,
                response_latency_seconds=1.8,
                reliability=MeasurementReliability(
                    confidence_score=0.95,
                    quality_rating="high",
                    notes="Mock audio analysis completed successfully."
                ),
                observations=[
                    "Spoke at approximately 136.0 words per minute over 42.5 seconds.",
                    "Identified 2 common filler words (um, like).",
                    "Measured 4 speaking pause transitions."
                ]
            )
            if db:
                try:
                    evidence_service.record_behavior_evidence(
                        db=db,
                        session_id=session_id,
                        user_id=context.user_id,
                        answer_id=params.answer_id,
                        question_id=params.question_id,
                        behavior_output=out
                    )
                except Exception as e:
                    logger.warning(f"Could not persist mock behavior evidence: {e}")
            return ToolResult(tool_name=self.name, success=True, data=out.model_dump())

        # 3. Resolve Transcript and Durations
        transcript_text: Optional[str] = params.transcript
        duration_sec: Optional[float] = params.duration_seconds
        latency_sec: Optional[float] = None
        ans_record: Optional[Answer] = None

        if db and params.answer_id:
            ans_record = db.query(Answer).filter(Answer.id == params.answer_id).first()
            if ans_record:
                if not transcript_text and ans_record.transcript_text:
                    transcript_text = ans_record.transcript_text

                # Compute duration from timestamps if not explicitly given
                if duration_sec is None and ans_record.started_at and ans_record.submitted_at:
                    delta = (ans_record.submitted_at - ans_record.started_at).total_seconds()
                    duration_sec = max(0.0, float(delta))

        # 4. Handle Case When Transcript / Speech Is Completely Missing
        if not transcript_text or not transcript_text.strip():
            # Distinguish missing speech from error
            dur = duration_sec or 0.0
            out = AnalyzeBehaviorOutput(
                status=EvidenceStatus.UNAVAILABLE,
                response_duration_seconds=dur,
                speaking_rate_wpm=0.0,
                pause_count=0,
                filler_word_count=0,
                speaking_ratio=0.0,
                response_latency_seconds=None,
                reliability=MeasurementReliability(
                    confidence_score=0.85,
                    quality_rating="medium",
                    notes="No transcript or spoken words found for this interview segment."
                ),
                observations=[
                    f"Measured duration of {dur:.1f}s without recorded speech transcript."
                ]
            )
            if db:
                try:
                    evidence_service.record_behavior_evidence(
                        db=db,
                        session_id=session_id,
                        user_id=context.user_id,
                        answer_id=params.answer_id,
                        question_id=params.question_id,
                        behavior_output=out
                    )
                except Exception as e:
                    logger.warning(f"Could not persist empty behavior evidence: {e}")
            return ToolResult(tool_name=self.name, success=True, data=out.model_dump())

        # 5. Deterministic Behavioral Telemetry Calculation
        cleaned_text = transcript_text.strip()
        words = re.findall(r"\b[A-Za-z0-9'-]+\b", cleaned_text.lower())
        word_count = len(words)

        # Count filler words
        filler_count = 0
        for w in words:
            if w in COMMON_FILLER_WORDS:
                filler_count += 1
        
        # Count filler phrases
        lower_transcript = cleaned_text.lower()
        for phrase in COMMON_FILLER_PHRASES:
            matches = len(re.findall(re.escape(phrase), lower_transcript))
            filler_count += matches

        # Estimate pauses from punctuation breaks (ellipses, commas, semicolons, dashes, periods)
        pause_indicators = len(re.findall(r"[,\.;:\-\u2013\u2014]|\.{3}", cleaned_text))
        pause_count = max(0, pause_indicators)

        # Determine speaking duration
        if duration_sec is None or duration_sec <= 0.0:
            # Fallback estimation based on natural speaking rate (~135 wpm)
            duration_sec = round((word_count / 135.0) * 60.0, 1) if word_count > 0 else 5.0
            quality_rating = "medium"
            notes = "Duration estimated from transcript word count."
            confidence = 0.8
        else:
            quality_rating = "high"
            notes = "Duration derived directly from audio timestamps."
            confidence = 0.95

        # Calculate Words Per Minute (WPM)
        minutes = duration_sec / 60.0 if duration_sec > 0 else 0.0
        wpm = round(word_count / minutes, 1) if minutes > 0 else 0.0

        # Deterministic speaking ratio (active speech / total duration)
        # Normal conversational pace is ~120-160 WPM.
        expected_speech_secs = (word_count / 140.0) * 60.0 if word_count > 0 else 0.0
        if duration_sec > 0:
            raw_ratio = min(1.0, max(0.1, expected_speech_secs / duration_sec))
            speaking_ratio = round(raw_ratio, 2)
        else:
            speaking_ratio = 1.0

        # Construct neutral, objective observations
        observations = [
            f"Observed speaking rate of {wpm:.1f} words per minute ({word_count} words over {duration_sec:.1f}s).",
            f"Identified {filler_count} verbal filler word/phrase occurrences in transcript.",
            f"Observed {pause_count} natural punctuation/pause boundaries in speech flow."
        ]

        if wpm > 180:
            observations.append(f"Speaking rate ({wpm:.1f} WPM) is higher than the standard interview baseline (120-160 WPM).")
        elif wpm < 90 and wpm > 0:
            observations.append(f"Speaking rate ({wpm:.1f} WPM) is measured below the typical baseline (120-160 WPM).")

        out = AnalyzeBehaviorOutput(
            status=EvidenceStatus.AVAILABLE,
            response_duration_seconds=duration_sec,
            speaking_rate_wpm=wpm,
            pause_count=pause_count,
            filler_word_count=filler_count,
            speaking_ratio=speaking_ratio,
            response_latency_seconds=latency_sec,
            reliability=MeasurementReliability(
                confidence_score=confidence,
                quality_rating=quality_rating,
                notes=notes
            ),
            observations=observations
        )

        # 6. Database Persistence
        if db:
            try:
                evidence_service.record_behavior_evidence(
                    db=db,
                    session_id=session_id,
                    user_id=context.user_id,
                    answer_id=params.answer_id,
                    question_id=params.question_id,
                    behavior_output=out
                )
            except Exception as e:
                logger.error(f"Failed persisting behavior evidence for session '{session_id}': {e}", exc_info=True)

        return ToolResult(tool_name=self.name, success=True, data=out.model_dump())
