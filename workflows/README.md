# Workflows Index — n8n

This folder contains the n8n workflow JSON files for the Nenufar Marketing Automation system.

## Active Architecture (4 Workflows)

### WF1: 💓 Heartbeat + Conversor (`GQaquqrmu8slMAhG`)
**Status:** Inactive (activate when ready)

Daily cron (9am) that detects new files in Drive `/Input/`, processes them in the day's format via Oracle, and marks as processed in Supabase.

**Flow:**
```
Daily Cron 9am → Scan Drive /Input/ → Check Supabase → Filter New
  → If new: Mark Processing → Determine Day Format → Download → Oracle Process → Upload /Procesadas/ → Mark Processed
  → If empty: Notify Shirley "pipeline empty"
```

**Day-based format strategy:**
| Day | Format | post_type | Size |
|-----|--------|-----------|------|
| Lunes | portrait | feed_ig | 1080x1350 |
| Martes | portrait | feed_ig | 1080x1350 |
| Miercoles | story | story | 1080x1920 |
| Jueves | portrait | feed_ig | 1080x1350 |
| Viernes | story | story | 1080x1920 |
| Sabado | landscape | feed_fb | 1080x566 |
| Domingo | square | square | 1080x1080 |

### WF2a-1: 📋 Caption Cron + Notify (`qoZ77gxnxsCdJDuT`)
**Status:** Inactive
**File:** `caption-sender.json`

Cron-triggered pipeline that finds the latest processed image in Supabase and notifies Shirley via Telegram that an image is ready for publishing. Shirley then tells Luna to generate the caption (semi-automatic flow).

**Cron Schedule (1 hour before optimal publish time):**
| Day | Notify Time | Publish Time |
|-----|------------|--------------|
| Mon-Thu | 11:00 AM | 12:00 PM |
| Friday | 4:00 PM | 5:00 PM |
| Saturday | 9:00 AM | 10:00 AM |
| Sunday | No publish | - |

**Flow:**
```
Cron Trigger → Find Processed Image (Supabase status='processed') → Has Image?
  → No: Stop silently
  → Yes: Build Notification → Send Telegram message to Shirley
  → Shirley tells Luna "Publica el archivo X" → Luna generates caption → dispatches to WF2a-2
```

**6 nodes:** Daily Caption Trigger, Find Processed Image, Has Image?, Build Notification, Notify Shirley, No Image - Stop.

**Note:** This is a semi-automatic flow. Full automation requires configuring OpenClaw webhook receiver (Opcion 2 in roadmap).

### WF2a-2: 📋 Caption Preview Sender (`4U7012o8wOkHldD8`)
**Status:** Inactive
**File:** `caption-preview-sender.json`

Webhook receiver that gets the caption back from Luna, validates HMAC signature, stores in Supabase, and sends the photo preview with approval buttons to Shirley via Telegram.

**Flow:**
```
Luna POST /webhook/caption-return (HMAC signed)
  → Verify HMAC + Build Data → Store Caption (Supabase pending_captions)
  → Send Preview to Shirley (Telegram sendPhoto + inline buttons)
  → [✅ Publicar] / [✏️ Ajustar] → Respond OK to Luna
```

**5 nodes:** Webhook: Caption Return, Verify HMAC + Build Data, Store Caption, Send Preview to Shirley, Respond OK.

### WF2b: 📋 Caption Callback + Publish (`soOfnxGp0Fxh3I7G`)
**Status:** Inactive
**File:** `caption-callback-handler.json`

Telegram-triggered workflow that handles Shirley's button responses. On approve: publishes directly to Instagram + Facebook via Meta Graph API. On adjust: notifies Luna to regenerate.

**Flow (Approve):**
```
Shirley taps [✅ Publicar] → Telegram callback_query
  → Parse Callback → Answer Callback → Route Action (approve)
  → Build Meta URL + Get Caption → Publish to Instagram + Publish to Facebook
  → Mark Published (Supabase) → Notify Shirley ✅
```

**Flow (Adjust):**
```
Shirley taps [✏️ Ajustar] → Telegram callback_query
  → Parse Callback → Answer Callback → Route Action (adjust)
  → Notify Luna Adjust (HTTP POST to Luna Bridge) + Notify Shirley (Telegram message)
  → Luna Bridge forwards to OpenClaw via WebSocket (ws://127.0.0.1:18789)
```

