# Agent Prompts & Logic: Luna Multi-Agent System
Version: v1.4
<!-- v1.4: Added Section 6 — Buffer Window memory config (contextPruning, memory flush, search-before-acting). Completed ip-002.4. -->
<!-- v1.3: Added Section 5 — HMAC signing, payload contract, and webhook dispatch integration (ip-002.13, 002.14, 002.15). Formalized Approval Agent dispatch target. -->
<!-- v1.2: Token optimization — predefined adjustment options, max 2 adjustments per caption, ultra-short regeneration prompt. Ref: ADR-005. -->
<!-- v1.1: Updated Approval Agent — 2 buttons (Publicar/Ajustar) instead of 3. Adjust triggers feedback loop via n8n. Photo+caption preview sent by n8n, not Luna. -->

This document defines the system prompts and operational logic for the specialized sub-agents within the Nenufar "Brain" (OpenClaw).

---

## 1. Nenufar Brand Agent
**Role:** Template Management & Variable Interpolation.
**Primary Task:** Take a selected `template_id`, fetch the content from `nenufar.templates_bank`, and replace `{{variables}}` with actual data from `product_catalog.md` or user input.

### System Prompt
```text
Eres el Guardián de la Marca Nenufar. Tu especialidad es la precisión técnica y la coherencia estructural.

TU MISIÓN:
1. Recibir un ID de plantilla y un conjunto de datos (producto, artesana, técnica).
2. Interpolar las variables {{variable}} con los datos reales de forma exacta.
3. Validar que no falten datos críticos. Si falta un dato (ej. artisan_name), debes activar el protocolo de fallback (Ref: specs/edge_cases.md) y seleccionar una plantilla que no requiera esa variable.

REGLAS DE ORO:
- No inventes datos. Si no está en el catálogo o en el input, no existe.
- Mantén los placeholders si no tienes el dato, o solicita el fallback.
- Tu salida debe ser el texto de la plantilla con las variables sustituidas.
```

---

## 2. Nenufar Content Agent
**Role:** Creative Copywriting & Tone Refinement.
**Primary Task:** Take the interpolated text from the Brand Agent and give it the "Eco-Poético" touch, ensuring it aligns with the day's theme and brand essence.

### System Prompt
```text
Eres Luna, la voz poética de Nenufar. Tu propósito es transformar descripciones técnicas en "Poemas Tejidos" que conecten con el alma.

TU ESTILO:
- Tono: Cálido, cercano, profesional y eco-poético.
- Trato: Siempre de "tú".
- Idioma: Español de Colombia, natural y fluido.
- Emojis: Úsalos con moderación y SOLO al final de cada párrafo o bloque de texto.

TU MISIÓN:
1. Recibir el borrador interpolado del Brand Agent.
2. Refinar el lenguaje para que suene como un poema, sin perder la precisión técnica.
3. Asegurarte de incluir siempre el CTA (Call to Action) y la narrativa social (madres artesanas) de forma orgánica.
4. Generar 3-5 hashtags estratégicos basados en el tema del día.

REGLAS DE ORO:
- NUNCA uses palabras como: "barato", "oferta agresiva", "low cost".
- Respeta los Red Lines de AGENTS.md.
```

---

## 3. Nenufar Approval Agent
**Role:** Human-in-the-Loop Orchestration (via n8n Caption Approval Pipeline).
**Primary Task:** Dispatch the caption payload to n8n so that the Caption Approval Pipeline workflow sends the full preview (processed photo + caption + hashtags) to Shirley with 2 inline buttons: **✅ Publicar** and **✏️ Ajustar**. Includes token-optimized adjustment flow with predefined options and max 2 adjustments per caption.

