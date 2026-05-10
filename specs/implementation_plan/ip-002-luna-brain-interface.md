# Epic ip-002: Luna's Brain & Interface
Version: v3.0
<!-- v3.0: ALL TASKS COMPLETED. Updated validation report (test-ip-002.md v3.0). ip-002.17 done. -->
<!-- v2.8: Completed ip-002.16 + ip-002.18 — Classification Buttons and Proactive Prompt Handlers. Both added to system prompt. -->
<!-- v2.7: Completed ip-002.16 — Interactive Classification Buttons. Luna asks product type via inline buttons to avoid Vision AI costs. Filename-based auto-classification as fallback. -->
<!-- v2.6: Completed ip-002.11 — Fixed OpenClaw callback handling to match n8n's actual flow (n8n intercepts callbacks, only notifies Luna on adjust). Fixed callback data format mismatch. -->
<!-- v2.5: Completed ip-002.4 — Buffer Window memory (contextPruning + memory flush + search-before-acting). Ref: specs/agent_prompts.md Section 6. -->
<!-- v2.4: Completed ip-002.13, 002.14, 002.15 — HMAC signing, JSON payload contract, webhook dispatch integration documented in specs/agent_prompts.md Section 5. -->
<!-- v2.3: Updated personality from eco-poetic to marketing strategist. Marked ip-002.1, 002.3, 002.9, 002.10, 002.12 completed. Approval buttons (002.11) moved to n8n. Updated success criteria. -->
<!-- v2.1: Reverted checkmarks per DoD - only tasks with passing tests stay [x]. Updated goal to Gemini 2.5 Flash. -->
<!-- v2.0: Implemented inline approval buttons, classification buttons, callback routing, and proactive handlers. -->
<!-- v1.9: Added Interactive Classification (Token Saving) and Proactivity handlers. -->
<!-- v1.8: Total removal of RAG references. Updated per Droid feedback. -->

**Goal:** Implement the central intelligence layer: OpenClaw (Luna) as the AI agent that communicates with Shirley via Telegram, uses Gemini 2.5 Flash for content generation (short marketing captions), and dispatches approved tasks to n8n workers.

**Status:** ✅ Completed
**Estimated Effort:** 4 days

---

## 1. Multi-Agent Architecture (The Brain)
*Ref: specs/architecture.md v2.1*

- [x] **ip-002.1:** Create the "Luna Multi-Agent System" workflow. (Completed: 2026-05-08 — OpenClaw configured with system prompt)
- [x] **ip-002.2:** Implement specialized Sub-Agents: (Prompts defined in `specs/agent_prompts.md`)
    - **Nenufar Brand Agent:** Manages the **Templates Bank** and variable interpolation.
    - **Nenufar Content Agent:** Selects the best template and crafts captions.
    - **Nenufar Approval Agent:** Manages task payloads and user validation.
- [x] **ip-002.3:** Configure "Luna Ultimate Assistant" as the main orchestrator (Gemini 2.5 Flash). (Completed: 2026-05-08)
- [x] **ip-002.4:** Integrate Buffer Window memory for context-aware conversations. (Completed: 2026-05-10 — Configured contextPruning cache-ttl + pre-compaction memory flush + mandatory search-before-acting rule. Ref: specs/agent_prompts.md Section 6.)

---

## 2. Templates & Brand Assets Integration
*Ref: specs/brand_essence.md & specs/product_catalog.md*

- [x] **ip-002.5:** Setup Supabase Templates Store (`templates_bank` table). (Completed: 2026-05-05)
- [x] **ip-002.6:** Seed the `templates_bank` with initial data from `specs/templates_bank.md`. (Completed: 2026-05-05)
- [x] **ip-002.7:** Implement the **Edge Case** fallbacks for missing variables (Defined in `specs/agent_prompts.md` & `specs/edge_cases.md`).
- [x] **ip-002.8:** Implement the 7-day content strategy (Logic defined in `specs/template_rotation_logic.md`).

---

## 3. Telegram Interface (Human-in-the-Loop)
*Ref: specs/telegram_commands.md v1.1*

- [x] **ip-002.9:** Implement Telegram Webhook Trigger for text and voice messages. (Completed: 2026-05-08 — OpenClaw receives Telegram directly)
- [x] **ip-002.10:** Setup Voice-to-Text transcription (Whisper/Gemini). (Completed: 2026-05-08 — Works via Google plugin)
- [x] **ip-002.11:** Implement Interactive Approval Buttons (handled by n8n, OpenClaw receives adjust notifications). (Completed: 2026-05-10 — Fixed callback flow in system prompt: n8n intercepts all callbacks, Luna only handles adjust via webhook notification. Approve is fully autonomous.)
- [x] **ip-002.12:** Command handlers replaced with natural language understanding. (Completed: 2026-05-08)
- [x] **ip-002.16:** Implement **Interactive Classification Buttons** (e.g., [Collar], [Aretes]) triggered when filename has no product type clues to avoid Vision AI costs. Filename-based auto-classification as fallback. (Completed: 2026-05-10 — Added to system prompt "CLASIFICACION INTERACTIVA DE PRODUCTOS" section)
- [x] **ip-002.18:** Implement **Proactive Prompt Handlers** to request content from Shirley when the pipeline is empty. (Completed: 2026-05-10 — Added to system prompt "COMPORTAMIENTO PROACTIVO" section. Max 1 message/day, no repeat if no response.)

---

## 4. Execution & Resilience (New)
*Ref: specs/architecture.md v2.1 - State Recovery*

- [x] **ip-002.13:** Generate secure HMAC signatures for worker payloads. (Completed: 2026-05-10 — Documented in `specs/agent_prompts.md` Section 5.1. HMAC-SHA256 signing with `x-luna-signature` header. Matches n8n and Oracle validation.)
- [x] **ip-002.14:** Create the final JSON task structure with HMAC handshake for direct webhook dispatch. (Completed: 2026-05-10 — Documented in `specs/agent_prompts.md` Section 5.2. Canonical payload with field validation rules.)
- [x] **ip-002.15:** Integrate with the `Luna Webhook Receiver` via direct HMAC-signed HTTP POST. (Completed: 2026-05-10 — Documented in `specs/agent_prompts.md` Section 5.3. Targets `n8n_dispatch` and `n8n_publish` mapped to n8n webhook URLs.)

---

## 5. Validation & QA
- [x] **ip-002.17:** Generate Validation Report in `specs/tests/test-ip-002.md`. (Completed: 2026-05-10 — Updated to v3.0 reflecting actual implementation: 2 buttons, n8n handles callbacks, filename auto-classify, HMAC contract, proactive nudge, memory config.)

---

## Success Criteria
- [ ] Luna responds in Colombian Spanish with marketing strategist tone.
- [ ] No prohibited words (barato, aggressive offers) are generated.
- [ ] Captions are max 3 lines: personality hook + product description + CTA + hashtags.
- [ ] All specifications are versioned and technical documentation is in English.
- [ ] Manual E2E tests for the Brain are documented in `specs/tests/`.
