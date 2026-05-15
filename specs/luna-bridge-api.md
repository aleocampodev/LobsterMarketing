# Luna Bridge API Specification
Version: v2.1 — DEPRECATED
<!-- v2.1: DEPRECATED. Bridge removed in v4.0. n8n migrated to Oracle Cloud — all components on same VM. n8n communicates directly with OpenClaw via Telegram Bot API. Luna dispatches captions via dispatch-caption.js script. This file kept for historical reference only. -->
<!-- v2.0: n8n migrated from GCP to Oracle Cloud. All components now on same VM. No more DuckDNS/GCP. Bridge uses /notify-upload (metadata-only, no binary). Luna dispatches via dispatch-caption.js script instead of webhook_dispatch plugin. -->
<!-- v1.2: Fixed DNS issue — all URLs use direct IP instead of DuckDNS. Bridge now sends direct instruction to OpenClaw (not generic notification). -->

## Overview

The Luna Bridge is an HTTP server on the Oracle Cloud VM that relays messages between n8n and OpenClaw (Luna AI agent). Since n8n, the Bridge, and OpenClaw all run on the same VM, all communication is via `localhost` — no external network calls, no DNS, no timeouts.

## Architecture

```text
n8n (localhost:5678) -> Luna Bridge (localhost:3010) -> OpenClaw/Luna (Telegram) -> dispatch-caption.js -> n8n webhook (localhost:5678)
```

## Server Details

| Component              | VM           | IP              | Port | Notes                            |
| ---------------------- | ------------ | --------------- | ---- | -------------------------------- |
| n8n                    | Oracle Cloud | 132.145.73.80   | 5678 | Docker container                 |
| OpenClaw + Bridge      | Oracle Cloud | 132.145.73.80   | 3010 | PM2 process                      |
| Luna Bot               | Oracle Cloud | 132.145.73.80   | —    | PM2 process (OpenClaw gateway)   |

**Previous architecture (deprecated):** n8n ran on GCP e2-micro (`n8n-stack-prod-dev.duckdns.org`). Migrated to Oracle on 2026-05-14 to eliminate timeouts, DuckDNS dependency, and to simplify the architecture.

## SSH Access

| Server             | User   | Key                                                             |
| ------------------ | ------ | --------------------------------------------------------------- |
| Oracle VM (all)    | ubuntu | /home/ale/Documentos/api_key_oracle_openclaw/ssh-key-oracle.key |

## API Endpoints

### POST /send

Receives a caption generation request from n8n and forwards it to Luna via Telegram.

**Request:**
```json
{
  "message": "Publica el archivo water.mp4",
  "file_id": "1lcdENXsCtjyTSgcw2dDnp9AanSR3Y3go",
  "file_name": "water.mp4",
  "post_type": "feed_ig",
  "processed_file_id": "1a1cr_GabxG1xeDwpZZsqwc1R1gc8jadr",
  "chat_id": "6327668964"
}
```

**Response:**
```json
{
  "status": "sent",
  "message": "Publica el archivo water.mp4"
}
```

# Data Flow Diagram

```text
┌──────────────────────────────────────────────────────────────────┐
│  ⏰ WF2a-1: Cron Trigger (9am, 11am, 4pm)                      │
│     → Supabase: get latest processed file                       │
│     → Bridge /notify-upload: send metadata only (no binary)     │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  🔌 Bridge (localhost:3010)                                      │
│     → Receives metadata from n8n                                │
│     → Sends text instruction to OpenClaw via Telegram           │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  🧠 OpenClaw / Luna (Brain)                                     │
│     → Receives instruction via Telegram                         │
│     → Generates caption using templates_bank (3 lines + hashtags)│
│     → Dispatches payload via dispatch-caption.js script          │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  📋 WF2a-2: Caption Preview Sender (localhost:5678)             │
│     → Downloads file from Drive (OAuth)                         │
│     → Sends to Telegram: photo/video + caption + inline buttons │
│         [✅ Aprobar y Publicar]  [✏️ Ajustar]                    │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  📱 Shirley (Telegram)                                          │
│     → Sees: image/video + copywriting + buttons                 │
│     → ✅ Approve → WF2b publishes to Instagram + Facebook       │
│     → ✏️ Adjust → Bridge → OpenClaw regenerates caption         │
└──────────────────────────────────────────────────────────────────┘
```

