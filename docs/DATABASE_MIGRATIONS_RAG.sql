-- ============================================
-- RAG Feature Database Migrations
-- ============================================
-- Run these queries in your Supabase SQL Editor to add RAG support
-- Date: 2025-10-25
-- ============================================

-- MIGRATION 1: Extend products table for RAG
-- ============================================
-- Add custom content sections (flexible JSON structure)
ALTER TABLE products ADD COLUMN IF NOT EXISTS content_sections JSONB DEFAULT '[]'::jsonb;

-- Track when product was last vectorized
ALTER TABLE products ADD COLUMN IF NOT EXISTS vectorized_at TIMESTAMP WITH TIME ZONE;

-- Track document count
ALTER TABLE products ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN products.content_sections IS 'Custom product content sections (array of {name: string, content: string})';
COMMENT ON COLUMN products.vectorized_at IS 'Timestamp when product was last vectorized in ChromaDB';
COMMENT ON COLUMN products.document_count IS 'Number of documents uploaded for this product';

-- Add index for filtering vectorized products
CREATE INDEX IF NOT EXISTS idx_products_vectorized_at ON products(vectorized_at);


-- MIGRATION 2: Create product_documents table
-- ============================================
CREATE TABLE IF NOT EXISTS product_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- File metadata
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'txt', 'md')),
    file_size INTEGER NOT NULL,  -- in bytes
    storage_path TEXT NOT NULL,  -- Supabase storage path or URL

    -- Processing metadata
    extracted_text TEXT,  -- Full extracted text
    chunk_count INTEGER DEFAULT 0,  -- Number of chunks created
    is_vectorized BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE product_documents IS 'Uploaded documents for products (PDFs, text files)';
COMMENT ON COLUMN product_documents.extracted_text IS 'Full text extracted from document';
COMMENT ON COLUMN product_documents.chunk_count IS 'Number of chunks created from this document';
COMMENT ON COLUMN product_documents.is_vectorized IS 'Whether document has been vectorized in ChromaDB';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_documents_product_id ON product_documents(product_id);
CREATE INDEX IF NOT EXISTS idx_product_documents_user_id ON product_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_product_documents_created_at ON product_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_documents_is_vectorized ON product_documents(is_vectorized);


-- MIGRATION 3: Extend sessions table for RAG
-- ============================================
-- Add RAG enabled flag
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS rag_enabled BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN sessions.rag_enabled IS 'Whether RAG assistance is enabled for this practice session';

-- Add index for filtering RAG-enabled sessions
CREATE INDEX IF NOT EXISTS idx_sessions_rag_enabled ON sessions(rag_enabled);


-- MIGRATION 4: Create triggers for automatic updates
-- ============================================

-- Auto-update updated_at on product_documents
CREATE OR REPLACE FUNCTION update_product_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_documents_updated_at
    BEFORE UPDATE ON product_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_product_documents_updated_at();

-- Auto-update document_count when documents are added/removed
CREATE OR REPLACE FUNCTION update_product_document_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products
        SET document_count = document_count + 1
        WHERE id = NEW.product_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products
        SET document_count = GREATEST(0, document_count - 1)
        WHERE id = OLD.product_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_document_count_insert
    AFTER INSERT ON product_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_product_document_count();

CREATE TRIGGER trigger_update_product_document_count_delete
    AFTER DELETE ON product_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_product_document_count();


-- MIGRATION 5: Row Level Security (RLS) for product_documents
-- ============================================
ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
    ON product_documents FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own documents
CREATE POLICY "Users can insert own documents"
    ON product_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
    ON product_documents FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
    ON product_documents FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify migrations were successful

-- Check products table has new columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('content_sections', 'vectorized_at', 'document_count')
ORDER BY ordinal_position;

-- Check product_documents table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'product_documents'
);

-- Check sessions table has rag_enabled column
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
AND column_name = 'rag_enabled';

-- Check RLS policies for product_documents
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'product_documents';


-- ============================================
-- ROLLBACK QUERIES (if needed)
-- ============================================
-- CAUTION: These will delete data! Use only if you need to undo migrations

/*
-- Remove triggers
DROP TRIGGER IF EXISTS trigger_update_product_documents_updated_at ON product_documents;
DROP TRIGGER IF EXISTS trigger_update_product_document_count_insert ON product_documents;
DROP TRIGGER IF EXISTS trigger_update_product_document_count_delete ON product_documents;

-- Remove functions
DROP FUNCTION IF EXISTS update_product_documents_updated_at();
DROP FUNCTION IF EXISTS update_product_document_count();

-- Remove product_documents table
DROP TABLE IF EXISTS product_documents CASCADE;

-- Remove columns from products table
ALTER TABLE products DROP COLUMN IF EXISTS content_sections;
ALTER TABLE products DROP COLUMN IF EXISTS vectorized_at;
ALTER TABLE products DROP COLUMN IF EXISTS document_count;

-- Remove column from sessions table
ALTER TABLE sessions DROP COLUMN IF EXISTS rag_enabled;

-- Remove indexes
DROP INDEX IF EXISTS idx_products_vectorized_at;
DROP INDEX IF EXISTS idx_sessions_rag_enabled;
*/
