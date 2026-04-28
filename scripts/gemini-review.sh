#!/bin/bash

DIFF=$(git diff --cached)

if [ -z "$DIFF" ]; then
  exit 0
fi

echo "🌀 Gemini reviewing..."

AGENTS=$(cat AGENTS.md)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

REVIEW=$(gemini -p "
You are a senior reviewer for LobsterMarketing (Luna AI - Nenufar).

## YOUR RULES BASE — AGENTS.md:
$AGENTS

## ADDITIONAL RULES:
- Repo files must be in ENGLISH only
- Spanish is ONLY for Instagram/Facebook external captions
- n8n workflows must always have: webhook validation, watermark, Supabase logging, Telegram approval
- Never expose API keys

## OUTPUT FORMAT (exact):
## REVIEW REPORT [$TIMESTAMP]
- Status: APPROVED | NEEDS WORK | BLOCKED
- Summary: <2 sentences>

## PENDING
- [ ] File: <path> | Change: <what and why>

(write 'no tasks' if nothing to fix)

## DIFF:
$DIFF
")

echo "" >> droid-tasks.md
echo "---" >> droid-tasks.md
echo "$REVIEW" >> droid-tasks.md

echo "✅ Review saved in droid-tasks.md"