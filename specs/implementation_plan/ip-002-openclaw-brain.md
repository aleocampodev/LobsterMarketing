# Epic ip-002: The Brain - OpenClaw Server

**Status:** ✅ Completed (100% - 2026-04-24)

**Goal:** Build the intelligence layer (Luna) that handles strategy and copywriting, triggered by new content in Google Drive and controlled via Telegram.

## Tasks

### ip-002.1: Environment and Connectivity (Oracle Cloud)
- [x] **ip-002.1.1:** Install Python (3.10+) on the Oracle ARM instance.
- [x] **ip-002.1.2:** Configure `.env.production` with:
    - `TELEGRAM_BOT_TOKEN` (Pending from BotFather).
    - `GEMINI_API_KEY` (Already provided).
    - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
    - `N8N_WEBHOOK_URL` (Configured).
- [x] **ip-002.1.3:** Implement FastAPI server with health check endpoint.

### ip-002.2: RAG Brain (Brand Memory)
- [x] **ip-002.2.1:** Execute SQL in Supabase for `brand_knowledge` and `brand_prompts` tables.
- [x] **ip-002.2.2:** Verify OpenClaw access to local brand documents (`soul.md`, `identity.md`).
- [x] **ip-002.2.3:** Luna is now aware of the brand voice through local file integration.

### ip-002.3: Ingestion from Google Drive
- [x] **ip-002.3.1:** Configure a "Watcher" (via n8n) to detect new photos/videos in the user's Google Drive folder.
- [x] **ip-002.3.2:** Retrieve file metadata (name, date) and send a thumbnail/link to Luna for analysis.

### ip-002.4: Visual Analysis and Generation (Luna)
- [x] **ip-002.4.1:** Send image to Gemini 1.5 Flash to extract: materials, colors, and weaving techniques.
- [x] **ip-002.4.2:** Perform semantic search in Supabase to retrieve the related "Woven Poem" or story.
- [x] **ip-002.4.3:** Construct the final caption + optimized hashtags.

### ip-002.5: Control Interface (Telegram)
- [x] **ip-002.5.1:** Luna sends to user: Photo preview (via Drive link) + proposed Caption.
- [x] **ip-002.5.2:** Implement action buttons:
    - ✅ **Approve:** Triggers n8n webhook for publishing.
    - 🔄 **Adjust:** Allows user to provide feedback (e.g., "make it more cheerful").
    - ❌ **Discard:** Cancels the publication.
- [x] **ip-002.5.3:** Multi-Agent System Implementation (see `ip-002.5-telegram-interface.md`)
    - ✅ Duplicating existing multi-agent workflow for Luna/Nenufar
    - ✅ Configuring 4 specialized agents (Luna, Content, Brand, Approval)
    - ✅ Integrating with n8n workflows (ip-003 ✅ completed)
    - ✅ Created "Luna Telegram Agent v3" workflow (ID: gho024nUvGmgeYRK)
    - ✅ Implemented callback query handling for approval buttons
    - ✅ Connected to n8n Webhook Receiver (EPslgKTzkbLcxdrs)
    - ✅ Workflow activated and ready for production testing

### ip-002.6: Execution Trigger (Secure Webhook)
- [x] **ip-002.6.1:** Generate final payload (Image URL, Caption, Platforms).
- [x] **ip-002.6.2:** Send signed POST request to n8n for execution.
