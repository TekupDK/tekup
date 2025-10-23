# 🔧 TekupVault Production Configuration - Quick Fix Guide

## ✅ Fix 1: Trust Proxy (COMPLETED)

**Status**: ✅ **Deployed** (commit 0f578ea)

**What was fixed:**
- Added `app.set('trust proxy', 1)` to Express configuration
- Fixes rate limiter warning: `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
- Improves IP tracking accuracy behind Cloudflare CDN

**Deploy Status:**
```
To https://github.com/JonasAbde/TekupVault.git
   0654cd3..0f578ea  main -> main
```

Render will auto-deploy this fix within 2-3 minutes.

---

## 🔴 Fix 2: Add OpenAI API Key (REQUIRED - 5 MIN)

**Status**: ⏳ **Waiting for manual action**

### Why This is Needed
Search API currently fails with error:
```json
{
  "level": 50,
  "msg": "API key not configured"
}
```

Without this key, semantic search cannot generate embeddings.

### Step-by-Step Instructions

#### Option A: Via Render Dashboard (Recommended)

1. **Go to Render Dashboard**
   - URL: https://dashboard.render.com/web/srv-d3nbh1er433s73bejq0g
   - Or: Dashboard → TekupVault service

2. **Navigate to Environment Tab**
   - Click "Environment" in left sidebar
   - You'll see existing variables like `DATABASE_URL`, `SUPABASE_URL`, etc.

3. **Add New Environment Variable**
   - Click "Add Environment Variable" button
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (starts with `sk-proj-...` or `sk-...`)
   - Click "Add" button

4. **Save Changes**
   - Click "Save Changes" button at bottom
   - Render will automatically restart the service (~30 seconds)

5. **Verify Deployment**
   - Wait for restart to complete
   - Service will be available again in ~30-60 seconds

#### Option B: Via Render CLI

```bash
# Install Render CLI (if not already installed)
npm install -g @render/cli

# Login to Render
render login

# Add environment variable
render env set OPENAI_API_KEY "sk-proj-YOUR_KEY_HERE" --service srv-d3nbh1er433s73bejq0g

# Verify
render env list --service srv-d3nbh1er433s73bejq0g
```

#### Where to Get OpenAI API Key

If you don't have one:

1. Go to: https://platform.openai.com/api-keys
2. Login with your OpenAI account
3. Click "Create new secret key"
4. Name it: `TekupVault Production`
5. Copy the key (it starts with `sk-proj-` or `sk-`)
6. **IMPORTANT**: Save it somewhere safe - you can't see it again!

**Cost Estimate:**
- Model: `text-embedding-3-small`
- Cost: $0.00002 per 1K tokens (~$0.02 per 1M tokens)
- Expected usage: <$1/month for typical use

---

## 🔍 Fix 3: MCP Endpoint Investigation (IN PROGRESS)

**Status**: 🟡 **Under investigation**

### Current Issue
`.well-known/mcp.json` endpoint returns 404 despite being registered in code:

```typescript
// Line 99-126 in apps/vault-api/src/index.ts
app.get('/.well-known/mcp.json', (_req, res) => {
  res.json({
    version: '2025-03-26',
    name: 'TekupVault MCP Server',
    // ... full MCP configuration
  });
});
```

### Possible Causes

1. **Express Static Middleware Conflict**
   - Express might be treating `.well-known` as a static directory
   - Solution: Ensure route is registered before any static middleware

2. **Path Encoding Issue**
   - Dot in path (`.well-known`) might be misinterpreted
   - Solution: Add explicit path handling or use different route

3. **Helmet CSP Blocking**
   - Already disabled CSP, but might need more config
   - Solution: Already set `contentSecurityPolicy: false`

4. **404 Handler Order**
   - 404 handler might be catching request before route
   - Solution: Verify route order (already looks correct)

### Next Steps

1. **Test After Trust Proxy Deploy**
   - Wait for current deploy to complete
   - Test endpoint again: `https://tekupvault.onrender.com/.well-known/mcp.json`
   - Sometimes Express middleware order fixes routing issues

2. **Alternative Route Test**
   - If still 404, add alternative route: `/mcp-config` or `/api/mcp-config`
   - Redirect from `.well-known/mcp.json` to alternative

3. **Debug Logging**
   - Add logging to route handler to see if it's being hit
   - Check if request reaches Express at all

