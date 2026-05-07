# ADR 004: Oracle Cloud as Media Processor Worker
Version: v1.0

## 1. Context and Problem

The n8n instance runs on a GCP e2-micro (0.25 vCPU, 1GB RAM). Processing high-resolution images (resize, watermark, format conversion) within n8n on this instance risks OOM crashes, especially with files larger than 5MB. The system needs to support images (and future video) for Instagram and Facebook publishing.

Previously (ADR-001), Redis Queue Mode was used to buffer tasks against OOM crashes. Redis was removed (ADR-003) in favor of direct webhooks, but the underlying problem remains: e2-micro has insufficient resources for media processing.

Additionally, the system already has an Oracle Cloud VM running OpenClaw (Luna) on the OCI Free Tier ARM Ampere A1, which provides up to 4 OCPU + 24GB RAM — vastly more powerful than e2-micro, at zero cost.

## 2. Considered Options

1. **Process in n8n on e2-micro (Status Quo):** Risk of OOM crashes on large images. No video capability.
2. **Upgrade GCP instance:** Move to e2-small/medium ($10-25/month). Still limited for video.
3. **Oracle Cloud Media Processor:** Deploy a lightweight Node.js API on the existing OCI VM. n8n delegates heavy processing to Oracle via HTTP. Zero additional cost.

## 3. Decision

We decided to implement **Option 3 (Oracle Cloud Media Processor)**.

A dedicated `/process` endpoint on the Oracle VM receives download URLs and operation parameters from n8n, performs all heavy media processing (Sharp for images, future ffmpeg for video), and returns the processed result as base64.

## 4. Justification

* **Performance:** ARM A1 (4 OCPU, 24GB RAM) vs e2-micro (0.25 vCPU, 1GB RAM) = **16x more CPU, 24x more RAM**.
* **Zero Cost:** OCI Free Tier includes the ARM A1 instance. No new billing.
* **No OOM Risk on e2-micro:** The GCP instance only passes HTTP requests/responses. It never loads image data into memory.
* **Colocation with Brain:** OpenClaw already runs on this VM. Same network = minimal latency between Brain and Processor.
* **Future-Proof:** The same service can be extended with ffmpeg for video processing (compression, resize, codec optimization, Reels, Stories).
* **Security Preserved:** HMAC signature validation on every request (same `WEBHOOK_SECRET`).

## 5. Consequences

* **Network Dependency:** n8n on GCP depends on Oracle VM being reachable. If Oracle VM is down, media processing fails. **Mitigation:** Supabase tracks failed tasks; Self-Healing heartbeat retries.
* **Base64 Transfer:** Processed images are returned as base64 over HTTP, which is ~33% larger than binary. **Mitigation:** Acceptable for 1-3 posts/day. Can be optimized later with direct Drive upload from Oracle.
* **Two Firewalls:** OCI has two firewall layers (OS iptables + Security List). Both must be configured correctly. **Mitigation:** Documented in `specs/media_processor_api.md`.
* **Single Point of Processing:** All media processing depends on one Oracle VM. **Mitigation:** OCI ARM instances have high uptime. The VM is already running OpenClaw without issues.

## 6. Impact on Other Documents

| Document | Change |
|---|---|
| `specs/media_processor_api.md` | New — full API spec + Oracle setup guide |
| `specs/architecture.md` | Add Oracle Worker to topology and diagrams |
| `specs/implementation_plan/ip-003-n8n-workflows.md` | Media Processor step calls Oracle instead of local processing |
| `AGENTS.md` | Updated architecture diagram |
| `MEMORY.md` | Log the decision |

## 7. Status
Accepted
