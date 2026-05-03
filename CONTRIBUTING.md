# How This Repository Works

## Orchestration Stack
- **OpenClaw (Luna)** — AI agent that writes and modifies code/specifications, operating as the Nenufar brand voice
- **Factory Droid** — the IDE agent (Factory) that executes coding tasks and manages the repo
- **Gemini CLI** — reviews each commit automatically
- **n8n** — automation workflows running on VPS

See `specs/architecture.md` for full details on the Brain-Arms Architecture and integration with Google Cloud, Supabase, and Upstash Redis.

## Workflow
1. Factory Droid makes local changes (following OpenClaw/Luna rules from AGENTS.md)
2. `git commit` triggers the Gemini CLI reviewer (pre-commit hook)
3. Gemini writes improvement tasks in `droid-tasks.md`
4. OpenClaw reads `droid-tasks.md` at the start of the next session
5. Approved commits are pushed to VPS via `git push`

## Branch Strategy
- `main` — production (VPS)
- `feature/*` — work in progress (OpenClaw + Factory Droid)
