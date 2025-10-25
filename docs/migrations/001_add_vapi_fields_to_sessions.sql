-- Migration: Add Vapi integration fields to sessions table
-- Date: 2025-10-25
-- Description: Adds assistant_id and vapi_call_id columns to support Vapi voice AI integration

-- Add assistant_id column (stores Vapi assistant ID for each session)
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS assistant_id TEXT;

-- Add vapi_call_id column (stores active call ID during conversation)
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS vapi_call_id TEXT;

-- Add index for faster lookups by assistant_id
CREATE INDEX IF NOT EXISTS idx_sessions_assistant_id ON sessions(assistant_id);

-- Add comment for documentation
COMMENT ON COLUMN sessions.assistant_id IS 'Vapi assistant ID created for this practice session';
COMMENT ON COLUMN sessions.vapi_call_id IS 'Active Vapi call ID when user is in conversation';
