# Validation Report: Luna Brain Interface (ip-002)
Version: v2.1
<!-- v2.1: Removed Redis references — direct HMAC webhook architecture (ADR-003). -->
<!-- v2.0: Added test sections for inline approval buttons, classification buttons, callback routing, proactive nudge. Corrected Gemini version. -->
<!-- v1.0: Initial validation report. -->

## 1. Objective
Validate the integration between the OpenClaw (Luna) brain and the user interface (Telegram), ensuring that Luna can receive messages, process them using the Brain-Arms pattern with the Templates Bank, request user approval via inline buttons, classify media interactively, and dispatch signed tasks to n8n workers.

## 2. Validation Summary
- **Status:** [ ] Pending Verification
- **Brain Integration:** [ ] Confirmed (Gemini 2.5 Flash)
- **Voice Consistency:** [ ] Confirmed (Eco-Poetic / Spanish Colombia)
- **Approval Workflow:** [ ] Confirmed (Inline Keyboard Buttons)
- **Classification Workflow:** [ ] Confirmed (Inline Keyboard Buttons)
- **Callback Routing:** [ ] Confirmed (approve/adjust/reject/classify)
- **Dispatch Mechanism:** [ ] Confirmed (HMAC + Direct Webhook)
- **Proactive Nudge:** [ ] Confirmed (Webhook → Telegram)
- **Memory:** [ ] Confirmed (Buffer Window per chat)

## 3. Prerequisites
- Gemini API Key configured (env var `GEMINI_API_KEY` or credential `googlePalmApi`).
- Telegram Bot Token configured (credential `telegramApi`).
- Supabase instance active (env vars `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- `SHIRLEY_TELEGRAM_CHAT_ID` env var set.
- `WEBHOOK_SECRET` env var set for HMAC signing.
- n8n instance running with webhook receiver endpoint active.
- Access to `specs/templates_bank.md`.

## 4. Manual E2E Procedures

### 4.1 Brain Integration (ip-002.1 / ip-002.3 / ip-002.4)
1. Send a text message to the Luna Telegram Bot: "Hola Luna".
2. Verify:
   - [ ] Luna responds in less than 10 seconds.
   - [ ] Response is in Spanish Colombia, informal ("tu"), eco-poetic tone.
   - [ ] No prohibited words (barato, oferta agresiva, low cost).
3. Send a follow-up message referencing the previous conversation.
4. Verify:
   - [ ] Luna maintains context (Buffer Window Memory is working).
   - [ ] The `sessionKey` uses the Telegram `chat.id`.

### 4.2 Voice Transcription (ip-002.10)
1. Send a voice message to the Luna Telegram Bot (in Spanish).
2. Verify:
   - [ ] The voice file is downloaded from Telegram.
   - [ ] Gemini 2.5 Flash transcribes the audio to text.
   - [ ] Luna processes the transcribed text and responds appropriately.

### 4.3 Command Handlers (ip-002.12)
1. Send `/help` to the bot.
   - [ ] Bot responds with the command list (Markdown formatted).
2. Send `/status` to the bot.
   - [ ] Bot processes the command through Luna Director.
3. Send `/process test_file` to the bot.
   - [ ] Bot routes to Prepare Input → Luna Director.
4. Send `/seed focus on ocean themes this week` to the bot.
   - [ ] Bot routes to Prepare Input → Luna Director.

### 4.4 Interactive Approval Buttons (ip-002.11)
1. Send a message that triggers content generation (e.g., "Crea contenido para un collar de mostacilla checa").
2. Verify:
   - [ ] Luna generates a draft with eco-poetic voice.
   - [ ] The Approval Agent sends a message with **Inline Keyboard** buttons: ✅ Aprobar, 🔄 Ajustar, ❌ Descartar.
   - [ ] The buttons appear as tappable inline buttons (NOT plain text).
3. Tap **🔄 Ajustar**.
   - [ ] Bot acknowledges the callback ("Recibido").
   - [ ] Luna regenerates the content with variations.
4. Tap **✅ Aprobar** on the new draft.
   - [ ] Bot acknowledges the callback.
   - [ ] Luna dispatches the task (calls taskDispatcher tool).
5. Tap **❌ Descartar** on a subsequent draft.
   - [ ] Bot sends "Entendido Shirley. Descartare este contenido."

### 4.5 Interactive Classification Buttons (ip-002.16)
1. Trigger the Draft Request flow by sending a POST to the `luna/draft-request` webhook with:
   ```json
   { "file_name": "aretes_telar_rojo.jpg", "file_id": "test123", "mime_type": "image/jpeg" }
   ```
2. Verify:
   - [ ] The `Parse File Data` node extracts: Aretes, Tejido en telar, Rojo (Fuerza).
   - [ ] The `Ask Classification` node sends a message to Shirley with **7 inline buttons**: Collar, Aretes, Pulsera, Anillo, Dije, Conjunto, Otro.
3. Tap **Aretes** button.
   - [ ] Bot acknowledges the callback.
   - [ ] The `Prepare Classification` node maps `cls_aretes` → "Aretes".
   - [ ] Luna Director receives the classification and generates content.

### 4.6 HMAC Signature & Webhook Dispatch (ip-002.13 / ip-002.14 / ip-002.15)
1. After an approval (step 4.4), check the Task Dispatcher execution.
2. Verify:
   - [ ] The HMAC Sign node generates a `sha256` signature using `WEBHOOK_SECRET`.
   - [ ] The task JSON contains: `task_id`, `file_id`, `caption`, `hashtags`, `platforms`, `hmac_signature`, `signed_payload`.
   - [ ] The signed payload is dispatched via direct HTTP POST to the n8n Webhook Receiver.
   - [ ] If the webhook call fails, the error is logged and the task status in Supabase is updated to `failed`.

### 4.7 Proactive Nudge (ip-002.18)
1. Send a POST to the `luna/proactive-prompt` webhook with an empty body.
2. Verify:
   - [ ] The `Proactive Nudge` node sends a message to `SHIRLEY_TELEGRAM_CHAT_ID`.
   - [ ] The message is in Spanish, eco-poetic tone.
   - [ ] The message asks Shirley if she has new pieces to publish.

## 5. Expected Results
- Luna responds in less than 10 seconds.
- All draft content follows the structure defined in `AGENTS.md` (poetic hook, technical body, CTA, hashtags).
- Inline keyboard buttons are interactive (tappable), not plain text.
- Callback routing correctly separates approve/adjust/reject/classify actions.
- Upon approval, a signed HMAC payload is dispatched via direct webhook to n8n.
- The interaction is logged in the `nenufar.processed_files` or `monitoring_logs` table.
- No prohibited words are ever generated.

## 6. Test Traceability Matrix

| Test Section | IP-002 Tasks | Workflow(s) |
|:---|:---|:---|
| 4.1 Brain Integration | ip-002.1, ip-002.3, ip-002.4 | Luna Brain Interface |
| 4.2 Voice Transcription | ip-002.10 | Luna Brain Interface |
| 4.3 Command Handlers | ip-002.12 | Luna Brain Interface |
| 4.4 Approval Buttons | ip-002.9, ip-002.11 | Luna Brain Interface + Approval Agent |
| 4.5 Classification Buttons | ip-002.16 | Luna Brain Interface |
| 4.6 HMAC & Webhook | ip-002.13, ip-002.14, ip-002.15 | Task Dispatcher |
| 4.7 Proactive Nudge | ip-002.18 | Luna Brain Interface |
