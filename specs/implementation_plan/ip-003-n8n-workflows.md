# Epic ip-003: The Arms - n8n Workflows

**Goal:** Automate the mechanical tasks of fetching, processing, and publishing media.

**Status:** ✅ Completed (2026-04-24)

---

## Tasks

### ip-003.1: n8n Orchestrator - Redis Queue Delegation
- [x] **ip-003.1.1:** Configure the secure Webhook receiver (Luna Webhook Receiver - EPslgKTzkbLcxdrs)
- [x] **ip-003.1.2:** Implement Redis Queue node to delegate heavy processing to workers
- [x] **ip-003.1.3:** Configure HMAC signature validation with WEBHOOK_SECRET
- [x] **ip-003.1.4:** Active workflow in production

### ip-003.2: n8n Worker - Image Processing (Watermark)
- [x] **ip-003.2.1:** Google Drive node: Download media using ID from OpenClaw (Luna Image Processor Worker - yGrcQFekZSnWUlDF)
- [x] **ip-003.2.2:** Image Transformation: Resize to platform standards (FB: 1080x1080 / IG: 1080x1350)
- [x] **ip-003.2.3:** Watermark: Apply the Nenufar logo to the bottom-left corner with transparency
- [x] **ip-003.2.4:** Active workflow in production

### ip-003.3: n8n Worker - Social Media Publishing
- [x] **ip-003.3.1:** Instagram Graph API: Upload processed image and publish with Luna's generated caption (Luna Social Publisher Worker - NlSGA3RcvMw6oC3h)
- [x] **ip-003.3.2:** Facebook Graph API: Cross-post or direct upload to the Business Page
- [x] **ip-003.3.3:** Active workflow in production

### ip-003.4: n8n Worker - Feedback and Logging
- [x] **ip-003.4.1:** Log the successful publication in the Supabase `posts` table (metadata, links, timestamps) (Luna Feedback and Logging Worker - v7j1Dv1mgO5ZUgmG)
- [x] **ip-003.4.2:** Send a success/failure notification to Aleja via Telegram with a direct link to the post
- [x] **ip-003.4.3:** Active workflow in production

---

## Related Files

### Workflows Created
- `Luna Webhook Receiver` (ID: EPslgKTzkbLcxdrs) - Orchestrator with Redis Queue
- `Luna Image Processor Worker` (ID: yGrcQFekZSnWUlDF) - Image processing + watermark
- `Luna Social Publisher Worker` (ID: NlSGA3RcvMw6oC3h) - Instagram + Facebook publishing
- `Luna Feedback and Logging Worker` (ID: v7j1Dv1mgO5ZUgmG) - Supabase logging + Telegram notifications

### Credentials Configured
- Upstash Redis Queue (ID: 0Kt51mAkW9dMB3aj)
- Telegram Bot Token
- Supabase (PostgreSQL pooler port 6543)
- Google Drive API
- WEBHOOK_SECRET (generated: fe4f2ef63ed74d0fab3a73471f95f8646f51961ebacffbf9ad2ad55a3157a47f)

---

## Next Steps

Conectar el sistema multi-agent (ip-002.5) con estos workflows ya existentes:
- Luna Telegram Agent → Luna Webhook Receiver
- Approval flow → Redis Queue → Workers
