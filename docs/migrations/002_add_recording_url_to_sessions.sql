-- Migration: Add recording_url to sessions table
-- Date: 2025-10-25
-- Description: Adds recording_url column to store Vapi call recording URLs

-- Add recording_url column (stores URL to call recording from Vapi)
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN sessions.recording_url IS 'URL to the call recording artifact from Vapi (call.artifact.recording)';
