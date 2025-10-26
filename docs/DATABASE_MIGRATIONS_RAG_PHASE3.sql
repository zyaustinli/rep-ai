-- ============================================================
-- Phase 3: RAG Query Pipeline - Database Migration
-- session_hints table for real-time product knowledge hints
-- ============================================================

-- Drop table if exists (for development/testing)
DROP TABLE IF EXISTS session_hints CASCADE;

-- ============================================================
-- session_hints: Stores RAG-generated hints during practice sessions
-- ============================================================
CREATE TABLE session_hints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

    -- The AI's question that triggered the hint
    question TEXT NOT NULL,

    -- The hint to display to the user
    hint_text TEXT NOT NULL,
    hint_data JSONB,  -- Full RAG results (all chunks, metadata)

    -- Source attribution (where hint came from)
    source_type TEXT,  -- "section" or "document"
    source_name TEXT,  -- Section name or document filename
    relevance_score FLOAT,  -- Similarity score of top result (0-1)

    -- Delivery tracking
    delivered BOOLEAN DEFAULT false,
    delivered_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Indexes for fast queries
-- ============================================================

-- Primary query: Get undelivered hints for a session
CREATE INDEX idx_session_hints_session_delivered
    ON session_hints(session_id, delivered)
    WHERE delivered = false;

-- Query all hints for a session (history view)
CREATE INDEX idx_session_hints_session_id
    ON session_hints(session_id);

-- Sort by timestamp
CREATE INDEX idx_session_hints_created_at
    ON session_hints(created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE session_hints ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view hints from their own sessions
CREATE POLICY "Users can view their own session hints"
    ON session_hints FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM sessions WHERE user_id = auth.uid()
        )
    );

-- Policy: Backend can insert hints (service role)
CREATE POLICY "Service can insert session hints"
    ON session_hints FOR INSERT
    WITH CHECK (true);

-- Policy: Backend can update delivered status (service role)
CREATE POLICY "Service can update session hints"
    ON session_hints FOR UPDATE
    USING (true);

-- ============================================================
-- Comments for documentation
-- ============================================================

COMMENT ON TABLE session_hints IS 'Stores RAG-generated product knowledge hints during practice sessions';
COMMENT ON COLUMN session_hints.question IS 'The AI question that triggered the hint (e.g., "Whats your pricing?")';
COMMENT ON COLUMN session_hints.hint_text IS 'The main hint text to display (top RAG result)';
COMMENT ON COLUMN session_hints.hint_data IS 'Full RAG results including all chunks, scores, and metadata';
COMMENT ON COLUMN session_hints.source_type IS 'Type of source: "section" (custom content) or "document" (uploaded file)';
COMMENT ON COLUMN session_hints.source_name IS 'Human-readable source name (e.g., "Pricing" or "Product_Brief.pdf")';
COMMENT ON COLUMN session_hints.relevance_score IS 'Similarity score of top result (0-1, higher = more relevant)';
COMMENT ON COLUMN session_hints.delivered IS 'Whether hint has been delivered to frontend';
COMMENT ON COLUMN session_hints.delivered_at IS 'Timestamp when hint was marked as delivered';

-- ============================================================
-- Sample queries for testing
-- ============================================================

-- Get undelivered hints for a session (what frontend polls)
-- SELECT * FROM session_hints
-- WHERE session_id = 'xxx' AND delivered = false
-- ORDER BY created_at DESC;

-- Get all hints for a session (history)
-- SELECT * FROM session_hints
-- WHERE session_id = 'xxx'
-- ORDER BY created_at DESC;

-- Mark hints as delivered
-- UPDATE session_hints
-- SET delivered = true, delivered_at = NOW()
-- WHERE id = 'xxx';

-- ============================================================
-- Migration complete
-- ============================================================
