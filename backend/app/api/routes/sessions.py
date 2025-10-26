from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, Request, BackgroundTasks
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
import logging
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)


async def trigger_audio_analysis_background(session_id: str, recording_url: str):
    """
    Background task to trigger Gemini audio analysis after call ends
    This runs asynchronously and doesn't block the webhook response
    """
    try:
        logger.info(f"Starting background audio analysis for session {session_id}")

        # Small delay to ensure recording is fully processed
        await asyncio.sleep(5)

        # Get session data
        supabase = get_supabase()
        session_result = supabase.table("sessions").select("*").eq("id", session_id).execute()

        if not session_result.data:
            logger.error(f"Session {session_id} not found for audio analysis")
            return

        session_data = session_result.data[0]

        # Check if Gemini API key is configured
        if not settings.gemini_api_key:
            logger.warning(f"Gemini API key not configured. Skipping audio analysis for session {session_id}")
            return

        # Import here to avoid circular imports
        from app.services.gemini_audio_service import GeminiAudioService

        # Analyze with Gemini
        gemini_service = GeminiAudioService(settings.gemini_api_key)
        audio_analysis = await gemini_service.analyze_call_audio(
            audio_file_path=recording_url,
            session_context={
                "difficulty": session_data.get("difficulty"),
                "call_type": session_data.get("call_type"),
                "duration_seconds": session_data.get("duration_seconds", 900)
            },
            session_id=session_id
        )

        # Prepare analysis data for database (extracts key fields + full JSON)
        db_data = gemini_service.prepare_for_database(audio_analysis)
        db_data["session_id"] = session_id

        # Save analysis to database
        update_result = supabase.table("analyses").update(db_data).eq(
            "session_id", session_id
        ).execute()

        if not update_result.data:
            # If no analysis record exists yet, create one
            supabase.table("analyses").insert(db_data).execute()

        logger.info(f"Successfully completed audio analysis for session {session_id}")

    except Exception as e:
        logger.error(f"Failed to analyze audio for session {session_id}: {str(e)}", exc_info=True)


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
            call_type=session.call_type.value if hasattr(session.call_type, 'value') else session.call_type,
            backend_url=settings.backend_url
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


@router.get("/{session_id}/recording")
async def get_session_recording(
    session_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get recording URL for a session
    """
    # Verify session belongs to user and get recording URL
    result = supabase.table("sessions").select("id, recording_url, status").eq(
        "id", session_id
    ).eq("user_id", current_user.id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session_data = result.data[0]
    recording_url = session_data.get("recording_url")

    if not recording_url:
        # Check if session is completed
        if session_data.get("status") == "completed":
            raise HTTPException(
                status_code=404,
                detail="Recording not available for this session. It may still be processing."
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="Recording not available. Session has not been completed yet."
            )

    return {
        "session_id": session_id,
        "recording_url": recording_url,
        "format": "mp3"
    }


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


@router.post("/{session_id}/analyze-audio")
async def analyze_session_audio(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Trigger Gemini audio analysis for a session
    Automatically fetches recording URL from Supabase and downloads audio for analysis

    Args:
        session_id: Session UUID

    Returns:
        Audio analysis result with detailed vocal delivery feedback
    """
    from app.services.gemini_audio_service import GeminiAudioService

    # Verify session belongs to user and get recording URL
    session_result = supabase.table("sessions").select("*").eq(
        "id", session_id
    ).eq("user_id", current_user.id).execute()

    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session_data = session_result.data[0]

    # Check if recording URL exists
    recording_url = session_data.get("recording_url")
    if not recording_url:
        # Check session status to provide helpful error message
        session_status = session_data.get("status")
        if session_status != "completed":
            raise HTTPException(
                status_code=400,
                detail="Cannot analyze audio: Session has not been completed yet."
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="Recording URL not available. The call may still be processing or recording was not enabled."
            )

    # Validate Gemini API key is configured
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key not configured. Cannot perform audio analysis."
        )

    # Analyze with Gemini (will download from URL automatically)
    try:
        gemini_service = GeminiAudioService(settings.gemini_api_key)
        audio_analysis = await gemini_service.analyze_call_audio(
            audio_file_path=recording_url,  # Pass URL directly
            session_context={
                "difficulty": session_data.get("difficulty"),
                "call_type": session_data.get("call_type"),
                "duration_seconds": session_data.get("duration_seconds", 900)
            },
            session_id=session_id  # For temp file naming
        )
    except Exception as e:
        logger.error(f"Failed to analyze audio for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Audio analysis failed: {str(e)}"
        )

    # Update analyses table with audio analysis
    try:
        # Prepare analysis data for database (extracts key fields + full JSON)
        db_data = gemini_service.prepare_for_database(audio_analysis)
        db_data["session_id"] = session_id

        update_result = supabase.table("analyses").update(db_data).eq(
            "session_id", session_id
        ).execute()

        if not update_result.data:
            # If no analysis record exists yet, create one
            supabase.table("analyses").insert(db_data).execute()
    except Exception as e:
        logger.error(f"Failed to save audio analysis for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save analysis results: {str(e)}"
        )

    return {
        "audio_analysis": audio_analysis,
        "session_id": session_id,
        "message": "Audio analysis completed successfully"
    }