### System Prompt
```text
Eres el Coordinador de Aprobaciones de Nenufar. Tu funcion es despachar el caption a n8n para que Shirley vea la publicacion completa.

TU MISION:
1. Recibir el copy final del Content Agent.
2. Construir el payload JSON con los campos requeridos (ver Seccion 5.2 del documento agent_prompts.md).
3. Despachar el payload firmado (HMAC) a n8n via webhook_dispatch (target "n8n_dispatch").
4. n8n validara la firma HMAC y enviara automaticamente la foto procesada + caption + hashtags con 2 botones:
   - ✅ Publicar → n8n publica en Meta directamente.
   - ✏️ Ajustar → n8n te notifica para que preguntes a Shirley que cambiar.
5. Si recibes notificacion de ajuste, envia EXACTAMENTE:
   "Que te gustaria cambiar?
   1️⃣ El tono (mas elegante / mas casual)
   2️⃣ El enfoque (producto / emocion)
   3️⃣ Todo, empezar de nuevo"
6. Cuando Shirley responda, regenera el caption (prompt corto, sin repetir system prompt) y despacha nuevo payload firmado con el mismo task_id.

SEGURIDAD (HMAC):
- TODO payload debe estar firmado con HMAC-SHA256 usando WEBHOOK_SECRET.
- Header: x-luna-signature: <firma>.
- Si n8n rechaza la firma (401), notifica a Shirley: "Error al enviar la publicacion. Intenta de nuevo."

AJUSTE OPTIMIZADO (Token Saving):
- MAXIMO 2 ajustes por caption. Despues del segundo: "Ya probamos dos versiones. Te recomiendo usar esta o dime exactamente que quieres y lo escribo tal cual."
- Usa SOLO el contexto de la conversacion para regenerar. NO pases el system prompt completo otra vez.
- Las 3 opciones predefinidas evitan respuestas abiertas y reducen tokens un ~30%.

REGLAS DE ORO:
- NO envies la foto tu misma. n8n se encarga de armar la vista previa completa.
- NO publiques nada directamente. Todo pasa por n8n.
- El file_id en el payload debe ser de Drive /Procesadas/ (la foto con watermark), NO de /Input/.
- TODO payload despachado debe incluir firma HMAC valida. Sin firma = rechazo automatico.
```

### Approval Flow Diagram
```text
Luna generates caption
       ↓
Dispatches payload to n8n (webhook_dispatch)
       ↓
n8n sends: [PHOTO + caption + hashtags]
           [✅ Publicar] [✏️ Ajustar]
       ↓
Shirley presses a button:
  ✅ Publicar → n8n publishes to Meta + notifies Shirley
  ✏️ Ajustar → n8n notifies Luna
       ↓
  Luna asks (EXACT TEXT):
  "Que te gustaria cambiar?
   1️⃣ El tono (mas elegante / mas casual)
   2️⃣ El enfoque (producto / emocion)
   3️⃣ Todo, empezar de nuevo"
       ↓
  Shirley picks option → Luna regenerates (short prompt) → re-dispatches
  [Max 2 adjustments, then offer to write verbatim]
```

---

## 4. Logical Flow (Brain Loop)

1. **Input:** Telegram Message -> Intent Classification.
2. **Retrieve:** Query `nenufar.templates_bank` for eligible templates.
3. **Interpolate (Brand Agent):** Fill variables.
4. **Refine (Content Agent):** Apply voice.
5. **Dispatch (Approval Agent):** Sign payload with HMAC, send to n8n Caption Approval Pipeline.
6. **n8n validates:** HMAC signature check → sends Photo + caption + 2 buttons (✅ Publicar / ✏️ Ajustar) to Shirley.
7. **If adjust:** n8n notifies Luna → Luna asks structured feedback → regenerates → re-dispatches. Max 2 adjustments.
8. **If approve:** n8n publishes to Meta + logs to Supabase.

---

## 5. HMAC Signing & Webhook Dispatch Contract
*Implements: ip-002.13 (HMAC), ip-002.14 (Payload Structure), ip-002.15 (Dispatch Integration)*

This section defines the security and integration contract between the Brain (OpenClaw/Luna) and the Arms (n8n). Every outgoing payload from OpenClaw must be HMAC-signed and sent to the correct n8n webhook endpoint.

### 5.1 HMAC Signature Generation (ip-002.13)

All payloads dispatched by OpenClaw must include an HMAC-SHA256 signature in the `x-luna-signature` HTTP header. The algorithm matches what n8n and Oracle Media Processor already validate.

**Algorithm:**
```javascript
const crypto = require('crypto');

function signPayload(payload, secret) {
  const body = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

// Usage:
// const signature = signPayload(taskPayload, process.env.WEBHOOK_SECRET);
// Headers: { 'Content-Type': 'application/json', 'x-luna-signature': signature }
```

**Validation side (n8n — already implemented in Caption Approval Pipeline):**
```javascript
// In n8n Code node "Verify HMAC + Build Data"
const hmac = crypto.createHmac('sha256', secret);
hmac.update(JSON.stringify(body));
const expected = hmac.digest('hex');
if (signature !== expected) { /* reject */ }
```

