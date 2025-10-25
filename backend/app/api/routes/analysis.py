from fastapi import APIRouter, Depends
from app.schemas.analysis import AnalyticsOverview, ProgressDataPoint, Analysis
from app.database import get_supabase
from app.api.deps import get_current_user
from typing import List

router = APIRouter()


@router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get analytics overview for current user
    """
    # Get all completed sessions
    sessions = supabase.table("sessions").select(
        "overall_score"
    ).eq("user_id", current_user.id).eq("status", "completed").execute()

    total_sessions = len(sessions.data)
    avg_score = sum(s["overall_score"] or 0 for s in sessions.data) / total_sessions if total_sessions > 0 else 0

    # Get average scores by category
    analyses = supabase.table("analyses").select(
        "discovery_score, product_knowledge_score, objection_handling_score, "
        "rapport_building_score, value_communication_score, closing_score, communication_score"
    ).execute()

    skill_breakdown = {}
    if analyses.data:
        for key in ["discovery_score", "product_knowledge_score", "objection_handling_score",
                    "rapport_building_score", "value_communication_score", "closing_score", "communication_score"]:
            scores = [a[key] for a in analyses.data if a[key] is not None]
            skill_breakdown[key.replace("_score", "")] = sum(scores) / len(scores) if scores else 0

    return AnalyticsOverview(
        total_sessions=total_sessions,
        avg_score=avg_score,
        trending="stable",  # TODO: Calculate actual trend
        skill_breakdown=skill_breakdown,
    )


@router.get("/progress", response_model=List[ProgressDataPoint])
async def get_progress(
    period: str = "30d",
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get progress data over time
    """
    # TODO: Implement actual time-series data
    return []


@router.get("/skills")
async def get_skill_breakdown(
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get detailed skill breakdown
    """
    # Get all analyses for user's sessions
    sessions = supabase.table("sessions").select("id").eq(
        "user_id", current_user.id
    ).eq("status", "completed").execute()

    session_ids = [s["id"] for s in sessions.data]

    if not session_ids:
        return {}

    analyses = supabase.table("analyses").select(
        "discovery_score, product_knowledge_score, objection_handling_score, "
        "rapport_building_score, value_communication_score, closing_score, communication_score"
    ).in_("session_id", session_ids).execute()

    skill_breakdown = {}
    if analyses.data:
        for key in ["discovery", "product_knowledge", "objection_handling",
                    "rapport_building", "value_communication", "closing", "communication"]:
            key_with_score = f"{key}_score"
            scores = [a[key_with_score] for a in analyses.data if a.get(key_with_score) is not None]
            skill_breakdown[key] = sum(scores) / len(scores) if scores else 0

    return skill_breakdown
