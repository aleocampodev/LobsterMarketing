# How This Repo Works

## Orchestration Stack
- **Droid Factory** — writes and modifies code/specs
- **Gemini CLI** — reviews every commit automatically
- **n8n** — automation workflows running on VPS

## Workflow
1. Droid Factory makes changes locally
2. `git commit` triggers Gemini CLI reviewer (pre-commit hook)
3. Gemini writes improvement tasks to `droid-tasks.md`
4. Droid reads `droid-tasks.md` at next session start
5. Approved commits are pushed to VPS via `git push`

## Branch Strategy
- `main` — production (VPS)
- `feature/*` — Droid Factory work in progress
