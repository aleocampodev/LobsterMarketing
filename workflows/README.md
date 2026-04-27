# 📁 n8n Workflows - Nenufar Marketing Automation

This folder contains the 5 active workflows that make up the marketing automation system for Nenufar.

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     LUNA MULTI-AGENT SYSTEM v2                  │
│                    ORCHESTRATOR - Telegram AI Interface         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   LUNA WEBHOOK RECEIVER                         │
│                  Sub-workflow - Approval receiver               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ IMAGE V2      │    │  PUBLISHER    │    │  FEEDBACK     │
│ Sub-workflow  │    │ Sub-workflow  │    │ Sub-workflow  │
└───────────────┘    └───────────────┘    └───────────────┘
```

## 📋 Workflows

### 🤖 ORCHESTRATOR

#### 1. Luna Multi-Agent System v2
**File:** `luna-multi-agent-v2.json`  
**ID:** `mKssn8hROxLNWWVH`  
**Type:** Orchestrator  
**Purpose:** Main orchestrator with Telegram interface

**Features:**
- Ultimate Assistant with eco-poetic voice (Colombian Spanish)
- Google Gemini 2.5 Flash as LLM
- Think + Calculator tools
- Simple Memory (Buffer Window)
- Text and voice support

**Credentials:**
- Google Generative AI
- Telegram API

---

### ⚙️ SUB-WORKFLOWS (Workers)

#### 2. Luna Webhook Receiver
**File:** `luna-webhook-receiver.json`  
**ID:** `EPslgKTzkbLcxdrs`  
**Type:** Sub-workflow  
**Purpose:** Receives Luna approvals and distributes tasks

**Features:**
- Webhook with HMAC validation
- Redis Queue (Upstash)
- Distributes tasks to workers

**Credentials:**
- Upstash Redis Queue

#### 3. Luna Image Processor Worker v2
**File:** `luna-image-processor-v2.json`  
**ID:** `3JGieW6MBlANnaud`  
**Type:** Sub-workflow  
**Purpose:** Processes images with Nenufar watermark

**Features:**
- Downloads from Google Drive
- Resizes (FB: 1080x1080, IG: 1080x1350)
- Applies watermark

**Credentials:**
- Google Drive

#### 4. Luna Social Publisher Worker
**File:** `luna-social-publisher.json`  
**ID:** `dENMnialkmtgKCo7`  
**Type:** Sub-workflow  
**Purpose:** Publishes to Instagram and Facebook

**Features:**
- Facebook/Instagram Graph API
- Publishes captions with hashtags
- Multi-platform support

**Credentials:**
- Facebook Graph API

#### 5. Luna Feedback and Logging Worker
**File:** `luna-feedback-logging.json`  
**ID:** `v7j1Dv1mgO5ZUgmG`  
**Type:** Sub-workflow  
**Purpose:** Supabase logging and notifications

**Features:**
- Logs execution to Supabase
- Sends Telegram notifications
- Analytics tracking

**Credentials:**
- Supabase
- Telegram API

---

## 🔧 Required Credentials

| Credential | Type | Used by Workflows |
|------------|------|-------------------|
| Google Generative AI | googlePalmApi | Multi-Agent v2 |
| Telegram API | telegramApi | Multi-Agent v2, Feedback |
| Upstash Redis Queue | redis | Webhook Receiver, Image V2, Publisher |
| Google Drive | googleDriveOAuth2Api | Image Processor v2 |
| Facebook Graph API | facebookGraphApi | Social Publisher |
| Supabase | supabaseApi | Feedback Worker |
| Header Auth | httpHeaderAuth | Webhooks |

---

## 📦 Installation

To import these workflows into your n8n instance:

1. Go to n8n → Workflows → Import from File
2. Select the corresponding JSON file
3. Configure the necessary credentials
4. Activate the workflow

## ⚠️ Important Notes

- **Activation order:** Activate workers first (Webhook Receiver, Image Processor, Social Publisher, Feedback), then the Multi-Agent System orchestrator
- **Environment variables:** Configure `.env.production` with the correct credentials
- **Redis Queue:** Ensure Upstash Redis is properly configured
- **Webhook URLs:** Webhook URLs may vary depending on your n8n instance configuration

## 🚀 Testing

To test the system:

1. Send a message to the Telegram bot
2. Verify that Ultimate Assistant responds in Colombian Spanish
3. Test caption generation with eco-poetic voice
4. Verify the complete flow to publication (if configured)

## 📈 Metrics

- **Total workflows:** 5 (1 orchestrator + 4 sub-workflows)
- **Total nodes:** 31
- **Credentials:** 7
- **Connections:** 20+
- **Triggers:** 2 (Telegram, Webhook)

---

**Last updated:** 2026-04-27  
**Status:** ✅ Production ready
