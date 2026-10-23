import math
from typing import Dict, Any


def estimate_camera_alignment(head_pose: Dict[str, float]) -> Dict[str, float]:
    """
    Calculate camera orientation alignment score (0.0 to 1.0) strictly from head pose geometry.
    Higher score indicates head is facing forward toward the camera lens.
    """
    if not head_pose:
        return {"alignment_score": 0.0}

    yaw = head_pose.get("yaw", 0.0)
    pitch = head_pose.get("pitch", 0.0)
    roll = head_pose.get("roll", 0.0)

    # Angular deviation vector length (weighted slightly lower for roll)
    deviation_deg = math.sqrt((yaw ** 2) + (pitch ** 2) + ((roll * 0.5) ** 2))

    # Calibrated angular deviation: >= 36 deg deviation produces 0.0 camera alignment
    alignment_score = max(0.0, 1.0 - (deviation_deg / 36.0))
    alignment_score = round(float(alignment_score), 4)

    return {"alignment_score": alignment_score}
