# Supabase Integration Guide

## Overview
The Nenufar Marketing Automation System uses Supabase for tracking processed files, preventing duplicates, and maintaining a content calendar. This guide explains the integration architecture and setup.

## Database Schema

### Tables

#### `processed_files`
Tracks all media files processed through the system to prevent duplicate processing.

```sql
CREATE TABLE processed_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id TEXT UNIQUE NOT NULL,              -- Google Drive file ID
    file_name TEXT NOT NULL,
    mime_type TEXT,
    size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    platforms TEXT[],                            -- ['facebook', 'instagram']
    status TEXT DEFAULT 'pending',               -- pending, processing, published, failed
    task_id TEXT,
    webhook_response JSONB,
    error_message TEXT,
    metadata JSONB
);
```

**Status Flow:**
- `pending`: File detected but not yet processed
- `processing`: Currently being processed
- `published`: Successfully published to social platforms
- `failed`: Processing or publishing failed

#### `monitoring_logs`
Tracks system monitoring activities for health checks and debugging.

```sql
CREATE TABLE monitoring_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    files_checked INTEGER DEFAULT 0,
    new_files INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    duration_ms INTEGER
);
```

#### `content_calendar`
Manages the -day content strategy and scheduling.

```sql
CREATE TABLE content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_date DATE NOT NULL,
    day_of_week TEXT NOT NULL,                  -- Monday, Tuesday, etc.
    theme TEXT NOT NULL,                        -- Tejiendo Caminos, Poemas Tejidos, etc.
    file_id TEXT REFERENCES processed_files(file_id),
    caption TEXT,
    hashtags TEXT[],
    platforms TEXT[],
    status TEXT DEFAULT 'planned',              -- planned, published, skipped
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);
```

## Helper Functions

### `is_file_processed(p_file_id TEXT)`
Returns `TRUE` if the file has been processed or is currently being processed.

```sql
SELECT is_file_processed('1IqV6LcrVuZPl9iBdQCPjgro1WYhFB5UQ');
-- Returns: true or false
```

### `mark_file_processed(...)`
Marks a file as currently being processed to prevent duplicate processing.

```sql
SELECT mark_file_processed(
    '1IqV6LcrVuZPl9iBdQCPjgro1WYhFB5UQ',
    'nenufar-logo.png',
    'image/png',
    1024000,
    'task-abc-123'
);
-- Returns: UUID of the processed file record
```

### `mark_file_published(p_file_id TEXT, p_platforms TEXT[])`
Marks a file as successfully published to social platforms.

```sql
SELECT mark_file_published(
    '1IqV6LcrVuZPl9iBdQCPjgro1WYhFB5UQ',
    ARRAY['facebook', 'instagram']
);
-- Returns: true if successful
```

## Supabase Configuration

### Environment Variables
Set these in your n8n environment or workflow parameters:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### n8n Credentials

#### Supabase Anon Key (Read Operations)
- **Type:** Generic Credential Type
- **Name:** Supabase Anon Key
- **Headers:**
  ```
  apikey: [your anon key]
  Authorization: Bearer [your anon key]
  ```

#### Supabase Service Role (Write Operations)
- **Type:** Generic Credential Type
- **Name:** Supabase Service Role
- **Headers:**
  ```
  apikey: [your service role key]
  Authorization: Bearer [your service role key]
  ```

## Workflow Integration

### 1. Luna Drive Monitor
**File:** `workflows/luna-drive-monitor.json`

Checks Google Drive for new files and verifies against Supabase to prevent duplicate processing.

**Key Nodes:**
- `Check Already Processed`: Queries Supabase for existing files
- `Log Monitoring Activity`: Records monitoring runs to `monitoring_logs`

### 2. Luna Image Processor v4
**File:** `workflows/luna-image-processor-v4-supabase.json`

Processes images with watermark and tracks status in Supabase.

**Flow:**
1. Check if file already processed using `is_file_processed()`
2. Mark as processing using `mark_file_processed()`
3. Download and process image
4. Queue for social publisher

### 3. Luna Social Publisher v2
**File:** `workflows/luna-social-publisher-v2-supabase.json`

Publishes to social platforms and marks files as published.

**Flow:**
1. Receive processed image from queue
2. Publish to Facebook/Instagram
3. Mark as published using `mark_file_published()`
4. Log success feedback

## API Endpoints

### REST API (Direct Queries)
```bash
# Check if file exists
GET https://your-project-id.supabase.co/rest/v1/processed_files?file_id=eq.FILE_ID

# Get all pending files
GET https://your-project-id.supabase.co/rest/v1/processed_files?status=eq.pending

# Insert new file record
POST https://your-project-id.supabase.co/rest/v1/processed_files
```

### RPC Functions (Helper Functions)
```bash
# Call helper function
POST https://your-project-id.supabase.co/rest/v1/rpc/is_file_processed
Content-Type: application/json
{
  "p_file_id": "FILE_ID"
}
```

## Testing & Verification

### Verify Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('processed_files', 'monitoring_logs', 'content_calendar');
```

### Test Helper Functions
```sql
-- Test is_file_processed
SELECT is_file_processed('test-file-id');

-- Test mark_file_processed
SELECT mark_file_processed('test-file-id', 'test.jpg', 'image/jpeg', 1024000, 'task-123');

-- Test mark_file_published
SELECT mark_file_published('test-file-id', ARRAY['facebook']);

-- Cleanup
DELETE FROM processed_files WHERE file_id = 'test-file-id';
```

### Check Recent Activity
```sql
-- Recent files processed
SELECT file_name, status, created_at, published_at 
FROM processed_files 
ORDER BY created_at DESC 
LIMIT 10;

-- Monitoring statistics
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as checks,
    SUM(new_files) as total_new_files
FROM monitoring_logs 
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Content calendar status
SELECT scheduled_date, theme, status 
FROM content_calendar 
WHERE scheduled_date >= CURRENT_DATE
ORDER BY scheduled_date;
```

## Security Considerations

### Row Level Security (RLS)
All tables have RLS enabled. The `service_role` key bypasses RLS for system operations.

### Key Usage
- **anon key**: Use for read-only operations (checking if file exists)
- **service_role key**: Use ONLY for write operations (marking files as processed/published)
- **NEVER** expose service_role key in client-side code or webhooks

### Backup & Recovery
```sql
-- Export all processed files data
COPY processed_files TO 'processed_files_backup.csv' CSV HEADER;

-- Restore from backup
COPY processed_files FROM 'processed_files_backup.csv' CSV HEADER;
```

## Troubleshooting

### Common Issues

**Issue:** "Function not found" error
**Solution:** Verify helper functions are created in Supabase SQL Editor

**Issue:** "Permission denied" error
**Solution:** Ensure you're using service_role key for write operations

**Issue:** Files not being tracked
**Solution:** Check n8n execution logs for Supabase API errors

### Debug Queries
```sql
-- Find stuck files (processing status but old)
SELECT file_name, file_id, processed_at 
FROM processed_files 
WHERE status = 'processing' 
AND processed_at < NOW() - INTERVAL '1 hour';

-- Find failed files
SELECT file_name, error_message, created_at 
FROM processed_files 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

## Next Steps

1. Configure Supabase credentials in n8n
2. Import updated workflows (v4 versions)
3. Test with a sample file from Google Drive
4. Verify records appear in Supabase dashboard
5. Set up monitoring dashboards in Supabase
