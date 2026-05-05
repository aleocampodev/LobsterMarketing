# Epic ip-003: The Arms - n8n Workflows

Version: v1.3
<!-- v1.3: Reverted all [x] to [ ] — tasks have not been tested/validated yet per DoD -->

**Goal:** Automate the mechanical tasks of fetching, processing, and publishing media using n8n Queue Mode and dedicated worker containers.

**Status:** 🔄 In Progress
**Estimated Effort:** 3 days

---

## 1. Orchestration & Queue Management
*Ref: specs/architecture.md v1.4*

- [ ] **ip-003.1:** Implement the secure `Luna Webhook Receiver` (ID: `EPslgKTzkbLcxdrs`).
- [ ] **ip-003.2:** Configure HMAC signature validation for all incoming requests from the Brain.
- [ ] **ip-003.3:** Setup Redis Queue nodes with **Exponential Backoff** (3 attempts).
- [ ] **ip-003.14:** **DLQ Notification:** Configure Luna to notify Shirley via Telegram when a task is moved to the `dead_letter_queue` after 3 failed attempts. (ETA: 1h)

---

## 2. Image Processing (The Artisan)
*Ref: specs/implementation_plan/ip-002.6-brand-assets.md*

- [ ] **ip-003.4:** Implement `Luna Image Processor Worker v2` (ID: `3JGieW6MBlANnaud`).
- [ ] **ip-003.5:** Automate media download from Google Drive using the `media_path` (file_id).
- [ ] **ip-003.6:** Image Transformation Logic:
    - Resize to 1080x1350 for Instagram.
    - Resize to 1080x1080 for Facebook.
- [ ] **ip-003.7:** Watermarking: Apply the Nenufar logo with 20% opacity at the bottom-right corner.

---

## 3. Social Publishing & Circuit Breakers (New)
*Ref: specs/architecture.md v1.4*

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
- [ ] Version header updated to v1.3 and technical specs in English.
