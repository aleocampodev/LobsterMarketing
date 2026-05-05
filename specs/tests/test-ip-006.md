# Validation Report: Supabase Improvements (ip-006)
Version: v1.0

## 1. Objective
Validate the maintenance routines and self-healing mechanisms implemented in Supabase, including log rotation and the heartbeat process.

## 2. Validation Summary
- **Status:** [ ] Pending Verification
- **Log Rotation:** [ ] Confirmed (`cleanup_monitoring_logs` function)
- **Self-Healing:** [ ] Confirmed (`requeue_stalled_tasks` function)
- **Cron Scheduling:** [ ] Confirmed (if using `pg_cron` or n8n trigger)

## 3. Prerequisites
- Admin access to Supabase SQL Editor.
- Existing records in `nenufar.monitoring_logs` (for log rotation test).
- A record in `nenufar.processed_files` with status `processing` and `processed_at` > 1 hour ago (for heartbeat test).

## 4. Manual E2E Procedure

### Step 1: Test Log Rotation
1. Insert a dummy log entry with a timestamp older than 30 days:
   ```sql
   INSERT INTO nenufar.monitoring_logs (timestamp, status) 
   VALUES (NOW() - INTERVAL '31 days', 'old_log');
   ```
2. Manually execute the cleanup function:
   ```sql
   SELECT nenufar.cleanup_monitoring_logs();
   ```
3. Verify the old log entry is gone.

### Step 2: Test Self-Healing Heartbeat
1. Create a "stalled" task:
   ```sql
   INSERT INTO nenufar.processed_files (file_id, file_name, status, processed_at) 
   VALUES ('test-stalled-01', 'stalled_file.jpg', 'processing', NOW() - INTERVAL '61 minutes');
   ```
2. Manually execute the requeue function:
   ```sql
   SELECT nenufar.requeue_stalled_tasks();
   ```
3. Verify the record status has changed back to `pending`.

## 5. Expected Results
- `cleanup_monitoring_logs` returns the number of deleted rows.
- `requeue_stalled_tasks` returns the number of updated rows.
- Stalled tasks are correctly reset to `pending` without manual intervention if cron is active.
