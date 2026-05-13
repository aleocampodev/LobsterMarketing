# Validation Report: The Arms — n8n Workflows (ip-003)

Version: v1.0
<!-- v1.0: Initial E2E test plan for ip-003. Covers Luna Bridge, Heartbeat, Caption flow, Publish, Circuit Breaker, Error Handler, Retry Logic. -->

## 1. Objective
Validate the end-to-end automation pipeline of the Nenufar system: from image upload to Drive through media processing, caption generation, approval, and social media publishing. All heavy processing delegated to Oracle Cloud, n8n as lightweight router.

## 2. Validation Summary
- **Status:** [ ] Pending Verification
- **Luna Bridge (HTTPS + WS):** [ ] Confirmed
- **Heartbeat + Drive Monitor:** [ ] Confirmed (auto-process new images)
- **Caption Cron + Notify (WF2a):** [ ] Confirmed
- **Caption Callback + Publish (WF2b):** [ ] Confirmed
- **Circuit Breaker:** [ ] Confirmed
- **Error Handler (Email):** [ ] Confirmed
- **Retry Logic:** [ ] Confirmed

## 3. Prerequisites
- [ ] All n8n workflows ACTIVE: Heartbeat (`GQaquqrmu8slMAhG`), WF2a (`qoZ77gxnxsCdJDuT`), WF2b (`soOfnxGp0Fxh3I7G`), Error Handler (`DPV2Ly5k1EhSyynI`)
- [ ] Oracle VM running: Media Processor (port 3001), Luna Bridge (port 3002), Caddy HTTPS
- [ ] Luna Bridge health check returns `ws_connected: true` at `https://nenufar-bridge.duckdns.org/health`
- [ ] Supabase `nenufar` schema: `processed_files` and `monitoring_logs` tables exist
- [ ] Google Drive folders: `/Input/` and `/Procesadas/` accessible by n8n
- [ ] Telegram Bot connected and responding
- [ ] Environment variables set in n8n: `OPENCLAW_BRIDGE_URL`, `META_PAGE_ACCESS_TOKEN`, `IG_BUSINESS_ACCOUNT_ID`, `FB_PAGE_ID`, `SHIRLEY_TELEGRAM_CHAT_ID`, `WEBHOOK_SECRET`
- [ ] Test image file ready (JPG or PNG, < 5MB)
- [ ] Gmail SMTP credential configured in n8n for error emails

## 4. Test Traceability Matrix

| Test | IP-003 Tasks | Workflow | Component |
|:-----|:-------------|:---------|:----------|
| 5.1 Luna Bridge Health | ip-003.25 | — | Caddy + Bridge + OpenClaw |
| 5.2 Heartbeat + Drive Monitor | ip-003.4-6, ip-003.18-22 | GQaquqrmu8slMAhG | Drive + Oracle + Supabase |
| 5.3 Caption Cron + Notify | ip-003.17, ip-003.23 | qoZ77gxnxsCdJDuT | Supabase + Telegram |
| 5.4 Publish (Approve) | ip-003.8-10, ip-003.15, ip-003.24 | soOfnxGp0Fxh3I7G | Telegram + Meta API + Supabase |
| 5.5 Publish (Adjust) | ip-003.25, ip-003.24 | soOfnxGp0Fxh3I7G | Telegram + Bridge + OpenClaw |
| 5.6 Circuit Breaker | ip-003.15 | soOfnxGp0Fxh3I7G | Supabase + Telegram |
| 5.7 Error Handler | ip-003.14 | DPV2Ly5k1EhSyynI | Error Trigger + Gmail SMTP |
| 5.8 Retry Logic | ip-003.3 | GQaquqrmu8slMAhG | Oracle HTTP + n8n retry |

---

## 5. Manual E2E Procedures

### 5.1 Luna Bridge Health Check

**Goal:** Verify the Luna Bridge is accessible via HTTPS and connected to OpenClaw via WebSocket.

1. Run from local terminal:
   ```bash
   curl -s https://nenufar-bridge.duckdns.org/health
   ```
2. Verify response:
   - [ ] `"status": "ok"`
   - [ ] `"ws_connected": true`
   - [ ] `"service": "luna-bridge"`

3. Send a test message (compute HMAC first):
   ```bash
   BODY='{"action":"heartbeat","task_id":"e2e-test-001","message":"E2E test from terminal"}'
   SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $NF}')
   curl -X POST https://nenufar-bridge.duckdns.org/send \
     -H "Content-Type: application/json" \
     -H "x-luna-signature: $SIG" \
     -d "$BODY"
   ```
