#!/bin/bash

DIFF=$(git diff --cached)

if [ -z "$DIFF" ]; then
  exit 0
fi

echo "🌀 Gemini loading project context..."

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

echo "🌀 Gemini reviewing diff with full context..."

TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "pending")

REVIEW=$(gemini -p "
You are a senior reviewer for LobsterMarketing (Luna AI - Nenufar).

================================================================
## FULL PROJECT CONTEXT
================================================================

### AGENTS.md:
$AGENTS

### SOUL.md:
$SOUL

### IDENTITY.md:
$IDENTITY

### MEMORY.md:
$MEMORY

### HEARTBEAT.md:
$HEARTBEAT

### WORKFLOWS_STATE.md:
$WORKFLOWS

### RAG_PROMPTS.md:
$RAG

### specs/:
$SPECS_FILES

### workflows/:
$WORKFLOW_FILES

================================================================
## REVIEW TASKS
================================================================

Analyze the diff and check:
1. RED LINES — Violations of AGENTS.md section 1.3?
2. BRAND VOICE — Consistent with SOUL.md?
3. WORKFLOW LOGIC — n8n workflows complete? (webhook validation, watermark, Supabase logging, Telegram approval)
4. RAG CONSISTENCY — Prompts align with RAG_PROMPTS.md?
5. SPECS ACCURACY — Materials/techniques from product catalog?
6. ARCHITECTURE — Respects n8n-first orchestration?
7. MISSING STEPS — Gaps in automation flow?
8. SECURITY — Exposed keys, unvalidated webhooks?

================================================================
## OUTPUT FORMAT (follow exactly)
================================================================

## REVIEW REPORT [$TIMESTAMP]
- Commit: <commit message>
- Overall status: APPROVED | NEEDS WORK | BLOCKED
- Summary: <2-3 sentences>

## PENDING
- [ ] File: <path> | Change: <specific fix with reason (in Spanish)>

If nothing to fix write exactly:
## PENDING
(no tasks)

================================================================
## IMPORTANT: Language Requirement
================================================================
 All repo files (code, docs, specs) must be in ENGLISH. 
Spanish (Colombia) is ONLY for external Nenufar content (Instagram captions, Facebook captions and comments).
================================================================
## DIFF:
$DIFF
================================================================
")

# Append review cleanly to droid-tasks.md (avoiding duplicate headers)
# Create temp file to process content
TEMP_FILE=$(mktemp)
echo "$REVIEW" > "$TEMP_FILE"

# Check if droid-tasks.md exists and has content
if [ -f droid-tasks.md ]; then
  # Remove the last REVIEW REPORT section to avoid duplicates
  sed -i '/## REVIEW REPORT/,/^(no tasks)$/d' droid-tasks.md
  # Remove duplicate PENDING headers that might exist
  sed -i '/^## PENDING$/{ N; /^## PENDING\n## PENDING$/d; }' droid-tasks.md
fi

# Append separator and new review
echo "" >> droid-tasks.md
echo "---" >> droid-tasks.md
cat "$TEMP_FILE" >> droid-tasks.md

# Clean up
rm "$TEMP_FILE"

echo "✅ Full review saved in droid-tasks.md"
