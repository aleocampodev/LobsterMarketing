# System Architecture: Nenufar Marketing Automation

## Overview
The system follows an **n8n-First Orchestrator** pattern where n8n coordinates the entire workflow and OpenClaw serves as a specialized copywriting service.

## 1. n8n (Principal Orchestrator)
- **Role:** Main workflow coordinator and execution engine.
- **Platform:** Google Cloud e2-micro.
- **Endpoint:** `https://n8n-stack-prod-dev.duckdns.org/`
- **Deployment:** Docker with Queue Mode enabled.
- **Resource Limit:** 512MB RAM (NODE_OPTIONS).
- **Responsibilities:**
    - **Google Drive Watcher:** Detects new photos/videos uploaded by user.
    - **Image Processing:** Resize, watermark application, format conversion.
    - **Preview Generation:** Creates previews for Instagram (1080x1350) and Facebook (1080x1080).
    - **Telegram Interface:** Sends previews + captions for user approval.
    - **Social Publishing:** Posts approved content to Instagram/Facebook via Graph API.
    - **Logging:** Records all activity in Supabase.

## 2. OpenClaw (Copywriting Service)
- **Role:** Specialized content generation service (Copywriter only).
- **Platform:** Oracle Cloud (Always Free Tier).
- **Core Engine:** Node.js / Python with LLM integration (Gemini Vision).
- **Features:**
    - **Visual Analysis:** Analyzes images via Gemini Vision API.
    - **RAG Engine:** Retrieves brand essence and product data from Supabase.
    - **Caption Generation:** Creates Spanish captions following Nenufar voice.
    - **Hashtag Strategy:** Generates optimized hashtags based on trends and brand.
- **Trigger:** Called by n8n when new media is detected.
- **Response:** Returns JSON with caption, hashtags, and content suggestions.

## 3. Data & Communication Layer
- **Supabase Cloud:**
    - PostgreSQL database for metadata and logs.
    - Vector store for RAG embeddings (brand memory).
    - Object storage for brand assets (watermarks, logos).
- **Upstash Redis:**
    - Message broker for n8n workers.
- **API Communication:**
    - n8n → OpenClaw: HTTP request with image metadata.
    - OpenClaw → n8n: JSON response with generated content.

## Workflow Sequence
1. **User uploads** photo/video to Google Drive
2. **n8n Watcher** detects new file via Google Drive Trigger
3. **n8n processes** image (resize + watermark)
4. **n8n calls OpenClaw** for caption generation
5. **OpenClaw analyzes** image and generates caption + hashtags
6. **n8n sends preview** to Telegram (processed image + caption)
7. **User approves/rejects** via Telegram buttons
8. **If approved**, n8n publishes to Instagram + Facebook
9. **n8n logs** publication in Supabase

## Security & Reliability
- **Secrets Management:** Environment variables only.
- **Queueing:** Ensures tasks are not lost during peak API usage.
- **Pruning:** Automatic execution data pruning in n8n to stay within free tier limits.
