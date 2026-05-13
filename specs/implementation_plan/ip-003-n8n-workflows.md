# Epic ip-003: The Arms - n8n Workflows

Version: v3.2
<!-- v3.2: Completed ip-003.25 (Luna Bridge WF2b integration), ip-003.3 (retry logic), ip-003.14 (Error Handler email), ip-003.18 (pipeline heartbeat), ip-003.15 (circuit breaker). WF2b now 18 nodes with CB + error logging. -->
<!-- v3.1: Added Luna Bridge task (ip-003.25) for HTTP→WebSocket proxy. Ref: specs/luna-bridge-api.md, architecture v3.0. -->
<!-- v3.0: Rebuilt WF2 as autonomous pipeline. WF2a (qoZ77gxnxsCdJDuT): Cron → Find Processed → Dispatch to Luna → Wait Caption → Send Preview. WF2b (st8o1iyoPkPdZ9go): Telegram Callback → Publish to Meta directly (merged WF3). Archived WF3 (l9LVaa1wxkQYffhC). Strategic scheduling: Mon-Thu 11AM, Fri 4PM, Sat 9AM. -->
<!-- v2.2: Unified Caption Approval Pipeline v2 (ID: 3QsBOmzseOyFv9sA). Merged approval buttons + callback handler + image processing + Meta publishing into single workflow. 19 nodes. Added Instagram + Facebook publishing via Meta Graph API. -->
<!-- v2.1: Token optimization for Caption Approval Pipeline — predefined adjustment options, max 2 adjustments. Ref: ADR-005. -->
<!-- v2.0: Implemented Caption Approval Pipeline (ip-003.23 + ip-003.24). 2 buttons (Publicar/Ajustar). Adjust triggers feedback loop via Luna. Photo+caption preview sent by n8n from Drive /Procesadas/. -->

**Goal:** Automate the mechanical tasks of fetching, processing, and publishing media using n8n as a lightweight router that delegates heavy media processing to the Oracle Cloud Media Processor API.

**Status:** 🔄 In Progress
**Estimated Effort:** 3 days

---

## 1. Orchestration & Task Routing
*Ref: specs/architecture.md v2.5*

- [x] **ip-003.1:** Implement the secure `Luna Webhook Receiver`. (Completed: 2026-05-10 — Caption Approval Pipeline v2, webhook `/caption-approval`, ID: `3QsBOmzseOyFv9sA`)
- [x] **ip-003.2:** Configure HMAC signature validation for all incoming requests from the Brain. (Completed: 2026-05-10 — Verify HMAC + Build Data node in pipeline)
- [x] **ip-003.3:** Configure n8n built-in retry logic with **Exponential Backoff** (3 attempts) for failed executions. (Completed: 2026-05-11 — Applied to WF2b Publish nodes + Heartbeat Download/Upload/Oracle nodes. retryOnFail=true, maxTries=3, waitBetweenTries=5000ms.)
- [x] **ip-003.14:** **Failed Task Notification:** Configure email notification to admin when a task fails after 3 retry attempts. (Completed: 2026-05-11 — Error Handler workflow `DPV2Ly5k1EhSyynI`: Error Trigger → Format Error → Send Email via Gmail SMTP to aleocampo.dev@gmail.com.)
- [x] **ip-003.17:** Implement **Strategic Delay/Scheduling** nodes to queue posts for optimal publishing hours. (Completed: 2026-05-11 — WF2a Schedule Trigger with 3 cron rules: Mon-Thu 11AM, Fri 4PM, Sat 9AM. Based on Sprout Social 2026 data adapted for Colombia UTC-5.)
- [x] **ip-003.18:** Implement a **Pipeline Heartbeat** (Cron) to trigger Luna if no content is scheduled for the next 24 hours. (Completed: 2026-05-11 — Heartbeat workflow `GQaquqrmu8slMAhG` already scans Drive + Supabase, notifies Shirley when no new images and no scheduled content.)
- [x] **ip-003.25:** **Luna Bridge — HTTP→WebSocket Proxy:** Deploy the Luna Bridge service on Oracle Cloud VM (`/opt/luna-bridge/server.js`). This proxy translates HTTP POST requests from n8n into WebSocket messages to OpenClaw's gateway (`ws://127.0.0.1:18789`). Includes: express + ws server, HMAC validation, auto-reconnect to OpenClaw, systemd service, OCI firewall config (port 3002). Update WF2b "Notify Luna Adjust" node to use `OPENCLAW_BRIDGE_URL` instead of `OPENCLAW_WEBHOOK_URL`. Ref: `specs/luna-bridge-api.md`, `specs/architecture.md` v3.0. (Completed: 2026-05-11 — Bridge deployed with Caddy HTTPS at nenufar-bridge.duckdns.org. WF2b updated: Compute HMAC for Bridge → Notify Luna via Bridge. OPENCLAW_BRIDGE_URL env var added to n8n docker-compose.)

---

## 2. Oracle Media Processor Integration (New)
*Ref: specs/media_processor_api.md*

