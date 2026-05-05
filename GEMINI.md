# GEMINI.md - Fundamental System Mandates

This document contains absolute mandates for the Gemini agent operating in this workspace. These instructions take absolute precedence over general defaults.

## 🌍 Language Mandate
- **Strict English for Technical Files:** All files located in `specs/`, including subdirectories like `specs/implementation_plan/` and `specs/tests/`, must be written exclusively in **English**.
- **Architecture and Rule Documentation:** Any file defining system behavior, agent rules, or project architecture (e.g., `AGENTS.md`, `README.md`) must be in **English**.
- **User-Facing Spanish:** Only content explicitly intended for user interaction (Telegram responses, brand copy templates, product descriptions) should be in **Spanish**.

## 🏗️ Architectural Consistency
- **Brain-Arms Pattern:** Always respect the separation between the "Brain" (OpenClaw/Luna for decision making) and the "Arms" (n8n workers for execution).
- **Templates over RAG:** Prioritize using the `templates_bank.md` for content generation to optimize token usage.

## 📝 Documentation Standard
- **Versioning:** Always include and increment version headers (`Version: v1.x`) in all specification and plan files.
- **Verification:** Every implementation plan must conclude with a verification step that documents empirical proof of the feature's success.
