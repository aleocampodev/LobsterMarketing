# Nenufar Marketing Automation

Nenufar is an intelligent marketing automation system designed for Colombian Ancestral Jewelry. It follows a **Brain-Arms pattern**, utilizing **OpenClaw (Luna)** as the creative brain and **n8n** as the execution arms to manage content creation, image processing, and social media publishing.

---

## 🚀 Operational Flow

```text
                                              │  1. Uploads photos/videos         │
                                              │     to Google Drive                │
                                              └───────────────────────────────────►│
                                                                                   │  2. Analyzes new content
                                                                                   │     in Google Drive
                                                                                   │
                                                                                   │  3. Queries templates bank
                                                                                   │     (Supabase)
                                                                                   │     for brand-voice
                                                                                   │     copywriting
                                                                                   │
                                                                                   │  4. Trend scraping
                                                                                   │     (Firecrawl + Graph API)
                                                                                   │     for strategic hashtags
                                                                                   │
                                                                                   │  5. Generates optimized copy
                                                                                   │     + hashtags
                                                                                   │
                                              │  6. Sends preview via Telegram    │
                                              ◄───────────────────────────────────│
                                              │                                    │
                                         APPROVAL                                 │
                                              │                                    │
                                         (Approve/Modify/Cancel)                  │
                                              │                                    │
                                              │  7. Confirms publication           │
                                              └───────────────────────────────────►│
                                                                                   │  8. Sends task to n8n
                                                                                   │     (via API/Webhook)
                                                                                   └─────────────────────────────────►
                                                                                                                │
                                                                                                                │  9. Retrieves media from
                                                                                                                │     Google Drive
                                                                                                                │
                                                                                                                │ 10. Converts image
                                                                                                                │     (FB:1080x1080 / IG:1080x1350)
                                                                                                                │
                                                                                                                │ 11. Applies watermark
                                                                                                                │     Nenufar (logo)
                                                                                                                │
                                                                                                                │ 12. Publishes on FB + IG
                                                                                                                │     with copy and hashtags
                                                                                                                │
                                                                                                                │ 13. Logs analytics
                                                                                                                │     in Supabase
                                                                                                                │
                                                                                                                │ 14. Notifies user
                                                                                                                │     via Telegram
                                                                                                                ▼
```

---

## 🧩 Key Features

### ✅ Consistent Copywriting (Templates Bank)

The system uses a **Templates Bank** approach to ensure all copy is consistent with the brand voice and optimized for token usage:

- The templates bank in Supabase contains verified structures for:
  - Product storytelling
  - Artisan heritage narratives
  - Collection launches
  - Educational content on materials/techniques

- **Prevents:** Generic or off-brand generation and Hallucination.

```sql
-- Templates bank structure in Supabase
CREATE TABLE nenufar.templates_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id TEXT UNIQUE NOT NULL,           -- e.g., 'story_artisan_01'
    category TEXT NOT NULL,                     -- story, product, engagement, fallback
    content TEXT NOT NULL,                      -- Template with {{variables}}
    variables TEXT[],                           -- List of expected variables
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 📈 Intelligent Hashtag Strategy

**Scraping + Analysis:**

| Tool | Purpose |
|-------------|-----------|
| **Firecrawl** | Extract trends from competitors and jewelry niche |
| **Graph API** | Analyze top-performing posts in the niche |

### 📱 Platform-Optimized Publishing

| Platform | Format | Watermark | Timing Strategy |
|------------|---------|---------------|---------------------|
| **Facebook Feed** | 1080x1080 (square) | Bottom right, 15% opacity | Peak engagement hours (9am-11am, 7pm-9pm) |
| **Instagram Feed** | 1080x1350 (portrait) | Bottom right, 15% opacity | Peak engagement hours (same as FB) |
| **Instagram Stories** | 1080x1920 (vertical) | Animated, corner | 24h cycle with reminders |
| **Reels** | 1080x1920 (vertical) | Subtle, non-intrusive | Trending audio + educational value |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Brain** | OpenClaw (Luna) | AI agent with eco-poetic voice |
| **LLM** | Gemini 2.0 Flash | Content generation + intent classification |
| **Templates** | Supabase / Markdown | Brand knowledge & pre-defined copy |
| **Interface** | Telegram Bot | Human-in-the-loop approval |
| **Broker** | Upstash Redis | Task queue between Brain and Arms |
| **Workers** | n8n (GCP e2-micro) | Image processing, publishing, logging |
| **Database** | Supabase PostgreSQL | Long-term memory + analytics |
| **Assets** | Google Drive | Media storage |
| **Publishing** | Meta Graph API | Instagram + Facebook |

---

## 📊 Project Status

| Epic | Description | Status |
|:-----|:------------|:-------|
| **ip-001** | Infrastructure Setup | ✅ Completed |
| **ip-002** | Brain — OpenClaw (Luna) + Telegram | 🔄 In Progress |
| **ip-003** | Arms — n8n Workers | 🔄 In Progress |
| **ip-004** | Integration Testing | ⏳ Pending |
| **ip-005** | Production Launch | ⏳ Pending |
| **ip-006** | Supabase Improvements | ✅ Completed |

---

## 📜 Project Structure

```
LobsterMarketing/
├── README.md                    # This file
├── SOUL.md                      # Agent identity and soul
├── USER.md                      # User profile (Shirley)
├── AGENTS.md                    # Agent workspace guide (v1.1)
├── TOOLS.md                     # Local tool notes
├── HEARTBEAT.md                 # Heartbeat configuration
├── MEMORY.md                    # Long-term memory
├── IDENTITY.md                  # Agent identity
├── specs/                       # Technical and brand specifications
└── memory/                      # Daily logs
```

---

## 🌸 Brand Quick Reference

### Voice
- **Tone:** Eco-poetic, close, professional
- **Language:** Colombian Spanish, always "tú"
- **Narrative:** "Poemas tejidos" (Woven poems) — each piece is a poem

### Keywords
Nenúfar contigo · Tejiendo esperanzas · Tejiendo caminos · Punzadas de amor · Arte hecho a mano · Poemas tejidos · Gajes del oficio

### 7-Day Content Strategy

| Day | Theme | Focus |
|:----|:------|:------|
| Monday | Tejiendo Caminos | Social impact, artisan mothers |
| Tuesday | Poemas Tejidos | Storytelling of a specific piece |
| Wednesday | Gajes del Oficio | Weaving process & techniques |
| Thursday | Universo Infantil | Kids & minimalist accessories |
| Friday | Naturaleza y Espíritu | Spirituality & meaningful designs |
| Saturday | Cultura en Movimiento | Clients at cultural events in Cartagena |
| Sunday | Reflexión y Color | Color meanings & weekly energy |

---

**Built with 💛 for Nenufar — Colombian Ancestral Jewelry**

_"Each piece carries a story. Our mission is to ensure that story is told well."_
