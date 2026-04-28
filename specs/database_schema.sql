-- ============================================
-- Nenufar Marketing Automation - Database Schema
-- ============================================

-- Table: Processed Files Tracking
CREATE TABLE IF NOT EXISTS processed_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id TEXT UNIQUE NOT NULL,              -- Google Drive file ID
    file_name TEXT NOT NULL,
    mime_type TEXT,
    size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    platforms TEXT[],                            -- ['facebook', 'instagram']
    status TEXT DEFAULT 'pending',               -- pending, processing, published, failed
    task_id TEXT,
    webhook_response JSONB,
    error_message TEXT,
    metadata JSONB
);

-- Index for faster lookups
CREATE INDEX idx_processed_files_file_id ON processed_files(file_id);
CREATE INDEX idx_processed_files_status ON processed_files(status);
CREATE INDEX idx_processed_files_created_at ON processed_files(created_at DESC);

-- Table: Monitoring Logs
CREATE TABLE IF NOT EXISTS monitoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    files_checked INTEGER DEFAULT 0,
    new_files INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    duration_ms INTEGER
);

-- Table: Content Calendar (7-day strategy tracking)
CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_date DATE NOT NULL,
    day_of_week TEXT NOT NULL,                  -- Monday, Tuesday, etc.
    theme TEXT NOT NULL,                        -- Tejiendo Caminos, Poemas Tejidos, etc.
    file_id TEXT REFERENCES processed_files(file_id),
    caption TEXT,
    hashtags TEXT[],
    platforms TEXT[],
    status TEXT DEFAULT 'planned',              -- planned, published, skipped
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- RLS (Row Level Security) policies
ALTER TABLE processed_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
GRANT ALL ON processed_files TO service_role;
GRANT ALL ON monitoring_logs TO service_role;
GRANT ALL ON content_calendar TO service_role;

-- Helper function to check if file was processed
CREATE OR REPLACE FUNCTION is_file_processed(p_file_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM processed_files 
        WHERE file_id = p_file_id 
        AND status IN ('processing', 'published')
    );
END;
$$ LANGUAGE plpgsql;

-- Helper function to mark file as processed
CREATE OR REPLACE FUNCTION mark_file_processed(
    p_file_id TEXT,
    p_file_name TEXT,
    p_mime_type TEXT,
    p_size BIGINT,
    p_task_id TEXT
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO processed_files (file_id, file_name, mime_type, size, task_id, status, processed_at)
    VALUES (p_file_id, p_file_name, p_mime_type, p_size, p_task_id, 'processing', NOW())
    ON CONFLICT (file_id) 
    DO UPDATE SET 
        processed_at = NOW(),
        status = 'processing',
        task_id = EXCLUDED.task_id
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to mark file as published
CREATE OR REPLACE FUNCTION mark_file_published(
    p_file_id TEXT,
    p_platforms TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE processed_files 
    SET 
        status = 'published',
        published_at = NOW(),
        platforms = p_platforms
    WHERE file_id = p_file_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
