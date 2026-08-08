import os
import cv2
import numpy as np
from typing import Generator, Tuple, Dict, Any
from app.ai.facial.config import FACIAL_ANALYSIS_SAMPLE_FPS, MAX_VIDEO_DURATION_SECONDS


class VideoProcessor:
    """
    OpenCV VideoCapture wrapper for metadata extraction and timestamp-based frame sampling.
    """
    def __init__(self, video_path: str):
        self.video_path = video_path
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at '{video_path}'")

        self.cap = cv2.VideoCapture(video_path)
        if not self.cap.isOpened():
            raise ValueError(f"OpenCV failed to open video file at '{video_path}'. Format or codec unsupported.")

        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.native_fps = float(self.cap.get(cv2.CAP_PROP_FPS))
        if self.native_fps <= 0 or np.isnan(self.native_fps):
            self.native_fps = 30.0  # Fallback assumption if FPS header is unreadable

        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if self.total_frames < 0:
            self.total_frames = 0

        self.duration_seconds = round(float(self.total_frames / self.native_fps), 2) if self.native_fps > 0 else 0.0

    def get_metadata(self) -> Dict[str, Any]:
        """
        Return extracted video metadata dictionary.
        """
        return {
            "width": self.width,
            "height": self.height,
            "native_fps": round(self.native_fps, 2),
            "total_frames": self.total_frames,
            "duration_seconds": self.duration_seconds,
        }

    def sample_frames(self, sample_fps: float = None) -> Generator[Tuple[float, np.ndarray], None, None]:
        """
        Yield sampled (timestamp_seconds, frame_bgr) tuples based on configured sample_fps.
        """
        target_fps = sample_fps if sample_fps is not None else FACIAL_ANALYSIS_SAMPLE_FPS
        if target_fps <= 0:
            target_fps = 2.0

        step = max(1, int(round(self.native_fps / target_fps)))
        
        # Reset frame position to start
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        frame_idx = 0

        while True:
            ret, frame = self.cap.read()
            if not ret or frame is None:
                break

            if frame_idx % step == 0:
                timestamp_sec = round(float(frame_idx / self.native_fps), 4)
                yield (timestamp_sec, frame)

            frame_idx += 1

    def close(self):
        """
        Release underlying VideoCapture resources cleanly.
        """
        if hasattr(self, 'cap') and self.cap:
            self.cap.release()
            self.cap = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
