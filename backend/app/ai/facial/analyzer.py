from typing import Dict, Any
from app.ai.facial.landmarker import FaceLandmarkerManager
from app.ai.facial.detector import decode_image_bytes
from app.ai.facial.metrics import calculate_face_metrics
from app.ai.facial.head_pose import estimate_head_pose
from app.ai.facial.gaze import estimate_camera_alignment


class FacialAnalyzer:
    """
    Main orchestration class for the facial analysis engine.
    Executes OpenCV image decoding, MediaPipe Face Landmarker detection, geometric calculations,
    head pose estimation, and camera alignment scoring.
    """
    def __init__(self, model_path: str = None):
        self.landmarker_mgr = FaceLandmarkerManager.get_instance(model_path=model_path)

    def analyze_image_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze a raw image byte buffer and return structured geometric results.
        """
        # 1. OpenCV Frame Decoding & Validation
        bgr_image = decode_image_bytes(image_bytes)
        height, width = bgr_image.shape[:2]

        # 2. MediaPipe Face Landmarker Detection
        detection_result = self.landmarker_mgr.detect(bgr_image)

        face_landmarks_list = detection_result.face_landmarks if detection_result else []
        face_count = len(face_landmarks_list) if face_landmarks_list else 0

        if face_count == 0:
            return {
                "face_detected": False,
                "face_count": 0,
                "face_metrics": None,
                "head_pose": None,
                "camera_orientation": None
            }

        # 3. Process Primary Face Landmarks (MAX_FACES = 1)
        primary_landmarks = face_landmarks_list[0]

        metrics = calculate_face_metrics(primary_landmarks, image_width=width, image_height=height)
        pose = estimate_head_pose(primary_landmarks, image_width=width, image_height=height)
        gaze = estimate_camera_alignment(pose)

        return {
            "face_detected": True,
            "face_count": face_count,
            "face_metrics": metrics,
            "head_pose": pose,
            "camera_orientation": gaze
        }
