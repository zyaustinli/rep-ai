-- Migration: Add audio_analysis field to analyses table
-- Date: 2025-10-25
-- Description: Adds audio_analysis JSONB column to store Gemini audio analysis results

-- Add audio_analysis column (stores Gemini analysis of vocal delivery)
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS audio_analysis JSONB;

-- Add comment for documentation
COMMENT ON COLUMN analyses.audio_analysis IS 'Gemini audio analysis of vocal delivery using sales call rubric. Includes scores, evidence, and recommendations for tone, pacing, clarity, and sales technique.';