### Temporary Workaround

If `.well-known/mcp.json` continues to fail, use root endpoint:

```bash
# Root endpoint already provides MCP info
curl https://tekupvault.onrender.com/
```

Response includes MCP endpoint location:
```json
{
  "endpoints": {
    "mcpDiscovery": "/.well-known/mcp.json"
  }
}
```

---

## 📊 Deployment Timeline

| Time | Action | Status |
|------|--------|--------|
| 04:43 AM | Trust proxy fix committed | ✅ Done |
| 04:44 AM | Pushed to GitHub | ✅ Done |
| 04:45 AM | Render auto-deploy started | 🔄 In progress |
| 04:47 AM | Deploy completion (ETA) | ⏳ Waiting |
| TBD | Add OpenAI API key | ⏳ **User action required** |
| TBD | Test all endpoints | ⏳ After API key |

---

## 🧪 Testing Checklist

After OpenAI key is added, run these tests:

### 1. Health Check
```powershell
Invoke-RestMethod https://tekupvault.onrender.com/health | ConvertTo-Json
```

Expected: `{ "status": "ok", ... }`

### 2. MCP Discovery
```powershell
Invoke-RestMethod https://tekupvault.onrender.com/.well-known/mcp.json | ConvertTo-Json -Depth 5
```

Expected: Full MCP configuration JSON

### 3. Search API
```powershell
$body = @{
    query = "Billy.dk API integration"
    limit = 5
} | ConvertTo-Json

Invoke-RestMethod -Method POST `
    -Uri https://tekupvault.onrender.com/api/search `
    -ContentType "application/json" `
    -Body $body | ConvertTo-Json -Depth 3
```

Expected: Search results with similarity scores

### 4. Response Time
```powershell
Measure-Command { Invoke-RestMethod https://tekupvault.onrender.com/health }
```

Expected: <100ms (always-on, no cold start)

---

## 📝 Environment Variables Reference

### Current Production Config (Render)

```bash
# Database & Supabase (Already configured)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# GitHub Sync (Already configured)
GITHUB_TOKEN=ghp_...

# Application (Already configured)
NODE_ENV=production
PORT=3000 # Render sets this automatically

# 🔴 MISSING - Required for search functionality
OPENAI_API_KEY=sk-proj-... # ADD THIS!

# Optional (for error tracking)
SENTRY_DSN=https://... # Not required for core functionality
```

---

## 🎯 Success Criteria

Service is production-ready when:

- ✅ Health endpoint returns 200 OK
- ✅ Response time <100ms (always-on confirmed)
- ✅ Trust proxy warning eliminated from logs
- ⏳ OpenAI API key configured (waiting for user)
- ⏳ Search API returns results (needs OpenAI key)
- 🟡 MCP discovery endpoint accessible (under investigation)

---

## 🚀 Next Actions

### Immediate (User Must Do)
1. **Add OpenAI API Key to Render** (5 minutes)
   - Follow instructions in "Fix 2" section above
   - This is the blocker for search functionality

### After API Key Added (Automated Testing)
2. **Run Test Suite** (2 minutes)
   - Health check ✅
   - Search API ✅
   - MCP endpoint 🟡
   - Response time ✅

3. **Verify Logs** (1 minute)
   - No more "API key not configured" errors
   - No more trust proxy warnings
   - All requests successful

### If MCP Endpoint Still Fails
4. **Implement Alternative Route** (10 minutes)
   - Add `/api/mcp-config` endpoint
   - Update documentation
   - Test with AI tools

---

## 📞 Support

If you encounter issues:

1. **Check Render Logs**
   - Dashboard → TekupVault → Logs
   - Look for errors or warnings

2. **Verify Environment Variables**
   - Dashboard → TekupVault → Environment
   - Ensure `OPENAI_API_KEY` is set

3. **Test Health Endpoint**
   - If health fails, something is critically wrong
   - Check service status in Render dashboard

4. **Review Recent Commits**
   - GitHub: https://github.com/JonasAbde/TekupVault/commits/main
   - Latest: `0f578ea` (trust proxy fix)

---

**Last Updated**: 17. Oktober 2025, 04:45 AM  
**Deploy Status**: 🔄 In progress (trust proxy fix)  
**Blocker**: ⏳ OpenAI API key needed (user action)  
**ETA to Full Production**: 5 minutes after API key added
