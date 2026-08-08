import os
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
from app.ai.facial.config import (
    MODEL_PATH,
    MAX_FACES,
    MIN_FACE_DETECTION_CONFIDENCE,
    MIN_FACE_PRESENCE_CONFIDENCE,
    MIN_TRACKING_CONFIDENCE,
)


class FaceLandmarkerManager:
    """
    Singleton / reusable wrapper around MediaPipe FaceLandmarker Task API.
    Maintains a single detector instance to maximize performance across requests.
    """
    _instance = None

    def __init__(self, model_path: str = None):
        self.model_path = model_path or MODEL_PATH
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"MediaPipe Face Landmarker model asset not found at '{self.model_path}'. "
                "Ensure the model file exists in backend/models/face_landmarker.task."
            )

        base_options = mp_python.BaseOptions(model_asset_path=self.model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_faces=MAX_FACES,
            min_face_detection_confidence=MIN_FACE_DETECTION_CONFIDENCE,
            min_face_presence_confidence=MIN_FACE_PRESENCE_CONFIDENCE,
            min_tracking_confidence=MIN_TRACKING_CONFIDENCE,
        )
        self.landmarker = vision.FaceLandmarker.create_from_options(options)

    @classmethod
    def get_instance(cls, model_path: str = None):
        """
        Get or create shared FaceLandmarkerManager instance.
        """
        if cls._instance is None:
            cls._instance = cls(model_path=model_path)
        return cls._instance

    def detect(self, bgr_image: np.ndarray):
        """
        Convert OpenCV BGR image into MediaPipe Image format and run detection.
        Returns MediaPipe FaceLandmarkerResult.
        """
        if bgr_image is None or not isinstance(bgr_image, np.ndarray) or bgr_image.size == 0:
            raise ValueError("Invalid or empty image provided for landmark detection.")

        rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
        return self.landmarker.detect(mp_image)

    def close(self):
        """
        Close underlying MediaPipe resources cleanly.
        """
        if hasattr(self, 'landmarker') and self.landmarker:
            self.landmarker.close()
            self.landmarker = None
        FaceLandmarkerManager._instance = None
