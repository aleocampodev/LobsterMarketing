# Implementation Plan: Phase 1

## Phase 1: Infrastructure Setup (Week 1)
- [ ] **Cloud Provisioning:** Setup Oracle Cloud (OpenClaw) and Google Cloud (n8n) free instances.
- [ ] **Database Setup:** Initialize Supabase project and create schemas for `brand_prompts` and `posts`.
- [ ] **Redis Connection:** Configure Upstash Redis for n8n queue mode.

## Phase 2: OpenClaw Core (Week 2)
- [ ] **RAG Implementation:** Load `specs/*.md` into Supabase vector store.
- [ ] **Telegram Bot:** Build the basic approval flow (Receive task -> Approve/Edit -> Trigger n8n).
- [ ] **Content Engine:** Integrate OpenAI text-generation using `RAG_PROMPTS.md`.

## Phase 3: n8n Workflows (Week 3)
- [ ] **Media Pipeline:** Build workflow to fetch from Google Drive, resize for IG/FB, and apply watermark.
- [ ] **Posting Logic:** Implement Instagram/Facebook Graph API nodes.
- [ ] **Analytics Sync:** Build workflow to fetch post performance and save to Supabase.

## Phase 4: Integration & Testing (Week 4)
- [ ] **End-to-End Test:** Run a full cycle from Drive upload to Telegram notification.
- [ ] **Security Audit:** Verify RLS in Supabase and OAuth scopes.
- [ ] **Deployment:** Finalize environment variables and setup monitoring heartbeats.
