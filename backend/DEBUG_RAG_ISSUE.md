# RAG Debug Guide - Finding Why Hints Aren't Appearing

## Problem
RAG hints are not appearing in the frontend during practice sessions, and NO RAG-related logs are showing up in the backend.

## Debug Logging Added

I've added **aggressive debug logging** to every step of the webhook handler. Here's what you should now see in your logs:

---

## Expected Log Pattern (When Working)

When a practice call is running and the AI asks a question, you should see:

```
================================================================================
🔔 WEBHOOK RECEIVED - ENTRY POINT
================================================================================
📦 Raw Payload Keys: ['message', 'call', 'timestamp', ...]
📦 Full Payload: {'message': {...}, ...}
🎯 Extracted event_type: 'transcript' (type: <class 'str'>)
🎯 call_data keys: ['type', 'role', 'transcript', 'timestamp', ...]
✅ Event type is truthy
Received Vapi webhook event type: transcript
🔀 Checking event type branches...
🔍 Checking if event_type == 'transcript': transcript == 'transcript' → True
✅ ENTERED TRANSCRIPT BRANCH
📝 Role: 'assistant' | Transcript length: 45 chars
📝 Transcript text: 'What are your pricing options?'
🔍 Checking role == 'assistant': 'assistant' == 'assistant' → True
🔍 Checking transcript_text truthy: True
✅ ENTERED AI MESSAGE PROCESSING BRANCH
🎤 AI Transcript Received: 'What are your pricing options?' (length: 30 chars)
📋 Session Found: a2fe9ff5... | Product: 2e96eebc...
🔍 RAG Step 1: Classifying question...
🤔 RAG Classifier: Analyzing question: 'What are your pricing options?'
✅ RAG Classifier: PRODUCT question detected → Triggering RAG pipeline (took 0.67s)
🔍 RAG Step 2: Querying ChromaDB...
🔍 ChromaDB Query: 'What are your pricing options?' | Product: 2e96eebc... | Collection size: 15 vectors | Top-k: 3
📊 ChromaDB returned 3 result(s)
  Result #1: Pricing | Similarity: 0.872 | Text preview: 'We offer three pricing tiers...'
  Result #2: FAQ | Similarity: 0.654 | Text preview: 'Pricing is based on...'
  Result #3: Sales Deck | Similarity: 0.543 | Text preview: 'Our pricing structure...'
🔍 RAG Step 3: Synthesizing natural response...
🔍 RAG Synthesis: Synthesizing response for 'What are your pricing options?' using 3 chunks
✅ RAG Synthesis: Generated hint in 0.83s: 'We offer three pricing tiers starting at $29/month...'
✅ RAG Pipeline Complete! Hint saved:
   Session: a2fe9ff5...
   Question: 'What are your pricing options?'
   Source: Pricing
   Relevance: 0.872
   Hint: 'We offer three pricing tiers starting at $29/month for our Starter plan, $99/month for Pro...'
================================================================================
✅ WEBHOOK HANDLER COMPLETE - Returning 200 OK
================================================================================
```

---

## What Each Log Means

### 1. Webhook Entry
```
🔔 WEBHOOK RECEIVED - ENTRY POINT
```
**Meaning**: The webhook endpoint was called by VAPI
**If missing**: The webhook is not being called at all (check VAPI dashboard)

### 2. Payload Structure
```
📦 Raw Payload Keys: [...]
📦 Full Payload: {...}
```
**Meaning**: Shows the structure of the webhook payload
**Look for**: `message`, `type`, `role`, `transcript` keys

### 3. Event Type Extraction
```
🎯 Extracted event_type: 'transcript' (type: <class 'str'>)
```
**Meaning**: Shows what event type VAPI sent
**Possible values**:
- `"transcript"` - Real-time transcript during call
- `"end-of-call-report"` - Call ended
- `"function-call"` - Function was called
- `null` - Event type missing (problem!)

### 4. Branch Checking
```
🔍 Checking if event_type == 'transcript': transcript == 'transcript' → True
```
**Meaning**: Shows the boolean comparison result
**If False**: Event type doesn't match, won't enter RAG pipeline

