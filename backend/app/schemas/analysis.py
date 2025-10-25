from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime


class KeyMoment(BaseModel):
    timestamp: int
    title: str
    description: str
    evaluation: str
    rating: str  # 'excellent', 'good', 'needs_improvement'


class Recommendation(BaseModel):
    priority: str  # 'high', 'medium', 'low'
    category: str
    suggestion: str
    reasoning: str
    practice_exercise: str


class Analysis(BaseModel):
    id: str
    session_id: str
    discovery_score: int
    product_knowledge_score: int
    objection_handling_score: int
    rapport_building_score: int
    value_communication_score: int
    closing_score: int
    communication_score: int
    strengths: Dict[str, List[str]]
    weaknesses: Dict[str, List[str]]
    key_moments: List[KeyMoment]
    recommendations: List[Recommendation]
    detailed_feedback: str
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyticsOverview(BaseModel):
    total_sessions: int
    avg_score: float
    trending: str  # 'up', 'down', 'stable'
    skill_breakdown: Dict[str, float]


class ProgressDataPoint(BaseModel):
    date: str
    avg_score: float
    sessions: int
