-- ============================================
-- Sales Call Practice Platform - Database Setup
-- ============================================
-- CURRENT SCHEMA (Updated: 2025-01-XX)
-- Run these queries in your Supabase SQL Editor
--
-- FOR EXISTING DATABASES: See migration section at bottom
-- ============================================

-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT,  -- e.g., "Sales Rep", "Sales Manager"
    experience_level TEXT,  -- "beginner", "intermediate", "advanced"
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE profiles IS 'Extended user profile information';

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);


-- 2. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2),
    features JSONB,  -- Array of feature strings
    unique_selling_points JSONB,  -- Array of USP strings
    target_market TEXT,
    competitors JSONB,  -- Array of competitor names
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE products IS 'Product profiles for sales practice';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);


-- 3. SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Scenario data (e.g., from an AI)
    scenario JSONB NOT NULL,

    -- Session configuration
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    call_type TEXT NOT NULL CHECK (call_type IN ('cold', 'warm', 'follow-up', 'closing')),
    duration_seconds INTEGER,

    -- Session status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Results
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    overall_grade TEXT,  -- A+, A, A-, B+, B, B-, etc.

    -- Vapi integration fields
    assistant_id TEXT,  -- Vapi assistant ID for this session
    vapi_call_id TEXT,  -- Vapi call ID when call is active
    recording_url TEXT,  -- URL to the call recording from Vapi

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE sessions IS 'Practice session records';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_product_id ON sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_assistant_id ON sessions(assistant_id);


-- 4. TRANSCRIPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

    -- Transcript data
    entries JSONB NOT NULL,  -- Array of {timestamp, speaker, text, duration}

    -- Metadata
    total_user_words INTEGER DEFAULT 0,
    total_ai_words INTEGER DEFAULT 0,
    user_talk_time_seconds INTEGER DEFAULT 0,
    ai_talk_time_seconds INTEGER DEFAULT 0,
    questions_asked INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE transcripts IS 'Conversation transcripts from practice sessions';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);


-- 5. ANALYSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

    -- Overall scores (for easy querying and display)
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    overall_grade TEXT,  -- A+, A, A-, B+, B, B-, C+, C, etc.

    -- Detailed analysis fields (legacy, can be populated from audio_analysis if needed)
    strengths JSONB,  -- Array of key strengths from audio analysis
    weaknesses JSONB,  -- Array of critical weaknesses from audio analysis
    key_moments JSONB,  -- Array of key moment objects (for future use)
    recommendations JSONB,  -- Array of actionable recommendation strings

    -- Full analysis text (summary)
    detailed_feedback TEXT,

    -- Gemini audio analysis (COMPLETE structured analysis)
    -- Contains: categories[], overallScore, overallGrade, keyStrengths[],
    -- criticalWeaknesses[], audioSpecificInsights{}, actionableRecommendations[]
    audio_analysis JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE analyses IS 'Performance analysis results with Gemini audio analysis. The audio_analysis JSONB field contains the complete hierarchical analysis from Gemini including categories, criteria, scores, and insights.';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analyses_session_id ON analyses(session_id);


-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;


-- PROFILES POLICIES
-- ============================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);


-- PRODUCTS POLICIES
-- ============================================
-- Users can view their own products
CREATE POLICY "Users can view own products"
    ON products FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own products
CREATE POLICY "Users can insert own products"
    ON products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own products
CREATE POLICY "Users can update own products"
    ON products FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own products
CREATE POLICY "Users can delete own products"
    ON products FOR DELETE
    USING (auth.uid() = user_id);


-- SESSIONS POLICIES
-- ============================================
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
    ON sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
    ON sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
    ON sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
    ON sessions FOR DELETE
    USING (auth.uid() = user_id);


-- TRANSCRIPTS POLICIES
-- ============================================
-- Users can view transcripts of their own sessions
CREATE POLICY "Users can view own transcripts"
    ON transcripts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = transcripts.session_id
            AND sessions.user_id = auth.uid()
        )
    );

-- Service role can insert transcripts
CREATE POLICY "Service role can insert transcripts"
    ON transcripts FOR INSERT
    WITH CHECK (true);  -- Only accessible via service role key


-- ANALYSES POLICIES
-- ============================================
-- Users can view analyses of their own sessions
CREATE POLICY "Users can view own analyses"
    ON analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = analyses.session_id
            AND sessions.user_id = auth.uid()
        )
    );

-- Service role can insert analyses
CREATE POLICY "Service role can insert analyses"
    ON analyses FOR INSERT
    WITH CHECK (true);  -- Only accessible via service role key


-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for products table
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- VIEWS (Optional - for analytics)
-- ============================================

-- View for user session statistics
CREATE OR REPLACE VIEW user_session_stats AS
SELECT
    s.user_id,
    COUNT(*) as total_sessions,
    AVG(s.overall_score) as avg_score,
    SUM(s.duration_seconds) as total_practice_time_seconds,
    MAX(s.completed_at) as last_session_date,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions
FROM sessions s
WHERE s.status = 'completed'
GROUP BY s.user_id;

