# Epic ip-003: The Arms - n8n Workflows

Goal: Automate the mechanical tasks of fetching, processing, and publishing media.

## Tasks
- [ ] **ip-003.1:** Create Google Drive API credentials and configure the n8n Drive node.
- [ ] **ip-003.2:** Configure Facebook & Instagram Graph API credentials in n8n.
- [ ] **ip-003.3:** **Workflow 1 (Media Fetch & Process):** Receive webhook from OpenClaw -> Download image from Drive -> Resize/Format (FB: 1080x1080, IG: 1080x1350) -> Apply Nenufar watermark.
- [ ] **ip-003.4:** **Workflow 2 (Publishing):** Take processed image + caption + hashtags -> Publish to FB/IG Graph APIs.
- [ ] **ip-003.5:** **Workflow 3 (Feedback Loop):** Catch publishing success/failure -> Update Supabase `posts` table -> Send Telegram notification to Aleja.
