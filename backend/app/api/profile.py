import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["User Profile"])


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    target_position: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    github: Optional[str] = None
    leetcode: Optional[str] = None
    codeforces: Optional[str] = None
    codechef: Optional[str] = None
    hackerrank: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    groq_api_key: Optional[str] = None


@router.get("")
@router.get("/")
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve candidate profile details for the authenticated user.
    """
    return {
        "id": current_user.id,
        "name": current_user.name or "",
        "email": current_user.email,
        "role": current_user.role or "Software Candidate",
        "target_position": getattr(current_user, "target_position", None) or "",
        "bio": getattr(current_user, "bio", None) or "",
        "location": getattr(current_user, "location", None) or "",
        "skills": getattr(current_user, "skills", None) or "",
        "education": getattr(current_user, "education", None) or "",
        "github": getattr(current_user, "github", None) or "",
        "leetcode": getattr(current_user, "leetcode", None) or "",
        "codeforces": getattr(current_user, "codeforces", None) or "",
        "codechef": getattr(current_user, "codechef", None) or "",
        "hackerrank": getattr(current_user, "hackerrank", None) or "",
        "linkedin": getattr(current_user, "linkedin", None) or "",
        "website": getattr(current_user, "website", None) or "",
        "has_groq_key": bool(getattr(current_user, "groq_api_key", None)),
    }


@router.put("")
@router.put("/")
def update_user_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update profile fields for the authenticated user.
    """
    if req.name is not None:
        current_user.name = req.name.strip()
    if req.role is not None:
        current_user.role = req.role.strip()
    if req.target_position is not None:
        current_user.target_position = req.target_position.strip()
    if req.bio is not None:
        current_user.bio = req.bio.strip()
    if req.location is not None:
        current_user.location = req.location.strip()
    if req.skills is not None:
        current_user.skills = req.skills.strip()
    if req.education is not None:
        current_user.education = req.education.strip()
    if req.github is not None:
        current_user.github = req.github.strip()
    if req.leetcode is not None:
        current_user.leetcode = req.leetcode.strip()
    if req.codeforces is not None:
        current_user.codeforces = req.codeforces.strip()
    if req.codechef is not None:
        current_user.codechef = req.codechef.strip()
    if req.hackerrank is not None:
        current_user.hackerrank = req.hackerrank.strip()
    if req.linkedin is not None:
        current_user.linkedin = req.linkedin.strip()
    if req.website is not None:
        current_user.website = req.website.strip()
    if req.groq_api_key is not None:
        current_user.groq_api_key = req.groq_api_key.strip()

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    logger.info(f"Updated candidate profile for user '{current_user.id}' ({current_user.email})")

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "profile": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "target_position": current_user.target_position,
            "bio": current_user.bio,
            "location": current_user.location,
            "skills": current_user.skills,
            "education": current_user.education,
            "github": current_user.github,
            "leetcode": current_user.leetcode,
            "codeforces": current_user.codeforces,
            "codechef": current_user.codechef,
            "hackerrank": current_user.hackerrank,
            "linkedin": current_user.linkedin,
            "website": current_user.website,
        }
    }
