# Validation Report: Luna Brain Interface (ip-002)
Version: v3.0
<!-- v3.0: Updated to reflect actual implementation — 2 buttons (not 3), n8n handles callbacks, classify via filename first, proactive when pipeline empty, HMAC contract in agent_prompts.md Section 5. -->
<!-- v2.1: Removed Redis references — direct HMAC webhook architecture (ADR-003). -->

## 1. Objective
Validate the integration between the OpenClaw (Luna) brain and the user interface (Telegram), ensuring that Luna can receive messages, process them using the Brain-Arms pattern with the Templates Bank, dispatch signed tasks to n8n workers, handle adjust callbacks, classify products, and act proactively when the pipeline is empty.

## 2. Validation Summary
- **Status:** [ ] Ready for Manual Verification
<!-- All test procedures defined. Ready for manual E2E execution by Shirley. -->
- **Brain Integration:** [ ] Confirmed (Gemini 2.5 Flash)
- **Voice Consistency:** [ ] Confirmed (Marketing Strategist / Spanish Colombia)
- **Approval Workflow:** [ ] Confirmed (2 buttons: ✅ Publicar / ✏️ Ajustar, handled by n8n)
- **Classification Workflow:** [ ] Confirmed (filename auto-classify + fallback buttons)
- **Callback Routing:** [ ] Confirmed (n8n intercepts all callbacks, notifies Luna on adjust only)
- **Dispatch Mechanism:** [ ] Confirmed (HMAC-SHA256 + Direct Webhook to n8n)
- **Proactive Nudge:** [ ] Confirmed (when pipeline empty, max 1/day)
- **Memory:** [ ] Confirmed (Buffer Window — contextPruning + memory flush + QMD retrieval)

