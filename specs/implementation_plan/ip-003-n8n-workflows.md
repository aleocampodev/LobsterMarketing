# Epic ip-003: The Arms - n8n Workflows

Version: v1.9
<!-- v1.9: Clarified full pipeline flow: Drive → Resize+Watermark → Luna Caption → Telegram Buttons → Publish. Added ip-003.23 and ip-003.24 for caption approval and callback handling. -->
<!-- v1.6: Removed Redis — direct HMAC webhook architecture (ADR-003). ip-003.3 superseded. -->
<!-- v1.5: Added Strategic Scheduling and Pipeline Heartbeat. Clarified Watermark source. -->
<!-- v1.4: Updated architecture reference to v2.1. -->
<!-- v1.3: Reverted all [x] to [ ] — tasks have not been tested/validated yet per DoD -->

**Goal:** Automate the mechanical tasks of fetching, processing, and publishing media using n8n as a lightweight router that delegates heavy media processing to the Oracle Cloud Media Processor API.

**Status:** 🔄 In Progress
**Estimated Effort:** 3 days

---

## 1. Orchestration & Task Routing
*Ref: specs/architecture.md v2.5*

- [ ] **ip-003.1:** Implement the secure `Luna Webhook Receiver` (ID: `EPslgKTzkbLcxdrs`).
- [ ] **ip-003.2:** Configure HMAC signature validation for all incoming requests from the Brain.
- [ ] **ip-003.3:** Configure n8n built-in retry logic with **Exponential Backoff** (3 attempts) for failed executions.
- [ ] **ip-003.14:** **Failed Task Notification:** Configure Luna to notify Shirley via Telegram when a task fails after 3 retry attempts. (ETA: 1h)
- [ ] **ip-003.17:** Implement **Strategic Delay/Scheduling** nodes to queue posts for optimal publishing hours.
- [ ] **ip-003.18:** Implement a **Pipeline Heartbeat** (Cron) to trigger Luna if no content is scheduled for the next 24 hours.

---

## 2. Oracle Media Processor Integration (New)
*Ref: specs/media_processor_api.md*

- [x] **ip-003.19:** Deploy the Media Processor API on Oracle Cloud VM (`/opt/media-processor/server.js`). (Completed: 2026-05-08)
- [x] **ip-003.20:** Configure OCI firewall (iptables + Security List) to expose port 3001. (Completed: 2026-05-08)
- [x] **ip-003.21:** Implement n8n HTTP Request node that calls `POST /process` on Oracle with HMAC-signed payload. (Completed: 2026-05-08)
- [ ] **ip-003.22:** Configure the response handler to extract base64 processed image and pass to Social Publisher.

---

## 3. Media Processing — Delegated to Oracle (Updated)
*Ref: specs/media_processor_api.md*

- [ ] **ip-003.4:** Implement n8n task routing: receive approved payload -> call Oracle Media Processor.
- [ ] **ip-003.5:** Configure Google Drive download URL construction for Oracle (`/uc?export=download&id=FILE_ID`).
- [ ] **ip-003.6:** Image Operations (handled by Oracle Media Processor):
    - Resize to 1080x1350 (portrait), 1080x1080 (square), or 1080x566 (landscape).
    - Apply Nenufar watermark at 15% opacity (bottom-right).
    - Format conversion (HEIC/PNG -> JPEG for Meta API compatibility).
- [ ] **ip-003.7:** (Moved to Oracle) Watermark application is now handled by the Oracle Media Processor API.

---

## 3. Caption Approval Pipeline (New)
*Ref: specs/openclaw_system_prompt.txt*

- [ ] **ip-003.23:** Implement **Caption Approval Sender** workflow: after image is processed, send caption + image preview to Shirley via Telegram with InlineKeyboardMarkup buttons (Aprobar/Ajustar/Descartar).
- [ ] **ip-003.24:** Implement **Callback Handler** workflow: receive Telegram callback_query, route action (approve → publish, adjust → regenerate, reject → cancel).

---

## 4. Social Publishing & Circuit Breakers (New)
*Ref: specs/architecture.md v2.1*

- [ ] **ip-003.8:** Implement `Luna Social Publisher Worker` (ID: `dENMnialkmtgKCo7`).
- [ ] **ip-003.9:** Configure Instagram Graph API nodes for direct photo/video publishing.
- [ ] **ip-003.10:** Configure Facebook Page API for cross-posting content.
- [ ] **ip-003.15:** **Circuit Breaker:** Implement a counter to detect >5 consecutive Meta API errors. If triggered, pause worker for 30 minutes and notify user via Telegram. (ETA: 2h)

---

## 4. Observability & Feedback (The Scribe)
*Ref: specs/database_schema.sql*

- [ ] **ip-003.11:** Implement `Luna Feedback and Logging Worker` (ID: `v7j1Dv1mgO5ZUgmG`).
- [ ] **ip-003.12:** Log every execution step into Supabase `processed_files` and `monitoring_logs`.
- [ ] **ip-003.13:** Send final success/failure notification to Shirley via Telegram with the live URL.

---

## 5. Validation & QA
- [ ] **ip-003.16:** Generate Validation Report in `specs/tests/test-ip-003.md`. (Rule 7.1)

---

## Success Criteria
- [ ] All heavy processing (image resizing) happens in worker containers.
- [ ] Supabase correctly reflects the state of every post (Pending -> Published).
- [ ] Version header updated to v1.5 and technical specs in English.
