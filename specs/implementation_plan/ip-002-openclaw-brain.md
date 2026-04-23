# Epic ip-002: The Brain - OpenClaw Server

Goal: Build the intelligence layer (Luna) that handles strategy and copywriting, triggered by new content in Google Drive and controlled via Telegram.

## Tasks

### ip-002.1: Environment and Connectivity (Oracle Cloud)
- [ ] **ip-002.1.1:** Install Node.js (v18+) or Python (3.10+) on the Oracle ARM instance.
- [ ] **ip-002.1.2:** Configure `.env.production` with:
    - `TELEGRAM_BOT_TOKEN` (Already configured).
    - `GEMINI_API_KEY` (Already provided).
    - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
    - `N8N_WEBHOOK_URL` (Pending).
- [ ] **ip-002.1.3:** Implement base bot with **Long Polling** to receive `/start` and `/status` commands.

### ip-002.2: RAG Brain (Brand Memory)
- [x] **ip-002.2.1:** Execute SQL in Supabase for `brand_knowledge` and `brand_prompts` tables.
- [x] **ip-002.2.2:** Verify OpenClaw access to local brand documents (`soul.md`, `identity.md`).
- [x] **ip-002.2.3:** Luna is now aware of the brand voice through local file integration.

### ip-002.3: Ingestion from Google Drive
- [ ] **ip-002.3.1:** Configure a "Watcher" (via n8n) to detect new photos/videos in the user's Google Drive folder.
- [ ] **ip-002.3.2:** Retrieve file metadata (name, date) and send a thumbnail/link to Luna for analysis.

### ip-002.4: Visual Analysis and Generation (Luna)
- [ ] **ip-002.4.1:** Send image to Gemini 1.5 Flash (or 3.1 Flash) to extract: materials, colors, and weaving techniques.
- [ ] **ip-002.4.2:** Perform semantic search in Supabase to retrieve the related "Woven Poem" or story.
- [ ] **ip-002.4.3:** Construct the final caption + optimized hashtags.

### ip-002.5: Control Interface (Telegram)
- [ ] **ip-002.5.1:** Luna sends to user: Photo preview (via Drive link) + proposed Caption.
- [ ] **ip-002.5.2:** Implement action buttons:
    - ✅ **Approve:** Triggers n8n webhook for publishing.
    - 🔄 **Adjust:** Allows user to provide feedback (e.g., "make it more cheerful").
    - ❌ **Discard:** Cancels the publication.

### ip-002.6: Execution Trigger (Secure Webhook)
- [ ] **ip-002.6.1:** Generate final payload (Image URL, Caption, Platforms).
- [ ] **ip-002.6.2:** Send signed POST request to n8n for execution.
