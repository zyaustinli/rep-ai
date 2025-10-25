from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"
    expert = "expert"


class CallType(str, Enum):
    cold = "cold"
    warm = "warm"
    follow_up = "follow-up"
    closing = "closing"


class SessionStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"


class PersonaInput(BaseModel):
    industry: str
    company_size: str
    role: str
    pain_points: List[str]
    budget: Optional[str] = None
    name: Optional[str] = None
    personality: Optional[str] = None
    decision_making_authority: Optional[str] = None


class PreferencesInput(BaseModel):
    difficulty: Difficulty
    call_type: CallType
    duration: int = 15  # minutes
    focus_areas: Optional[List[str]] = None


class ScenarioGenerateRequest(BaseModel):
    product: Dict[str, Any]
    persona: PersonaInput
    preferences: PreferencesInput


class SessionCreate(BaseModel):
    product_id: Optional[str] = None
    scenario: Dict[str, Any]
    difficulty: Difficulty
    call_type: CallType


class Session(BaseModel):
    id: str
    user_id: str
    product_id: Optional[str] = None
    scenario: Dict[str, Any]
    difficulty: str
    call_type: str
    duration_seconds: Optional[int] = None
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    overall_score: Optional[int] = None
    overall_grade: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TranscriptEntry(BaseModel):
    timestamp: int
    speaker: str  # 'user' or 'ai'
    text: str
    duration: int


class Transcript(BaseModel):
    id: str
    session_id: str
    entries: List[TranscriptEntry]
    total_user_words: int
    total_ai_words: int
    user_talk_time_seconds: int
    ai_talk_time_seconds: int
    questions_asked: int
    created_at: datetime

    class Config:
        from_attributes = True
