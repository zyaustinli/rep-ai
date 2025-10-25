from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    experience_level: Optional[str] = None


class User(UserBase):
    id: str
    role: Optional[str] = None
    experience_level: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserStats(BaseModel):
    total_sessions: int
    average_score: float
    last_session_date: Optional[datetime] = None
    practice_streak: int
    total_practice_time: int  # in seconds
