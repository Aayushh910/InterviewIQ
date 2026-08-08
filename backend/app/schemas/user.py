from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserCreate(BaseModel):
    """
    Schema for user registration requests.
    Supports 'name', 'fullName', or 'first_name' / 'last_name' field representations.
    """
    name: Optional[str] = None
    fullName: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None


class UserResponse(BaseModel):
    """
    Safe public user response schema excluding password hashes.
    """
    id: str
    name: str
    email: str
    role: str = "Senior Full-Stack Candidate"
    avatar: Optional[str] = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
    isAdmin: bool = False
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
