# Call Recording Implementation

## Overview
This document describes the implementation of call recording functionality using VAPI's artifact system. After each call ends, the recording URL is automatically captured and stored for later processing by LLM agents.

## What Was Implemented

### 1. Database Changes
- **Migration**: `002_add_recording_url_to_sessions.sql`
- **New Column**: Added `recording_url` TEXT column to the `sessions` table
- **Purpose**: Stores the URL to the MP3 recording from VAPI

### 2. VAPI Assistant Configuration
- **File**: `backend/app/services/vapi_service.py`
- **Changes**:
  - Added `artifact_plan` configuration with:
    - `recording_enabled: True`
    - `recording_format: "mp3"`
    - Transcript plan enabled with speaker names
  - Added `server_url` parameter to configure webhook endpoint
  - Webhook URL: `{BACKEND_URL}/api/sessions/vapi/webhook`

### 3. Webhook Handler
- **File**: `backend/app/api/routes/sessions.py`
- **Endpoint**: `POST /api/sessions/vapi/webhook`
- **Functionality**:
  - Receives `end-of-call-report` events from VAPI
  - Extracts recording URL from `call.artifact.recording`
  - Updates session with:
    - `recording_url`
    - `vapi_call_id`
    - `status: "completed"`
    - `completed_at` timestamp

### 4. Recording Retrieval API
- **File**: `backend/app/api/routes/sessions.py`
- **Endpoint**: `GET /api/sessions/{session_id}/recording`
- **Returns**:
  ```json
  {
    "session_id": "uuid",
    "recording_url": "https://api.vapi.ai/recordings/...",
    "format": "mp3"
  }
  ```
- **Authentication**: Requires valid user token, ensures users can only access their own recordings

### 5. Schema Updates
- **File**: `backend/app/schemas/session.py`
- **Changes**: Added `recording_url: Optional[str]` to `Session` model

### 6. Configuration Updates
- **File**: `backend/app/config.py`
- **New Setting**: `backend_url` (default: "http://localhost:8000")
- **Purpose**: Used to construct webhook URL for VAPI

## How It Works

### Flow:
1. **Session Creation**:
   - User creates a practice session
   - Backend creates VAPI assistant with `artifact_plan` and `server_url` configured
   - Assistant is ready to record calls

2. **During Call**:
   - VAPI automatically records the conversation as MP3
   - Stores recording in VAPI's secure cloud storage

3. **Call Ends**:
   - VAPI sends `end-of-call-report` webhook to backend
   - Webhook handler extracts recording URL from payload
   - Backend updates session in database with recording URL

4. **Retrieval**:
   - Frontend/LLM agent can call `GET /api/sessions/{session_id}/recording`
   - Receives downloadable recording URL
   - Can download MP3 file or pass URL directly to audio-capable LLM

## Setup Instructions

### 1. Run Database Migration

**Option A - Manual (Recommended)**:
```bash
# Copy the migration SQL
cat docs/migrations/002_add_recording_url_to_sessions.sql

# Paste and run in Supabase SQL Editor:
# Dashboard → SQL Editor → New Query
```

**Option B - Using Script**:
```bash
cd backend
python run_migration.py
```

### 2. Update Environment Variables

Add to your `.env` file:
```bash
# Backend URL for VAPI webhooks
# Local development:
BACKEND_URL=http://localhost:8000

# Production (replace with your domain):
BACKEND_URL=https://api.yourdomain.com
```

### 3. Configure VAPI Webhook URL

**Important**: For production, ensure your `BACKEND_URL` is:
- Publicly accessible (VAPI needs to reach it)
- Uses HTTPS (required for production)
- Points to your deployed backend

Example production URLs:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- AWS: `https://api.yourdomain.com`

### 4. Test the Implementation

1. **Start Backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Create a Practice Session**:
   ```bash
   curl -X POST http://localhost:8000/api/sessions \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "scenario": {...},
       "difficulty": "medium",
       "call_type": "cold"
     }'
   ```

3. **Start and Complete a Call** using the VAPI Web SDK