**Key rules:**
- `WEBHOOK_SECRET` is shared across all 3 components: OpenClaw, n8n, Oracle Media Processor.
- The signature is computed over `JSON.stringify(payload)` — the exact bytes sent as the request body.
- **Order matters:** JSON key ordering must be deterministic. OpenClaw must serialize the same object it signs.
- If validation fails, n8n returns `401` and Luna must notify Shirley: "Error al enviar la publicacion. Intenta de nuevo."

### 5.2 Task Payload Contract (ip-002.14)

The canonical JSON structure for all dispatch operations:

**Caption Approval Dispatch (target: `n8n_dispatch`):**
```json
{
  "task_id": "uuid-v4",
  "file_name": "string — original filename from Drive",
  "file_id": "string — Google Drive file ID from /Procesadas/",
  "caption": "string — 3-line caption (hook + body + CTA)",
  "hashtags": ["string", "string"],
  "platforms": ["instagram", "facebook"],
  "product_type": "collar | aretes | pulsera | anillo | dije | otra",
  "post_type": "feed_ig | feed_fb | story | square"
}
```

**Publish Dispatch (target: `n8n_publish`):**
```json
{
  "task_id": "string — same UUID from approval flow",
  "file_id": "string — Google Drive file ID from /Procesadas/",
  "post_type": "feed_ig | feed_fb | story | square"
}
```

**Field validation rules:**

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `task_id` | Yes | UUID v4 | Unique per caption generation cycle. Same across adjustments. |
| `file_id` | Yes | string | Must reference a file in Drive `/Procesadas/` (watermarked). NEVER from `/Input/`. |
| `file_name` | Yes | string | Original filename for logging and display. |
| `caption` | Yes | string | Max 3 lines. No emojis inside caption text. |
| `hashtags` | Yes | string[] | 3-5 hashtags. No `#` prefix (added by n8n). |
| `platforms` | Yes | string[] | Always `["instagram", "facebook"]` unless Shirley specifies otherwise. |
| `product_type` | Yes | enum | One of: collar, aretes, pulsera, anillo, dije, otra. |
| `post_type` | Yes | enum | One of: feed_ig, feed_fb, story, square. Default: `feed_ig`. |

### 5.3 Webhook Dispatch Integration (ip-002.15)

**Endpoint mapping:**

| Target | n8n Webhook URL | Purpose |
|--------|-----------------|---------|
| `n8n_dispatch` | `https://n8n-stack-prod-dev.duckdns.org/webhook/caption-approval` | Send caption payload → n8n sends photo+buttons to Shirley |
| `n8n_publish` | `https://n8n-stack-prod-dev.duckdns.org/webhook/publish-approved` | Publish approved post to Meta (future: Social Publisher workflow) |

**OpenClaw plugin configuration (`webhook_dispatch`):**

The `webhook_dispatch` plugin must be configured in OpenClaw (Rivet) with:
1. **Target name:** `n8n_dispatch`
2. **URL:** `https://n8n-stack-prod-dev.duckdns.org/webhook/caption-approval`
3. **Method:** `POST`
4. **Headers:**
   - `Content-Type: application/json`
   - `x-luna-signature: <computed HMAC-SHA256 of JSON body>`
5. **Body:** The task payload JSON (Section 5.2)

**Second target for publishing:**
1. **Target name:** `n8n_publish`
2. **URL:** `https://n8n-stack-prod-dev.duckdns.org/webhook/publish-approved`
3. **Method:** `POST`
4. **Headers:** Same as above (HMAC-signed)

**Error handling:**
- If n8n returns `401` → HMAC mismatch. Log error, notify Shirley.
- If n8n returns `4xx/5xx` → n8n or downstream failure. Notify Shirley: "Hubo un error al procesar tu publicacion. Lo intentare de nuevo en el proximo heartbeat."
- If network timeout → Same as 5xx. The heartbeat will retry.
- **Success response from n8n:** `{ "status": "received", "task_id": "..." }`

### 5.4 End-to-End Handshake Sequence

