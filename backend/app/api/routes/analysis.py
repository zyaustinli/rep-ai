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
    try:
        # Get all completed sessions for current user
        sessions = supabase.table("sessions").select(
            "id, overall_score"
        ).eq("user_id", current_user.id).eq("status", "completed").execute()

        # Filter out sessions with null scores
        sessions_with_scores = [s for s in (sessions.data or []) if s.get("overall_score") is not None]

        # Use sessions_with_scores for accurate counting
        total_sessions = len(sessions_with_scores)

        # Calculate average score
        if total_sessions > 0:
            scores = [s.get("overall_score") for s in sessions_with_scores]
            avg_score = sum(scores) / len(scores) if scores else 0
        else:
            avg_score = 0

        # TODO: Extract skill breakdown from audio_analysis JSONB field
        # For now, return empty skill_breakdown to avoid column errors
        skill_breakdown = {}

        return AnalyticsOverview(
            total_sessions=total_sessions,
            avg_score=avg_score,
            trending="stable",  # TODO: Calculate actual trend
            skill_breakdown=skill_breakdown,
        )
    except Exception as e:
        import logging
        logging.error(f"Error fetching analytics overview: {str(e)}")
        # Return empty analytics instead of crashing
        return AnalyticsOverview(
            total_sessions=0,
            avg_score=0,
            trending="stable",
            skill_breakdown={},
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
    TODO: Extract from audio_analysis JSONB field
    """
    # For now, return empty breakdown to avoid column errors
    # The detailed scores are in the audio_analysis JSONB field
    return {}