COMMENT ON VIEW user_session_stats IS 'Aggregated statistics per user';


-- View for overall analysis scores
CREATE OR REPLACE VIEW user_analysis_overview AS
SELECT
    s.user_id,
    AVG(a.overall_score) as avg_overall_score,
    COUNT(a.id) as total_analyses,
    MAX(a.created_at) as last_analysis_date
FROM sessions s
JOIN analyses a ON a.session_id = s.id
WHERE s.status = 'completed' AND a.overall_score IS NOT NULL
GROUP BY s.user_id;

COMMENT ON VIEW user_analysis_overview IS 'Average overall scores from audio analysis per user. For detailed category scores, query audio_analysis JSONB field directly.';


-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Note: Uncomment the following to insert sample data
-- You'll need to replace the UUIDs with actual user IDs from your auth.users table

/*
-- Sample product
INSERT INTO products (user_id, name, description, price, features, target_market)
VALUES (
    'YOUR_USER_ID_HERE'::uuid,
    'CRM Pro',
    'Advanced CRM system for growing businesses',
    99.00,
    '["Contact Management", "Sales Pipeline", "Email Integration", "Reporting"]'::jsonb,
    'Small to medium businesses with 10-100 employees'
);
*/


-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Query to check table sizes
-- SELECT
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;


-- Query to check RLS policies
-- SELECT
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual,
--     with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;


-- ============================================
-- BACKUP & RESTORE
-- ============================================

-- Supabase automatically handles backups
-- For manual backup, use Supabase dashboard or pg_dump
-- For restore, use Supabase dashboard or psql


-- ============================================
-- NOTES
-- ============================================

-- 1. All tables use UUID for primary keys (standard Supabase practice)
-- 2. JSONB is used for flexible schema fields (scenario, transcript, analysis)
-- 3. Row Level Security (RLS) ensures users can only access their own data
-- 4. Timestamps are stored as TIMESTAMP WITH TIME ZONE for timezone awareness
-- 5. Foreign keys use CASCADE or SET NULL for referential integrity
-- 6. Indexes are created on frequently queried columns
-- 7. Check constraints ensure data validity (e.g., scores 0-100)


-- ============================================
-- MIGRATION FOR EXISTING DATABASES
-- ============================================
-- If you already have a database with the old schema, run these queries:

-- 1. Add recording_url to sessions table (if not exists)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_url TEXT;
COMMENT ON COLUMN sessions.recording_url IS 'URL to the call recording from Vapi';

-- 2. Update analyses table structure
-- Drop old individual score columns (they don't match Gemini's output)
ALTER TABLE analyses
  DROP COLUMN IF EXISTS discovery_score,
  DROP COLUMN IF EXISTS product_knowledge_score,
  DROP COLUMN IF EXISTS objection_handling_score,
  DROP COLUMN IF EXISTS rapport_building_score,
  DROP COLUMN IF EXISTS value_communication_score,
  DROP COLUMN IF EXISTS closing_score,
  DROP COLUMN IF EXISTS communication_score;

-- Add overall_score and overall_grade columns
ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  ADD COLUMN IF NOT EXISTS overall_grade TEXT;

-- Update table comment
COMMENT ON TABLE analyses IS 'Performance analysis results with Gemini audio analysis. The audio_analysis JSONB field contains the complete hierarchical analysis from Gemini including categories, criteria, scores, and insights.';

-- Add column comments
COMMENT ON COLUMN analyses.overall_score IS 'Overall performance score (0-100) from Gemini audio analysis';
COMMENT ON COLUMN analyses.overall_grade IS 'Letter grade (A+, A, A-, B+, etc.) from Gemini audio analysis';
COMMENT ON COLUMN analyses.strengths IS 'Array of key strengths from Gemini keyStrengths field';
COMMENT ON COLUMN analyses.weaknesses IS 'Array of critical weaknesses from Gemini criticalWeaknesses field';
COMMENT ON COLUMN analyses.recommendations IS 'Array of actionable recommendations from Gemini actionableRecommendations field';
COMMENT ON COLUMN analyses.audio_analysis IS 'Complete Gemini analysis JSON with categories[], criteria[], scores, audioSpecificInsights{}, etc.';

-- 3. Drop old user_skill_breakdown view (references deleted columns)
DROP VIEW IF EXISTS user_skill_breakdown;

-- 4. Create new user_analysis_overview view
CREATE OR REPLACE VIEW user_analysis_overview AS
SELECT
    s.user_id,
    AVG(a.overall_score) as avg_overall_score,
    COUNT(a.id) as total_analyses,
    MAX(a.created_at) as last_analysis_date
FROM sessions s
JOIN analyses a ON a.session_id = s.id
WHERE s.status = 'completed' AND a.overall_score IS NOT NULL
GROUP BY s.user_id;

COMMENT ON VIEW user_analysis_overview IS 'Average overall scores from audio analysis per user. For detailed category scores, query audio_analysis JSONB field directly.';


-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Verify setup by running:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verify analyses table structure:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'analyses'
-- ORDER BY ordinal_position;
