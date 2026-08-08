import cv2
import numpy as np


def decode_image_bytes(image_bytes: bytes, max_dimension: int = 1920) -> np.ndarray:
    """
    Decode raw byte buffer into an OpenCV BGR image matrix.
    Validates array dimensions and performs safe aspect-ratio preserving resizing.
    """
    if not image_bytes or len(image_bytes) == 0:
        raise ValueError("Uploaded image file buffer is empty.")

    np_array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None or image.size == 0:
        raise ValueError("OpenCV failed to decode image buffer. Unsupported or corrupted format.")

    h, w = image.shape[:2]
    if max(h, w) > max_dimension:
        scale = max_dimension / float(max(h, w))
        new_w = int(w * scale)
        new_h = int(h * scale)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

    return image
