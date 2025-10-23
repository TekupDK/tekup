# MCP Usage Status - Oct 21, 2025

## Status: ⚠️ Production Logs Not Accessible

### What We Checked

**1. Local Logs (logs/ directory)**
- ✅ Last logs available: Oct 11-12, 2025
- ❌ No logs from Oct 21, 2025 (today)
- **Reason:** Local logs are only from development/test mode

**2. Supabase Audit Logs (`billy_audit_logs` table)**
- ✅ Table configured correctly in `src/database/supabase-client.ts`
- ✅ Credentials present in `.env`
- ❌ 404 error when querying
- **Possible Reasons:**
  - Table doesn't exist yet in production database
  - Audit logging not enabled in production (`ENABLE_SUPABASE` flag missing)
  - Supabase REST API endpoint needs service_key instead of anon_key
  - Table needs to be created in Supabase dashboard

**3. Render.com Production Logs**
- ✅ Service running: `tekup-billy-mcp` (srv-d3kk30t6ubrc73e1qon0)
- ✅ Dashboard URL: https://dashboard.render.com
- ❌ Requires manual login (no API key in `.env`)
- **Access Method:** User must log in to Render dashboard manually

---

## Available Historical Data (Oct 11-12, 2025)

From `logs/user-actions-2025-10-11.json` and `logs/user-actions-2025-10-12.json`:

### Summary
- **Total tool calls:** ~160 over 2 days
- **Unique tools used:** 6 out of 32 available (18.75% coverage)
- **Error rate:** 0% (100% success)
- **Peak hours:** 17:00-22:00 CET

### Top Tools Used (Oct 11-12)
1. **updateProduct** - ~40% of all calls
   - Used for updating product descriptions, prices, account codes
   
2. **createCustomer** - ~25% of all calls
   - Creating new customer records with contact details
   
3. **updateCustomer** - ~20% of all calls
   - Updating existing customer information
   
4. **listProducts** - ~8% of all calls
   - Browsing product catalog
   
5. **listCustomers** - ~5% of all calls
   - Finding customers by name/email
   
6. **getProduct** - ~2% of all calls
   - Viewing specific product details

### Execution Performance
- **Average response time:** <50ms (cached) to 250ms (API calls)
- **Cache hit rate:** 60-80% (from Supabase caching)
- **Rate limiting:** No issues observed

---

## How to Access Today's Production Logs (Oct 21)

### Option 1: Render Dashboard (RECOMMENDED - Manual)

**Steps:**
1. Open browser: https://dashboard.render.com
2. Log in with Render credentials
3. Select service: `tekup-billy-mcp` (srv-d3kk30t6ubrc73e1qon0)
4. Click "Logs" tab
5. Filter by today's date: Oct 21, 2025
6. Search for patterns:
   - `[ChatGPT]` - ChatGPT tool calls
   - `[Shortwave]` - Shortwave AI calls
   - `tools/call` - Tool invocations
   - Tool names: `list_invoices`, `update_product`, etc.

**What to Look For:**
```json
{
  "timestamp": "2025-10-21T...",
  "level": "info",
  "message": "[ChatGPT] POST /api/v1/tools/list_invoices",
  "params": { "organizationId": "...", "state": "approved" },
  "executionTime": 45
}
```

### Option 2: Render CLI (Technical - Command Line)

**Prerequisites:**
```powershell
npm install -g @renderinc/cli
render login
```

**Commands:**
```powershell
# View real-time logs
render logs -s srv-d3kk30t6ubrc73e1qon0 --tail

# View last 100 lines
render logs -s srv-d3kk30t6ubrc73e1qon0 --tail -n 100

# Filter for specific tool
render logs -s srv-d3kk60t6ubrc73e1qon0 --tail | Select-String "list_invoices"
```

### Option 3: Enable Supabase Audit Logging (FUTURE)

