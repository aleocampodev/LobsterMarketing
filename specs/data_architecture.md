# Data Architecture & Supabase Integration
Version: v1.3
<!-- v1.3: Added brand_knowledge, post_engagement, engagement_calendar, comment_patterns tables. Aligned with database_schema.sql v1.2. -->

## Overview
The Nenufar Marketing Automation System uses Supabase (PostgreSQL + pgvector) as its centralized data brain. All tables and functions are scoped under the **`nenufar` schema** (not `public`). It handles task tracking, semantic search (RAG), content strategy persistence, and duplicate detection.

---

## 1. Schema: `nenufar`

All tables, indexes, and RPC functions live under the `nenufar` schema. The migration script (`specs/database_schema.sql`) handles moving existing `public` tables into `nenufar` automatically.

### 1.1 `nenufar.processed_files` (Asset Lifecycle)
Tracks every media file from Google Drive to Meta.
- **`id`**: UUID (PK).
- **`file_id` (Unique):** Google Drive File ID.
- **`file_name`:** Original filename.
- **`mime_type`:** MIME type (image/jpeg, video/mp4, etc.).
- **`size`:** File size in bytes.
- **`status`:** `pending`, `processing`, `published`, `failed`.
- **`platforms`:** Array of targeted social networks (`['instagram', 'facebook']`).
- **`task_id`:** Execution task identifier.
- **`webhook_response`:** JSONB with API response data.
- **`error_message`:** Error details if failed.
- **`metadata`:** JSONB for extensible data.
- **`created_at`, `processed_at`, `published_at`:** Timestamps.

**Indexes:** `idx_pf_file_id`, `idx_pf_status`, `idx_pf_created_at`.

### 1.2 `nenufar.content_calendar` (7-Day Strategy)
Manages the 7-day thematic cycle.
- **`scheduled_date`:** When the content should be proposed.
- **`day_of_week`:** Monday through Sunday.
- **`theme`:** Maps to `user_engagement_system.md` themes (Tejiendo Caminos, Poemas Tejidos, etc.).
- **`file_id`:** Reference to `processed_files.file_id`.
- **`caption`, `hashtags`, `platforms`:** Generated content data.
- **`status`:** `planned`, `published`, `skipped`.

### 1.3 `nenufar.brand_knowledge` (RAG Knowledge Base)
Stores document embeddings for semantic retrieval.
- **`id`**: UUID (PK).
- **`content`:** Text chunks from catalog and mission.
- **`embedding`:** 768-dimensional vector (Gemini text-embedding-004).
- **`source`:** Origin document (e.g., `product_catalog`, `brand_essence`, `social_impact`).
- **`metadata`:** JSONB for extensible data.

**Index:** `idx_bk_embedding` (IVFFlat, cosine ops).

### 1.4 `nenufar.monitoring_logs` (Operational Audit)
Tracks every monitoring run and system health check.
- **`files_checked`:** Number of files scanned.
- **`new_files`:** Number of new files detected.
- **`status`:** `success` or `error`.
- **`error_message`:** Error details if applicable.
- **`duration_ms`:** Execution duration.

### 1.5 `nenufar.post_engagement` (Analytics Tracking)
*Ref: specs/analytics_system.md v1.1*
Tracks engagement metrics for published posts (48-hour window).
- **`post_id`:** Meta API post identifier.
- **`platform`:** `instagram` or `facebook`.
- **`file_id`:** Reference to `processed_files.file_id`.
- **Direct Metrics:** `likes`, `comments`, `shares`, `saves`, `views`, `clicks`.
- **Calculated KPIs:** `engagement_rate`, `viral_coefficient`.
- **`performance_tier`:** Low, Medium, High, Viral.
- **`caption_style`:** Poetic or Educational.

### 1.6 `nenufar.engagement_calendar` (Daily Engagement Schedule)
*Ref: specs/user_engagement_system.md v1.1*
Manages the daily interactive content (polls, quizzes, questions).
- **`scheduled_date`:** When to publish.
- **`day_of_week`:** Monday through Sunday.
- **`theme`:** Tejiendo Caminos, Poemas Tejidos, etc.
- **`question_type`:** poll, quiz, open_question.
- **`question_text`:** The engagement question content.
- **`options`:** Poll/quiz answer choices.
- **`platform`:** `instagram_stories` or `feed`.

### 1.7 `nenufar.comment_patterns` (Proactive Reply Templates)
*Ref: specs/user_engagement_system.md v1.1*
Stores classified comment patterns with Luna's eco-poetic response templates.
- **`pattern_type`:** compliment, question, feedback, complaint.
- **`sentiment`:** positive, neutral, negative.
- **`trigger_keywords`:** Keywords that activate this pattern.
- **`response_template`:** Luna's reply in eco-poetic voice.

---

## 2. RPC Functions (Scoped to `nenufar`)

Workers communicate with Supabase via secure RPC functions. All functions require the `Accept-Profile: nenufar` header in REST API calls.

| Function | Purpose | Returns |
|---|---|---|
| `nenufar.is_file_processed(file_id)` | Check if a Drive file was already processed or published | `BOOLEAN` |
| `nenufar.mark_file_processed(...)` | Lock file for processing, prevent duplicates | `UUID` |
| `nenufar.mark_file_published(...)` | Record final Meta URL and success timestamp | `BOOLEAN` |

### n8n Integration Pattern
The `Luna Proactive Drive Check` workflow (ID: `ok6QCES3fkdtfGEc`) calls `is_file_processed` via Supabase REST API to filter out already-processed files before notifying OpenClaw.

---

## 3. Configuration & Security

### Environment Variables
```bash
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[secret-key]  # Used ONLY by Workers
```

### Security Protocols
1. **Schema Isolation:** All Nenufar data lives in the `nenufar` schema, separate from `public`.
2. **Row Level Security (RLS):** Enabled for all tables.
3. **Service Role:** n8n Workers use the `service_role` key to bypass RLS for system operations.
4. **Anon Access:** Read-only (`SELECT`) on all tables for public-facing queries.
5. **Audit Logs:** All monitoring runs are recorded in `nenufar.monitoring_logs`.

### Required REST API Headers (for n8n HTTP Request nodes)
```json
{
  "apikey": "<SUPABASE_SERVICE_ROLE_KEY>",
  "Authorization": "Bearer <SUPABASE_SERVICE_ROLE_KEY>",
  "Content-Type": "application/json",
  "Accept-Profile": "nenufar"
}
```

---

## 4. Change Log
- **v1.3 (2026-05-03):** Added `post_engagement`, `engagement_calendar`, `comment_patterns` tables. Added `brand_knowledge` full field docs. Aligned with `database_schema.sql` v1.2.
- **v1.2 (2026-05-03):** Migrated all tables to `nenufar` schema. Added `monitoring_logs` table. Added `Accept-Profile` header documentation for n8n integration.
- **v1.1:** Initial data architecture with `public` schema.

---

## Success Criteria
- [x] Schema prevents duplicate processing of the same Drive File ID.
- [x] RAG queries return relevant brand context in < 500ms.
- [x] All database operations are versioned and documented in English.
- [x] `nenufar` schema isolates all Nenufar data from `public`.
- [x] Duplicate detection integrated in n8n Proactive Drive Check workflow.
