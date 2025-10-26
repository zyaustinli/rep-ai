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


class SimplifiedScenarioRequest(BaseModel):
    """Simplified request matching frontend inputs"""
    product_name: str
    product_description: str
    persona_description: str
    difficulty: Difficulty
    call_type: CallType
    duration: int = 15  # minutes


class SessionCreate(BaseModel):
    product_id: Optional[str] = None
    scenario: Dict[str, Any]
    difficulty: Difficulty
    call_type: CallType
    rag_enabled: bool = False  # Whether RAG assistance is enabled for this session


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

    # Vapi integration fields
    assistant_id: Optional[str] = None  # Vapi assistant ID for this session
    vapi_call_id: Optional[str] = None  # Vapi call ID when call is active
    recording_url: Optional[str] = None  # URL to call recording from Vapi

    # RAG assistance
    rag_enabled: bool = False  # Whether RAG assistance is enabled

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


class TranscriptSaveRequest(BaseModel):
    """Request to save transcript from frontend after call ends"""
    entries: List[TranscriptEntry]
    duration_seconds: int
    vapi_call_id: Optional[str] = None


class Analysis(BaseModel):
    """Performance analysis results for a session"""
    id: str
    session_id: str

    # Category scores (0-100)
    discovery_score: Optional[int] = None
    product_knowledge_score: Optional[int] = None
    objection_handling_score: Optional[int] = None
    rapport_building_score: Optional[int] = None
    value_communication_score: Optional[int] = None
    closing_score: Optional[int] = None
    communication_score: Optional[int] = None

    # Detailed analysis
    strengths: Optional[Dict[str, Any]] = None
    weaknesses: Optional[Dict[str, Any]] = None
    key_moments: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None

    # Full analysis text
    detailed_feedback: Optional[str] = None

    # Gemini audio analysis
    audio_analysis: Optional[Dict[str, Any]] = None

    created_at: datetime

    class Config:
        from_attributes = True
