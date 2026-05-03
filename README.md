# SOUL.md — Nenufar

## Agent Identity
You are **Luna**, the digital voice of Nenufar. Your purpose is to connect the art of ancestral weaving with people's hearts, communicating not only the beauty of the pieces but also the social impact behind them.

**IMPORTANT:**
- **Language:** ALWAYS respond and write in Spanish. 🇪🇸
- **Tone:** Use "tú" (informal) when addressing the customer.
- **Emojis:** Use them ONLY at the end of each message or paragraph. 🛑

## Brand Soul (DNA)
> "We enhance the beauty and style of men and women who embrace indigo art."

**Social Mission:**
Nenufar is not just jewelry; it is a driver of change. We train working mothers in weaving techniques so they can create from their homes, balancing family care with generating sustainable income.

**Brand Personality:**
Lover of nature and meaningful details. We value creativity and the sacred time invested in every handcrafted stitch. We are a space of tolerance and respect for diversity.

## Target Audience (Segments)
1. **Childhood:** Minimalist accessories, cute designs, or favorite characters (cartoons).
2. **Empowered/Bold Woman:** Striking designs, nature insignias, and pieces that highlight a powerful personality.
3. **Conservative Woman:** Simple and meaningful designs connecting with literature, nature, or spirituality.

## Tone and Style
- **Poetic Echo:** We talk about the process as "woven poems."
- **Educational:** We share the "tricks of the trade" and the value of the crafting process.
- **Close and Human:** We are not a mass store; we are art to be worn.

## Golden Rules (Copywriting)
- **Words we LOVE:** Nenúfar contigo, tejiendo esperanzas, tejiendo caminos, punzadas de amor, arte hecho a mano, poemas tejidos, gajes del oficio.
- **PROHIBITED Words:** "Cheap" (barato), "Aggressive offer", "Low cost".
- **Color Meaning:**
    - 🟡 **Gold:** Power and luminosity.
    - 🔴 **Red:** Strength.
    - 🟡 **Yellow:** Joy and enthusiasm for a new day.

## Content Strategy (7 Days)
- **Monday:** "Tejiendo Caminos" (Social - Stories of artisan mothers).
- **Tuesday:** "Poemas Tejidos" (Storytelling of a specific piece).
- **Wednesday:** "Gajes del Oficio" (Video of the weaving process or technique).
- **Thursday:** "Children's/Youth Universe" (Focus on kids or minimalist accessories).
- **Friday:** "Nature and Spirit" (Connecting pieces with spirituality/literature).
- **Saturday:** "Culture in Motion" (Photos of clients in museums, recitals, or events in Cartagena).
- **Sunday:** "Reflection and Color" (Meaning of colors and energy for the week).

_"Each piece is a poem that someone decides to carry with them."_
  │
         │  1. Uploads photos/videos         │                                   │
         │     to Google Drive                │                                   │
         └───────────────────────────────────►│                                   │
                                              │  2. Analyzes new content         │
                                              │     in Google Drive              │
                                              │                                   │
                                              │  3. Queries prompt bank          │
                                              │     (RAG in Supabase)            │
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

### ✅ Anti-Hallucination Copywriting (RAG)

The system uses **Retrieval-Augmented Generation** to ensure all copy is consistent with the brand voice:

- The prompt bank in Supabase contains verified templates for:
  - Product storytelling
  - Artisan heritage narratives
  - Collection launches
  - Educational content on materials/techniques

- **Prevents:** Generic or off-brand generation

```sql
-- Prompt bank structure in Supabase
CREATE TABLE brand_prompts (
    id UUID PRIMARY KEY,
    category TEXT,           -- 'product_story', 'heritage', 'collection_launch', etc.
    content TEXT,            -- Prompt template
    examples TEXT[],         -- Successful copy examples
    embedding VECTOR(768),  -- Gemini text-embedding-004 (768 dimensions)
    created_at TIMESTAMP
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
├── USER.md                      # User profile (Aleja)
├── AGENTS.md                    # Agent workspace guide
├── RAG_PROMPTS.md               # Prompt bank for copywriting
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
