# Nenufar Marketing Automation

Nenufar is an intelligent marketing automation system designed for Colombian Ancestral Jewelry. It follows a **Brain-Arms pattern**, utilizing **OpenClaw (Luna)** as the creative brain and **n8n** as the execution arms to manage content creation, image processing, and social media publishing.

---

## 🚀 Operational Flow
         │  1. Uploads photos/videos         │                                   │
         │     to Google Drive                │                                   │
         └───────────────────────────────────►│                                   │
                                              │  2. Analyzes new content         │
                                              │     in Google Drive              │
                                              │                                   │
                                              │  3. Queries templates bank        │
                                              │     (Supabase)                   │
                                              │     for brand-voice              │
                                              │     copywriting                  │
                                              │                                   │
                                              │  4. Trend scraping               │
                                              │     (Firecrawl + Graph API)      │
                                              │     for strategic hashtags       │
                                              │                                   │
                                              │  5. Generates optimized copy     │
                                              │     + hashtags                   │
                                              │                                   │
         │  6. Sends preview via Telegram    │                                   │
         ◄───────────────────────────────────│                                   │
         │                                    │                                   │
    APPROVAL                                 │                                   │
         │                                    │                                   │
    (Approve/Modify/Cancel)                  │                                   │
         │                                    │                                   │
         │  7. Confirms publication           │                                   │
         └───────────────────────────────────►│                                   │
                                              │  8. Sends task to n8n            │
                                              │     (via API/Webhook)            │
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

**Hashtag Combination:**
- **Evergreen Niche:** #JoyeríaAncestral #Mostacilla #HechoEnCartagena #ArtisanJewelry
- **Brand:** #NenufarJoyería #NenufarAncestral #Nenufar #JoyasConAlma
- **Daily Trends:** Algorithmically optimized based on Scraping
- **Campaign:** Specific tags for collections or launches

### 📱 Platform-Optimized Publishing

| Platform | Format | Watermark | Timing Strategy |
|------------|---------|---------------|---------------------|
| **Facebook Feed** | 1080x1080 (square) | Bottom right, 15% opacity | Peak engagement hours (9am-11am, 7pm-9pm) |
| **Instagram Feed** | 1080x1350 (portrait) | Bottom right, 15% opacity | Peak engagement hours (same as FB) |
| **Instagram Stories** | 1080x1920 (vertical) | Animated, corner | 24h cycle with reminders |
| **Reels** | 1080x1920 (vertical) | Subtle, non-intrusive | Trending audio + educational value |

---

## 🛠️ Configuration and Deployment

### Prerequisites

- [ ] Oracle Cloud account (Free Tier)
- [ ] Google Cloud account (Free Tier)
- [ ] Upstash Redis (Free tier)
- [ ] Supabase (Free tier)
- [ ] Telegram Bot Token (@BotFather)
- [ ] Google Drive API credentials
- [ ] Facebook & Instagram Developer access

### Environment Variables

See the original documentation for detailed environment variables.

---

## 📊 Monitoring and Maintenance

### Health Checks

| Component | Endpoint/Command | Expected Response |
|------------|------------------|-------------------|
| OpenClaw | `GET /health` | `{ "status": "ok", "brand_loaded": true }` |
| n8n | `GET /healthz` | `{ "status": "up" }` |
| Redis | `redis-cli ping` | `PONG` |
| Supabase | API health endpoint | `200 OK` |

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

**Created with 💛 for Nenufar - Colombian Ancestral Jewelry**

*"Each piece carries a story. Our mission is to ensure that story is told well."*
