from fastapi import APIRouter, Depends, status
from typing import List, Dict, Any
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.get("", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
def get_user_resumes(current_user: User = Depends(get_current_user)):
    """
    Retrieve candidate resumes. Returns empty list if no resumes uploaded yet.
    """
    return []
