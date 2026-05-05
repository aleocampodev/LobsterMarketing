# Epic ip-004: Integration & E2E Testing
Version: v1.2

**Goal:** Ensure the Brain (Orchestrator) and the Arms (Workers) communicate securely and reliably via the Redis broker, ensuring 100% data integrity.

**Status:** ⏳ Pending Implementation
**Estimated Duration:** 3 days
**Planned Start Date:** 2026-05-01

---

## 1. Internal Integration Spike
*Ref: specs/architecture.md v1.4 - HMAC Handshake*

- [ ] **ip-004.1:** Validate HMAC signature handshake between the Multi-Agent System and the Webhook Receiver.
- [ ] **ip-004.2:** Verify that task payloads are correctly pushed to and pulled from the Upstash Redis queue.
- [ ] **ip-004.3:** Test system behavior when a worker is offline (Task persistence in Redis).

---

## 2. End-to-End (E2E) Functional Tests
*Ref: AGENTS.md - Rule 7.1*

- [ ] **ip-004.4:** **Test 1 - Static Post:** Upload image -> Approve in Telegram -> Verify Watermark & Publish on IG/FB.
- [ ] **ip-004.5:** **Test 2 - Narrative Accuracy:** Verify that the generated caption includes the artisan mother's story using the appropriate template from `templates_bank`.
- [ ] **ip-004.6:** **Test 3 - Error Handling:** Force a Meta API failure and verify that Luna notifies the error via Telegram.

---

## 3. Engagement System Tests
- [ ] **ip-004.7:** **Test 4 - Automated Reply:** Post a mock comment and verify that Luna responds with the "Eco Poético" tone within 30 minutes.

---

## 4. Resilience Testing (New)
*Ref: specs/architecture.md v1.4 - Resilience*

- [ ] **ip-004.8:** **Test 5 - DLQ Flow:** Mock 3 consecutive worker failures and verify task is moved to `dead_letter_queue` with Telegram notification. (ETA: 2h)
- [ ] **ip-004.9:** **Test 6 - Circuit Breaker:** Mock 5 Meta API errors and verify that the Social Publisher worker pauses for 30m. (ETA: 2h)
- [ ] **ip-004.10:** **Test 7 - Self-Healing:** Manually set a file to `processing` in Supabase and verify the Heartbeat re-queues it after 1 hour. (ETA: 2h)

---

## 5. Validation & QA
- [ ] **ip-004.11:** Generate Validation Report in `specs/tests/test-ip-004.md`. (Rule 7.1)

---

## Success Criteria
- [ ] Manual E2E tests for every scenario are documented in `specs/tests/`.
- [ ] Version header updated to v1.2 and technical documentation in English.
- [ ] Actual completion date logged for all tasks.
