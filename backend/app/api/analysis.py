from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.facial_analysis import FacialAnalysisResponse
from app.schemas.temporal_facial_analysis import TemporalFacialAnalysisResponse
from app.services.facial_analysis_service import analyze_facial_image
from app.services.temporal_facial_analysis_service import analyze_temporal_facial_video

router = APIRouter()


@router.post("/facial", response_model=FacialAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_facial_frame(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze candidate's visible facial geometry, bounding box metrics, head pose, and camera alignment for a single frame.
    Development testing endpoint requiring JWT authentication. Processes image in memory.
    """
    try:
        contents = await file.read()
        filename = file.filename or ""
        content_type = file.content_type or ""

        # Fallback MIME detection by file extension if content_type is generic application/octet-stream
        if filename and (not content_type or content_type == "application/octet-stream"):
            lower_name = filename.lower()
            if lower_name.endswith(".jpg") or lower_name.endswith(".jpeg"):
                content_type = "image/jpeg"
            elif lower_name.endswith(".png"):
                content_type = "image/png"
            elif lower_name.endswith(".webp"):
                content_type = "image/webp"

        result = analyze_facial_image(contents, filename=filename, content_type=content_type)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Facial analysis model asset error"
        )


@router.post("/facial/video", response_model=TemporalFacialAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_facial_video(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze candidate's visible facial behavior across sampled frames in an uploaded interview video clip.
    Computes duration, sampled frames, face presence ratio, average head pose, pose variability, and camera alignment.
    Development testing endpoint requiring JWT authentication.
    """
    try:
        contents = await file.read()
        filename = file.filename or ""
        content_type = file.content_type or ""

        # Fallback MIME detection by file extension if content_type is generic application/octet-stream
        if filename and (not content_type or content_type == "application/octet-stream"):
            lower_name = filename.lower()
            if lower_name.endswith(".mp4"):
                content_type = "video/mp4"
            elif lower_name.endswith(".webm"):
                content_type = "video/webm"
            elif lower_name.endswith(".mov"):
                content_type = "video/quicktime"
            elif lower_name.endswith(".avi"):
                content_type = "video/x-msvideo"

        result = analyze_temporal_facial_video(contents, filename=filename, content_type=content_type)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Facial analysis model asset error"
        )
