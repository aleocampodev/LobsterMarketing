#!/bin/bash

DIFF=$(git diff --cached)

if [ -z "$DIFF" ]; then
  exit 0
fi

echo "🤖 Gemini loading project context..."

# Core files
AGENTS=$(cat AGENTS.md 2>/dev/null || echo "not found")
SOUL=$(cat SOUL.md 2>/dev/null || echo "not found")
MEMORY=$(cat MEMORY.md 2>/dev/null || echo "not found")
IDENTITY=$(cat IDENTITY.md 2>/dev/null || echo "not found")
HEARTBEAT=$(cat HEARTBEAT.md 2>/dev/null || echo "not found")
WORKFLOWS=$(cat WORKFLOWS_STATE.md 2>/dev/null || echo "not found")
RAG=$(cat RAG_PROMPTS.md 2>/dev/null || echo "not found")

# Specs directory
SPECS_FILES=""
for f in specs/*.md; do
  [ -f "$f" ] && SPECS_FILES="$SPECS_FILES\n\n### $f:\n$(cat $f)"
done

# Workflows directory
WORKFLOW_FILES=""
for f in workflows/*.md workflows/*.json; do
  [ -f "$f" ] && WORKFLOW_FILES="$WORKFLOW_FILES\n\n### $f:\n$(cat $f)"
done

echo "🤖 Gemini reviewing diff with full context..."

gemini -p "
You are a senior AI systems reviewer for LobsterMarketing.
This is a marketing automation system for Nenufar — Colombian ancestral jewelry brand.

================================================================
## FULL PROJECT CONTEXT — READ BEFORE REVIEWING
================================================================

### AGENTS.md (Operational rules & red lines):
$AGENTS

---

### SOUL.md (Brand identity & voice):
$SOUL

---

### IDENTITY.md:
$IDENTITY

---

### MEMORY.md (System config & milestones):
$MEMORY

---

### HEARTBEAT.md:
$HEARTBEAT

---

### WORKFLOWS_STATE.md:
$WORKFLOWS

---

### RAG_PROMPTS.md:
$RAG

---

### specs/ directory:
$SPECS_FILES

---

### workflows/ directory:
$WORKFLOW_FILES

================================================================
## YOUR REVIEW TASKS
================================================================

Analyze the diff below against ALL the context above and check:

1. RED LINES — Does anything violate AGENTS.md section 1.3?
2. BRAND VOICE — Is tone consistent with SOUL.md? (poetic, warm, Colombian Spanish)
3. WORKFLOW LOGIC — Are n8n workflows complete? (webhook validation, watermark, Supabase logging, Telegram approval)
4. RAG CONSISTENCY — Do prompts align with RAG_PROMPTS.md templates?
5. SPECS ACCURACY — Are materials/techniques from the actual product catalog?
6. ARCHITECTURE — Does it respect the n8n-first orchestration pattern?
7. MISSING STEPS — Are there gaps in the automation flow?
8. SECURITY — Any exposed keys, unvalidated webhooks, or missing signatures?

================================================================
## OUTPUT FORMAT
================================================================

Write a report and then tasks for Droid Factory:

## REVIEW REPORT
- Overall status: APPROVED | NEEDS WORK | BLOCKED
- Summary: <2-3 sentences>

## PENDING
- [ ] File: <path> | Change: <specific fix with reason>

(If nothing to fix write '(no tasks)' under PENDING)

================================================================
## DIFF TO REVIEW:
$DIFF
================================================================
" >> droid-tasks.md

echo "✅ Full review saved in droid-tasks.md"
