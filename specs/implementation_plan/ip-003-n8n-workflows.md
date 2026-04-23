# Epic ip-003: n8n Orchestrator - Main Workflow Coordinator

Goal: Build the complete n8n workflow that coordinates from media detection to publication.

## Tasks

### ip-003.1: Google Drive Watcher (Entry Point)
- [ ] **ip-003.1.1:** Configure Google Drive Trigger node to detect new photos/videos in specific folder.
- [ ] **ip-003.1.2:** Filter for valid media types (jpg, png, mp4, mov).
- [ ] **ip-003.1.3:** Extract file metadata (name, ID, created date, thumbnail link).

### ip-003.2: Image Processing Pipeline
- [ ] **ip-003.2.1:** Google Drive node: Download media using file ID.
- [ ] **ip-003.2.2:** Image Transformation: 
  - Resize for Facebook: 1080x1080 (square)
  - Resize for Instagram: 1080x1350 (portrait)
- [ ] **ip-003.2.3:** Watermark: Apply the Nenufar logo to bottom-left corner with 15% opacity.
- [ ] **ip-003.2.4:** Save processed images temporarily for preview.

### ip-003.3: OpenClaw Integration (Caption Generation)
- [ ] **ip-003.3.1:** HTTP Request node: Call OpenClaw API with image metadata.
- [ ] **ip-003.3.2:** Endpoint: `POST https://openclaw-instance/api/generate-caption`
- [ ] **ip-003.3.3:** Payload: `{ "file_url": "...", "file_name": "...", "drive_id": "..." }`
- [ ] **ip-003.3.4:** Parse response: Extract caption, hashtags, and metadata.

### ip-003.4: Telegram Approval Interface
- [ ] **ip-003.4.1:** Send photo preview (processed image) + caption to Telegram.
- [ ] **ip-003.4.2:** Implement inline keyboard with buttons:
  - ✅ **Aprobar:** Continue to publication
  - 🔄 **Editar:** Request modification from user
  - ❌ **Rechazar:** Cancel workflow
- [ ] **ip-003.4.3:** Wait for user response (Telegram Trigger node).
- [ ] **ip-003.4.4:** Branch workflow based on user action.

### ip-003.5: Social Media Publishing
- [ ] **ip-003.5.1:** Instagram Graph API: Upload processed image with caption.
- [ ] **ip-003.5.2:** Facebook Graph API: Upload processed image with caption.
- [ ] **ip-003.5.3:** Handle platform-specific requirements and API limits.

### ip-003.6: Logging and Notification
- [ ] **ip-003.6.1:** Log successful publication in Supabase `posts` table.
- [ ] **ip-003.6.2:** Store metadata: platform URLs, timestamps, file IDs.
- [ ] **ip-003.6.3:** Send success notification to Telegram with direct links to published posts.
- [ ] **ip-003.6.4:** Error handling: Send failure notification if publication fails.
