# Nenufar Marketing Automation

> _"Cada pieza es un poema que alguien decide llevar consigo."_

Sistema de marketing automatizado para **Nenufar**, joyeria artesanal colombiana. Integra generacion de contenido AI con automatizacion de workflows para publicar en Instagram y Facebook con voz eco-poetica.

---

## Architecture

```text
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║   🌸  NENUFAR MARKETING AUTOMATION  🌸                               ║
║   Brain-Arms Architecture · Gemini 2.5 Flash                         ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝


 ┌───────────────────────────────────────────────────────────────────┐
 │  🧠  THE BRAIN — OPENCLAW (LUNA)                                 │
 │     AI Agent · Gemini 2.5 Flash + RAG · Telegram Interface       │
 │                                                                   │
 │  ① LISTEN    Telegram Messages (Voice, Text, Media)               │
 │  ② THINK     Gemini 2.5 Flash + RAG (Supabase pgvector)          │
 │  ③ CRAFT     "Poemas Tejidos" (Eco-Poetic Voice)                 │
 │  ④ INTERACT  Request Approval (Telegram ✅/🔄/❌ Buttons)         │
 │  ⑤ DISPATCH  Sign Payload (HMAC) → Push to Redis Queue           │
 └──────┬──────────────┬────────────────────┬────────────────────────┘
        │              │                    │
        ▼              ▼                    ▼
 ┌────────────┐ ┌──────────────┐ ┌─────────────────┐
 │ 📱 Telegram │ │ 🗄️ Supabase  │ │ 🔀 Redis Queue  │
 │ Bot API     │ │ (Memory/RAG) │ │ (Dispatch)      │
 └────────────┘ └──────────────┘ └────────┬────────┘
                                           │
                                           ▼
 ┌───────────────────────────────────────────────────────────────────┐
 │  🦾  THE ARMS — n8n WORKERS                                      │
 │                                                                   │
 │  [ 🛡️ RECEIVER  ]  Validate HMAC Signature                        │
 │  [ 🎨 PROCESSOR ]  Download from Drive + Sharp Watermark          │
 │  [ 📡 PUBLISHER ]  Meta Graph API (Instagram & Facebook)          │
 │  [ 📝 SCRIBE    ]  Log Status & Notify (Supabase + Telegram)      │
 └───────────────────────────────────────────────────────────────────┘


 ══════════════════════════════════════════════════════════════════════
  🔄 OPERATIONAL FLOW
 ══════════════════════════════════════════════════════════════════════

  ① DRIVE SYNC     →  ② HEARTBEAT    →  ③ LUNA DRAFT    →  ④ APPROVAL
     New media          Scan detected      RAG + Caption       Telegram
                                                                Buttons
                                                                    │
  ⑤ REDIS PUSH     →  ⑥ n8n PULL    →  ⑦ IMAGE PROC    →  ⑧ PUBLISH
     Queue task         Worker ready       Watermark/Resize     Meta API
                                                                    │
  ⑨ LOG (Supabase) →  ⑩ FEEDBACK (Telegram)  ✅ Done!
```

---

## Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Brain** | OpenClaw (Luna) | AI agent with eco-poetic voice |
| **LLM** | Gemini 2.5 Flash | Content generation + intent classification |
| **RAG** | Supabase pgvector | Brand knowledge semantic search |
| **Interface** | Telegram Bot | Human-in-the-loop approval |
| **Broker** | Upstash Redis | Task queue between Brain and Arms |
| **Workers** | n8n (GCP e2-micro) | Image processing, publishing, logging |
| **Database** | Supabase PostgreSQL | Long-term memory + analytics |
| **Assets** | Google Drive | Media storage |
| **Publishing** | Meta Graph API | Instagram + Facebook |

---

## Project Status

| Epic | Description | Status |
|:-----|:------------|:-------|
| **ip-001** | Infrastructure Setup | ✅ Completed |
| **ip-002** | Brain — OpenClaw (Luna) + Telegram | 🔄 In Progress |
| **ip-003** | Arms — n8n Workers | ⏳ Pending |
| **ip-004** | Integration Testing | ⏳ Pending |
| **ip-005** | Production Launch | ⏳ Pending |

---

## Project Structure

```
LobsterMarketing/
├── README.md                           # This file
├── SOUL.md                             # Luna's identity and brand voice
├── USER.md                             # Aleja's profile and preferences
├── AGENTS.md                           # Agent operating manual (rules)
├── CONTRIBUTING.md                     # How this repo works (workflow)
├── MEMORY.md                           # Long-term system memory
├── IDENTITY.md                         # Agent identity config
├── HEARTBEAT.md                        # Heartbeat configuration
├── TOOLS.md                            # Local tool notes
├── RAG_PROMPTS.md                      # Prompt bank reference
├── TESTING_GUIDE.md                    # RAG + watermark testing guide
│
├── specs/                              # Technical & brand specifications
│   ├── architecture.md                 # System architecture (Brain-Arms)
│   ├── data_architecture.md            # Supabase schema & RPC functions
│   ├── database_schema.sql             # Full SQL migration script
│   ├── brand_essence.md                # Brand DNA, voice, keywords
│   ├── product_catalog.md              # Materials, techniques, pricing
│   ├── social_impact.md                # Artisan mothers mission
│   ├── telegram_commands.md            # Bot command reference
│   ├── rag_prompts_bank.md             # RAG prompt templates
│   ├── rag_integration_summary.md      # RAG implementation details
│   ├── user_engagement_system.md       # Engagement engine design
│   ├── engagement_questions_library.md # Pre-approved daily questions
│   ├── analytics_system.md             # Analytics & optimization
│   ├── openclaw-n8n-integration-spike.md # Integration spike notes
│   │
│   ├── implementation_plan/            # Epic-based task breakdown
│   │   ├── INDEX.md                    # Overview & status
│   │   ├── ip-001-infrastructure.md
│   │   ├── ip-002-luna-brain-interface.md
│   │   ├── ip-003-n8n-workflows.md
│   │   ├── ip-004-integration-testing.md
│   │   └── ip-005-production-launch.md
│   │
│   └── tests/                          # E2E validation reports
│       ├── test-ip-001.md
│       └── test-standardization-architecture.md
│
├── scripts/                            # Utility scripts
│   └── setup-vector-store.sql          # RAG vector store setup
│
├── memory/                             # Daily session logs
└── workflows/                          # n8n workflow JSON files (TBD)
```

---

## Brand Quick Reference

### Voice
- **Tone:** Eco-poetico, cercano, profesional
- **Language:** Espanol colombiano, siempre "tu"
- **Narrative:** "Poemas tejidos" — cada pieza es un poema

### Keywords
Nenufar contigo · Tejiendo esperanzas · Tejiendo caminos · Punzadas de amor · Arte hecho a mano · Poemas tejidos · Gajes del oficio

### 7-Day Content Strategy

| Day | Theme | Focus |
|:----|:------|:------|
| Monday | Tejiendo Caminos | Social impact, artisan mothers |
| Tuesday | Poemas Tejidos | Storytelling of a specific piece |
| Wednesday | Gajes del Oficio | Weaving process & techniques |
| Thursday | Universo Infantil | Kids & minimalist accessories |
| Friday | Naturaleza y Espiritu | Spirituality & meaningful designs |
| Saturday | Cultura en Movimiento | Clients at cultural events in Cartagena |
| Sunday | Reflexion y Color | Color meanings & weekly energy |

---

**Built with 💛 for Nenufar — Colombian Ancestral Jewelry**

_"Cada pieza lleva una historia. Nuestra mision es asegurarnos de que esa historia se cuente bien."_
