-- ============================================
-- Nenufar Marketing Automation - Database Schema
-- Version: v1.5
-- All tables, indexes, and functions scoped to `nenufar` schema.
-- v1.4: Added template_used column to processed_files. Updated mark_file_published.
--      Seeded 15 boutique templates. Removed RAG/Vector dependencies.
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
    status TEXT DEFAULT 'pending',               -- pending, processing, published, failed
    task_id TEXT,
    template_used TEXT,                          -- v1.4: Tracks which template was used
    platforms TEXT[],                            -- ['facebook', 'instagram']
    metadata JSONB,
    webhook_response JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_pf_file_id ON nenufar.processed_files(file_id);
CREATE INDEX IF NOT EXISTS idx_pf_status ON nenufar.processed_files(status);
CREATE INDEX IF NOT EXISTS idx_pf_created_at ON nenufar.processed_files(created_at DESC);

-- ============================================
-- Table: nenufar.monitoring_logs (Operational Audit)
-- ============================================
CREATE TABLE IF NOT EXISTS nenufar.monitoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT DEFAULT 'success',
    files_checked INTEGER DEFAULT 0,
    new_files INTEGER DEFAULT 0,
    duration_ms INTEGER,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
-- ============================================
CREATE TABLE IF NOT EXISTS nenufar.templates_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id TEXT UNIQUE NOT NULL,           -- e.g., 'reel_process_01'
    category TEXT NOT NULL,                     -- reel, photo, story, question
    content TEXT NOT NULL,                      -- Template with {{variables}}
    variables TEXT[],                           -- List of expected variables
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tb_category ON nenufar.templates_bank(category);
CREATE INDEX IF NOT EXISTS idx_tb_template_id ON nenufar.templates_bank(template_id);

-- ============================================
-- Table: nenufar.post_engagement (Analytics)
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
-- Table: nenufar.pending_captions (Caption Approval Bridge)
-- Persists captions between webhook execution and Telegram callback.
-- ============================================
CREATE TABLE IF NOT EXISTS nenufar.pending_captions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT UNIQUE NOT NULL,
    file_id TEXT NOT NULL,
    caption TEXT NOT NULL,
    post_type TEXT DEFAULT 'feed_ig',
    platforms TEXT DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pc_task_id ON nenufar.pending_captions(task_id);

-- ============================================
-- Table: nenufar.comment_patterns (Proactive Replies)
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
-- Helper Functions (Scoped to nenufar schema)
-- ============================================

