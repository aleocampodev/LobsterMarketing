# Epic ip-004: Integration, Spike & E2E Testing

Goal: Ensure the Brain and Arms communicate securely and reliably.

## Tasks
- [ ] **ip-004.1:** Execute `specs/openclaw-n8n-integration-spike.md` (Test webhook signature validation between Oracle and GCP).
- [ ] **ip-004.2:** End-to-End Test 1 (Static Image): Upload ring photo -> Approve in Telegram -> Verify IG/FB post.
- [ ] **ip-004.3:** End-to-End Test 2 (Video/Reel): Upload workshop video -> Approve in Telegram -> Verify Reel post.
- [ ] **ip-004.4:** Tune n8n memory usage (`max-old-space-size=512MB`) and monitor Upstash Redis queue depth during tests.
