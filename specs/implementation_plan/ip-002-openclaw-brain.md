# Epic ip-002: Copywriting Service - OpenClaw/Luna

Goal: Build a specialized content generation service that receives image metadata from n8n and returns brand-consistent captions.

## Tasks

### ip-002.1: Environment and Connectivity (Oracle Cloud)
- [ ] **ip-002.1.1:** Install Node.js (v18+) or Python (3.10+) on the Oracle ARM instance.
- [ ] **ip-002.1.2:** Configure `.env.production` with:
    - `GEMINI_API_KEY` (Already provided).
    - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
    - `OPENCLAW_API_KEY` (For authentication from n8n).
- [ ] **ip-002.1.3:** Implement REST API endpoint `/api/generate-caption` (POST).

### ip-002.2: RAG Brain (Brand Memory)
- [x] **ip-002.2.1:** Execute SQL in Supabase for `brand_knowledge` and `brand_prompts` tables.
- [x] **ip-002.2.2:** Verify OpenClaw access to local brand documents (`soul.md`, `identity.md`).
- [x] **ip-002.2.3:** Luna is now aware of the brand voice through local file integration.

### ip-002.3: Visual Analysis and Generation (Luna)
- [ ] **ip-002.3.1:** Receive image metadata from n8n (file URL, name, drive ID).
- [ ] **ip-002.3.2:** Send image to Gemini 1.5 Flash (or 3.1 Flash) to extract: materials, colors, and weaving techniques.
- [ ] **ip-002.3.3:** Perform semantic search in Supabase to retrieve the related "Woven Poem" or story.
- [ ] **ip-002.3.4:** Construct the final caption + optimized hashtags.

### ip-002.4: API Response Format
- [ ] **ip-002.4.1:** Return JSON structure:
  ```json
  {
    "caption": "Poema tejido...",
    "hashtags": ["#Nenufar", "#JoyeríaArtesanal", ...],
    "suggested_time": "2024-04-23T19:00:00",
    "detected_elements": {
      "materials": ["Mostacilla Checa", "Piedras Naturales"],
      "technique": "Telar",
      "target_audience": "Mujer Audaz"
    }
  }
  ```

### ip-002.5: Authentication and Security
- [ ] **ip-002.5.1:** Implement API key authentication for n8n requests.
- [ ] **ip-002.5.2:** Rate limiting to prevent abuse.
- [ ] **ip-002.5.3:** Request logging for debugging.