4. **Check Recording URL**:
   ```bash
   curl http://localhost:8000/api/sessions/{session_id}/recording \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

5. **Verify Webhook Received**:
   - Check backend logs for: "Received Vapi webhook event: end-of-call-report"
   - Check database for recording_url value

## Using the Recording for LLM Analysis

### Example: Pass Recording to Claude for Analysis

```python
import anthropic
import requests

# Get recording URL
response = requests.get(
    f"{API_URL}/api/sessions/{session_id}/recording",
    headers={"Authorization": f"Bearer {token}"}
)
recording_url = response.json()["recording_url"]

# Download recording (if needed for local processing)
recording_data = requests.get(recording_url).content

# Use with Claude (if Claude supports audio input in future)
# Or convert to text first using a transcription service
```

### Example: Using VAPI's Built-in Transcript

Note: VAPI also provides transcripts in the webhook payload at `call.artifact.transcript`. You can capture this in the webhook handler alongside the recording URL.

## Troubleshooting

### Recording URL is null
- **Check**: Is `status` = "completed"?
- **Check**: Did webhook endpoint receive the call-end event? (Check logs)
- **Check**: Is `BACKEND_URL` accessible from VAPI's servers?
- **Solution**: For local dev, use ngrok or similar to expose localhost

### Webhook not receiving events
- **Check**: Is `BACKEND_URL` correct in `.env`?
- **Check**: Is endpoint `/api/sessions/vapi/webhook` returning 200 OK?
- **Check**: Are there any errors in backend logs?
- **Solution**: Test webhook locally with curl:
  ```bash
  curl -X POST http://localhost:8000/api/sessions/vapi/webhook \
    -H "Content-Type: application/json" \
    -d '{"message": {"type": "end-of-call-report", "call": {...}}}'
  ```

### Recording URL expired or inaccessible
- **Check**: VAPI recordings may have retention limits (check VAPI docs)
- **Solution**: Download and store recordings in your own storage (S3, etc.) if long-term retention is needed

## Next Steps

Now that recording URLs are captured, you can:

1. **Implement LLM Analysis Pipeline**:
   - Fetch recording URL after call ends
   - Download MP3 file
   - Pass to speech-to-text service (if not using VAPI transcripts)
   - Feed transcript to analysis LLM
   - Store analysis results

2. **Add Recording Storage**:
   - Download recordings from VAPI
   - Upload to your own S3/cloud storage
   - Update database with your storage URL
   - Ensures long-term retention

3. **Build Analysis Webhook**:
   - Automatically trigger analysis when recording is available
   - Use background jobs (Celery, etc.) for async processing
   - Update frontend when analysis completes

## API Reference

### Get Recording URL

**Endpoint**: `GET /api/sessions/{session_id}/recording`

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "recording_url": "https://api.vapi.ai/recordings/call-abc123.mp3",
  "format": "mp3"
}
```

**Errors**:
- `404 Session not found`: Session doesn't exist or doesn't belong to user
- `404 Recording not available`: Session not completed or recording not yet processed

### VAPI Webhook

**Endpoint**: `POST /api/sessions/vapi/webhook`

**Authentication**: None (public endpoint, called by VAPI)

**Payload** (example):
```json
{
  "message": {
    "type": "end-of-call-report",
    "call": {
      "id": "vapi-call-id",
      "assistantId": "assistant-id",
      "artifact": {
        "recording": "https://api.vapi.ai/recordings/call-abc123.mp3",
        "transcript": [...],
        "logUrl": "..."
      }
    }
  }
}
```

## Security Considerations

1. **Recording URLs**: VAPI recording URLs are typically signed and time-limited
2. **Webhook Security**: Consider adding webhook signature verification
3. **Access Control**: Recording endpoint enforces user ownership via RLS
4. **Data Privacy**: Be aware of recording consent laws in your jurisdiction

## Cost Considerations

- **VAPI Recording**: ~$0.05-0.10 per minute (included in VAPI pricing)
- **Storage**: If downloading/storing, factor in S3/storage costs
- **Bandwidth**: If passing recordings to external services

## Resources

- [VAPI Recording Documentation](https://docs.vapi.ai/assistants/call-recording)
- [VAPI Webhook Events](https://docs.vapi.ai/webhooks)
- [Project Architecture](/docs/ARCHITECTURE.md)
- [Database Schema](/docs/DATABASE_SETUP.sql)
