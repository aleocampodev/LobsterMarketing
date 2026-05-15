# Luna Bridge API Specification
Version: v1.2
<!-- v1.2: Fixed DNS issue — all URLs use direct IP instead of DuckDNS. Bridge now sends direct instruction to OpenClaw (not generic notification). -->

## Overview

The Luna Bridge is an intermediary HTTP server that connects n8n workflows with OpenClaw (Luna AI agent). Since n8n cannot speak directly with OpenClaw, the Bridge receives requests from n8n, translates them into Telegram messages for Luna, and forwards them. Luna then responds, and the Bridge connects back to n8n, enabling automated caption generation without manual intervention.

## Architecture

```text
n8n (GCP) -> Luna Bridge (Oracle VM 132.145.73.80:3010) -> OpenClaw/Luna -> n8n webhook caption-preview
```

## Server Details

| Component              | VM           | IP                             | Port | Domain                         |
| ---------------------- | ------------ | ------------------------------ | ---- | ------------------------------ |
| n8n                    | GCP e2-micro | n8n-stack-prod-dev.duckdns.org | 443  | n8n-stack-prod-dev.duckdns.org |
| OpenClaw + Bridge      | Oracle Cloud | 132.145.73.80                  | 3010 | nenufar-bridge.duckdns.org     |
| Oracle Media Processor | Oracle Cloud | 140.238.72.167                 | 3001 | -                              |

## SSH Access

| Server             | User   | Key                                                             |
| ------------------ | ------ | --------------------------------------------------------------- |
| OpenClaw VM        | ubuntu | /home/ale/Documentos/api_key_oracle_openclaw/ssh-key-oracle.key |
| Media Processor VM | opc    | /home/ale/Documentos/ssh-key-2026-05-08.key                     |

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

     ```mermaid
     flowchart LR
         A[n8n WF2a-1 Cron] -->|JSON + file_id| B[Supabase]
         B -->|processed file metadata| A
         A -->|Download Drive OAuth| C[Google Drive]
         C -->|binary file| A
         A -->|multipart upload| D[Luna Bridge :3010]
         D -->|Telegram message| E[OpenClaw Luna]
         E -->|caption + webhook_dispatch| F[n8n WF2a-2 caption-preview]
         F -->|Download Drive OAuth| C
         F -->|photo/video + caption + buttons| G[Telegram Shirley]
         G -->|callback approve| H[n8n WF2b Callback + Publish]
         G -->|callback adjust| D
         H -->|Meta API| I[Instagram + Facebook]
         H -->|status update| J[Supabase]
         E -->|caption regenerate| F


     Y la versión visual simplificada:

     ```markdown
     ## Simplified Flow

     ```text
     ╔═══════════════════════════════════════════════════════════════════╗
     ║                                                                   ║
     ║       🌸  LUNA CAPTION PIPELINE — NENUFAR  🌸                   ║
     ║       Brain = OpenClaw (Luna) · Arms = n8n · Bridge = HTTP relay ║
     ║                                                                   ║
     ╚═════════════════════════════════════════════════════════════════════╝

      ┌──────────────────────────────────────────────────────────────────┐
      │  ⏰ WF2a-1: Cron Trigger (9am, 11am, 4pm)                      │
      │     → Supabase: get latest processed file                       │
      │     → Google Drive: download via OAuth (n8n credential)         │
      │     → Bridge /upload: send binary + metadata                    │
      └──────────┬───────────────────────────────────────────────────────┘
                 │
                 ▼
      ┌──────────────────────────────────────────────────────────────────┐
      │  🔌 Bridge (Oracle VM :3010)                                    │
      │     → Receives binary from n8n                                  │
      │     → Saves to temp file                                        │
      │     → Sends Telegram message to OpenClaw with file info         │
      └──────────┬───────────────────────────────────────────────────────┘
                 │
                 ▼
      ┌──────────────────────────────────────────────────────────────────┐
      │  🧠 OpenClaw / Luna (Brain)                                     │
      │     → Reads Telegram message                                    │
      │     → Generates caption using templates_bank (3 lines + hashtags)│
      │     → Dispatches payload to n8n webhook via webhook_dispatch    │
      └──────────┬───────────────────────────────────────────────────────┘
                 │
                 ▼
      ┌──────────────────────────────────────────────────────────────────┐
      │  📋 WF2a-2: Caption Preview Sender                              │
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

