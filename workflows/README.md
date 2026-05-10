# Workflows Index — n8n

This folder contains the n8n workflow JSON files used in the Nenufar Marketing Automation system. Each file can be imported directly into n8n.

## Workflows

### 📸 Caption Approval Pipeline (`caption-approval-pipeline.json`)
**ID:** `zVzPVkBtUxfHx006` | **Status:** Active

Receives publish requests from OpenClaw (Luna) after Shirley approves a caption. Processes the image in the correct format for the target platform and uploads to Drive.

**Flow:**
```
OpenClaw dispatches → /webhook/publish-approved
    → Get file_id + post_type from payload
    → Download original from Google Drive
    → Oracle Media Processor (resize + watermark in correct format)
    → Convert base64 response to binary
    → Upload to Drive /Procesadas/ with suffix (e.g., _story.jpg)
    → Mark as published in Supabase
    → Notify Shirley via Telegram
```

**Supported formats:**
| post_type | Size | Use case |
|-----------|------|----------|
| `feed_ig` | 1080x1350 | Instagram Feed (default) |
| `feed_fb` | 1080x566 | Facebook Feed |
| `story` | 1080x1920 | Stories / Reels |
| `square` | 1080x1080 | Both platforms |

**Payload expected:**
```json
{
  "file_id": "Google Drive file ID",
  "file_name": "original name",
  "post_type": "feed_ig",
  "task_id": "uuid"
}
```

### 💓 Luna - Heartbeat & Drive Monitor (`heartbeat-drive-monitor.json`)
**ID:** `GQaquqrmu8slMAhG` | **Status:** Inactive (manual trigger)

Scans Google Drive /Input/ folder for new files, processes them through Oracle Media Processor (portrait + watermark), and uploads to /Procesadas/. Notifies Shirley via Telegram if no new files found.

**Flow:**
```
Daily cron (9am) or manual trigger
    → Scan Drive /Input/ folder
    → Check Supabase for already-processed files
    → Filter new files
    → For each new file:
        → Mark as processing in Supabase
        → Determine operations (image vs video)
        → Download from Drive
        → Send to Oracle Media Processor
        → Convert base64 to binary
        → Upload to Drive /Procesadas/
        → Mark as processed in Supabase
    → If no new files → notify Shirley
```

## Other n8n Workflows (created in n8n UI)

| Name | ID | Status | Description |
|------|-----|--------|-------------|
| 🏷️ Brand Agent | `yq7oc3n4b5xYjWR3` | Inactive | Template interpolation (deprecated — handled by OpenClaw) |
| ✍️ Content Agent | `Aqs6rI03SXL4Zy2Z` | Inactive | Caption refinement (deprecated — handled by OpenClaw) |
| ✅ Approval Agent | `YqEAhFDahWIRiBTe` | Inactive | Approval orchestration (deprecated — handled by OpenClaw) |
| 🚀 Task Dispatcher | `n41wKfxIbFzuAMD9` | Inactive | Task routing (deprecated — handled by OpenClaw) |
| 🧠 Luna Brain Interface | `fOMLdXhP2Ejjq2d4` | Inactive | Full n8n brain (deprecated — replaced by OpenClaw) |

## Architecture

```
OpenClaw (Luna) = Brain
    ↕ Telegram API (sends photo + buttons, receives callbacks)
    ↕ webhook_dispatch → n8n (Caption Approval Pipeline)
    
n8n = Arms
    ↕ Oracle Media Processor (resize, watermark, format)
    ↕ Google Drive (download/upload)
    ↕ Supabase (state tracking)
    ↕ Telegram API (notifications)
```

See `../oracle/` for the Media Processor API (server.js).
