#!/bin/bash

DIFF=$(git diff --cached)

if [ -z "$DIFF" ]; then
  exit 0
fi

echo "🌀 Gemini reviewing..."

AGENTS=$(cat AGENTS.md 2>/dev/null || echo "not found")
SOUL=$(cat SOUL.md 2>/dev/null || echo "not found")
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

REVIEW=$(gemini -p "
You are a senior reviewer for LobsterMarketing (Luna AI - Nenufar).

## AGENTS.md — Operational rules:
$AGENTS

## SOUL.md — Brand identity:
$SOUL

## CRITICAL LANGUAGE RULE:
- ALL repo files (code, docs, specs, tasks) must be in ENGLISH
- Spanish is ONLY for external Instagram/Facebook captions content
- Write all review tasks in ENGLISH

## REVIEW CHECKLIST:
1. Red lines violations? (AGENTS.md section 1.3)
2. n8n workflows complete? (webhook validation, watermark, Supabase logging, Telegram approval)
3. Security issues? (exposed keys, unvalidated webhooks)
4. Language correct? (repo=English, captions=Spanish Colombia)
5. Missing steps in automation flow?

## OUTPUT FORMAT (exact, no variations):
## REVIEW REPORT [$TIMESTAMP]
- Status: APPROVED | NEEDS WORK | BLOCKED
- Summary: <2 sentences>

## PENDING
- [ ] File: <path> | Change: <what and why in English>

(write 'no tasks' if nothing to fix)

## DIFF:
$DIFF
")

echo "" >> droid-tasks.md
echo "---" >> droid-tasks.md
echo "$REVIEW" >> droid-tasks.md

echo "✅ Review saved in droid-tasks.md"