- [x] **ip-003.19:** Deploy the Media Processor API on Oracle Cloud VM (`/opt/media-processor/server.js`). (Completed: 2026-05-08)
- [x] **ip-003.20:** Configure OCI firewall (iptables + Security List) to expose port 3001. (Completed: 2026-05-08)
- [x] **ip-003.21:** Implement n8n HTTP Request node that calls `POST /process` on Oracle with HMAC-signed payload. (Completed: 2026-05-08)
- [x] **ip-003.22:** Configure the response handler to extract base64 processed image and pass to Social Publisher. (Completed: 2026-05-10 — Prepare Upload node converts base64 to binary for Drive upload)

---

## 3. Media Processing — Delegated to Oracle (Updated)
*Ref: specs/media_processor_api.md*

- [x] **ip-003.4:** Implement n8n task routing: receive approved payload -> call Oracle Media Processor. (Completed: 2026-05-10 — Build Operations + Oracle Process Image nodes in pipeline)
- [x] **ip-003.5:** Configure Google Drive download URL construction for Oracle (`/uc?export=download&id=FILE_ID`). (Completed: 2026-05-10 — Download Original node in pipeline)
- [x] **ip-003.6:** Image Operations (handled by Oracle Media Processor):
    - Resize to 1080x1350 (portrait), 1080x1080 (square), 1080x566 (landscape), 1080x1920 (story).
    - Apply Nenufar watermark at 35% opacity (bottom-right).
    - Format conversion (HEIC/PNG -> JPEG for Meta API compatibility).
    (Completed: 2026-05-10 — Oracle processes based on post_type from callback data)
- [ ] **ip-003.7:** (Moved to Oracle) Watermark application is now handled by the Oracle Media Processor API.

---

## 3. Caption Approval Pipeline (Rebuilt v3.0)
*Ref: specs/openclaw_system_prompt.txt, workflows/caption-sender.json*

- [x] **ip-003.23:** Implement **Caption + Preview Pipeline (WF2a)**: Cron-triggered workflow (`qoZ77gxnxsCdJDuT`) that finds the latest processed image in Supabase, dispatches to OpenClaw/Luna for caption generation via webhook, waits for caption return (`/webhook/caption-return`), verifies HMAC, stores caption in `pending_captions`, and sends photo + caption + inline buttons to Shirley via Telegram sendPhoto. 11 nodes. (Completed: 2026-05-11 — Rebuilt from scratch. Cron: Mon-Thu 11AM, Fri 4PM, Sat 9AM.)
- [x] **ip-003.24:** Implement **Caption Callback + Publish (WF2b)**: Telegram-triggered workflow (`st8o1iyoPkPdZ9go`) that handles Shirley's button responses. Approve → Build Meta URL → Publish to Instagram + Facebook via Meta Graph API → Mark Published in Supabase → Notify Shirley. Adjust → Notify Luna via webhook. 11 nodes. (Completed: 2026-05-11 — Merged WF3 publish logic. Direct publish without intermediary webhook.)

---

## 4. Social Publishing & Circuit Breakers (New)
*Ref: specs/architecture.md v2.1*

- [x] **ip-003.8:** Implement `Luna Social Publisher Worker`. (Completed: 2026-05-10 — Integrated into Caption Approval Pipeline v2 as Publish to Instagram + Publish to Facebook nodes)
- [x] **ip-003.9:** Configure Instagram Graph API nodes for direct photo/video publishing. (Completed: 2026-05-10 — POST to `/v21.0/{IG_BUSINESS_ACCOUNT_ID}/media` in pipeline)
- [x] **ip-003.10:** Configure Facebook Page API for cross-posting content. (Completed: 2026-05-10 — POST to `/v21.0/{FB_PAGE_ID}/photos` in pipeline)
- [x] **ip-003.15:** **Circuit Breaker:** Implement a counter to detect >5 consecutive Meta API errors. If triggered, pause worker for 30 minutes and notify user via Telegram. (Completed: 2026-05-11 — WF2b now has Check Circuit Breaker → Count Recent Meta Errors → Circuit Open? nodes. Queries monitoring_logs for >5 errors in 5 min. If open → alerts via Telegram, blocks publish. Failed publishes log to monitoring_logs via Log Meta Error → Save Error Log.)

---

## 4. Observability & Feedback (The Scribe)
*Ref: specs/database_schema.sql*

- [ ] **ip-003.11:** Implement `Luna Feedback and Logging Worker`. (Partially done — Mark Published node updates Supabase status, Save Error Log writes to monitoring_logs on Meta API failures. No dedicated logging worker for all steps.)
- [ ] **ip-003.12:** Log every execution step into Supabase `processed_files` and `monitoring_logs`. (Partially done — Mark Published updates status, Save Error Log captures Meta errors. Missing: step-by-step logging for Drive download, Oracle process, Drive upload.)
- [x] **ip-003.13:** Send final success/failure notification to Shirley via Telegram with the live URL. (Completed: 2026-05-10 — Notify Published node in pipeline)

---

## 5. Validation & QA
- [x] **ip-003.16:** Generate Validation Report in `specs/tests/test-ip-003.md`. (Completed: 2026-05-11 — E2E test plan with 8 test sections: Bridge Health, Heartbeat, Caption Cron, Publish Approve/Adjust, Circuit Breaker, Error Handler, Retry Logic.)

---

## Success Criteria
- [ ] All heavy processing (image resizing) happens in worker containers.
- [ ] Supabase correctly reflects the state of every post (Pending -> Published).
- [ ] Version header updated to v1.5 and technical specs in English.