**11 nodes:** Telegram Callback, Parse Callback, Answer Callback, Route Action, Build Meta URL + Get Caption, Publish to Instagram, Publish to Facebook, Mark Published, Notify Published, Notify Luna Adjust, Notify Adjusting.

## End-to-End Flow

```
WF1 (9am): Drive /Input/ → Oracle Process → /Procesadas/ → Supabase status='processed'
                                                                      ↓
WF2a-1 (11am/4pm/9am): Cron → Find 'processed' image → Notify Shirley via Telegram
                                                                      ↓
                                           Shirley tells Luna "Publica el archivo X"
                                                                      ↓
                                           Luna generates caption → dispatches to n8n webhook
                                                                      ↓
WF2a-2: Webhook receives caption → Verify HMAC → Store → Send preview to Shirley
                                                                      ↓
                                           Shirley taps ✅ or ✏️ via Telegram
                                                                      ↓
WF2b: Callback → (approve) Publish IG+FB → Mark Published → Notify Shirley
              → (adjust)  HTTP POST to Luna Bridge → WS to OpenClaw → Luna regenerates → re-dispatch to WF2a-2
```

## Required Environment Variables

```bash
WEBHOOK_SECRET=            # Shared HMAC secret
SHIRLEY_TELEGRAM_CHAT_ID=  # Shirley's Telegram chat ID
IG_BUSINESS_ACCOUNT_ID=    # Instagram Business Account ID
FB_PAGE_ID=                # Facebook Page ID
META_PAGE_ACCESS_TOKEN=    # Meta Graph API token
OPENCLAW_BRIDGE_URL=       # Luna Bridge URL (http://<oracle-ip>:3002/send)
```

## Why Separate Workflows?

n8n does not reliably support multiple different trigger types (Schedule + Webhook + Telegram Trigger) in the same workflow. Each trigger type needs its own workflow:
- **WF2a-1**: Schedule Trigger only
- **WF2a-2**: Webhook Trigger only
- **WF2b**: Telegram Trigger only

The `pending_captions` table in Supabase bridges data between workflows.

## Deprecated / Archived Workflows

| Name | ID | Status | Note |
|------|-----|--------|------|
| 🚀 Publish to Meta | `l9LVaa1wxkQYffhC` | Archived | Merged into WF2b. Publish logic is now inline in Callback Handler. |
| 📋 Caption Callback Handler (v1) | `WArkD3e1lYZKCx07` | Archived | Replaced by WF2b (`soOfnxGp0Fxh3I7G`) with direct publish. |
| 📋 Caption Callback Handler (v2) | `XrutCDyhYAWf8EJd` | Deleted | Replaced by WF2b (`soOfnxGp0Fxh3I7G`). |
| 📋 Caption Callback (API-created) | `st8o1iyoPkPdZ9go` | Deleted | Bug: telegramTrigger not visible in UI. Recreated manually as `soOfnxGp0Fxh3I7G`. |
| 📸 Caption Approval Pipeline (v1) | `zVzPVkBtUxfHx006` | Inactive | Old monolithic version |
| 📋 Caption Approval Pipeline v2 | `3QsBOmzseOyFv9sA` | Inactive | Monolithic 2-trigger version — split into WF2a + WF2b |
| 🏷️ Brand Agent | `yq7oc3n4b5xYjWR3` | Active* | Deprecated — handled by OpenClaw |
| ✍️ Content Agent | `Aqs6rI03SXL4Zy2Z` | Active* | Deprecated — handled by OpenClaw |
| ✅ Approval Agent | `YqEAhFDahWIRiBTe` | Active* | Deprecated — handled by OpenClaw |
| 🚀 Task Dispatcher | `n41wKfxIbFzuAMD9` | Active* | Deprecated — handled by OpenClaw |
| 🧠 Luna Brain Interface | `fOMLdXhP2Ejjq2d4` | Inactive | Deprecated — replaced by OpenClaw |

*Active but non-functional (empty/minimal nodes from early prototyping).
