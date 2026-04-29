# Epic ip-003: The Arms - n8n Workflows
Version: v1.1

**Goal:** Automate the mechanical tasks of fetching, processing, and publishing media using n8n Queue Mode and dedicated worker containers.

**Status:** ✅ Completed / Optimization Phase

---

## 1. Orchestration & Queue Management
*Ref: specs/architecture.md v1.3*

- [x] **ip-003.1:** Implement the secure `Luna Webhook Receiver` (ID: `EPslgKTzkbLcxdrs`).
- [x] **ip-003.2:** Configure HMAC signature validation for all incoming requests from the Brain.
- [x] **ip-003.3:** Setup Redis Queue nodes to delegate processing tasks to workers, ensuring zero-latency for the orchestrator.

---

## 2. Image Processing (The Artisan)
*Ref: specs/implementation_plan/ip-002.6-brand-assets.md*

- [x] **ip-003.4:** Implement `Luna Image Processor Worker v2` (ID: `3JGieW6MBlANnaud`).
- [x] **ip-003.5:** Automate media download from Google Drive using the `media_path` (file_id).
- [x] **ip-003.6:** Image Transformation Logic:
    - Resize to 1080x1350 for Instagram.
    - Resize to 1080x1080 for Facebook.
- [x] **ip-003.7:** Watermarking: Apply the Nenufar logo with 20% opacity at the bottom-right corner.

---

## 3. Social Publishing (The Herald)
*Ref: Meta Graph API Documentation*

- [x] **ip-003.8:** Implement `Luna Social Publisher Worker` (ID: `dENMnialkmtgKCo7`).
- [x] **ip-003.9:** Configure Instagram Graph API nodes for direct photo/video publishing.
- [x] **ip-003.10:** Configure Facebook Page API for cross-posting content.

---

## 4. Observability & Feedback (The Scribe)
*Ref: specs/database_schema.sql*

- [x] **ip-003.11:** Implement `Luna Feedback and Logging Worker` (ID: `v7j1Dv1mgO5ZUgmG`).
- [x] **ip-003.12:** Log every execution step into Supabase `processed_files` and `monitoring_logs`.
- [x] **ip-003.13:** Send final success/failure notification to Aleja via Telegram with the live URL.

---

## Success Criteria
- [x] All heavy processing (image resizing) happens in worker containers.
- [x] Supabase correctly reflects the state of every post (Pending -> Published).
- [x] Version header updated to v1.1 and technical specs in English.
