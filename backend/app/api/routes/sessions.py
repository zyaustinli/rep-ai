from fastapi import APIRouter, Depends, HTTPException, status, WebSocket
from typing import List, Optional
from app.schemas.session import (
    Session,
    SessionCreate,
    ScenarioGenerateRequest,
    SimplifiedScenarioRequest,
    Transcript,
    TranscriptSaveRequest,
)
from app.database import get_supabase
from app.api.deps import get_current_user
from app.services.scenario_generator import ScenarioGenerator
from app.services.conversation import ConversationService
from app.services.vapi_service import VapiService
from app.config import settings

router = APIRouter()


@router.post("/generate-scenario")
async def generate_scenario(
    request: ScenarioGenerateRequest,
    current_user = Depends(get_current_user),
):
    """
    Generate a scenario using Claude API (legacy, structured inputs)
    """
    generator = ScenarioGenerator(settings.anthropic_api_key)
    scenario = await generator.generate_scenario(
        request.product,
        request.persona.model_dump(),
        request.preferences.model_dump()
    )

    return {"scenario": scenario}


@router.post("/generate-scenario-simple")
async def generate_scenario_simple(
    request: SimplifiedScenarioRequest,
    current_user = Depends(get_current_user),
):
    """
    Generate a scenario using simplified inputs from frontend
    """
    generator = ScenarioGenerator(settings.anthropic_api_key)
    scenario = await generator.generate_scenario_simplified(
        product_name=request.product_name,
        product_description=request.product_description,
        persona_description=request.persona_description,
        difficulty=request.difficulty.value,
        call_type=request.call_type.value,
        duration=request.duration
    )

    return {"scenario": scenario}


@router.post("/", response_model=Session, status_code=status.HTTP_201_CREATED)
async def create_session(
    session: SessionCreate,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Create a new practice session and Vapi assistant
    """
    # Prepare session data
    session_data = session.model_dump()
    session_data["user_id"] = current_user.id
    session_data["status"] = "pending"

    # Create session in database first
    result = supabase.table("sessions").insert(session_data).execute()
    created_session = result.data[0]
    session_id = created_session["id"]

    # Create Vapi assistant for this session
    # CRITICAL: If this fails, the entire session creation should fail
    if not settings.vapi_api_key:
        # Delete the session we just created
        supabase.table("sessions").delete().eq("id", session_id).execute()
        raise HTTPException(
            status_code=500,
            detail="Vapi API key not configured. Cannot create assistant for practice session."
        )

    try:
        vapi_service = VapiService(settings.vapi_api_key)
        assistant_id = await vapi_service.create_assistant_for_session(
            session_id=session_id,
            scenario=session.scenario,
            difficulty=session.difficulty.value if hasattr(session.difficulty, 'value') else session.difficulty,
            call_type=session.call_type.value if hasattr(session.call_type, 'value') else session.call_type
        )

        # Update session with assistant_id
        supabase.table("sessions").update(
            {"assistant_id": assistant_id}
        ).eq("id", session_id).execute()

        # Update the response object
        created_session["assistant_id"] = assistant_id

    except Exception as e:
        # If Vapi assistant creation fails, delete the session and fail
        print(f"ERROR: Failed to create Vapi assistant for session {session_id}: {str(e)}")
        supabase.table("sessions").delete().eq("id", session_id).execute()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create Vapi assistant: {str(e)}"
        )

    return created_session


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


@router.get("/{session_id}/assistant")
async def get_session_assistant(
    session_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get Vapi assistant ID for a session
    """
    # Verify session belongs to user
    result = supabase.table("sessions").select("assistant_id").eq(
        "id", session_id
    ).eq("user_id", current_user.id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    assistant_id = result.data[0].get("assistant_id")

    if not assistant_id:
        raise HTTPException(status_code=404, detail="No assistant created for this session")

    return {
        "session_id": session_id,
        "assistant_id": assistant_id,
        "vapi_public_key": settings.vapi_public_key
    }


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


@router.post("/{session_id}/transcript")
async def save_transcript(
    session_id: str,
    transcript_request: TranscriptSaveRequest,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Save transcript after call ends (called by frontend)
    """
    # Verify session belongs to user
    session = supabase.table("sessions").select("*").eq(
        "id", session_id
    ).eq("user_id", current_user.id).execute()

    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")

    # Calculate transcript statistics
    total_user_words = 0
    total_ai_words = 0
    user_talk_time = 0
    ai_talk_time = 0
    questions_asked = 0

    for entry in transcript_request.entries:
        word_count = len(entry.text.split())
        if entry.speaker == "user":
            total_user_words += word_count
            user_talk_time += entry.duration
            # Count questions (simple heuristic)
            if "?" in entry.text:
                questions_asked += 1
        elif entry.speaker == "ai":
            total_ai_words += word_count
            ai_talk_time += entry.duration

    # Prepare transcript data
    transcript_data = {
        "session_id": session_id,
        "entries": [entry.model_dump() for entry in transcript_request.entries],
        "total_user_words": total_user_words,
        "total_ai_words": total_ai_words,
        "user_talk_time_seconds": user_talk_time,
        "ai_talk_time_seconds": ai_talk_time,
        "questions_asked": questions_asked
    }

    # Check if transcript already exists
    existing = supabase.table("transcripts").select("id").eq(
        "session_id", session_id
    ).execute()

    if existing.data:
        # Update existing transcript
        result = supabase.table("transcripts").update(transcript_data).eq(
            "session_id", session_id
        ).execute()
    else:
        # Create new transcript
        result = supabase.table("transcripts").insert(transcript_data).execute()

    # Update session with duration and status
    update_data = {
        "duration_seconds": transcript_request.duration_seconds,
        "status": "completed"
    }

    if transcript_request.vapi_call_id:
        update_data["vapi_call_id"] = transcript_request.vapi_call_id

    supabase.table("sessions").update(update_data).eq(
        "id", session_id
    ).execute()

    return {
        "message": "Transcript saved successfully",
        "session_id": session_id,
        "entries_count": len(transcript_request.entries),
        "duration_seconds": transcript_request.duration_seconds
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
