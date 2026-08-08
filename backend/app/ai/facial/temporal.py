import numpy as np
from typing import List, Dict, Any, Optional


class TemporalFacialAggregator:
    """
    Aggregates per-frame facial observations over time to compute temporal facial metrics.
    """

    @staticmethod
    def aggregate_observations(
        observations: List[Dict[str, Any]],
        duration_seconds: float
    ) -> Dict[str, Any]:
        """
        Compute time-series facial statistics across sampled video frames.
        """
        frames_sampled = len(observations)
        if frames_sampled == 0:
            return {
                "duration_seconds": round(float(duration_seconds), 2),
                "frames_sampled": 0,
                "frames_with_face": 0,
                "face_presence_ratio": 0.0,
                "average_camera_alignment": None,
                "average_position_quality": None,
                "average_head_pose": None,
                "head_pose_variability": None,
                "camera_alignment_variability": None,
            }

        face_obs = [obs for obs in observations if obs.get("face_detected", False)]
        frames_with_face = len(face_obs)
        face_presence_ratio = round(float(frames_with_face / frames_sampled), 4)

        if frames_with_face == 0:
            return {
                "duration_seconds": round(float(duration_seconds), 2),
                "frames_sampled": frames_sampled,
                "frames_with_face": 0,
                "face_presence_ratio": 0.0,
                "average_camera_alignment": None,
                "average_position_quality": None,
                "average_head_pose": None,
                "head_pose_variability": None,
                "camera_alignment_variability": None,
            }

        # Extract metric arrays from face-present frames
        alignments = [obs["camera_alignment"] for obs in face_obs if obs.get("camera_alignment") is not None]
        qualities = [obs["position_quality"] for obs in face_obs if obs.get("position_quality") is not None]
        yaws = [obs["yaw"] for obs in face_obs if obs.get("yaw") is not None]
        pitches = [obs["pitch"] for obs in face_obs if obs.get("pitch") is not None]
        rolls = [obs["roll"] for obs in face_obs if obs.get("roll") is not None]

        # Calculate means
        avg_alignment = round(float(np.mean(alignments)), 4) if alignments else None
        avg_quality = round(float(np.mean(qualities)), 4) if qualities else None

        avg_pose = None
        if yaws and pitches and rolls:
            avg_pose = {
                "yaw": round(float(np.mean(yaws)), 2),
                "pitch": round(float(np.mean(pitches)), 2),
                "roll": round(float(np.mean(rolls)), 2),
            }

        # Calculate sample standard deviations (variability)
        ddof = 1 if frames_with_face > 1 else 0

        align_var = round(float(np.std(alignments, ddof=ddof)), 4) if alignments else 0.0

        pose_var = None
        if yaws and pitches and rolls:
            pose_var = {
                "yaw": round(float(np.std(yaws, ddof=ddof)), 2),
                "pitch": round(float(np.std(pitches, ddof=ddof)), 2),
                "roll": round(float(np.std(rolls, ddof=ddof)), 2),
            }

        return {
            "duration_seconds": round(float(duration_seconds), 2),
            "frames_sampled": frames_sampled,
            "frames_with_face": frames_with_face,
            "face_presence_ratio": face_presence_ratio,
            "average_camera_alignment": avg_alignment,
            "average_position_quality": avg_quality,
            "average_head_pose": avg_pose,
            "head_pose_variability": pose_var,
            "camera_alignment_variability": align_var,
        }
