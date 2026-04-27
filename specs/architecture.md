# System Architecture: Nenufar Marketing Automation

## Overview
The system follows an **n8n-First Orchestration** pattern, where the decision-making (Brain) and execution (Arms) are unified within a single automated ecosystem.

## 1. The Orchestrator (The Brain)
- **Role:** Central Intelligence, Strategic Planning & User Interface.
- **Platform:** n8n (Google Cloud e2-micro).
- **Core Engine:** Google Gemini 2.5 Flash.
- **Features:**
    - **Unified Assistant:** Handles conversational interface (Telegram), voice transcription, and content generation.
    - **Contextual Memory:** Uses Buffer Window memory to maintain conversation flow.
    - **Strategic Logic:** Directly integrates brand essence (`SOUL.md`) and RAG prompts into the LLM system message.
    - **Approval Gate:** Manages the human-in-the-loop validation via Telegram buttons.

## 2. Sub-Workflows (The Workers)
- **Role:** Atomic Task Execution & Scalability.
- **Platform:** n8n Docker (Queue Mode) with Upstash Redis.
- **Workflows:**
    - **Webhook Receiver:** Secure entry point that validates signatures and routes tasks.
    - **Image Processor v2:** Specialized in media handling (Download from Drive, Resize, Watermarking).
    - **Social Publisher:** Manages direct integration with Meta Graph API (Instagram/Facebook).
    - **Feedback & Logging:** Ensures observability by persisting data to Supabase and notifying the user.

## 3. Infrastructure & Data Layer
- **Google Cloud Platform:** Hosts the n8n Docker instance.
- **Supabase Cloud:**
    - PostgreSQL for execution logs and metadata.
    - Vector Store for brand knowledge (RAG).
- **Upstash Redis:**
    - Serves as the message broker for n8n workers, ensuring high availability and task persistence.
- **Google Drive:** Primary source for raw media assets.

## Security & Reliability
- **End-to-End Encryption:** Secured via HTTPS and Webhook HMAC signatures.
- **Queue Mode:** Decouples the orchestrator from heavy processing tasks, preventing memory overflows in the e2-micro instance.
- **Free Tier Optimization:** Architected to stay within the limits of Google Cloud Free Tier, Supabase Free, and Upstash Free.
