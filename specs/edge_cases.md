# 🛡️ Edge Cases and Error Handling
Version: v1.1

This document defines the failure scenarios and fallback strategies for the Nenufar system. The goal is to ensure that Luna maintains her professionalism and tone of voice even when technical services fail.

---

## 1. Content Generation Failures

### 1.1 Missing Variables in Templates
**Scenario:** An attempt is made to use an "Artisan Story" template, but the product has no associated artisan name in the database/file.
- **Action:** The system detects the null or empty variable.
- **Strategy:** Automatically switch to a template from the "Catalog and Product" category (ID: `product_showcase_01`) that does not require that variable.
- **Log:** Record warning in Supabase: "Missing variable {{artisan_name}} for product ID XXX".

### 1.2 Character Limit Exceeded
**Scenario:** The generated copy (after interpolating variables) exceeds Instagram's 2200 character limit.
- **Action:** Truncate the text at the last period before the limit.
- **Strategy:** Ensure the call to action (CTA) and hashtags remain at the end, even if part of the message body is cut.

---

## 2. Infrastructure Failures (n8n / Supabase / Telegram)

### 2.1 Brain Timeout (OpenClaw/Gemini)
**Scenario:** Gemini does not respond in < 30 seconds during a Telegram interaction.
- **Action:** Luna sends an automatic standby message.
- **Strategy:** Use `fallback_general`: "La naturaleza tiene sus propios tiempos... estamos ajustando detalles".
- **Retry:** Notify Shirley via an internal log that the process will be retried in 5 minutes or requires manual intervention.

### 2.2 Database (Supabase) Unavailable
**Scenario:** Products and logs cannot be queried.
- **Action:** The Telegram bot enters "Emergency Mode".
- **Strategy:** Luna responds only with predefined static messages that do not require DB consultation, informing that it is in "mantenimiento poético".

---

## 3. Unexpected User Inputs

### 3.1 "Garbage" or Off-Tone Input
**Scenario:** A user sends insults or spam to the Telegram bot.
- **Action:** Sentiment detection (if Gemini is active) or keyword filtering.
- **Strategy:** Luna responds with a polite but firm closing phrase: "Nuestra comunidad se basa en el respeto y la armonía con la tierra. Si deseas conocer más sobre nuestras artesanías, aquí estaré. 🌸".

### 3.2 Unknown Commands
**Scenario:** A `/non_existent_command` is sent.
- **Action:** Show help menu.
- **Strategy:** "Parece que ese camino no está en mi mapa todavía. 🌿 Puedes usar /ayuda para ver qué puedo hacer por ti."

---

## 4. Publishing Errors

### 4.1 Instagram API Failure
**Scenario:** The image cannot be uploaded due to a Meta error.
- **Action:** Move the task record in `nenufar.task_queue` to the `FAILED` state.
- **Notification:** Send an URGENT message to Shirley on Telegram: "⚠️ No pude sembrar nuestra publicación en Instagram. Error: [Código]. ¿Quieres que lo intente más tarde?".

---

## 5. Security and Token Protection (Pre-LLM Filters)

To prevent malicious token depletion from massive requests to Gemini, validations must be implemented in n8n that occur **before** any call to the LLM.

### 5.1 Telegram Whitelist
**Scenario:** An unauthorized user attempts to interact with Luna's administrative bot.
- **Action (n8n Filter):** Verify that the `{{ $json.message.from.id }}` matches the authorized IDs (e.g., Shirley).
- **Strategy:** If the ID is not on the list, the flow stops immediately without sending a response (or sends a static "No autorizado" message). **Cost: 0 tokens.**

### 5.2 Length and Type Filter (Structural)
**Scenario:** An excessively long message designed to exhaust the LLM context is received, or an empty/extremely short message.
- **Action (n8n Filter):** Evaluate the message length.
- **Strategy:** Reject messages with more than 500 characters or less than 2 characters without processing them through the LLM. **Cost: 0 tokens.**

### 5.3 Rate Limiting (Application-Level)
**Scenario:** A user sends dozens of messages in a few seconds (spam/DDoS attack).
- **Action (n8n Filter + Supabase):** Track message timestamps per user in Supabase. Count messages within the last 60 seconds.
- **Strategy:** If the count exceeds 5 messages per minute, stop the flow and ignore subsequent messages until the limit resets. **Cost: 0 tokens.**

