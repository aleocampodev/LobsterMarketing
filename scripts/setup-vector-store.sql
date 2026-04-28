-- Supabase Vector Store Setup for Nenufar RAG Integration
-- Run this in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create brand_knowledge table with vector support
CREATE TABLE IF NOT EXISTS brand_knowledge (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(768), -- Gemini text-embedding-004 dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX IF NOT EXISTS brand_knowledge_embedding_idx 
ON brand_knowledge 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION match_brand_knowledge(
    query_embedding vector(768),
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id TEXT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        brand_knowledge.id,
        brand_knowledge.content,
        brand_knowledge.metadata,
        1 - (brand_knowledge.embedding <=> query_embedding) AS similarity
    FROM
        brand_knowledge
    ORDER BY
        brand_knowledge.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Enable Row Level Security
ALTER TABLE brand_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (anon key)
CREATE POLICY "Allow read access to brand_knowledge"
ON brand_knowledge FOR SELECT
TO anon
USING (true);

-- Create policy for write access (service role only)
CREATE POLICY "Allow write access to brand_knowledge"
ON brand_knowledge FOR INSERT
TO service_role
WITH CHECK (true);

-- Create policy for update/delete access (service role only)
CREATE POLICY "Allow update/delete access to brand_knowledge"
ON brand_knowledge FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to check if knowledge exists
CREATE OR REPLACE FUNCTION knowledge_exists(p_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(SELECT 1 FROM brand_knowledge WHERE id = p_id);
END;
$$ LANGUAGE plpgsql;

-- Create function to update knowledge
CREATE OR REPLACE FUNCTION upsert_knowledge(
    p_id TEXT,
    p_content TEXT,
    p_embedding vector(768),
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TEXT AS $$
BEGIN
    INSERT INTO brand_knowledge (id, content, embedding, metadata)
    VALUES (p_id, p_content, p_embedding, p_metadata)
    ON CONFLICT (id) DO UPDATE
    SET content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata;
    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_brand_knowledge TO anon;
GRANT EXECUTE ON FUNCTION knowledge_exists TO anon;
GRANT EXECUTE ON FUNCTION upsert_knowledge TO service_role;

-- Test data (optional - remove after testing)
-- INSERT INTO brand_knowledge (id, content, embedding, metadata)
-- VALUES (
--     'test-001',
--     'Nenufar is a brand that values nature and craftsmanship.',
--     '[0.1, 0.2, ...]'::vector(1536), -- Replace with actual embedding
--     '{"type": "test", "source": "setup"}'::jsonb
-- );

-- Verify setup
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'brand_knowledge'
ORDER BY ordinal_position;

-- Check index created
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'brand_knowledge';

-- Check functions created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%brand_knowledge%';
