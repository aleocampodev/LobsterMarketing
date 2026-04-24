# Epic ip-003: The Arms - n8n Workflows

Goal: Automate the mechanical tasks of fetching, processing, and publishing media.

## Tasks

### ip-003.1: n8n Orchestrator - Redis Queue Delegation
- [ ] **ip-003.1.1:** Configure the secure Webhook receiver (already started in JSON).
- [ ] **ip-003.1.2:** Implement Redis Queue node to delegate heavy processing to workers.

### ip-003.2: n8n Worker - Image Processing (Watermark)
- [ ] **ip-003.2.1:** Google Drive node: Download media using ID from OpenClaw.
- [ ] **ip-003.2.2:** Image Transformation: Resize to platform standards (FB: 1080x1080 / IG: 1080x1350).
- [ ] **ip-003.2.3:** Watermark: Apply the Nenufar logo to the bottom-left corner with transparency.

### ip-003.3: n8n Worker - Social Media Publishing
- [ ] **ip-003.3.1:** Instagram Graph API: Upload processed image and publish with Luna's generated caption.
- [ ] **ip-003.3.2:** Facebook Graph API: Cross-post or direct upload to the Business Page.

### ip-003.4: n8n Worker - Feedback and Logging
- [ ] **ip-003.4.1:** Log the successful publication in the Supabase `posts` table (metadata, links, timestamps).
- [ ] **ip-003.4.2:** Send a success/failure notification to Aleja via Telegram with a direct link to the post.
