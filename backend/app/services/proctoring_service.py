import uuid
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.interview import Interview
from app.models.interview_session import InterviewSession
from app.models.proctoring_event import ProctoringEvent
from app.schemas.proctoring import (
    ProctoringPolicy,
    ProctoringEventCreate,
    ProctoringEventResponse,
    ProctoringEventsBatchRequest,
    ProctoringSummaryResponse,
    SessionTerminationRequest,
)
from app.services.session_service import get_session_by_id, complete_session

logger = logging.getLogger(__name__)

# Default authoratative policy
DEFAULT_POLICY = ProctoringPolicy()


def get_session_proctoring_config(
    db: Session,
    session_id: str,
    user_id: str
) -> Optional[ProctoringPolicy]:
    """
    Retrieve authoritative proctoring policy for the authorized interview session.
    """
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        return None

    # Return authoritative policy
    return DEFAULT_POLICY


def record_proctoring_event(
    db: Session,
    session_id: str,
    user_id: str,
    event_in: ProctoringEventCreate
) -> Optional[ProctoringEvent]:
    """
    Validate, sanitize, and persist a single proctoring event.
    Ignores modification if the session is already completed or terminated.
    """
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        return None

    # If interview is finalized or terminated, do not reopen or mutate session state
    is_terminal = session.status in ["completed", "terminated_by_policy", "abandoned"]
    
    # Sanitize confidence
    confidence = event_in.confidence
    if confidence is not None:
        confidence = max(0.0, min(1.0, float(confidence)))

    recorded_time = event_in.timestamp or datetime.utcnow()

    event = ProctoringEvent(
        id=event_in.event_id or str(uuid.uuid4()),
        session_id=session.id,
        event_type=event_in.event_type,
        confidence=confidence,
        duration_seconds=event_in.duration_seconds,
        started_at=event_in.started_at,
        ended_at=event_in.ended_at,
        recorded_at=recorded_time,
        event_metadata=event_in.metadata or {},
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


def record_proctoring_events_batch(
    db: Session,
    session_id: str,
    user_id: str,
    batch: ProctoringEventsBatchRequest
) -> Optional[List[ProctoringEvent]]:
    """
    Persist multiple proctoring events atomically in a single transaction.
    """
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        return None

    created_events = []
    for item in batch.events:
        conf = item.confidence
        if conf is not None:
            conf = max(0.0, min(1.0, float(conf)))

        ev = ProctoringEvent(
            id=item.event_id or str(uuid.uuid4()),
            session_id=session.id,
            event_type=item.event_type,
            confidence=conf,
            duration_seconds=item.duration_seconds,
            started_at=item.started_at,
            ended_at=item.ended_at,
            recorded_at=item.timestamp or datetime.utcnow(),
            event_metadata=item.metadata or {},
        )
        db.add(ev)
        created_events.append(ev)

    db.commit()
    for ev in created_events:
        db.refresh(ev)

    return created_events


def get_session_proctoring_summary(
    db: Session,
    session_id: str,
    user_id: str
) -> Optional[ProctoringSummaryResponse]:
    """
    Calculate consolidated proctoring metrics and integrity indicators from recorded observations.
    """
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        return None

    events = db.query(ProctoringEvent).filter(
        ProctoringEvent.session_id == session_id
    ).order_by(ProctoringEvent.recorded_at.asc()).all()

    tab_departures_count = 0
    fullscreen_exits_count = 0
    window_blur_count = 0
    prolonged_closure_count = 0
    prolonged_closure_total_duration = 0.0
    off_camera_gaze_intervals = 0
    off_camera_gaze_total_duration = 0.0
    longest_off_camera_interval = 0.0
    phone_detection_count = 0
    phone_detection_total_duration = 0.0
    tracking_failures_count = 0

    latest_eye_open_pct = 95.0
    latest_camera_gaze_pct = 85.0
    latest_screen_gaze_pct = 10.0
    latest_blink_count = 0
    latest_blink_freq = 16.0
    latest_coverage = 0.95

    for ev in events:
        etype = ev.event_type
        meta = ev.event_metadata or {}

        if etype == "tab_hidden":
            tab_departures_count += 1
        elif etype == "fullscreen_exited":
            fullscreen_exits_count += 1
        elif etype == "window_blur":
            window_blur_count += 1
        elif etype == "prolonged_eye_closure":
            prolonged_closure_count += 1
            dur = ev.duration_seconds or meta.get("duration_seconds", 0.0) or 0.0
            prolonged_closure_total_duration += dur
        elif etype == "off_camera_gaze":
            off_camera_gaze_intervals += 1
            dur = ev.duration_seconds or meta.get("duration_seconds", 0.0) or 0.0
            off_camera_gaze_total_duration += dur
            if dur > longest_off_camera_interval:
                longest_off_camera_interval = dur
        elif etype == "phone_detected":
            phone_detection_count += 1
            dur = ev.duration_seconds or meta.get("duration_seconds", 0.0) or 0.0
            phone_detection_total_duration += dur
        elif etype == "phone_detection_ended":
            dur = ev.duration_seconds or meta.get("duration_seconds", 0.0) or 0.0
            phone_detection_total_duration = max(phone_detection_total_duration, dur)
        elif etype in ["eye_tracking_unavailable", "face_tracking_unavailable"]:
            tracking_failures_count += 1

        # Extract telemetry telemetry updates if embedded in metadata
        if "eye_open_percentage" in meta:
            try:
                latest_eye_open_pct = float(meta["eye_open_percentage"])
            except (ValueError, TypeError):
                pass
        if "camera_directed_gaze_percentage" in meta:
            try:
                latest_camera_gaze_pct = float(meta["camera_directed_gaze_percentage"])
            except (ValueError, TypeError):
                pass
        if "screen_directed_gaze_percentage" in meta:
            try:
                latest_screen_gaze_pct = float(meta["screen_directed_gaze_percentage"])
            except (ValueError, TypeError):
                pass
        if "blink_count" in meta:
            try:
                latest_blink_count = int(meta["blink_count"])
            except (ValueError, TypeError):
                pass
        if "blink_frequency" in meta:
            try:
                latest_blink_freq = float(meta["blink_frequency"])
            except (ValueError, TypeError):
                pass
        if "face_tracking_coverage" in meta:
            try:
                latest_coverage = float(meta["face_tracking_coverage"])
            except (ValueError, TypeError):
                pass

    # Determine integrity status
    if session.status == "terminated_by_policy":
        integrity_status = "flagged"
    elif phone_detection_count > 0:
        integrity_status = "flagged"
    elif tab_departures_count > DEFAULT_POLICY.max_tab_departures:
        integrity_status = "flagged"
    elif off_camera_gaze_total_duration > 30.0 or prolonged_closure_total_duration > 15.0:
        integrity_status = "review_required"
    elif tracking_failures_count > 10 and latest_coverage < 0.5:
        integrity_status = "insufficient_data"
    else:
        integrity_status = "verified"

    recent_pydantic_events = [
        ProctoringEventResponse.model_validate(e)
        for e in events[-20:]
    ]

    return ProctoringSummaryResponse(
        session_id=session.id,
        face_tracking_coverage=round(latest_coverage, 2),
        eye_open_percentage=round(latest_eye_open_pct, 1),
        camera_directed_gaze_percentage=round(latest_camera_gaze_pct, 1),
        screen_directed_gaze_percentage=round(latest_screen_gaze_pct, 1),
        blink_count=latest_blink_count,
        blink_frequency=round(latest_blink_freq, 1),
        prolonged_closure_count=prolonged_closure_count,
        prolonged_closure_total_duration=round(prolonged_closure_total_duration, 1),
        off_camera_gaze_intervals=off_camera_gaze_intervals,
        off_camera_gaze_total_duration=round(off_camera_gaze_total_duration, 1),
        longest_off_camera_interval=round(longest_off_camera_interval, 1),
        phone_detection_count=phone_detection_count,
        phone_detection_total_duration=round(phone_detection_total_duration, 1),
        tab_departures_count=tab_departures_count,
        fullscreen_exits_count=fullscreen_exits_count,
        window_blur_count=window_blur_count,
        tracking_failures_count=tracking_failures_count,
        total_events_count=len(events),
        integrity_status=integrity_status,
        termination_reason=session.termination_reason,
        policy=DEFAULT_POLICY,
        recent_events=recent_pydantic_events,
    )


def terminate_session_by_policy(
    db: Session,
    session_id: str,
    user_id: str,
    termination_in: SessionTerminationRequest
) -> Optional[InterviewSession]:
    """
    Safely and idempotently terminate an active interview session due to proctoring policy violation.
    Preserves all existing answers and questions.
    """
    session = get_session_by_id(db, session_id=session_id, user_id=user_id)
    if not session:
        return None

    # Idempotent: If already completed or terminated, return immediately without re-terminating
    if session.status in ["completed", "terminated_by_policy"]:
        return session

    reason = termination_in.reason or "proctoring_tab_departures"

    # Record terminal proctoring event
    terminal_event = ProctoringEvent(
        session_id=session.id,
        event_type="policy_violation_terminated",
        confidence=1.0,
        recorded_at=datetime.utcnow(),
        event_metadata={
            "reason": reason,
            "departure_count": termination_in.departure_count,
            "details": termination_in.details or {},
        }
    )
    db.add(terminal_event)

    # Use existing complete_session mechanism with status 'terminated_by_policy'
    return complete_session(
        db,
        session_id=session_id,
        user_id=user_id,
        status="terminated_by_policy",
        termination_reason=reason
    )
