# Epic ip-002: Luna's Brain & Interface (Orchestrator)
Version: v1.1

**Goal:** Implement the central intelligence layer (Luna) in n8n, integrating the Multi-Agent System, the RAG knowledge base, and the Telegram control interface.

**Status:** ✅ Completed / In Optimization

---

## 1. Multi-Agent Architecture (The Brain)
*Ref: specs/architecture.md v1.3*

- [x] **ip-002.1:** Create the "Luna Multi-Agent System" workflow (ID: `TasuK8cfPqa2ob8O`).
- [x] **ip-002.2:** Implement specialized Sub-Agents:
    - **Nenufar Brand Agent:** Handles RAG queries and brand memory.
    - **Nenufar Content Agent:** Crafts "Eco Poético" captions using the standard structure.
    - **Nenufar Approval Agent:** Manages task payloads and user validation.
- [x] **ip-002.3:** Configure "Luna Ultimate Assistant" as the main orchestrator (Gemini 1.5 Flash).
- [x] **ip-002.4:** Integrate Buffer Window memory for context-aware conversations.

---

## 2. RAG & Brand Assets Integration
*Ref: specs/brand_essence.md & specs/product_catalog.md*

- [x] **ip-002.5:** Setup Supabase Vector Store (`brand_knowledge` table).
- [x] **ip-002.6:** Implement the `luna-rag-knowledge-base` ingestion workflow.
- [x] **ip-002.7:** Standardize the Prompt Bank:
    - Poetic Hooks, Social Impact statements, and Technical data (Czech Beads, Apta Thread, etc.).
- [x] **ip-002.8:** Implement the 7-day content strategy (Tejiendo Caminos, Poemas Tejidos, etc.).

---

## 3. Telegram Interface (Human-in-the-Loop)
*Ref: specs/telegram_commands.md v1.1*

- [x] **ip-002.9:** Implement Telegram Webhook Trigger for text and voice messages.
- [x] **ip-002.10:** Setup Voice-to-Text transcription (Whisper/Gemini).
- [x] **ip-002.11:** Implement Interactive Approval Buttons:
    - ✅ **Approve:** Dispatches task to Upstash Redis Queue.
    - 🔄 **Adjust:** Triggers feedback loop for caption regeneration.
    - ❌ **Reject:** Cancels the current task.
- [x] **ip-002.12:** Implement basic command handlers: `/status`, `/process`, `/list`.

---

## 4. Execution & Dispatch
*Ref: specs/architecture.md - The Handshake*

- [x] **ip-002.13:** Generate secure HMAC signatures for worker payloads.
- [x] **ip-002.14:** Create the final JSON task structure:
  ```json
  {
    "task_id": "uuid",
    "media_path": "drive_id",
    "caption": "Woven poem text",
    "hashtags": ["#nenufar"],
    "platforms": ["instagram", "facebook"]
  }
  ```
- [x] **ip-002.15:** Integrate with the `Luna Webhook Receiver` via Upstash Redis.

---

## Success Criteria
- [x] Luna responds in Colombian Spanish with the "Eco Poético" tone.
- [x] No prohibited words (barato, aggressive offers) are generated.
- [x] All specifications are versioned (v1.1) and technical documentation is in English.
- [x] Manual E2E tests for the Brain are documented in `specs/tests/`.