4. Verify:
   - [ ] Response: `{"status":"delivered","task_id":"e2e-test-001"}`
   - [ ] OpenClaw logs show incoming WebSocket message from bridge

### 5.2 Heartbeat + Drive Monitor

**Goal:** Upload an image to Drive `/Input/`, trigger heartbeat manually, verify auto-processing (resize + watermark) and Supabase update.

**Pre-test cleanup:**
```sql
-- In Supabase SQL Editor (optional, to start clean)
DELETE FROM nenufar.processed_files WHERE file_name LIKE '%test_e2e%';
DELETE FROM nenufar.monitoring_logs WHERE timestamp > NOW() - INTERVAL '1 hour';
```

1. Upload a test image to Google Drive `/Input/` folder (rename to `test_e2e_001.jpg`).
2. In n8n UI, open workflow `💓 Luna - Heartbeat & Drive Monitor` (`GQaquqrmu8slMAhG`).
3. Click **Test Workflow** (or wait for cron if active).
4. Verify in execution:
   - [ ] `📁 Scan Drive Folder` finds the test image
   - [ ] `🔍 Filter New Files` identifies it as new (not in Supabase)
   - [ ] `🗄️ Mark as Processing` inserts row with status `processing`
   - [ ] `💪 Oracle Process` calls Media Processor and returns processed image
   - [ ] `📤 Upload to Procesadas` uploads watermarked image to Drive `/Procesadas/`
   - [ ] `🗄️ Mark as Processed` updates row to status `processed`
5. Check Drive `/Procesadas/`:
   - [ ] New file exists with `_feed_ig.jpg` suffix
   - [ ] Image has Nenufar watermark (bottom-right, 35% opacity)
   - [ ] Image is 1080x1350px (portrait format)
6. Check Supabase `processed_files`:
   - [ ] Row exists with `file_id` matching Drive file ID
   - [ ] `status = 'processed'`
   - [ ] `metadata` JSON contains `processed_file_id`, `post_type`

### 5.3 Caption Cron + Notify (WF2a)

**Goal:** Trigger the caption notification workflow, verify it finds the processed image and notifies Shirley.

1. In n8n UI, open `📋 Caption Cron + Notify (WF2a-1)` (`qoZ77gxnxsCdJDuT`).
2. Click **Test Workflow**.
3. Verify in execution:
   - [ ] `Find Processed Image` returns the test image from Supabase (status `processed`)
   - [ ] `Has Image?` routes to TRUE branch
   - [ ] `Build Notification` formats message with file name and format
   - [ ] `Notify Shirley` sends Telegram message to Shirley
4. Check Shirley's Telegram:
   - [ ] Message received: "Shirley, tengo una imagen lista para publicar..."
   - [ ] Contains file name and format info
5. If no processed image exists:
   - [ ] `Has Image?` routes to FALSE branch
   - [ ] `No Image - Stop` ends silently

### 5.4 Caption Callback + Publish — APPROVE flow (WF2b)

**Goal:** Test the full approve → publish → notify flow.

1. Ensure WF2a sent a notification with inline buttons (or manually send a test callback).
2. In Telegram, Shirley presses **✅ Publicar** button.
3. Verify in n8n execution of WF2b (`soOfnxGp0Fxh3I7G`):
   - [ ] `Telegram Callback` receives `approve:TASK_ID:FILE_ID:feed_ig`
   - [ ] `Parse Callback` extracts action, task_id, file_id, post_type
   - [ ] `Answer Callback` acknowledges button press
   - [ ] `Check Circuit Breaker` → `Count Recent Meta Errors` → `Circuit Open?` → FALSE (no errors)
   - [ ] `Route Action` routes to APPROVE branch
   - [ ] `Build Meta URL + Get Caption` constructs Drive download URL
   - [ ] `Publish to Instagram` — POST to Meta Graph API succeeds (200)
   - [ ] `Publish to Facebook` — POST to Meta Graph API succeeds (200)
   - [ ] `Mark Published` — Supabase `processed_files` status → `published`
   - [ ] `Notify Published` — Telegram message: "Publicado con exito!"
4. Check Shirley's Telegram:
   - [ ] "✅ ¡Publicado con éxito! Tu creación ya está en Instagram y Facebook."
5. Check Supabase:
   - [ ] `processed_files` row has `status = 'published'` and `published_at` timestamp

### 5.5 Caption Callback + Publish — ADJUST flow (WF2b)

**Goal:** Test the adjust → Luna Bridge → OpenClaw flow.

