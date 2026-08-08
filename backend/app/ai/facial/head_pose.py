import math
import cv2
import numpy as np
from typing import Dict, Any, List

# Generic 3D facial model points aligned with OpenCV Camera Coordinate System:
# - X points RIGHT (Candidate's right eye is at +X, left eye at -X)
# - Y points DOWN (Chin is at +Y below nose, eyes are at -Y above nose)
# - Z points AWAY into scene/head
MODEL_POINTS = np.array([
    (0.0, 0.0, 0.0),             # Nose tip (index 1)
    (0.0, 330.0, -65.0),         # Chin (index 152) -> Below nose (+Y)
    (-225.0, -170.0, -135.0),    # Left eye outer corner (index 33) -> Above nose (-Y), Left (-X)
    (225.0, -170.0, -135.0),     # Right eye outer corner (index 263) -> Above nose (-Y), Right (+X)
    (-150.0, 150.0, -125.0),     # Mouth left corner (index 61) -> Below nose (+Y), Left (-X)
    (150.0, 150.0, -125.0)       # Mouth right corner (index 291) -> Below nose (+Y), Right (+X)
], dtype=np.float64)

# MediaPipe landmark indices corresponding to 3D model points
LANDMARK_INDICES = [1, 152, 33, 263, 61, 291]


def estimate_head_pose(face_landmarks: List[Any], image_width: int, image_height: int) -> Dict[str, float]:
    """
    Estimate head orientation (yaw, pitch, roll in degrees) using Perspective-n-Point (solvePnP).
    
    Convention:
    - Yaw: Head turn left/right (Negative = Turn Left, Positive = Turn Right)
    - Pitch: Head tilt up/down (Negative = Look Up, Positive = Look Down)
    - Roll: Head side tilt towards shoulder (Negative = Tilt Left, Positive = Tilt Right)
    """
    if not face_landmarks or len(face_landmarks) < 468:
        return {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}

    image_points = []
    for idx in LANDMARK_INDICES:
        lm = face_landmarks[idx]
        image_points.append((lm.x * image_width, lm.y * image_height))

    image_points = np.array(image_points, dtype=np.float64)

    # Approximate camera intrinsics based on frame dimensions
    focal_length = float(image_width)
    center = (image_width / 2.0, image_height / 2.0)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype=np.float64)

    dist_coeffs = np.zeros((4, 1), dtype=np.float64)

    # Solve PnP using iterative method
    success, rvec, tvec = cv2.solvePnP(
        MODEL_POINTS,
        image_points,
        camera_matrix,
        dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE
    )

    if not success:
        return {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}

    # Convert rotation vector to 3x3 rotation matrix
    rmat, _ = cv2.Rodrigues(rvec)

    # Decompose rotation matrix into Euler angles (pitch, yaw, roll)
    angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)

    pitch = angles[0]
    yaw = angles[1]
    roll = angles[2]

    # Normalize roll to [-90, 90] range for an upright candidate face
    if roll > 90:
        roll = roll - 180
    elif roll < -90:
        roll = roll + 180

    return {
        "yaw": round(float(yaw), 2),
        "pitch": round(float(pitch), 2),
        "roll": round(float(roll), 2),
    }
