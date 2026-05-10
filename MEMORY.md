# MEMORY.md - Long-Term Memory

## Project Milestones
- **2026-04-22:** Started Google Drive integration (Task ip-002.3).
- **2026-04-22:** Brand Memory established via local OpenClaw file integration.
- **2026-04-22:** Trello board link added: [Lobstermarketing Board](https://trello.com/b/A6VjYPGU/lobstermarketing)
- **2026-04-20:** Project documentation fully translated to English. Brand essence and technical specs formalized in the `specs/` directory.
- **2026-04-20:** Integration plan for OpenClaw and n8n established.
- **2026-04-20:** OpenClaw system configuration integrated into memory.

## System Configuration (OpenClaw)
- WEBHOOK_SECRET: 73f0b54afa26320af143b62794ca2c4c (Used for OpenClaw -> n8n signing)
- **Primary Model:** `Gemini 2.5 Flash` (Google Generative AI).
- **System Prompt Override:** "Responde siempre en español. Eres un asistente experto en n8n y Supabase."
- **Telegram Channel:** Enabled with `dmPolicy: pairing` and `groupPolicy: allowlist`. Streaming mode set to `partial`.
- **Enabled Plugins:** Google, Google Generative AI.
- **Gateway Mode:** Local.

## System Configuration (n8n & Infrastructure)
- WEBHOOK_SECRET: ******************************** (Used for OpenClaw -> n8n -> Oracle signing)
- **n8n (GCP e2-micro):** `n8n-stack-prod-dev.duckdns.org` (HTTPS). Regular Mode. Lightweight router only.
- **Media Processor (Oracle Cloud ARM A1):** Port 3001. Heavy media processing (Sharp + ffmpeg). Same VM as OpenClaw.
- **Database Store:** Supabase PostgreSQL (via Transaction Pooler, port 6543).
- **Memory Optimization:** `max-old-space-size=512MB` (Optimized for GCP e2-micro).
- **Persistence:** Local volume `./n8n-persistence`.
- **Note (2026-05-07):** Added Oracle Cloud Media Processor (ADR-004). n8n on e2-micro now delegates all heavy media operations to Oracle. Brain + Media Processor share the same OCI VM.

## Brand Insights
- Nenufar's mission is deeply rooted in social impact, specifically empowering working mothers in Cartagena.
- The "Woven Poems" (Poemas Tejidos) concept is the primary narrative hook for all marketing content.

## Technical Lessons
- Decoupling decision-making (OpenClaw) from execution (n8n) allows for better scalability on free-tier cloud providers.

## Session Log
- **2026-05-10:** COMPLETED IP-002 (all tasks). Session covered: ip-002.13-002.15 (HMAC+dispatch), ip-002.4 (Buffer Window memory), ip-002.11 (approval callback fix), ip-002.16 (classification buttons), ip-002.18 (proactive nudge), ip-002.17 (validation report v3.0). Key files modified: specs/agent_prompts.md v1.4 (Sections 5+6), specs/openclaw_system_prompt.txt (callbacks, classify, proactive), specs/implementation_plan/ip-002 v3.0 (COMPLETED), specs/tests/test-ip-002.md v3.0.
- **2026-05-10:** Completed ip-002.11 — Interactive Approval Buttons. Fixed callback flow: n8n intercepts ALL callbacks (approve/adjust). Approve = n8n publishes autonomously. Adjust = n8n POSTs to OpenClaw webhook, Luna asks Shirley. Fixed mismatch (system prompt had approve:TASK_ID:FILE_ID:POST_TYPE, n8n actually sends approve:TASK_ID). Updated IP-002 to v2.6.
- **2026-05-10:** Completed ip-002.4 — Buffer Window memory. Configured contextPruning (cache-ttl 5m), pre-compaction memory flush (50K headroom), QMD retrieval index with specs/ path, and search-before-acting rule. Ref: specs/agent_prompts.md Section 6. Updated IP-002 to v2.5. Remaining IP-002: 002.11, 002.16, 002.18, 002.17.
- **2026-05-10:** Completed ip-002.13, ip-002.14, ip-002.15 — HMAC signing, JSON payload contract, and webhook dispatch integration. Added Section 5 to `specs/agent_prompts.md` with full HMAC algorithm, payload field validation, endpoint mapping (n8n_dispatch / n8n_publish), error handling, and end-to-end handshake sequence. Updated IP-002 to v2.4. Remaining IP-002 tasks: 002.4 (memory), 002.11 (approval buttons), 002.16 (classification), 002.18 (proactive), 002.17 (validation report).
- **2026-05-07:** Defined Drive folder structure (architecture v2.7). Shirley uploads to `/Input/` (root). System auto-creates `/Procesadas/` subfolder for watermarked files. Supabase stores only metadata + references (no binaries). Updated: architecture.md v2.7, data_architecture.md v1.8, media_processor_api.md v1.1. Workflow fix pending n8n MCP connection.
- **2026-05-07:** Fixed Drive Monitor workflow (GQaquqrmu8slMAhG). Was only processing 1 of N new files (picked most recent). Now processes ALL new files: Scan Drive -> Check Processed -> Filter ALL new -> Mark Processing -> Oracle Media Processor -> Mark Processed. If no new files, notifies Shirley. Also fixed Supabase operations (insert -> create).
- **2026-05-07:** Added Oracle Cloud Media Processor (ADR-004). n8n on e2-micro delegates heavy image/video processing to a Node.js API on the Oracle VM (same as OpenClaw). This solves the OOM risk on e2-micro and enables future video support. Updated: architecture.md v2.5, AGENTS.md, ip-003 v1.7, MEMORY.md. Created: media_processor_api.md, ADR-004.
- **2026-05-03:** Audit of AGENTS.md compliance and Supabase structure. Found and fixed: (1) All specs missing version headers, (2) database_schema.sql was using `public` schema instead of `nenufar`, (3) 4 missing tables in SQL (brand_knowledge, post_engagement, engagement_calendar, comment_patterns), (4) ip-001/ip-002/ip-003 had [x] on untested tasks, (5) INDEX.md had incorrect statuses, (6) test-ip-001.md queried `public` instead of `nenufar`, (7) memory/ directory was missing.
