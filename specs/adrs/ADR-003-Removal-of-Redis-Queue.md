# ADR 003: Removal of Redis Queue — Direct Webhook Architecture
Version: v1.0

## 1. Context and Problem

ADR-001 introduced **Upstash Redis** as a message broker between the Brain (OpenClaw/Luna) and the Arms (n8n workers), and as the execution broker for n8n's Queue Mode. This decision was made to protect against OOM crashes on the e2-micro instance by persisting tasks in an external queue.

After further analysis of the actual system behavior and traffic patterns, several issues have been identified:

1. **Contradictory Integration Pattern:** The existing n8n workflows (`n8n_minimal.json`, `n8n_minimal_v2.json`) are already Webhook Receivers that validate HMAC signatures directly. Luna does not push to a Redis list and wait for n8n to poll — it calls an HTTP endpoint. Redis sits between two components that already communicate synchronously via HTTP, acting as an unnecessary intermediary.

2. **Volume Does Not Justify a Message Broker:** The system processes 1–3 posts per day. A message broker provides value at high throughput (hundreds/thousands of messages per second). At this volume, the overhead of managing a Redis connection, credentials, and queue logic outweighs any resilience benefit.

3. **Redundant Persistence:** Supabase already serves as the source of truth. The `processed_files` table tracks every asset's lifecycle status (`pending`, `processing`, `published`, `failed`). The "Self-Healing" heartbeat described in the architecture already recovers stuck tasks by querying Supabase — not Redis. If Redis is cleared, the system loses nothing because Supabase holds the state.

4. **RAM Overhead on e2-micro:** n8n Queue Mode requires a Redis connection and additional worker processes, consuming precious RAM on a 1 GB instance. Regular Mode uses significantly less memory, reducing the likelihood of OOM crashes — the very problem Redis was meant to solve.

5. **Single Instance = No Distribution Benefit:** Queue Mode distributes work across multiple n8n workers. The current infrastructure runs a single n8n instance on one e2-micro VM. There is nothing to distribute to.

## 2. Considered Options

1. **Keep Redis (Status Quo):** Maintain Upstash Redis as message broker and n8n Queue Mode.
2. **Keep Redis only for n8n Queue Mode:** Remove the "message broker" role but keep Queue Mode.
3. **Remove Redis entirely — Direct HMAC Webhook:** Luna dispatches signed payloads directly to n8n webhooks. n8n runs in Regular Mode. Supabase provides persistence and recovery.

## 3. Decision

We decided to implement **Option 3 (Remove Redis entirely)**.

The Brain → Arms communication will be a direct HTTP POST from Luna to the n8n Webhook Receiver, secured with HMAC signatures. n8n will run in Regular Mode. Supabase remains the source of truth for task state and recovery.

## 4. Justification

* **Simplicity:** Removes an entire infrastructure component (Upstash Redis), its credentials, its configuration, and its failure modes. Fewer moving parts = fewer things that break.
* **Direct Integration Matches Reality:** The webhook-based integration already exists. Removing the Redis abstraction aligns the architecture documentation with what the code actually does.
* **Lower Memory Footprint:** n8n Regular Mode consumes less RAM than Queue Mode, directly addressing the e2-micro constraint that motivated ADR-001 in the first place.
* **Supabase Is Sufficient for Resilience:** The `processed_files` table + Self-Healing heartbeat provides task recovery without needing a separate message broker. Failed tasks are re-queued by the heartbeat, not by Redis retry logic.
* **Cost Neutral but Complexity Negative:** Upstash Free Tier costs $0, so removing it doesn't save money — but it saves operational complexity (one fewer credential to manage, one fewer service to monitor).
* **Security Preserved:** HMAC signature validation on the webhook receiver remains intact. Only the transport channel changes (Redis → direct HTTP).

## 5. Consequences

* **Loss of In-Memory Task Buffer:** If n8n is down when Luna dispatches a webhook, the HTTP call fails immediately. **Mitigation:** Luna detects the failure and (a) logs the error to Supabase, (b) notifies Shirley via Telegram, (c) the next heartbeat retries. This is acceptable for a 1-3 posts/day system.
* **No Dead Letter Queue (DLQ):** Redis provided a natural DLQ for failed tasks. **Mitigation:** Failed tasks are marked as `failed` in Supabase `processed_files`. The Self-Healing heartbeat picks them up and re-attempts. The DLQ is effectively Supabase itself.
* **No Built-in Retry with Backoff:** Queue Mode provided automatic retry with exponential backoff. **Mitigation:** n8n workflows can implement their own retry logic using the built-in retry node, or the heartbeat handles retries at the application level.
* **ADR-001 Superseded:** This decision directly reverses ADR-001. That document is retained for historical context but its status changes to "Superseded."

## 6. Impact on Other Documents

| Document | Change |
|---|---|
| `specs/architecture.md` | Remove Redis from topology, diagrams, and data flow descriptions |
| `AGENTS.md` | Remove Redis from architecture section and ASCII diagrams |
| `specs/implementation_plan/ip-002-*.md` | Update tasks ip-002.11, ip-002.13–ip-002.15 to remove Redis references |
| `MEMORY.md` | Log the architectural decision and rationale |
| `specs/data_architecture.md` | No changes needed (Redis was never part of the data layer) |

## 7. Status
Accepted — Replaces ADR-001 (Superseded)
