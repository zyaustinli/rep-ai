from fastapi import APIRouter, Depends, HTTPException, status, WebSocket
from typing import List, Optional
from app.schemas.session import (
    Session,
    SessionCreate,
    ScenarioGenerateRequest,
    Transcript,
)
from app.database import get_supabase
from app.api.deps import get_current_user
from app.services.scenario_generator import ScenarioGenerator
from app.services.conversation import ConversationService
from app.config import settings

router = APIRouter()


@router.post("/generate-scenario")
async def generate_scenario(
    request: ScenarioGenerateRequest,
    current_user = Depends(get_current_user),
):
    """
    Generate a scenario using Claude API
    """
    generator = ScenarioGenerator(settings.anthropic_api_key)
    scenario = await generator.generate_scenario(
        request.product,
        request.persona.model_dump(),
        request.preferences.model_dump()
    )

    return {"scenario": scenario}


@router.post("/", response_model=Session, status_code=status.HTTP_201_CREATED)
async def create_session(
    session: SessionCreate,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Create a new practice session
    """
    session_data = session.model_dump()
    session_data["user_id"] = current_user.id
    session_data["status"] = "pending"

    result = supabase.table("sessions").insert(session_data).execute()

    return result.data[0]


@router.get("/", response_model=List[Session])
async def list_sessions(
    page: int = 1,
    limit: int = 20,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    List all sessions for current user
    """
    offset = (page - 1) * limit

    result = supabase.table("sessions").select("*").eq(
        "user_id", current_user.id
    ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()

    return result.data


@router.get("/{session_id}", response_model=Session)
async def get_session(
    session_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get a specific session
    """
    result = supabase.table("sessions").select("*").eq(
        "id", session_id
    ).eq("user_id", current_user.id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    return result.data[0]


@router.get("/{session_id}/transcript", response_model=Transcript)
async def get_session_transcript(
    session_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get transcript for a session
    """
    # Verify session belongs to user
    session = supabase.table("sessions").select("id").eq(
        "id", session_id
    ).eq("user_id", current_user.id).execute()

    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get transcript
    result = supabase.table("transcripts").select("*").eq(
        "session_id", session_id
    ).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Transcript not found")

    return result.data[0]


@router.post("/{session_id}/analyze")
async def analyze_session(
    session_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Trigger analysis for a completed session
    """
    # Get session and transcript
    session = supabase.table("sessions").select("*").eq(
        "id", session_id
    ).eq("user_id", current_user.id).execute()

    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")

    transcript = supabase.table("transcripts").select("*").eq(
        "session_id", session_id
    ).execute()

    if not transcript.data:
        raise HTTPException(status_code=404, detail="Transcript not found")

    # TODO: Implement analysis service
    # For now, return placeholder
    return {
        "message": "Analysis started",
        "session_id": session_id
    }


@router.websocket("/{session_id}/conversation")
async def conversation_websocket(
    websocket: WebSocket,
    session_id: str,
):
    """
    WebSocket endpoint for real-time conversation
    """
    await websocket.accept()

    # TODO: Implement conversation service
    conversation_service = ConversationService(settings.openai_api_key)

    try:
        await conversation_service.handle_conversation(websocket, session_id)
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        await websocket.close()
