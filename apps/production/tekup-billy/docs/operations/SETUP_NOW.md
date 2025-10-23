# ⚡ QUICK SETUP - Copy/Paste Guide

## Step 1: Supabase SQL (2 minutes)

### 1. Open browser:
```
https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/editor
```

### 2. Click "SQL Editor" → "New query"

### 3. Copy this ENTIRE block and paste:

```sql
-- Supabase Audit Logging Setup
CREATE TABLE IF NOT EXISTS billy_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    tool_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('read', 'create', 'update', 'delete')),
    organization_id TEXT,
    user_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    execution_time_ms INTEGER,
    params JSONB,
    result JSONB,
    error TEXT,
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON billy_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tool_name ON billy_audit_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON billy_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON billy_audit_logs(status) WHERE status = 'error';

ALTER TABLE billy_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage audit logs" ON billy_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

SELECT '✅ Setup complete!' as status, COUNT(*) as existing_logs FROM billy_audit_logs;
```

### 4. Click "Run" (or Ctrl+Enter)

### 5. ✅ You should see: "✅ Setup complete! existing_logs: 0"

---

## Step 2: Render Environment (1 minute)

### 1. Open browser:
```
https://dashboard.render.com/web/srv-d3kk30t6ubrc73e1qon0/env
```

### 2. Click "Add Environment Variable"

### 3. Paste these values:

**Key:**
```
ENABLE_SUPABASE_LOGGING
```

**Value:**
```
true
```

### 4. Click "Save Changes"

### 5. ✅ Wait 2-3 minutes for auto-deploy

---

## Step 3: Verify (30 seconds)

### Run this in PowerShell:

```powershell
# Test API call
$response = Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/api/v1/tools/validate_auth" -Method Post `
    -Headers @{
        "X-API-Key" = $env:BILLY_API_KEY
        "Content-Type" = "application/json"
    } `
    -Body '{"organizationId":"IQgm5fsl5rJ3Ub33EfAEow"}'

Write-Host "✅ Test call successful: $($response.valid)" -ForegroundColor Green
Write-Host ""
Write-Host "Now check Supabase:" -ForegroundColor Yellow
Write-Host "Go to: https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/editor" -ForegroundColor Cyan
Write-Host "Run: SELECT * FROM billy_audit_logs ORDER BY created_at DESC LIMIT 1;" -ForegroundColor Cyan
```

---

## ✅ Done!

If you see your test call in Supabase, **audit logging is working!**

**Total time:** 3-4 minutes  
**Manual steps:** Just copy-paste + click buttons

---

## 🆘 Problems?

**Supabase SQL fails:**
- Error "relation already exists" → Table exists! Skip Step 1
- Permission denied → Make sure you're project owner

**Render variable not saving:**
- Make sure you're on "Environment" tab, not "Environment Groups"
- Service ID is correct: srv-d3kk30t6ubrc73e1qon0

**No logs in Supabase:**
- Wait 5 minutes after Render deploy
- Check Render logs: `.\render-cli\cli_v2.4.2.exe logs --resources srv-d3kk30t6ubrc73e1qon0 --tail`
- Look for "Supabase" or "audit" in logs
