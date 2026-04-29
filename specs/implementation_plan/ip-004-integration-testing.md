# Epic ip-004: Integration & E2E Testing
Version: v1.1

**Goal:** Ensure the Brain (Orchestrator) and the Arms (Workers) communicate securely and reliably via the Redis broker, ensuring 100% data integrity.

**Status:** ⏳ Pending Implementation

---

## 1. Internal Integration Spike
- [ ] **ip-004.1:** Validate HMAC signature handshake between the Multi-Agent System and the Webhook Receiver.
- [ ] **ip-004.2:** Verify that task payloads are correctly pushed to and pulled from the Upstash Redis queue.
- [ ] **ip-004.3:** Test system behavior when a worker is offline (Task persistence in Redis).

---

## 2. End-to-End (E2E) Functional Tests
- [ ] **ip-004.4:** **Test 1 - Static Post:** Upload image -> Approve in Telegram -> Verify Watermark & Publish on IG/FB.
- [ ] **ip-004.5:** **Test 2 - Narrative Accuracy:** Verify that the generated caption includes the artisan mother's story retrieved via RAG.
- [ ] **ip-004.6:** **Test 3 - Error Handling:** Force a Meta API failure and verify that Luna notifies the error via Telegram.

---

## 3. Engagement System Tests
- [ ] **ip-004.7:** **Test 4 - Automated Reply:** Post a mock comment and verify that Luna responds with the "Eco Poético" tone within 30 minutes.

---

## Success Criteria
- [ ] Manual E2E tests for every scenario are documented in `specs/tests/`.
- [ ] Version header updated to v1.1 and technical documentation in English.
