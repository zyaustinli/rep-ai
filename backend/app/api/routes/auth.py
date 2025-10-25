from fastapi import APIRouter, Depends, HTTPException
from app.schemas.user import UserCreate, User, UserUpdate, UserStats
from app.database import get_supabase
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/me", response_model=User)
async def get_current_user_profile(
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get current user profile
    """
    # Get extended profile from profiles table
    result = supabase.table("profiles").select("*").eq("id", current_user.id).execute()

    if not result.data:
        # Create profile if doesn't exist
        profile_data = {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.user_metadata.get("full_name"),
        }
        result = supabase.table("profiles").insert(profile_data).execute()

    return result.data[0]


@router.patch("/me", response_model=User)
async def update_user_profile(
    user_update: UserUpdate,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Update current user profile
    """
    result = supabase.table("profiles").update(
        user_update.model_dump(exclude_unset=True)
    ).eq("id", current_user.id).execute()

    return result.data[0]


@router.get("/me/stats", response_model=UserStats)
async def get_user_stats(
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get user statistics
    """
    # Get all completed sessions
    sessions = supabase.table("sessions").select(
        "overall_score, duration_seconds, completed_at"
    ).eq("user_id", current_user.id).eq("status", "completed").execute()

    total_sessions = len(sessions.data)
    avg_score = sum(s["overall_score"] or 0 for s in sessions.data) / total_sessions if total_sessions > 0 else 0
    total_practice_time = sum(s["duration_seconds"] or 0 for s in sessions.data)

    # Calculate streak (simplified for MVP)
    practice_streak = 0

    last_session_date = None
    if sessions.data:
        last_session_date = sessions.data[0]["completed_at"]

    return UserStats(
        total_sessions=total_sessions,
        average_score=avg_score,
        last_session_date=last_session_date,
        practice_streak=practice_streak,
        total_practice_time=total_practice_time,
    )