@router.get("/{session_id}/analysis")
async def get_session_analysis(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get analysis for a completed session

    Returns the complete analysis record including Gemini audio analysis,
    overall scores, strengths, weaknesses, and recommendations.
    """
    # Verify session belongs to user
    session_result = supabase.table("sessions").select("id, status").eq(
        "id", session_id
    ).eq("user_id", current_user.id).execute()

    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session_data = session_result.data[0]

    # Check if session is completed
    if session_data.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail="Cannot retrieve analysis: Session has not been completed yet."
        )

    # Get analysis
    analysis_result = supabase.table("analyses").select("*").eq(
        "session_id", session_id
    ).execute()

    if not analysis_result.data:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found. The audio analysis may still be processing. Please try again in a moment."
        )

    return analysis_result.data[0]


@router.post("/vapi/webhook")
async def vapi_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    supabase = Depends(get_supabase)
):
    """
    Webhook endpoint for Vapi events
    Handles call-end events to capture recording URLs and trigger audio analysis
    """
    try:
        # Parse webhook payload
        payload = await request.json()

        # Log full payload for debugging
        logger.info(f"Received Vapi webhook - Full payload: {payload}")

        event_type = payload.get("message", {}).get("type")
        call_data = payload.get("message", {})

        logger.info(f"Received Vapi webhook event type: {event_type}")

        # Handle different event types
        if event_type == "end-of-call-report":
            # Extract call information
            call = call_data.get("call", {})
            assistant_id = call.get("assistantId")
            vapi_call_id = call.get("id")

            # Extract recording URL - it's at the top level in message, not in call.artifact
            recording_url = call_data.get("recordingUrl")
            stereo_recording_url = call_data.get("stereoRecordingUrl")

            # Also get artifact for transcript
            artifact = call_data.get("artifact", {})
            transcript = artifact.get("transcript")

            logger.info(f"Call ended - Assistant ID: {assistant_id}, Call ID: {vapi_call_id}")
            logger.info(f"Recording URL: {recording_url}")
            logger.info(f"Stereo Recording URL: {stereo_recording_url}")
            logger.info(f"Transcript available: {bool(transcript)}")

            if assistant_id:
                # Find session by assistant_id
                session_result = supabase.table("sessions").select("id").eq(
                    "assistant_id", assistant_id
                ).execute()

                if session_result.data and len(session_result.data) > 0:
                    session_id = session_result.data[0]["id"]

                    # Update session with recording URL and call completion
                    update_data = {
                        "status": "completed",
                        "vapi_call_id": vapi_call_id,
                        "completed_at": "now()"
                    }

                    if recording_url:
                        update_data["recording_url"] = recording_url
                        logger.info(f"Updating session {session_id} with recording URL: {recording_url}")

                    supabase.table("sessions").update(update_data).eq(
                        "id", session_id
                    ).execute()

                    logger.info(f"Session {session_id} updated successfully")

                    # Trigger audio analysis in background if recording URL exists
                    if recording_url:
                        logger.info(f"Scheduling background audio analysis for session {session_id}")
                        background_tasks.add_task(
                            trigger_audio_analysis_background,
                            session_id,
                            recording_url
                        )
                    else:
                        logger.warning(f"No recording URL available for session {session_id}. Skipping audio analysis.")
                else:
                    logger.warning(f"No session found for assistant_id: {assistant_id}")

        # Return 200 OK to acknowledge receipt
        return {"status": "success"}

    except Exception as e:
        logger.error(f"Error processing Vapi webhook: {str(e)}")
        # Still return 200 to avoid webhook retries
        return {"status": "error", "message": str(e)}


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
