# Epic ip-002: Luna's Brain & Interface
Version: v2.2
<!-- v2.2: Removed Redis/Upstash — direct HMAC webhook architecture (ADR-003). -->
<!-- v2.1: Reverted checkmarks per DoD - only tasks with passing tests stay [x]. Updated goal to Gemini 2.5 Flash. -->
<!-- v2.0: Implemented inline approval buttons, classification buttons, callback routing, and proactive handlers. -->
<!-- v1.9: Added Interactive Classification (Token Saving) and Proactivity handlers. -->
<!-- v1.8: Total removal of RAG references. Updated per Droid feedback. -->

**Goal:** Implement the central intelligence layer: OpenClaw (Luna) as the AI agent that communicates with Shirley via Telegram, uses Gemini 2.5 Flash + **Templates Bank** for content generation, and dispatches tasks to n8n workers.

**Status:** 🔨 In Progress
**Estimated Effort:** 4 days

---

## 1. Multi-Agent Architecture (The Brain)
*Ref: specs/architecture.md v2.1*

- [ ] **ip-002.1:** Create the "Luna Multi-Agent System" workflow.
- [x] **ip-002.2:** Implement specialized Sub-Agents: (Prompts defined in `specs/agent_prompts.md`)
    - **Nenufar Brand Agent:** Manages the **Templates Bank** and variable interpolation.
    - **Nenufar Content Agent:** Selects the best template and crafts "Eco Poético" captions.
    - **Nenufar Approval Agent:** Manages task payloads and user validation.
- [ ] **ip-002.3:** Configure "Luna Ultimate Assistant" as the main orchestrator (Gemini 2.5 Flash).
- [ ] **ip-002.4:** Integrate Buffer Window memory for context-aware conversations.

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

- [ ] **ip-002.9:** Implement Telegram Webhook Trigger for text and voice messages.
- [ ] **ip-002.10:** Setup Voice-to-Text transcription (Whisper/Gemini).
- [ ] **ip-002.11:** Implement Interactive Approval Buttons:
    - ✅ **Approve:** Dispatches task via direct HMAC webhook to n8n.
    - 🔄 **Adjust:** Triggers feedback loop for caption regeneration.
    - ❌ **Reject:** Cancels the current task.
- [ ] **ip-002.12:** Implement basic command handlers: `/status`, `/process`, `/list`.
- [ ] **ip-002.16:** Implement **Interactive Classification Buttons** (e.g., [Collar], [Aretes]) triggered by n8n media detection to avoid Vision AI costs.
- [ ] **ip-002.18:** Implement **Proactive Prompt Handlers** to request content from Shirley when the pipeline is empty.

---

## 4. Execution & Resilience (New)
*Ref: specs/architecture.md v2.1 - State Recovery*

- [ ] **ip-002.13:** Generate secure HMAC signatures for worker payloads.
- [ ] **ip-002.14:** Create the final JSON task structure with HMAC handshake for direct webhook dispatch.
- [ ] **ip-002.15:** Integrate with the `Luna Webhook Receiver` via direct HMAC-signed HTTP POST.

---

## 5. Validation & QA
- [ ] **ip-002.17:** Generate Validation Report in `specs/tests/test-ip-002.md`. (Rule 7.1)

---

## Success Criteria
- [ ] Luna responds in Colombian Spanish with the "Eco Poético" tone.
- [ ] No prohibited words (barato, aggressive offers) are generated.
- [ ] All specifications are versioned (v1.9) and technical documentation is in English.
- [ ] Manual E2E tests for the Brain are documented in `specs/tests/`.
