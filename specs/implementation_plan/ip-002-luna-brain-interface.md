# Epic ip-002: Luna's Brain & Interface
Version: v1.3
<!-- v1.3: Corrected architecture — Brain is OpenClaw (Luna), not n8n. n8n is the Arms (workers). -->

**Goal:** Implement the central intelligence layer: OpenClaw (Luna) as the AI agent that communicates with Aleja via Telegram, uses Gemini 2.5 Flash + RAG for content generation, and dispatches tasks to n8n workers.

**Status:** 🔨 In Progress
**Estimated Effort:** 4 days

---

## 1. Multi-Agent Architecture (The Brain)
*Ref: specs/architecture.md v1.4*

- [ ] **ip-002.1:** Create the "Luna Multi-Agent System" workflow (ID: `TasuK8cfPqa2ob8O`).
- [ ] **ip-002.2:** Implement specialized Sub-Agents:
    - **Nenufar Brand Agent:** Handles RAG queries and brand memory.
    - **Nenufar Content Agent:** Crafts "Eco Poético" captions using the standard structure.
    - **Nenufar Approval Agent:** Manages task payloads and user validation.
- [ ] **ip-002.3:** Configure "Luna Ultimate Assistant" as the main orchestrator (Gemini 2.5 Flash).
- [ ] **ip-002.4:** Integrate Buffer Window memory for context-aware conversations.

---

## 2. RAG & Brand Assets Integration
*Ref: specs/brand_essence.md & specs/product_catalog.md*

- [ ] **ip-002.5:** Setup Supabase Vector Store (`brand_knowledge` table).
- [ ] **ip-002.6:** Implement the `luna-rag-knowledge-base` ingestion workflow.
- [ ] **ip-002.7:** Standardize the Prompt Bank:
    - Poetic Hooks, Social Impact statements, and Technical data (Czech Beads, Apta Thread, etc.).
- [ ] **ip-002.8:** Implement the 7-day content strategy (Tejiendo Caminos, Poemas Tejidos, etc.).

---

## 3. Telegram Interface (Human-in-the-Loop)
*Ref: specs/telegram_commands.md v1.1*

- [ ] **ip-002.9:** Implement Telegram Webhook Trigger for text and voice messages.
- [ ] **ip-002.10:** Setup Voice-to-Text transcription (Whisper/Gemini).
- [ ] **ip-002.11:** Implement Interactive Approval Buttons:
    - ✅ **Approve:** Dispatches task to Upstash Redis Queue.
    - 🔄 **Adjust:** Triggers feedback loop for caption regeneration.
    - ❌ **Reject:** Cancels the current task.
- [ ] **ip-002.12:** Implement basic command handlers: `/status`, `/process`, `/list`.

---

## 4. Execution & Resilience (New)
*Ref: specs/architecture.md v1.4 - State Recovery*

- [ ] **ip-002.13:** Generate secure HMAC signatures for worker payloads.
- [ ] **ip-002.14:** Create the final JSON task structure with HMAC handshake.
- [ ] **ip-002.15:** Integrate with the `Luna Webhook Receiver` via Upstash Redis.
- [ ] **ip-002.16:** **Self-Healing Heartbeat:** Implement a routine to check for files stuck in `processing` state in Supabase for >1 hour and automatically re-queue them. (ETA: 2h)

---

## 5. Validation & QA
- [ ] **ip-002.17:** Generate Validation Report in `specs/tests/test-ip-002.md`. (Rule 7.1)

---

## Success Criteria
- [ ] Luna responds in Colombian Spanish with the "Eco Poético" tone.
- [ ] No prohibited words (barato, aggressive offers) are generated.
- [ ] All specifications are versioned (v1.2) and technical documentation is in English.
- [ ] Manual E2E tests for the Brain are documented in `specs/tests/`.
