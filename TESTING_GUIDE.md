# 🧪 Testing Guide - Nenufar Marketing Automation
Version: v1.1

## 🎯 Objective
Test the complete implementation of the Nenufar system, focusing on:
- **Luna Brain Interface:** Content generation via Templates Bank.
- **Image Processing:** Resizing and watermarking.
- **n8n Automation:** Worker execution and social publishing.

---

## 📋 Prerequisites

### 1. Gemini API Configuration
Configured in n8n/OpenClaw: **"Google Generative AI"** (Gemini 2.0 Flash)

### 2. Supabase
- URL: `https://your-project-id.supabase.co`
- Schema: `nenufar`
- Key Tables: `templates_bank`, `processed_files`, `monitoring_logs`

### 3. Google Drive
- Logo File ID: `1IqV6LcrVuZPl9iBdQCPjgro1WYhFB5UQ`
- Existing credentials: **"Google Drive account"**

---

## 🚀 STEP 1: Verify Templates Bank (3 minutes)

1. **Check Supabase Data**
   ```sql
   SELECT template_id, category, variables 
   FROM nenufar.templates_bank;
   ```

2. **Verify categories**
   - Ensure you have templates for: `story`, `product`, `engagement`, `fallback`.

---

## 🔥 STEP 2: Test Luna Brain Interface (5 minutes)

1. **Telegram Interaction**
   - Send a message to the Luna Telegram Bot: *"Hola Luna, redacta un post para unos aretes de mostacilla inspirados en la naturaleza."*
   
2. **Observe Response**
   - Luna should use the **Eco-Poetic** voice.
   - Luna should provide a draft based on a template from `templates_bank`.
   - Luna should present ✅/🔄/❌ buttons.

3. **Approve Draft**
   - Click the ✅ (Approve) button.
   - Verify that the task is dispatched via HMAC webhook to n8n.

---

## 🖼️ STEP 3: Test Image Processing (5 minutes)

1. **Upload a test image**
   - Go to Google Drive and upload an image (e.g., `test-photo.jpg`).
   - Copy the File ID.

2. **Verify Watermark Workflow**
   - Ensure "Luna Image Processor Worker v2" is active.
   - It should resize the image to 1080x1350 (IG) or 1080x1080 (FB) and apply the Nenufar watermark.

3. **Check Status in Supabase**
   ```sql
   SELECT file_name, status, processed_at 
   FROM nenufar.processed_files 
   WHERE file_id = 'YOUR_FILE_ID'
   ORDER BY created_at DESC;
   ```

---

## 🔍 STEP 4: End-to-End Validation

1. **Full Flow Test**
   - Trigger a Heartbeat or manually start the "Luna Heartbeat" workflow.
   - Verify that new media in Drive is detected and Luna notifies you via Telegram.
   - Complete the approval and verify the post is published to the test Meta accounts.

---

## 🐛 Troubleshooting

### Error: "Template not found"
**Solution:** Ensure the `nenufar.templates_bank` table is populated as per `specs/templates_bank.md`.

### Error: "Watermark not applied"
**Solution:** 
1. Verify that the logo exists in Google Drive.
2. Check `Sharp` library logs in the n8n worker.

### Error: "Gemini Hallucination"
**Solution:** Refine the templates in `templates_bank` and ensure Luna's system prompt strictly follows `AGENTS.md`.

---

## ✅ Final Checklist

```
Brain Integration:
□ Templates Bank populated
□ Eco-Poetic voice confirmed
□ Telegram buttons functional
□ Webhook dispatch working

Image Processing:
□ Resize (1080x1350 / 1080x1080)
□ Watermark applied (15% opacity)
□ Metadata logged in Supabase

System Resilience:
□ Monitoring logs updated
□ Heartbeat detects new files
□ Stalled tasks auto-requeued
```

---

**Created with 💛 for Nenufar - Colombian Ancestral Jewelry**
