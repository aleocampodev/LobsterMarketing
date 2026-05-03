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
- WEBHOOK_SECRET: 73f0b54afa26320af143b62794ca2c4c (Used for OpenClaw -> n8n signing)
- **Domain:** `n8n-stack-prod-dev.duckdns.org` (HTTPS).
- **Execution Mode:** `queue` (Distributed processing enabled).
- **Redis Broker:** Upstash Redis with TLS.
- **Database Store:** Supabase PostgreSQL (via Transaction Pooler, port 6543).
- **Memory Optimization:** `max-old-space-size=512MB` (Optimized for GCP e2-micro).
- **Persistence:** Local volume `./n8n-persistence`.

## Brand Insights
- Nenufar's mission is deeply rooted in social impact, specifically empowering working mothers in Cartagena.
- The "Woven Poems" (Poemas Tejidos) concept is the primary narrative hook for all marketing content.

## Technical Lessons
- Decoupling decision-making (OpenClaw) from execution (n8n) allows for better scalability on free-tier cloud providers.

## Session Log
- **2026-05-03:** Audit of AGENTS.md compliance and Supabase structure. Found and fixed: (1) All specs missing version headers, (2) database_schema.sql was using `public` schema instead of `nenufar`, (3) 4 missing tables in SQL (brand_knowledge, post_engagement, engagement_calendar, comment_patterns), (4) ip-001/ip-002/ip-003 had [x] on untested tasks, (5) INDEX.md had incorrect statuses, (6) test-ip-001.md queried `public` instead of `nenufar`, (7) memory/ directory was missing.