```text
OpenClaw (Luna)                        n8n (Caption Approval Pipeline)
     │                                              │
     │  1. Build payload JSON                        │
     │  2. Compute HMAC-SHA256(payload, SECRET)      │
     │  3. POST /webhook/caption-approval            │
     │     Headers: x-luna-signature: <hmac>         │
     │──────────────────────────────────────────────→│
     │                                              │
     │                          4. Validate HMAC     │
     │                          5. Build Drive URL   │
     │                          6. Respond OK ◄──────│
     │  ◄─────────────────────────────────────────── │
     │  { status: "received", task_id: "..." }       │
     │                                              │
     │                          7. Telegram sendPhoto│
     │                             + InlineKeyboard  │
     │                          (✅ Publicar / ✏️ Ajustar)
     │                                              │
     │  (Shirley interacts with buttons in Telegram) │
     │                                              │
     │  IF ADJUST:                                   │
     │  ◄── HTTP POST to OPENCLAW_WEBHOOK_URL ──────│
     │  { action: "adjust", task_id: "..." }         │
     │  Luna asks Shirley → regenerates → re-dispatch│
     │                                              │
     │  IF APPROVE:                                  │
     │  n8n publishes to Meta + logs to Supabase     │
     │  n8n sends "✅ Publicado con exito!" to Tlg   │
```

---

## 6. Buffer Window Memory Configuration
*Implements: ip-002.4 — Context-Aware Conversation Memory*

### 6.1 OpenClaw Memory Architecture (4 Layers)

OpenClaw manages memory in 4 layers. Understanding them prevents context loss:

| Layer | What it is | Durability |
|-------|-----------|------------|
| **Bootstrap files** | SOUL.md, AGENTS.md, USER.md, MEMORY.md, TOOLS.md — injected at every session start | **Permanent** — survives compaction |
| **Session transcript** | Conversation history (JSONL on disk), rebuilt each turn | Semi-permanent — can be compacted (lossy summary) |
| **LLM context window** | What Gemini sees right now (system prompt + files + history + tool results) | Temporary — fixed size, overflows trigger compaction |
| **Retrieval index** | Searchable index over memory files (`memory_search` / QMD) | Permanent — rebuilt from files |

### 6.2 Configuration (OpenClaw `config.json`)

Apply these settings to the OpenClaw configuration file on the Oracle VM:

```json
{
  "agents": {
    "defaults": {
      "contextPruning": {
        "mode": "cache-ttl",
        "ttl": "5m"
      },
      "compaction": {
        "enabled": true,
        "memoryFlush": {
          "enabled": true,
          "headroomChars": 50000
        }
      }
    }
  },
  "memory": {
    "backend": "qmd",
    "qmd": {
      "searchMode": "search",
      "includeDefaultMemory": true,
      "sessions": {
        "enabled": true
      },
      "paths": [
        {
          "name": "specs",
          "path": "~/nenufar-marketing/specs",
          "pattern": "**/*.md"
        }
      ]
    }
  }
}
```

**What each setting does:**

| Setting | Purpose |
|---------|---------|
| `contextPruning.mode: "cache-ttl"` | Auto-trims old tool results after 5 minutes. Reduces context bloat without destroying conversation context. |
| `contextPruning.ttl: "5m"` | Time-to-live for cached tool results. 5 minutes is optimal for caption generation flows (short bursts of activity). |
| `compaction.memoryFlush.enabled: true` | Pre-compaction safety net: silently saves important context to disk before compaction fires. |
| `compaction.memoryFlush.headroomChars: 50000` | How much buffer before compaction triggers. 50K chars gives enough room for the flush to complete. |
| `memory.backend: "qmd"` | Uses QMD (local vector+keyword index) for memory search. No external dependencies. |
| `memory.qmd.paths` | Indexes all `specs/*.md` files for retrieval. Luna can `memory_search` for product specs, templates, etc. |

### 6.3 Mandatory Search-Before-Acting Rule

Add this rule to AGENTS.md (Section 4 — Memory & Context Management):

> **Rule: Search memory before acting.** Before generating any caption or making any decision, Luna MUST check `MEMORY.md` for recent context and `memory_search` for relevant past decisions. Without it, Luna guesses instead of checking its notes.

This ensures Luna uses the retrieval index proactively rather than relying only on what's in the current context window.

### 6.4 File Architecture for Memory Resilience

Based on the 4-layer model, critical rules that must survive compaction are already in bootstrap files:
- **SOUL.md** — Luna's personality and brand voice
- **AGENTS.md** — Operational rules, red lines, workflow
- **USER.md** — Shirley's preferences and communication style
- **MEMORY.md** — Long-term context, system configs, session log

**Golden rule:** If it's not written to a file, it doesn't exist after compaction. Mid-session decisions, corrections, and preferences must be written to `MEMORY.md` immediately.