## 3. Prerequisites
- OpenClaw configured on Oracle Cloud VM with system prompt (`specs/openclaw_system_prompt.txt`).
- Telegram Bot Token configured (OpenClaw Telegram plugin with `dmPolicy: pairing`).
- Gemini 2.5 Flash API key configured.
- Supabase instance active (env vars `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- `SHIRLEY_TELEGRAM_CHAT_ID` env var set.
- `WEBHOOK_SECRET` env var set (shared across OpenClaw, n8n, Oracle Media Processor).
- n8n instance running with Caption Approval Pipeline (`caption-approval-pipeline.json`) deployed.
- Google Drive `/Input/` and `/Procesadas/` folders configured.
- Oracle Media Processor running on port 3001.
- OpenClaw config.json with contextPruning, memory flush, and QMD memory backend configured (ref: `specs/agent_prompts.md` Section 6).

## 4. Manual E2E Procedures

### 4.1 Brain Integration (ip-002.1 / ip-002.3 / ip-002.4)
1. Send a text message to the Luna Telegram Bot: "Hola Luna".
2. Verify:
   - [ ] Luna responds in less than 10 seconds.
   - [ ] Response is in Spanish Colombia, informal ("tu"), marketing strategist tone.
   - [ ] No prohibited words (barato, oferta agresiva, low cost).
3. Send a follow-up message referencing the previous conversation.
4. Verify:
   - [ ] Luna maintains context (Buffer Window Memory is working).
   - [ ] contextPruning is active (run `/context list` in OpenClaw to verify).

### 4.2 Voice Transcription (ip-002.10)
1. Send a voice message to the Luna Telegram Bot (in Spanish).
2. Verify:
   - [ ] Gemini 2.5 Flash transcribes the audio to text via Google plugin.
   - [ ] Luna processes the transcribed text and responds appropriately.

### 4.3 Natural Language Understanding (ip-002.12)
1. Send "Publica el collar nuevo" to the bot.
   - [ ] Luna interprets intent: generate caption + request approval.
2. Send "Como vamos con las publicaciones?" to the bot.
   - [ ] Luna shows current status.
3. Send "Que archivos nuevos hay?" to the bot.
   - [ ] Luna lists pending files.
4. Send "Cambia el tono, hazlo mas divertido" to the bot.
   - [ ] Luna adjusts and regenerates caption.

### 4.4 Caption Dispatch & Approval (ip-002.11 / ip-002.13-15)
1. Send a message that triggers content generation (e.g., "Crea contenido para un collar de mostacilla checa").
2. Verify Luna generates a draft:
   - [ ] 3-line caption (hook + product + CTA) + 3-5 hashtags.
   - [ ] No emojis inside caption. No prohibited words.
3. Luna dispatches payload to n8n via webhook_dispatch (target `n8n_dispatch`).
4. Verify on n8n side:
   - [ ] Caption Approval Pipeline receives POST to `/webhook/caption-approval`.
   - [ ] HMAC signature validated (`x-luna-signature` header).
   - [ ] n8n sends photo (from Drive /Procesadas/) + caption + 2 inline buttons to Shirley.
5. Shirley presses **✅ Publicar**:
   - [ ] n8n publishes to Meta (when Social Publisher is built).
   - [ ] n8n sends "✅ Publicado con exito!" to Shirley.
   - [ ] Luna does NOT receive any notification (fully autonomous).
6. Shirley presses **✏️ Ajustar**:
   - [ ] n8n POSTs to OpenClaw webhook: `{ action: "adjust", task_id: "..." }`.
   - [ ] Luna asks: "Que te gustaria cambiar? 1️⃣ Tono 2️⃣ Enfoque 3️⃣ Todo".
   - [ ] Shirley responds → Luna regenerates → re-dispatches to n8n.
   - [ ] Max 2 adjustments. After 2nd: "Ya probamos dos versiones..."

### 4.5 Product Classification (ip-002.16)
1. Ask Luna to create content for a file named `IMG_20260510_1234.jpg` (no product clues):
   - [ ] Luna asks: "Que tipo de pieza es esta? [Collar] [Aretes] [Pulsera] [Anillo] [Dije] [Otra]".
   - [ ] Shirley responds → Luna uses classification for caption + payload.
2. Ask Luna to create content for a file named `collar_mostacilla_dorado.jpg` (has clues):
   - [ ] Luna auto-classifies as "collar" without asking.
   - [ ] Uses correct materials in caption.

### 4.6 HMAC Signature Validation (ip-002.13 / ip-002.14 / ip-002.15)
1. Monitor the webhook_dispatch output in OpenClaw logs.
2. Verify:
   - [ ] Payload JSON matches the contract (Section 5.2 in agent_prompts.md).
   - [ ] `x-luna-signature` header contains valid HMAC-SHA256 hex.
   - [ ] n8n Caption Approval Pipeline validates the signature successfully.
3. Send a request with an invalid signature:
   - [ ] n8n returns 401.
   - [ ] Luna notifies Shirley: "Error al enviar la publicacion."

### 4.7 Proactive Nudge (ip-002.18)
1. Ensure no content is scheduled and no new files in Drive.
2. Trigger the daily heartbeat (9am cron or manual).
3. Verify:
   - [ ] Luna sends: "Shirley, no tengo nada programado para hoy..."
   - [ ] Only 1 message is sent (no repeat).
4. Add a file to Drive `/Input/` and trigger heartbeat again:
   - [ ] File is auto-processed (no notification to Shirley).
   - [ ] Luna does NOT send proactive message (pipeline has content).

## 5. Expected Results
- Luna responds in less than 10 seconds.
- All captions follow: hook (personality) + product description + CTA + 3-5 hashtags. Max 3 lines.
- 2 inline buttons only: ✅ Publicar / ✏️ Ajustar.
- n8n intercepts ALL callbacks. Luna only handles adjust notifications.
- Upon approve, n8n publishes to Meta autonomously (no Luna involvement).
- HMAC-SHA256 signature on every dispatch. 401 on invalid signatures.
- Product classification via filename first, buttons as fallback.
- Proactive message only when pipeline is empty. Silent otherwise.
- No prohibited words ever generated.

## 6. Test Traceability Matrix

| Test Section | IP-002 Tasks | Component |
|:---|:---|:---|
| 4.1 Brain Integration | ip-002.1, ip-002.3, ip-002.4 | OpenClaw (Luna) |
| 4.2 Voice Transcription | ip-002.10 | OpenClaw + Gemini |
| 4.3 Natural Language | ip-002.12 | OpenClaw (Luna) |
| 4.4 Caption Dispatch & Approval | ip-002.11, ip-002.13-15 | OpenClaw + n8n |
| 4.5 Product Classification | ip-002.16 | OpenClaw (Luna) |
| 4.6 HMAC Validation | ip-002.13, ip-002.14, ip-002.15 | OpenClaw + n8n |
| 4.7 Proactive Nudge | ip-002.18 | OpenClaw + n8n Heartbeat |
