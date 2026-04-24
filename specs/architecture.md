# System Architecture: Nenufar Marketing Automation

## Overview
The system follows a "Brain & Arms" architectural pattern, decoupling decision-making from execution.

## 1. OpenClaw (The Brain)
- **Role:** Central Intelligence & Orchestration.
- **Platform:** Oracle Cloud (Always Free Tier).
- **Core Engine:** Node.js / Python with LLM integration (OpenAI/Anthropic).
- **Features:**
    - **RAG Engine:** Retrieves brand essence and product data from Supabase.
    - **Strategic Planner:** Determines content calendar based on `SOUL.md`.
    - **Copywriter:** Generates Spanish captions and hashtags.
    - **User Interface:** Telegram Bot for approvals and human-in-the-loop control.

## 2. n8n (The Arms)
- **Role:** Workflow Execution & Automation.
- **Platform:** Google Cloud e2-micro.
- **Endpoint:** `https://n8n-stack-prod-dev.duckdns.org/`
- **Deployment:** Docker with Queue Mode enabled.
- **Resource Limit:** 512MB RAM (NODE_OPTIONS).
- **Integrations:**
    - **Google Drive:** Source for raw media.
    - **Facebook/Instagram Graph API:** Posting destination.
    - **Supabase:** Persistence via Transaction Pooler (port 6543).
    - **Telegram:** Notification delivery.

## 3. Data & Communication Layer
- **Supabase Cloud:**
    - PostgreSQL database for metadata and logs.
    - Vector store for RAG embeddings.
    - Object storage for brand assets (watermarks, logos).
- **Upstash Redis:**
    - Message broker for n8n workers.
- **REST APIs / Webhooks:**
    - OpenClaw triggers n8n workflows via secure webhooks.
    - n8n sends status updates back to OpenClaw.

## Security & Reliability
- **Secrets Management:** Environment variables only.
- **Queueing:** Ensures tasks are not lost during peak API usage.
- **Pruning:** Automatic execution data pruning in n8n to stay within free tier limits.
