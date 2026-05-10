# ADR 005: Caption Approval Pipeline — Full Preview with Token Optimization

Version: v1.0

## 1. Context and Problem

The Nenufar system generates Instagram/Facebook captions using Luna (OpenClaw + Gemini 2.5 Flash). Previously, when Luna generated a caption, she only sent **text** to Shirley via Telegram — no photo preview, no interactive buttons. Shirley had to imagine how the post would look without seeing the actual watermarked image alongside the caption.

The system needed:
1. A way for Shirley to see the **complete publication** (processed photo + caption + hashtags) before approving.
2. Interactive buttons for approve/adjust (previously designed as 3 buttons: approve/adjust/reject).
3. Token efficiency, since the system uses **Gemini 2.5 Flash Free Tier** with strict rate limits (RPM/TPM).

Additionally, the original design had 3 buttons (✅/🔄/❌), but the "reject" option was redundant — if Shirley doesn't like it, she naturally wants to adjust it, not cancel silently. And the "adjust" flow was open-ended, risking high token consumption from multiple regeneration loops.

## 2. Considered Options

### 2.1 Who sends the preview?

1. **Luna (Brain) sends preview:** Luna sends photo + caption + buttons directly via Telegram plugin. Simpler, but violates Brain-Arms separation (Luna should think, not render UI).
2. **n8n (Arms) sends preview:** Luna dispatches caption payload to n8n. n8n fetches the processed photo from Drive `/Procesadas/` and sends it via `Telegram sendPhoto` with InlineKeyboardMarkup. Maintains clean architecture.

### 2.2 How many buttons?

1. **3 buttons (✅ Publicar / 🔄 Ajustar / ❌ Descartar):** Original design. "Descartar" was redundant — if Shirley doesn't like it, she adjusts.
2. **2 buttons (✅ Publicar / ✏️ Ajustar):** Simpler. If she adjusts and still doesn't like it, she adjusts again. No silent cancel.

### 2.3 How to handle adjustment feedback?

1. **Open-ended question:** "What would you like to change?" → Shirley responds freely → Luna regenerates. High token cost (unstructured input → more processing).
2. **Predefined options:** "What to change? 1️⃣ Tone (elegant/casual) 2️⃣ Focus (product/emotion) 3️⃣ Start over" → Structured response → faster regeneration, fewer tokens.
3. **No feedback loop:** Luna regenerates automatically with a different template. No user input. Lowest tokens but poor UX.

## 3. Decision

We decided on:

- **n8n sends the preview** (Option 2.1-B) — maintains Brain-Arms architecture.
- **2 buttons** (Option 2.2-B) — simpler UX, no redundant "cancel".
- **Predefined options + max 2 adjustments** (Option 2.3-B) — structured feedback with a hard cap to prevent token drain.

### 3.1 Token Optimization Strategy

| Technique | Impact |
|---|---|
| Predefined adjustment options (1/2/3) | ~30% fewer tokens per adjustment (structured input) |
| Ultra-short regeneration prompt | ~60% fewer tokens vs full system prompt on regeneration |
| Max 2 adjustments per caption | Prevents runaway token consumption |
| Templates Bank (already in place) | Base generation is already optimized |

### 3.2 Estimated Token Consumption

| Scenario | Before optimization | After optimization |
|---|---|---|
| Generation (no adjust) | ~1,000 | ~1,000 (unchanged) |
| 1 adjustment | ~2,300 total | ~1,500 total |
| 2 adjustments (max) | ~3,600 total | ~2,000 total |
| **Savings per adjusted post** | | **~35-45%** |

## 4. Justification

* **Full Preview:** Shirley sees exactly what will be published (watermarked photo + caption + hashtags). Reduces approval friction and prevents publishing errors.
* **2 Buttons:** Simpler mental model. "Publicar" or "Ajustar". No ambiguity.
* **Structured Feedback:** Predefined options (tone/focus/start over) give Luna clear direction → shorter prompts → less tokens → faster responses on free tier.
* **Hard Cap (2 adjustments):** Prevents infinite loops that drain free tier quotas. After 2 adjustments, Luna offers to write the caption verbatim from Shirley's exact words.
* **Brain-Arms Separation:** Luna generates text (Brain). n8n renders the preview (Arms). Clean responsibilities.

## 5. Consequences

* **New n8n Workflow:** The "Caption Approval Pipeline" workflow must be deployed in n8n (file: `workflows/caption-approval-pipeline.json`). It requires Telegram Bot API credentials.
* **Adjustment Loop Goes Through n8n:** When Shirley presses "✏️ Ajustar", n8n notifies Luna via webhook → Luna asks Shirley → Shirley responds → Luna regenerates → Luna dispatches new payload to n8n → n8n sends new preview. This is a round-trip but preserves architecture.
* **Photo Source:** The preview photo comes from Google Drive `/Procesadas/` (already processed with watermark by Oracle Media Processor). The Drive download URL is used directly in Telegram `sendPhoto`.
* **Free Tier Rate Limits:** With optimization, a typical post (1 generation + 1 adjustment) consumes ~1,500 tokens total, well within Gemini 2.5 Flash free tier limits (15 RPM, 1M TPM).
* **No Cancel Button:** If Shirley truly wants to cancel, she can ignore the message or tell Luna "cancela" in the chat after pressing Ajustar.

## 6. Impact on Other Documents

| Document | Change |
|---|---|
| `workflows/caption-approval-pipeline.json` | New — n8n workflow with 10 nodes |
| `specs/openclaw_system_prompt.txt` | Updated dispatch section + new "COMO AJUSTAR" section |
| `specs/agent_prompts.md` | Updated Approval Agent (v1.1) — 2 buttons, predefined options, max 2 adjustments |
| `specs/architecture.md` | Updated (v2.8 → v2.9) — approval flow, lifecycle states, diagrams |
| `specs/implementation_plan/ip-003-n8n-workflows.md` | Updated (v1.9 → v2.0) — ip-003.23 and ip-003.24 marked complete |

## 7. Status
Accepted