1. Upload another test image and ensure it reaches `processed` status.
2. Send a new notification (trigger WF2a again).
3. In Telegram, Shirley presses **✏️ Ajustar** button.
4. Verify in n8n execution of WF2b:
   - [ ] `Route Action` routes to ADJUST branch
   - [ ] `Compute HMAC for Bridge` — generates HMAC signature over `{action: "adjust", task_id: "...", message: "..."}`
   - [ ] `Notify Luna via Bridge` — POST to `OPENCLAW_BRIDGE_URL` with `x-luna-signature` header
   - [ ] Bridge returns `{"status": "delivered"}`
   - [ ] `Notify Adjusting` — Telegram message: "Le avise a Luna..."
5. Check OpenClaw logs:
   - [ ] WebSocket message received from bridge with `action: "adjust"`
6. Check Telegram:
   - [ ] Shirley sees "✏️ Le avisé a Luna. Te pregunta en un momento qué quieres cambiar."
   - [ ] Luna (OpenClaw) sends follow-up: "Que te gustaria cambiar?" with options

### 5.6 Circuit Breaker

**Goal:** Verify the circuit breaker blocks publishing after 5+ consecutive errors.

**Setup — Insert fake errors:**
```sql
-- In Supabase SQL Editor
INSERT INTO nenufar.monitoring_logs (status, error_message, timestamp)
VALUES
  ('error', 'Meta API error: test circuit breaker 1', NOW() - INTERVAL '2 minutes'),
  ('error', 'Meta API error: test circuit breaker 2', NOW() - INTERVAL '2 minutes'),
  ('error', 'Meta API error: test circuit breaker 3', NOW() - INTERVAL '2 minutes'),
  ('error', 'Meta API error: test circuit breaker 4', NOW() - INTERVAL '2 minutes'),
  ('error', 'Meta API error: test circuit breaker 5', NOW() - INTERVAL '2 minutes');
```

1. Trigger WF2b by pressing any callback button (approve or adjust).
2. Verify in execution:
   - [ ] `Check Circuit Breaker` computes 5-minute cutoff
   - [ ] `Count Recent Meta Errors` finds 5+ error rows
   - [ ] `Circuit Open?` routes to TRUE branch
   - [ ] `Alert Circuit Open` sends Telegram alert
3. Check Telegram:
   - [ ] "🚨 Circuit Breaker activado — Demasiados errores de Meta API..."
4. Verify publish was BLOCKED:
   - [ ] Execution does NOT reach `Publish to Instagram` or `Publish to Facebook`

**Cleanup:**
```sql
DELETE FROM nenufar.monitoring_logs WHERE error_message LIKE '%test circuit breaker%';
```

### 5.7 Error Handler (Email Alert)

**Goal:** Verify that workflow failures trigger an email to aleocampo.dev@gmail.com.

1. Ensure Error Handler workflow (`DPV2Ly5k1EhSyynI`) is ACTIVE.
2. Force an error in any active workflow (e.g., temporarily set an invalid URL in a node, or run a workflow with missing credentials).
3. Verify:
   - [ ] Error Handler workflow triggers automatically
   - [ ] `Format Error Message` extracts workflow name, node name, error message
   - [ ] `Send Error Email` sends email via Gmail SMTP
4. Check inbox at `aleocampo.dev@gmail.com`:
   - [ ] Email received with subject: `[Nenufar] Error en <workflow name>`
   - [ ] Body contains: Workflow name, Node name, Error message, Execution ID

### 5.8 Retry Logic

**Goal:** Verify that transient failures trigger 3 retries with 5-second intervals.

1. Temporarily stop Oracle Media Processor:
   ```bash
   ssh ubuntu@openclaw-server "sudo systemctl stop media-processor"
   ```
2. Trigger Heartbeat workflow manually (ensure there's a new file in Drive).
3. Verify in n8n execution:
   - [ ] `💪 Oracle Process` fails on first attempt
   - [ ] n8n retries up to 3 times with ~5s wait between attempts
   - [ ] After 3 failures, node errors out
   - [ ] If Error Handler is active → email alert sent
4. Restart Media Processor:
   ```bash
   ssh ubuntu@openclaw-server "sudo systemctl start media-processor"
   ```
5. Trigger Heartbeat again:
   - [ ] `💪 Oracle Process` succeeds on first attempt (service restored)

---

## 6. Expected Results
- All test sections pass with checkmarks.
- No manual intervention needed for the happy path (upload → process → publish).
- Circuit Breaker blocks publishing after 5 errors and alerts via Telegram.
- Error Handler sends email within 60 seconds of any workflow failure.
- Retry logic attempts 3 times before giving up.
- All Supabase records transition correctly: `pending` → `processing` → `processed` → `published`.