### 5. Role Checking
```
📝 Role: 'assistant' | Transcript length: 45 chars
🔍 Checking role == 'assistant': 'assistant' == 'assistant' → True
```
**Meaning**: Verifies this is an AI message (not user)
**Possible roles**:
- `"assistant"` - AI spoke (triggers RAG)
- `"user"` - User spoke (ignored)
- `null` - Role missing (problem!)

---

## Common Issues & What to Look For

### Issue 1: Webhook Not Being Called
**Symptoms**: No `🔔 WEBHOOK RECEIVED` logs at all

**Causes**:
- VAPI webhook URL not configured
- Backend URL incorrect (not accessible to VAPI)
- Webhook configuration in session creation failed

**Fix**:
- Check `settings.backend_url` in `.env`
- Must be HTTPS (or use ngrok for local testing)
- Verify webhook was set when creating Vapi assistant

### Issue 2: Wrong Event Type
**Symptoms**: Logs show `⏭️ NOT TRANSCRIPT EVENT`

**Causes**:
- VAPI is sending different event types
- Payload structure changed

**Fix**:
- Look at the `Full Payload` log to see actual structure
- Event type might be nested differently

### Issue 3: Wrong Role
**Symptoms**: Logs show `⏭️ SKIPPED: role='user', has_transcript=True`

**Causes**:
- Webhook is capturing user messages, not AI messages
- Role field is incorrect in payload

**Fix**:
- Check the payload to see how role is structured
- Might need to adjust role extraction logic

### Issue 4: Empty Transcript
**Symptoms**: Logs show `⏭️ SKIPPED: role='assistant', has_transcript=False`

**Causes**:
- Transcript field is empty or missing
- Transcript might be in a different field

**Fix**:
- Check Full Payload for where transcript text actually is
- Might be `text`, `content`, `message`, etc.

### Issue 5: No Session/Product Found
**Symptoms**: Logs show `ℹ️ No product_id for session ... - skipping RAG`

**Causes**:
- Session was created without a product_id
- Assistant_id doesn't match any session

**Fix**:
- Ensure product is selected when creating session in frontend
- Verify session record in database has product_id

### Issue 6: ChromaDB Empty
**Symptoms**: Logs show `⚠️ ChromaDB collection is EMPTY`

**Causes**:
- No documents have been uploaded and vectorized
- Documents failed to vectorize

**Fix**:
- Upload documents to product in frontend
- Check for vectorization errors in upload logs

---

## How to Test Now

1. **Restart backend if needed:**
   ```bash
   # Kill the existing process
   # Then restart:
   cd backend
   python -m uvicorn app.main:app --reload --log-level info
   ```

2. **Start a practice session:**
   - Create or use existing product WITH uploaded documents
   - Start a practice call
   - Ask the AI a product question like "What's your pricing?"

3. **Watch the logs:**
   - You should see `🔔 WEBHOOK RECEIVED` messages
   - Follow the flow through each step
   - Identify where it's failing

4. **Copy relevant logs:**
   - Copy the section from `🔔 WEBHOOK RECEIVED` to `✅ WEBHOOK HANDLER COMPLETE`
   - Share these logs so we can see exactly what's happening

---

## Next Steps Based on Logs

### If you see NO webhook logs at all:
→ Webhook URL problem - check VAPI configuration

### If webhook logs appear but event_type is not "transcript":
→ Check what event_type values VAPI is actually sending

### If event_type is "transcript" but role is not "assistant":
→ Check payload structure for role field

### If everything looks correct but still no hints:
→ Check for errors in RAG pipeline steps (classification, ChromaDB query, synthesis)

### If RAG pipeline completes successfully:
→ Check database to verify hints were saved
→ Check frontend polling is working

---

## Quick Database Check

To verify if hints are being created:

```sql
SELECT
    sh.created_at,
    sh.question,
    sh.hint_text,
    sh.delivered,
    s.id as session_id
FROM session_hints sh
JOIN sessions s ON s.id = sh.session_id
WHERE s.id = 'YOUR_SESSION_ID'
ORDER BY sh.created_at DESC;
```

If hints exist in database but not showing in frontend:
→ Frontend polling issue (check browser console)

If hints don't exist in database:
→ Backend issue (check logs for where pipeline is failing)
