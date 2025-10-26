# How to Properly Restart Backend with New Code

## Problem
The uvicorn `--reload` flag isn't detecting our changes. We need to do a hard restart.

## Steps to Restart Properly

### 1. Stop the current server
Press **CTRL+C** in the terminal where uvicorn is running.

If that doesn't work, find and kill the process:
```bash
# Find the process
ps aux | grep uvicorn

# Kill it (replace XXXXX with the PID from above)
kill -9 XXXXX
```

### 2. Clear Python cache
```bash
cd /Users/darinvu/calhacks2025/convo-ai/backend
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} +
```

### 3. Start the server fresh
```bash
cd /Users/darinvu/calhacks2025/convo-ai/backend
python -m uvicorn app.main:app --reload --log-level info
```

### 4. Test that logging works
Open a new terminal and run:
```bash
curl http://127.0.0.1:8000/api/sessions/test-logging
```

You should see in your server logs:
```
================================================================================
🧪 TEST ENDPOINT CALLED - LOGGING WORKS!
================================================================================
```

**If you see this**, the new code is loaded!

**If you DON'T see this**, the old code is still running.

### 5. During a practice call, watch for webhook logs
When webhooks come in, you should now see:
```
================================================================================
🔔 WEBHOOK RECEIVED - ENTRY POINT
================================================================================
📦 Raw Payload Keys: [...]
🎯 Extracted event_type: '...'
```

---

## If Logging Still Doesn't Appear

1. **Check if you have multiple Python versions:**
   ```bash
   which python
   which python3
   python --version
   python3 --version
   ```

2. **Make sure you're in the venv:**
   ```bash
   source venv/bin/activate  # If using venv
   # OR
   poetry shell  # If using poetry
   ```

3. **Try completely removing and recreating the venv:**
   ```bash
   rm -rf venv/
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

---

## Clarification Question

Also, I need to clarify the RAG use case. You mentioned:

> "the ai should be asking the questions, and im answering them with our rag system"

**Current Implementation:**
- When the AI (assistant) asks a question during the call
- We classify if it's a product question
- We query ChromaDB for relevant product info
- We synthesize a hint for the USER (salesperson)
- The hint appears in the frontend to help the USER answer

**Is this correct?** Or did you mean something different?

The current code processes AI messages (`role == "assistant"`) to generate hints for the human user. Is that what you want?
