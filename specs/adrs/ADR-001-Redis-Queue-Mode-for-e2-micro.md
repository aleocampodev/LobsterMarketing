# ADR 001: Implementation of Redis Queue Mode on e2-micro Instances
Version: v1.1

## 1. Context and Problem

The Marketing Automation system (Nenufar) depends on **n8n** as its execution layer ("The Arms"). A central part of this execution is downloading, resizing, and watermarking high-quality images (from Google Drive) for later publication on Meta (Instagram/Facebook).

The current infrastructure is based on the Google Cloud Free Tier, which provides an **`e2-micro`** instance. This virtual machine has extremely limited resources:
- **RAM:** 1 GB (or less available for applications).
- **CPU:** 0.25 shared vCPUs.

When an n8n process attempts to manipulate a heavy image (e.g., a 5MB JPG) using in-memory libraries, the n8n container can easily exceed the available RAM limit, leading to an **Out Of Memory (OOM) Crash** by the Linux operating system.

If n8n runs in **Regular Mode** (without an external message broker), a crash means the total loss of the in-memory task. The publication would fail silently, and Shirley would have to restart the process manually from Telegram.

## 2. Considered Options

1. **Regular n8n Mode (No Redis)**: Process images sequentially on a single thread.
2. **Scale Infrastructure (Vertical)**: Upgrade to an `e2-small` or `e2-medium` machine (monthly cost of $10 - $25 USD).
3. **Queue Mode (With Redis)**: Use an external Message Broker to queue tasks and process them via "Workers" that do not lose the original message if they crash.

## 3. Decision

It was decided to implement **Option 3 (Queue Mode)** using **Upstash Redis** (Serverless Free Tier) to decouple orchestration (receiving the Gemini webhook) from execution (image processing).

## 4. Justification (Why it is the best technical option)

*   **Tolerance to OOM Crashes:** If the `e2-micro` instance explodes due to lack of RAM while processing an image and restarts, the original task remains persistently stored in Upstash Redis. When the server powers up again, the n8n Worker will resume the task, ensuring **zero data loss**.
*   **Concurrency Management:** By using Workers, we can configure n8n to process a maximum of 1 heavy task at a time (`N8N_CONCURRENCY_PRODUCTION_LIMIT=1`), protecting the server's fragile memory.
*   **Cost-Effective ($0):** Upstash Redis offers a Free Tier sufficient for this volume of automation, maintaining the project's premise of using "Serverless/Free" tools without paying for larger instances on GCP.
*   **Error Isolation (Retry Logic):** If a task fails, the Worker can perform an exponential retry or move the task to a *Dead Letter Queue*, which is much harder to manage reliably in Regular Mode when the server crashes.

## 5. Consequences

*   **Operational Complexity (Cons):** Requires managing additional credentials (Redis URI) and configuring n8n in a slightly more complex mode (requires encryption environment variables and Queue mode).
*   **Latency (Neutral):** Introduces extra milliseconds of latency when queuing and dequeuing messages, which is irrelevant for an asynchronous marketing task.
*   **Security:** Payloads must be signed (e.g., with HMAC) to guarantee that workers only process legitimate tasks sent by the "Brain" (Luna).

## 6. Status
**Superseded** by ADR-003 (2026-05-07). Redis removed — direct HMAC webhook architecture adopted.
