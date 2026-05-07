# Implementation Plan Index: Nenufar Marketing Automation
Version: v1.8
<!-- v1.8: Removed Redis/Upstash — direct HMAC webhook architecture (ADR-003). -->
<!-- v1.7: Added Proactive Hybrid Flow (v2.2) to Overview and Change Log. -->
<!-- v1.6: Updated architecture description to include Supervisor Pattern. -->
<!-- v1.5: Optimization: Replaced RAG with Templates Bank. -->

## 🎯 Overview
Automated marketing system for Nenufar with a **Brain-Arms architecture**: OpenClaw (Luna) is the Brain that thinks and communicates via Telegram, and n8n Workers are the Arms that execute mechanical tasks.

**Architecture:** Brain-Arms Pattern (Supervisor & Modular Sub-workflows)
- **Brain:** OpenClaw (Luna) — AI agent using Gemini 2.5 Flash + Templates Bank, communicating with Shirley via Telegram for strategy, copywriting, and human-in-the-loop approval. Operates under a **Supervisor Pattern** orchestrating specialized sub-workflows.
- **Arms:** n8n Workers — Specialized sub-workflows for image processing, Meta publishing, and centralized logging, triggered via direct HMAC webhooks. **Strategic Scheduling** delays post publication until peak engagement hours.
- **Hybrid Flow:** Token-efficient interactive classification (Human-in-the-Loop) and proactive pipeline monitoring via Heartbeats.

---

## 📚 Epics

### ✅ ip-001: Infrastructure Setup
- **File:** `ip-001-infrastructure.md`
- **Status:** Completed
- **Goal:** Configure cloud infrastructure (GCP, Supabase).

---

### 🔄 ip-002: Luna's Brain & Interface
- **File:** `ip-002-luna-brain-interface.md`
- **Status:** In Progress
- **Goal:** Implement the intelligence layer: OpenClaw (Luna) as the cognitive agent communicating via Telegram, with Templates Bank and approval workflow.

---

### 🔄 ip-003: The Arms - n8n Workflows
- **File:** `ip-003-n8n-workflows.md`
- **Status:** In Progress
- **Goal:** Automate mechanical tasks: download from Drive, process (watermark/resize), and publish.

---

### ⏳ ip-004: Integration Testing & Robustness
- **File:** `ip-004-integration-testing.md`
- **Status:** Pending
- **Goal:** Implement error handling and manual end-to-end (E2E) validation protocols.

---

### ⏳ ip-005: Production Launch
- **File:** `ip-005-production-launch.md`
- **Status:** Pending
- **Goal:** Deploy the system to production and establish monitoring.

---

### ✅ ip-006: Supabase Improvements
- **File:** `ip-006-supabase-improvements.md`
- **Status:** Completed
- **Goal:** Fix schema omissions, implement log rotation, and self-healing heartbeat.

---

## 📝 Architectural Change Log
**2026-05-07:** Removed Upstash Redis (ADR-003). Switched n8n from Queue Mode to Regular Mode. Brain→Arms communication is now direct HMAC webhook. Reduces complexity and RAM usage on e2-micro.
**2026-05-06:** Adopted **Proactive Hybrid Flow** (v2.2): Token-efficient interactive classification via Telegram and strategic scheduling (n8n delay) for optimal engagement.
**2026-05-05:** Adopted **Supervisor Pattern** (v2.1): Modular architecture with a main Supervisor workflow delegating to specialized sub-workflows (Brand, Content, Approval).
**2026-05-03:** Optimization: Shifted from RAG to Templates Bank (v2.1) to reduce token consumption. OpenClaw (Luna) Brain updated to handle template interpolation.
**2026-05-03:** Architecture corrected to Brain-Arms pattern (v2.0). OpenClaw (Luna) = Brain via Telegram. n8n = Arms (workers). Model updated to Gemini 2.5 Flash.
**2026-04-29:** Updated Architecture to v1.4 with Resilience patterns (DLQ, Circuit Breaker, Self-Healing).
**2026-04-27:** Full migration to n8n-First Architecture. OpenClaw Brain (Oracle Cloud/Python) deprecated. Luna Multi-Agent System v2 active. Specialized Worker workflows active.
