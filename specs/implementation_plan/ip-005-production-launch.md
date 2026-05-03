# Epic ip-005: Production Launch & Monitoring
Version: v1.2

**Goal:** Formally hand over the n8n system for daily autonomous operation, ensuring production-grade stability and brand voice compliance.

**Status:** ⏳ Pending Final Validation
**Estimated Duration:** 4 days
**Planned Start Date:** 2026-05-05

---

## 1. Quality & Compliance Audit
*Ref: specs/brand_essence.md*

- [ ] **ip-005.1:** Conduct a final audit of RAG-generated content to ensure zero usage of prohibited words (e.g., *barato*, *oferta*).
- [ ] **ip-005.2:** Verify that all published media includes the correct Nenufar watermark.

---

## 2. Infrastructure Hardening
*Ref: specs/architecture.md v1.4*

- [ ] **ip-005.3:** Set up automated daily backups for the Supabase PostgreSQL database.
- [ ] **ip-005.4:** Implement a log rotation/cleanup routine in Supabase to maintain storage limits.
- [ ] **ip-005.5:** Configure monitoring alerts for the n8n Docker container status in GCP.

---

## 3. Official Launch & Handover
- [ ] **ip-005.6:** **Day 0 Launch:** Execute the first scheduled publication from the automated queue.
- [ ] **ip-005.7:** **24-Hour Observation:** Monitor the Proactive Discovery Mode (Heartbeat) to ensure it triggers correctly at 9:00 AM.
- [ ] **ip-005.8:** Project hand-off: Final documentation of workflow IDs and credentials management.

---

## 4. Validation & QA
- [ ] **ip-005.9:** Generate Validation Report in `specs/tests/test-ip-005.md`. (Rule 7.1)

---

## Success Criteria
- [ ] The system operates for 7 consecutive days without manual intervention.
- [ ] All production metrics (publish success rate, engagement logs) are visible in Supabase.
- [ ] Version header updated to v1.2 and technical documentation in English.
- [ ] Actual completion date logged for all tasks.
