-- ============================================
-- Nenufar Marketing Automation - Database Schema
-- Version: v1.3
-- All tables, indexes, and functions scoped to `nenufar` schema.
-- v1.3: Removed RAG and vector dependencies (ADR-002).
-- v1.2: Migrated to nenufar schema. Added brand_knowledge, post_engagement,
--        engagement_calendar, comment_patterns tables.
-- ============================================

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS nenufar;

-- ============================================
-- Table: nenufar.processed_files (Asset Lifecycle)
-- ============================================
CREATE TABLE IF NOT EXISTS nenufar.processed_files (
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

CREATE INDEX IF NOT EXISTS idx_pf_file_id ON nenufar.processed_files(file_id);
CREATE INDEX IF NOT EXISTS idx_pf_status ON nenufar.processed_files(status);
CREATE INDEX IF NOT EXISTS idx_pf_created_at ON nenufar.processed_files(created_at DESC);

-- ============================================
-- Table: nenufar.monitoring_logs (Operational Audit)
-- ============================================
CREATE TABLE IF NOT EXISTS nenufar.monitoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    files_checked INTEGER DEFAULT 0,
    new_files INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    duration_ms INTEGER
);

-- ============================================
-- Table: nenufar.content_calendar (7-Day Strategy)
-- ============================================
CREATE TABLE IF NOT EXISTS nenufar.content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_date DATE NOT NULL,
    day_of_week TEXT NOT NULL,                  -- Monday, Tuesday, etc.
    theme TEXT NOT NULL,                        -- Tejiendo Caminos, Poemas Tejidos, etc.
    file_id TEXT REFERENCES nenufar.processed_files(file_id),
    caption TEXT,
    hashtags TEXT[],
    platforms TEXT[],
    status TEXT DEFAULT 'planned',              -- planned, published, skipped
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- Table: nenufar.templates_bank (Content Generation)
-- Ref: specs/templates_bank.md v1.0
-- ============================================
CREATE TABLE IF NOT EXISTS nenufar.templates_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id TEXT UNIQUE NOT NULL,           -- e.g., 'story_artisan_01'
    category TEXT NOT NULL,                     -- story, product, engagement, fallback
    content TEXT NOT NULL,                      -- Template with {{variables}}
    variables TEXT[],                           -- List of expected variables
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tb_category ON nenufar.templates_bank(category);
CREATE INDEX IF NOT EXISTS idx_tb_template_id ON nenufar.templates_bank(template_id);

-- ============================================
-- Table: nenufar.post_engagement (Analytics)
-- Ref: specs/analytics_system.md v1.1
-- ============================================
CREATE TABLE IF NOT EXISTS nenufar.post_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id TEXT NOT NULL,                      -- Meta API post ID
    platform TEXT NOT NULL,                     -- instagram, facebook
    file_id TEXT REFERENCES nenufar.processed_files(file_id),
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,4),
    viral_coefficient DECIMAL(5,4),
    performance_tier TEXT,                      -- Low, Medium, High, Viral
    caption_style TEXT,                         -- Poetic, Educational
    hashtag_density INTEGER,
    published_at TIMESTAMP WITH TIME ZONE,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pe_post_id ON nenufar.post_engagement(post_id);
CREATE INDEX IF NOT EXISTS idx_pe_platform ON nenufar.post_engagement(platform);
CREATE INDEX IF NOT EXISTS idx_pe_measured_at ON nenufar.post_engagement(measured_at DESC);

-- ============================================
-- Table: nenufar.engagement_calendar (Daily Engagement)
-- Ref: specs/user_engagement_system.md v1.1
-- ============================================
CREATE TABLE IF NOT EXISTS nenufar.engagement_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_date DATE NOT NULL,
    day_of_week TEXT NOT NULL,
    theme TEXT NOT NULL,
    question_type TEXT,                         -- poll, quiz, open_question
    question_text TEXT NOT NULL,
    options TEXT[],                             -- Poll/quiz options
    platform TEXT,                              -- instagram_stories, feed
    status TEXT DEFAULT 'planned',              -- planned, published, skipped
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: nenufar.comment_patterns (Proactive Replies)
-- Ref: specs/user_engagement_system.md v1.1
-- ============================================
CREATE TABLE IF NOT EXISTS nenufar.comment_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type TEXT NOT NULL,                 -- compliment, question, feedback, complaint
    sentiment TEXT NOT NULL,                    -- positive, neutral, negative
    trigger_keywords TEXT[],                    -- Keywords that trigger this pattern
    response_template TEXT NOT NULL,            -- Luna's eco-poetic reply template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE nenufar.processed_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.monitoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.templates_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.post_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.engagement_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.comment_patterns ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Grants (Service Role - Full Access)
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA nenufar TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA nenufar TO service_role;
GRANT USAGE ON SCHEMA nenufar TO service_role;

-- Anon: Read-only
GRANT USAGE ON SCHEMA nenufar TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA nenufar TO anon;


-- ============================================
-- Helper Functions (Scoped to nenufar schema)
-- ============================================

-- Check if file was processed
CREATE OR REPLACE FUNCTION nenufar.is_file_processed(p_file_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM nenufar.processed_files 
        WHERE file_id = p_file_id 
        AND status IN ('processing', 'published')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark file as processing (prevents duplicates)
CREATE OR REPLACE FUNCTION nenufar.mark_file_processed(
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
    INSERT INTO nenufar.processed_files (file_id, file_name, mime_type, size, task_id, status, processed_at)
    VALUES (p_file_id, p_file_name, p_mime_type, p_size, p_task_id, 'processing', NOW())
    ON CONFLICT (file_id) 
    DO UPDATE SET 
        processed_at = NOW(),
        status = 'processing',
        task_id = EXCLUDED.task_id
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark file as published
CREATE OR REPLACE FUNCTION nenufar.mark_file_published(
    p_file_id TEXT,
    p_platforms TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE nenufar.processed_files 
    SET 
        status = 'published',
        published_at = NOW(),
        platforms = p_platforms
    WHERE file_id = p_file_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup monitoring logs older than 30 days (Log Rotation)
CREATE OR REPLACE FUNCTION nenufar.cleanup_monitoring_logs()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM nenufar.monitoring_logs
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Self-Healing Heartbeat: Re-queue stalled tasks
CREATE OR REPLACE FUNCTION nenufar.requeue_stalled_tasks()
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE nenufar.processed_files
    SET status = 'pending',
        error_message = 'Auto-requeued by Heartbeat (stalled > 1h)'
    WHERE status = 'processing'
    AND processed_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Scheduled Tasks (CRON)
-- Requires `pg_cron` extension to be enabled in Supabase.
-- ============================================

-- Enable pg_cron if not already enabled (requires Superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule: Cleanup logs every day at 00:00
-- SELECT cron.schedule('cleanup-nenufar-logs', '0 0 * * *', 'SELECT nenufar.cleanup_monitoring_logs()');

-- Schedule: Re-queue stalled tasks every hour
-- SELECT cron.schedule('requeue-stalled-tasks', '0 * * * *', 'SELECT nenufar.requeue_stalled_tasks()');

-- ============================================
-- Migration Helper: Move public tables to nenufar schema
-- Run ONLY if tables exist in public schema
-- ============================================
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'processed_files') THEN
--         ALTER TABLE public.processed_files SET SCHEMA nenufar;
--     END IF;
--     IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monitoring_logs') THEN
--         ALTER TABLE public.monitoring_logs SET SCHEMA nenufar;
--     END IF;
--     IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_calendar') THEN
--         ALTER TABLE public.content_calendar SET SCHEMA nenufar;
--     END IF;
-- END $$;