-- Mark file as published
CREATE OR REPLACE FUNCTION nenufar.mark_file_published(
    p_file_id TEXT,
    p_platforms TEXT[],
    p_template_used TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE nenufar.processed_files 
    SET 
        status = 'published',
        published_at = NOW(),
        platforms = p_platforms,
        template_used = p_template_used
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
        error_message = 'Auto-requeued by Heartbeat'
    WHERE status = 'processing'
    AND processed_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================
-- Seed Data: 15 Boutique Templates
-- =========================================================

INSERT INTO nenufar.templates_bank (template_id, category, content, variables)
VALUES

-- Reels (4)
(
    'reel_process_01', 'reel',
    'El secreto de nuestra joyería índigo que pocos conocen... 🤫👇 ' ||
    'No es solo la calidad de la {{material}}; es la paciencia en la técnica de {{technique}}. ' ||
    'En un mundo rápido, nosotras nos detenemos a crear arte. ' ||
    'Dale ▶️ y cuéntanos: ¿crees que lo hecho a mano tiene otra energía? 📌🌸',
    ARRAY['material', 'technique']
),
(
    'reel_artisan_01', 'reel',
    '¿Te has preguntado quién está detrás de este accesorio? ⏱️👇 ' ||
    'Quédate un segundo en el taller con {{artisan_name}}. ' ||
    'Mientras teje este {{product_name}}, también construye el futuro de su familia. ' ||
    'Guarda este video si también apoyas el trabajo de las madres cabeza de hogar. 🤎🌿',
    ARRAY['artisan_name', 'product_name']
),
(
    'reel_materials_01', 'reel',
    'De la tierra a tus manos. 🌎 ' ||
    '¿Sabías que esta {{material}} tiene una historia de sostenibilidad? ' ||
    'Mira cómo brilla bajo el sol. No es solo joyería, es conciencia tejida. ' ||
    'Dale amor si valoras lo natural. 🌿',
    ARRAY['material']
),
(
    'reel_transformation_01', 'reel',
    'No es magia, es paciencia. ✨ ' ||
    'Mira cómo un puñado de {{material}} se transforma en un {{product_name}} ' ||
    'mediante la técnica de {{technique}}. ' ||
    'Un proceso lento para un resultado eterno. Guarda este video para inspirar tu día. ⏱️🌸',
    ARRAY['material', 'product_name', 'technique']
),

-- Fotos (4)
(
    'photo_exclusive_01', 'photo',
    '✨ {{product_name}} ✨ | ' ||
    'No creamos para las masas; creamos para quienes entienden que el verdadero lujo está en lo irrepetible. ' ||
    'Esta pieza de {{material}} fue concebida para respirar naturaleza. ' ||
    'Hacemos muy pocas a la semana. Si sientes que debe ser tuya, escríbenos por DM para separarla en el taller. 🌿',
    ARRAY['product_name', 'material']
),
(
    'photo_heritage_01', 'photo',
    'Antes de que fuera moda, fue lenguaje. 🍃 ' ||
    'Cuando tejemos con {{technique}}, recordamos que nuestros ancestros usaban el color para hablar. ' ||
    'Este {{product_name}} no es un adorno; es un dialecto milenario vivo que mantienes vivo al llevarlo contigo. 🤎',
    ARRAY['technique', 'product_name']
),
(
    'photo_gift_01', 'photo',
    'Regala algo que no se pueda repetir. 🎁 ' ||
    'El {{product_name}} es el mensaje perfecto para decir te quiero con arte. ' ||
    'Piezas únicas para personas que dejan huella. Escríbenos y te ayudamos a elegir el empaque ideal. 🎀',
    ARRAY['product_name']
),
(
    'photo_local_01', 'photo',
    'Desde el corazón de Cartagena para el mundo. 🌴 ' ||
    'Nuestro {{product_name}} lleva la brisa y el color de nuestra tierra en cada puntada de {{technique}}. ' ||
    '¿Desde qué ciudad nos lees hoy? 📍🌻',
    ARRAY['product_name', 'technique']
),

-- Stories (4)
(
    'story_bts_01', 'story',
    'Puntada a puntada... ⏱️ ' ||
    'Así luce nuestro taller hoy creando sus pedidos. ' ||
    'La técnica de {{technique}} requiere toda nuestra presencia. ¡Feliz día, tribu! ☕🌿',
    ARRAY['technique']
),
(
    'story_last_units_01', 'story',
    '¡Quedan muy pocas unidades disponibles! 🏃‍♀ ' ||
    'El {{product_name}} en {{material}} está volando. ' ||
    'Si lo tenías en la mira, este es el momento. Toca el link en la bio o escríbenos al DM. 🔥',
    ARRAY['product_name', 'material']
),
(
    'story_client_love_01', 'story',
    'Almas felices luciendo Nenufar. ✨ ' ||
    'Gracias por elegir nuestra técnica de {{technique}} para acompañar sus momentos especiales. ' ||
    'Etiquétanos en tu foto para saludarte. 📸🌸',
    ARRAY['technique']
),
(
    'story_interactive_01', 'story',
    '¿A o B? 🤔 ' ||
    'En el taller estamos indecisas con este diseño de {{product_name}}. ' ||
    '¿Te gusta más en tonos tierra o vibrantes? Reacciona o escríbenos. 👇✨',
    ARRAY['product_name']
),

-- Preguntas / engagement (3)
(
    'post_question_01', 'question',
    'Hoy en el taller hablábamos sobre {{day_theme}} y quería preguntarles algo a ustedes, nuestra tribu. 🤎 ' ||
    'Cuando se ponen sus piezas favoritas de Nenufar, ¿qué buscan sentir? ' ||
    '¿Seguridad, paz o conexión con lo natural? Las leo aquí abajo. 👇✨',
    ARRAY['day_theme']
),
(
    'post_poll_01', 'question',
    '¡Necesitamos su ayuda en el taller! 🤔🍃 ' ||
    'Estamos creando nuevos {{product_name}} con {{material}} y queremos saber: ' ||
    'para sus días más importantes, ¿prefieren tonos dorados (Poder) o amarillos (Alegría)? ' ||
    'Déjennos su voto abajo. 👇🌸',
    ARRAY['product_name', 'material']
),
(
    'post_cocreate_01', 'question',
    '¿Qué soñamos después? ✨ ' ||
    'Queremos crear una nueva colección con {{material}} y queremos que tú seas parte del diseño. ' ||
    '¿Qué accesorio te gustaría que tejiéramos esta semana? Las leo con mucha ilusión. 👇🤎',
    ARRAY['material']
)

ON CONFLICT (template_id) DO UPDATE 
    SET 
        content = EXCLUDED.content,
        variables = EXCLUDED.variables,
        updated_at = NOW();


-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE nenufar.processed_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.monitoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.templates_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.post_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.engagement_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE nenufar.pending_captions ENABLE ROW LEVEL SECURITY;
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
