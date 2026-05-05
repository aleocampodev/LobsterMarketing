# Implementation Plan: Supabase Improvements (ip-006)
Version: v1.1

## Background & Motivation
An audit of the current Supabase implementation identified missing tables, pending DevOps maintenance routines (backups and log rotation), and incomplete self-healing mechanisms. This plan addresses these gaps to ensure the database is reliable, scalable, and complete as per the original architecture design.

## Scope & Impact
This plan impacts:
- **`specs/database_schema.sql`**: Completing the missing `brand_knowledge` table.
- **Supabase Functions/Cron**: Creating mechanisms for log rotation and self-healing.
- **Documentation**: Updating the implementation index to reflect these improvements.

## Implementation Steps

### Phase 1: Schema Corrections
- [x] **ip-006.1:** Add the `brand_knowledge` table to `specs/database_schema.sql`.
- [x] **ip-006.2:** Apply Row Level Security (RLS) to the new `brand_knowledge` table.
- [x] **ip-006.3:** Update table index and structure documentation to reflect the fix.

### Phase 2: Maintenance & DevOps
- [x] **ip-006.4:** Implement Log Rotation: Write a stored procedure (e.g., `cleanup_monitoring_logs`) to delete logs older than 30 days, preventing storage overflow.
- [x] **ip-006.5:** Schedule the Log Rotation using `pg_cron` (if enabled) or document the process to be triggered via n8n.
- [x] **ip-006.6:** Document the Backup Strategy: Use the Supabase Dashboard to enable daily backups or PITR. For free tier, use `pg_dump` manually or via a scheduled n8n workflow.

### Phase 3: Self-Healing Mechanism
- [x] **ip-006.7:** Implement the Self-Healing Heartbeat function in Supabase.
- [x] **ip-006.8:** Create a stored procedure to update stalled records back to `pending`.

## Verification
- Test `database_schema.sql` locally or via Supabase SQL editor to ensure no syntax errors exist.
- Verify the heartbeat query accurately targets delayed processing records without affecting active tasks.
- Confirm documentation (`INDEX.md`, etc.) correctly references `ip-006` tasks.