**To Enable:**
1. Log into Supabase dashboard: https://oaevagdgrasfppbrxbey.supabase.co
2. Go to SQL Editor
3. Create `billy_audit_logs` table:
   ```sql
   CREATE TABLE IF NOT EXISTS billy_audit_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     tool_name TEXT NOT NULL,
     action TEXT NOT NULL,
     organization_id TEXT,
     user_id TEXT,
     status TEXT NOT NULL, -- 'success' or 'error'
     execution_time_ms INTEGER,
     params JSONB,
     result JSONB,
     error TEXT,
     ip_address TEXT,
     user_agent TEXT
   );
   
   CREATE INDEX idx_audit_logs_created_at ON billy_audit_logs(created_at DESC);
   CREATE INDEX idx_audit_logs_tool_name ON billy_audit_logs(tool_name);
   CREATE INDEX idx_audit_logs_org ON billy_audit_logs(organization_id);
   ```
4. Set `ENABLE_SUPABASE=true` in Render environment variables
5. Re-run query: `powershell get-todays-mcp-usage.ps1`

---

## Key Insights from Available Data

### Product Management Tools Heavily Used
- **updateProduct** dominates usage (40%) - Indicates frequent product catalog maintenance
- Most updates are: descriptions, prices, account codes
- Pattern: User is actively cleaning up and organizing product catalog

### Customer Management Secondary Focus
- **createCustomer** and **updateCustomer** combined ~45% of usage
- Indicates active CRM work, adding/updating customer details

### Invoice/Financial Tools Underutilized
- **list_invoices**, **create_invoice** not seen in Oct 11-12 logs
- TODAY'S analysis (Oct 21) showed 108 invoices, 84 approved
- Suggests: MCP mostly used for catalog management, not invoice work

### Shortwave Integration Pattern
From documentation (not in logs yet):
- Shortwave AI uses MCP for email-to-customer automation
- Expected tools: `search_customers`, `create_customer`, `update_contact`
- Customer contact details extracted from email signatures

---

## Action Items

### Immediate (User)
- [ ] **Log into Render dashboard** to view today's production logs
- [ ] **Search for Shortwave patterns** in logs: `[Shortwave]`, `[ChatGPT]`
- [ ] **Export log sample** to text file for analysis

### Technical (Future Sprint)
- [ ] **Create `billy_audit_logs` table** in Supabase
- [ ] **Set `ENABLE_SUPABASE=true`** in Render environment
- [ ] **Add RENDER_API_KEY** to `.env` for programmatic log access
- [ ] **Automate daily log exports** to CSV for analytics

### Analysis (After Log Access)
- [ ] **Compare Oct 11-12 vs Oct 21** - Tool usage evolution
- [ ] **Identify Shortwave-specific patterns** - Which tools does AI use?
- [ ] **Correlate with invoice analysis** - Are tools used matching invoice products?
- [ ] **Update USAGE_PATTERNS_REPORT.md** with Oct 21 data

---

## Current Workaround: Manual Render Dashboard Access

Since we cannot programmatically access today's logs yet, **please log into Render dashboard manually**:

1. **URL:** https://dashboard.render.com
2. **Service:** `tekup-billy-mcp` (Frankfurt)
3. **Logs Tab:** Click "Logs" in left sidebar
4. **Filter:** Look for entries from Oct 21, 2025
5. **Copy relevant entries** to text file or take screenshots

**What we're looking for:**
- Tool usage today vs Oct 11-12 baseline
- Shortwave AI integration patterns
- Error rates and performance
- Peak usage times today

---

## Summary

**Status:** ⚠️ Cannot access today's production logs programmatically yet

**Reason:**
- Local logs only have Oct 11-12 data (test mode)
- Supabase audit logs table may not be created yet
- Render API requires manual dashboard login

**Solution:**
- **Short-term:** Manual Render dashboard access (user logs in)
- **Long-term:** Enable Supabase audit logging + Render API key

**Historical Data Available:**
- Oct 11-12 logs show heavy `updateProduct` and customer management usage
- Oct 21 invoice analysis shows 57/68 products actively used in real invoices
- Waiting for today's operational logs to complete the picture

---

**Next Steps:** Please log into https://dashboard.render.com to view today's production logs, or we can proceed with product cleanup based on invoice analysis alone (57/68 products are used, 11 never used).
