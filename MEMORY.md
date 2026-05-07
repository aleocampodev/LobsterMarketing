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
- **2026-05-07:** Fixed media flow (architecture v2.6). New files in Drive are auto-processed by Oracle (resize, watermark) without Telegram notification. Heartbeat only notifies Shirley at 9am if pipeline is empty. Watermark logo fetched from Drive (not local). Updated: architecture.md v2.6, media_processor_api.md, AGENTS.md.
- **2026-05-07:** Added Oracle Cloud Media Processor (ADR-004). n8n on e2-micro delegates heavy image/video processing to a Node.js API on the Oracle VM (same as OpenClaw). This solves the OOM risk on e2-micro and enables future video support. Updated: architecture.md v2.5, AGENTS.md, ip-003 v1.7, MEMORY.md. Created: media_processor_api.md, ADR-004.
- **2026-05-03:** Audit of AGENTS.md compliance and Supabase structure. Found and fixed: (1) All specs missing version headers, (2) database_schema.sql was using `public` schema instead of `nenufar`, (3) 4 missing tables in SQL (brand_knowledge, post_engagement, engagement_calendar, comment_patterns), (4) ip-001/ip-002/ip-003 had [x] on untested tasks, (5) INDEX.md had incorrect statuses, (6) test-ip-001.md queried `public` instead of `nenufar`, (7) memory/ directory was missing.
