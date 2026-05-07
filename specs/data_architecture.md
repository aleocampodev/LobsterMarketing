# Data Architecture & Supabase Integration
Version: v1.7
<!-- v1.7: Added Supabase Storage bucket for watermark logo. -->
<!-- v1.6: Removed all residual RAG and pgvector mentions. -->
<!-- v1.5: Documented template_used column and 15-template dual-axis strategy. Updated schema v1.4. -->

## Overview
The Nenufar Marketing Automation System uses Supabase (PostgreSQL) as its centralized data brain. All tables and functions are scoped under the **`nenufar` schema** (not `public`). It handles task tracking, content generation via **Templates Bank**, content strategy persistence, and duplicate detection.

---

## 1. Schema: `nenufar`

All tables, indexes, and RPC functions live under the `nenufar` schema. 

### 1.1 `nenufar.processed_files` (Asset Lifecycle)
Tracks every media file from Google Drive to Meta.
- **`id`**: UUID (PK).
- **`file_id` (Unique):** Google Drive File ID.
- **`file_name`:** Original filename.
- **`mime_type`:** MIME type (image/jpeg, video/mp4, etc.).
- **`size`:** File size in bytes.
- **`status`:** `pending`, `processing`, `published`, `failed`.
- **`template_used` (v1.4):** Tracks the specific `template_id` used for generation.
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

### 1.3 `nenufar.templates_bank` (Content Generation)
Stores pre-defined copy structures with placeholders for variable interpolation.
- **`id`**: UUID (PK).
- **`template_id` (Unique):** Identifier for the template (e.g., `reel_process_01`).
- **`category`:** reel, photo, story, question.
- **`content`:** Text with `{{variables}}` placeholders.
- **`variables`:** Array of strings (expected placeholders).

**Strategy (v1.6):** 15 boutique templates distributed as follows:
*   **Photo:** 4 templates (Exclusive, Heritage, Gift, Local).
*   **Reel:** 4 templates (Process, Artisan, Materials, Transformation).
*   **Story:** 4 templates (BTS, Last Units, Client Love, Interactive).
*   **Question:** 3 templates (Engagement, Poll, Co-create).

**Indexes:** `idx_tb_category`, `idx_tb_template_id`.

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
| `nenufar.mark_file_published(...)` | Record final Meta URL, template used, and success timestamp | `BOOLEAN` |

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
3. **Service Role:** n8n Workers and Media Processor use the `service_role` key to bypass RLS for system operations.
4. **Anon Access:** Read-only (`SELECT`) on all tables for public-facing queries.
5. **Audit Logs:** All monitoring runs are recorded in `nenufar.monitoring_logs`.

---

## 3.5 Supabase Storage Buckets

### `nenufar-assets` (Private)
Stores static brand assets used by the Media Processor.

| File | Purpose | Used By |
|---|---|---|
| `nenufar-logo.png` | Watermark overlay for published images | Oracle Media Processor API |

**Access:** Private bucket. The Media Processor downloads via public URL (service_role key). The logo is cached locally on Oracle VM after first download.

**Configuration:** The file path is set via `WATERMARK_STORAGE_PATH` env var (default: `nenufar-assets/nenufar-logo.png`).

---

## 4. Change Log
- **v1.7 (2026-05-07):** Added `nenufar-assets` Storage bucket for watermark logo. Updated security protocols to include Media Processor.
- **v1.6 (2026-05-05):** Removed all residual RAG and pgvector mentions. Aligned with 100% Template-based architecture.
- **v1.5 (2026-05-05):** Documented `template_used` column and the 15-template strategy. Updated RPC `mark_file_published` to include template tracking.
- **v1.4 (2026-05-03):** Replaced `brand_knowledge` (RAG) with `templates_bank`. Removed `pgvector` dependency from primary flow.
- **v1.3 (2026-05-03):** Added `post_engagement`, `engagement_calendar`, `comment_patterns` tables.
- **v1.2 (2026-05-03):** Migrated all tables to `nenufar` schema.
- **v1.1:** Initial data architecture with `public` schema.

---

## Success Criteria
- [x] Schema prevents duplicate processing of the same Drive File ID.
- [x] Template retrieval returns relevant brand context in < 100ms.
- [x] All database operations are versioned and documented in English.
- [x] `nenufar` schema isolates all Nenufar data from `public`.
- [x] `template_used` correctly tracked for each published post.
