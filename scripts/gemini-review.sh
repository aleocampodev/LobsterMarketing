#!/bin/bash

DIFF=$(git diff --cached)

if [ -z "$DIFF" ]; then
  exit 0
fi

echo "�� Gemini reviewing diff..."

gemini -p "
You are a senior reviewer for the LobsterMarketing project (Luna AI - Nenufar).

Review this diff against AGENTS.md and SOUL.md rules.

If you find issues or improvements needed, write them as tasks for Droid Factory
in this EXACT format:

## PENDING
- [ ] File: <path> | Change: <specific description>

If nothing needs improvement write only:
## PENDING
(no tasks)

DIFF:
$DIFF
" >> droid-tasks.md

echo "✅ Review saved in droid-tasks.md"
