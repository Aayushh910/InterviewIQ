import math
from typing import Dict, Any, List


def calculate_face_metrics(face_landmarks: List[Any], image_width: int, image_height: int) -> Dict[str, float]:
    """
    Calculate normalized geometric boundary and framing quality metrics from landmark array.
    """
    if not face_landmarks:
        return None

    xs = [lm.x for lm in face_landmarks]
    ys = [lm.y for lm in face_landmarks]

    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    center_x = round(float((min_x + max_x) / 2.0), 4)
    center_y = round(float((min_y + max_y) / 2.0), 4)
    width = round(float(max_x - min_x), 4)
    height = round(float(max_y - min_y), 4)
    area_ratio = round(float(width * height), 4)

    # Position Quality: framing centered near (0.5, 0.45) with optimal area ratio around 0.12 - 0.30
    dist_from_center = math.sqrt((center_x - 0.5) ** 2 + (center_y - 0.45) ** 2)
    center_score = max(0.0, 1.0 - (dist_from_center * 2.0))

    # Scale score: penalty for faces that are too small (<0.04) or taking over entire frame (>0.70)
    if 0.08 <= area_ratio <= 0.45:
        scale_score = 1.0
    elif area_ratio < 0.08:
        scale_score = max(0.0, area_ratio / 0.08)
    else:
        scale_score = max(0.0, 1.0 - ((area_ratio - 0.45) / 0.30))

    position_quality = round(float(0.6 * center_score + 0.4 * scale_score), 4)
    position_quality = max(0.0, min(1.0, position_quality))

    return {
        "center_x": center_x,
        "center_y": center_y,
        "width": width,
        "height": height,
        "area_ratio": area_ratio,
        "position_quality": position_quality,
    }
