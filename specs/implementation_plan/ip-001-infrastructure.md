# Epic ip-001: Infrastructure & Core Setup
Version: v1.4

**Goal:** Establish the foundational servers and databases required for the Brain-Arms Architecture.
<!-- v1.4: Removed Redis — n8n switched to Regular Mode (ADR-003). ip-001.4 superseded. -->
<!-- v1.3: Marked all tasks and DoD as complete per user confirmation. -->

## Tasks
- [x] **ip-001.1:** Provision Google Cloud e2-micro instance for the central n8n instance.
- [x] **ip-001.2:** Deploy n8n via Docker Compose on GCP with Regular Mode.
- [x] **ip-001.3:** Setup Supabase project (PostgreSQL).
- [x] ~~**ip-001.4:** Configure Upstash Redis cluster for n8n worker queue management.~~ (Superseded by ADR-003 — Redis removed from architecture.)
- [x] **ip-001.5:** Setup DNS and SSL certificates (`n8n-stack-prod-dev.duckdns.org`).
- [x] **ip-001.6:** Define Google Drive folder hierarchy (Input, Processing, Published).

## Definition of Done Verification
- [x] **Versioning:** Header updated to v1.2.
- [x] **Language:** Technical specs in English.
- [x] **Manual E2E Test:** Created in `specs/tests/test-ip-001.md`.
