# Re-run TestSprite Tests Mod Railway

**Dato:** 31. Oktober 2025  
**Status:** ✅ Railway server verified - Ready for testing

---

## ✅ Railway Server Status

**Health Check:**

```bash
curl https://tekup-billy-production.up.railway.app/health
```

**Result:**

- ✅ Status: `degraded` (Redis not configured, but Billy API healthy)
- ✅ Billy API: `healthy` (Connected to Rendetalje organization)
- ✅ Supabase: `healthy`
- ✅ Version: 1.4.3
- ✅ Uptime: ~3.3 hours

---

## 🔧 TestSprite UI Configuration Update

Da tekup-billy kører på Railway (ikke localhost), skal du **opdatere TestSprite configuration i UI**:

### Step 1: Opdater Base URL

1. Gå til TestSprite Dashboard
2. Find tekup-billy test configuration
3. **Change:**
   - ❌ **OLD:** `http://localhost:3000`
   - ✅ **NEW:** `https://tekup-billy-production.up.railway.app`

### Step 2: Opdater Port/Path

**Remove port number** (Railway uses standard HTTPS port 443):

- **Port:** Leave empty or remove field
- **Path:** `/` (for MCP) or `/api/v1/tools/*` (for REST API)

### Step 3: Authentication

**For MCP endpoints (`/`, `/mcp`):**

- Authentication: **None** ✅

**For REST API (`/api/v1/tools/*`):**

- Authentication: **Custom Header**
  - Header Name: `X-API-Key`
  - Header Value: `bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b`

---

## 🚀 Re-run Tests

### Via TestSprite UI:

1. **Click "Run Tests"** eller "Execute Tests" button
2. Tests vil nu køre mod Railway deployment
3. **Expected:** All 10 tests should pass ✅

### Via TestSprite MCP (Alternative):

Hvis du vil re-run via MCP tool:

```bash
# Testsprite MCP tool kan ikke direkt konfigureres til remote URLs
# Brug TestSprite UI i stedet
```

---

## 📊 Expected Test Results

**After Railway Configuration:**

| Test                       | Status  | Expected                           |
| -------------------------- | ------- | ---------------------------------- |
| TC001: list_invoices       | ✅ Pass | Billy API connection working       |
| TC002-TC008: Invoice tests | ✅ Pass | Customer creation works on Railway |
| TC009: list_customers      | ✅ Pass | Billy API returns customers        |
| TC010: create_customer     | ✅ Pass | Customer creation functional       |

**All 10 tests:** ✅ **PASS** (100%)

---

## 🔍 Verification Commands

### Test Health Endpoint:

```bash
curl https://tekup-billy-production.up.railway.app/health
```

### Test Customer List:

```bash
curl -X POST https://tekup-billy-production.up.railway.app/api/v1/tools/list_customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b" \
  -d '{"limit":5}'
```

### Test Customer Creation:

```bash
curl -X POST https://tekup-billy-production.up.railway.app/api/v1/tools/create_customer \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b" \
  -d '{"name":"Test Customer","email":"test@test.dk"}'
```

---

## ✅ Summary

**Railway Configuration:**

- ✅ Server: `https://tekup-billy-production.up.railway.app`
- ✅ Health: Degraded (Redis missing, but core services healthy)
- ✅ Billy API: Connected to Rendetalje organization
- ✅ Environment Variables: Set on Railway (BILLY_API_KEY, BILLY_ORGANIZATION_ID, etc.)

**Action Required:**

1. Update TestSprite UI config: `localhost:3000` → `tekup-billy-production.up.railway.app`
2. Remove port number (use standard HTTPS port 443)
3. Click "Run Tests" in TestSprite UI
4. Verify all 10 tests pass

---

**Ready for Railway Testing!** 🚀
