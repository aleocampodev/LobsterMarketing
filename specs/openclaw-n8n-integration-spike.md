# Spike: OpenClaw & n8n Integration

## Goal
Verify the communication flow between OpenClaw (decision) and n8n (execution) using secure webhooks and payload signing.

## Integration Workflow
1. **OpenClaw** generates a JSON payload:
   ```json
   {
     "task_id": "uuid",
     "media_path": "drive://folder/file.jpg",
     "caption": "...",
     "hashtags": ["...", "..."],
     "platforms": ["instagram", "facebook"]
   }
   ```
2. **OpenClaw** signs the payload using a shared `WEBHOOK_SECRET`.
3. **n8n** receives the webhook and validates the signature.
4. **n8n** starts the execution and returns a `202 Accepted` with an execution ID.

## Success Criteria
- [ ] Successful trigger of n8n from a local curl/Postman request.
- [ ] Payload correctly parsed by n8n.
- [ ] n8n can access the `media_path` in Google Drive.
- [ ] Status update sent from n8n back to OpenClaw via API.

## Risk Assessment
- **Rate Limits:** Instagram API limits can trigger if testing is too aggressive.
- **Connectivity:** Webhook exposure requires secure tunnels (Cloudflare Tunnels or similar) if instances are not public.
- **Latency:** Image processing in e2-micro might be slow; monitor worker timeouts.
