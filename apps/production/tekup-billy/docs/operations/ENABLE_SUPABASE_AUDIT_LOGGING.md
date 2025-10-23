# Enable Supabase Audit Logging - Setup Guide

## Status: 🚧 Ready to Execute

This guide will enable audit logging to Supabase for all MCP tool calls.

---

## Step 1: Create Supabase Table (5 minutes)

### 1.1 Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey
2. Click **"SQL Editor"** in left sidebar
3. Click **"New query"**

### 1.2 Run SQL Script

1. Open file: `scripts/supabase-setup-audit-logs.sql`
2. Copy ALL contents (176 lines)
3. Paste into Supabase SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)

### 1.3 Verify Success

You should see output like:
```
✅ Audit logging table created successfully!
existing_logs: 0
```

If you see errors:
- Check if table already exists: `SELECT * FROM billy_audit_logs LIMIT 1;`
- Drop and recreate: `DROP TABLE billy_audit_logs CASCADE;` then re-run script

---

## Step 2: Update Render Environment (2 minutes)

### 2.1 Open Render Dashboard

1. Go to: https://dashboard.render.com
2. Navigate to: **Services** → **tekup-billy-mcp**
3. Click **"Environment"** tab in left sidebar

### 2.2 Add Environment Variable

Click **"Add Environment Variable"** and add:

| Key | Value |
|-----|-------|
| `ENABLE_SUPABASE_LOGGING` | `true` |

**Note:** The Supabase credentials (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`) are already configured in your Render environment from the RenOS project.

### 2.3 Deploy Changes

1. Click **"Save Changes"** button
2. Render will automatically redeploy the service
3. Wait ~2-3 minutes for deployment to complete

---

## Step 3: Verify Audit Logging (1 minute)

### 3.1 Make a Test API Call

```powershell
$response = Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/api/v1/tools/validate_auth" -Method Post `
    -Headers @{
        "X-API-Key" = $env:BILLY_API_KEY
        "Content-Type" = "application/json"
    } `
    -Body (@{
        organizationId = $env:BILLY_ORGANIZATION_ID
    } | ConvertTo-Json)

Write-Host "Test call succeeded: $($response.valid)" -ForegroundColor Green
```

### 3.2 Check Supabase Logs

In Supabase SQL Editor, run:
```sql
SELECT 
    created_at,
    tool_name,
    action,
    status,
    execution_time_ms
FROM billy_audit_logs
ORDER BY created_at DESC
LIMIT 10;
```

You should see your `validate_auth` call logged!

---

## Step 4: Query Logs (Usage Examples)

### Today's Tool Usage
```sql
SELECT 
    tool_name,
    COUNT(*) as calls,
    COUNT(*) FILTER (WHERE status = 'success') as success,
    COUNT(*) FILTER (WHERE status = 'error') as errors
FROM billy_audit_logs
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY tool_name
ORDER BY calls DESC;
```

### Last 24 Hours Performance
```sql
SELECT 
    tool_name,
    ROUND(AVG(execution_time_ms)::numeric, 2) as avg_ms,
    MIN(execution_time_ms) as min_ms,
    MAX(execution_time_ms) as max_ms
FROM billy_audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY tool_name
ORDER BY avg_ms DESC;
```

### Error Rate by Tool
```sql
SELECT 
    tool_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'error') as errors,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'error')::float / COUNT(*)) * 100,
        2
    ) as error_rate_percent
FROM billy_audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY tool_name
HAVING COUNT(*) > 10
ORDER BY error_rate_percent DESC;
```

### Usage by Hour (Peak Times)
```sql
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as calls
FROM billy_audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;
```

---

## Step 5: Use PowerShell to Query Logs

Create a script to fetch today's logs:

```powershell
# File: scripts/query-supabase-logs.ps1

$SUPABASE_URL = $env:SUPABASE_URL
$SUPABASE_KEY = $env:SUPABASE_SERVICE_KEY

$today = Get-Date -Format "yyyy-MM-dd"

$response = Invoke-RestMethod `
    -Uri "$SUPABASE_URL/rest/v1/billy_audit_logs?created_at=gte.${today}T00:00:00&order=created_at.desc&limit=100" `
    -Method Get `
    -Headers @{
        "apikey" = $SUPABASE_KEY
        "Authorization" = "Bearer $SUPABASE_KEY"
        "Content-Type" = "application/json"
    }

Write-Host "Today's logs: $($response.Count) entries" -ForegroundColor Green
$response | Format-Table created_at, tool_name, action, status, execution_time_ms
```

---

## Benefits After Setup

✅ **Complete audit trail** - Every tool call logged with parameters and results  
✅ **Performance monitoring** - Track execution times and identify slow tools  
✅ **Error tracking** - See which tools fail and why  
✅ **Usage analytics** - Understand which tools are most used  
✅ **Compliance** - Meet data access audit requirements  
✅ **Debugging** - Reproduce issues by seeing exact parameters used

---

## Maintenance

### Automatic Cleanup (Optional)

Set up a cron job to delete old logs (keep 90 days):

```sql
-- Run monthly via Supabase cron extension or external scheduler
DELETE FROM billy_audit_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Storage Usage

Check table size:
```sql
SELECT 
    pg_size_pretty(pg_total_relation_size('billy_audit_logs')) as total_size,
    COUNT(*) as row_count
FROM billy_audit_logs;
```

---

## Troubleshooting

### Logs Not Appearing

1. **Check Render deployment:**
   - Go to Render dashboard → tekup-billy-mcp → Logs
   - Search for "Supabase" - should see connection messages
   - Look for errors like "SUPABASE_URL not set"

2. **Check environment variable:**
   ```powershell
   # Test from Render service shell
   echo $ENABLE_SUPABASE_LOGGING  # Should output: true
   ```

3. **Verify Supabase credentials:**
   ```powershell
   # Test connection
   curl "$env:SUPABASE_URL/rest/v1/" `
       -H "apikey: $env:SUPABASE_ANON_KEY"
   # Should return: {"message":"The server is running."}
   ```

### RLS Policy Issues

If you can't query logs, check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'billy_audit_logs';
```

Temporarily disable RLS for testing:
```sql
ALTER TABLE billy_audit_logs DISABLE ROW LEVEL SECURITY;
```

---

## Next Steps After Setup

1. ✅ Update `get-todays-mcp-usage.ps1` to query Supabase directly
2. ✅ Create dashboard queries for common analytics
3. ✅ Set up alerts for high error rates
4. ✅ Export weekly usage reports

---

**Estimated Total Time:** 10 minutes  
**Difficulty:** Easy (copy-paste + click buttons)  
**Impact:** High (complete observability)
