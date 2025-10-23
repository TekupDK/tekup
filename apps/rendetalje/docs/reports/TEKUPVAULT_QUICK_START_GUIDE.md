# TekupVault Quick Start Guide

## 🚀 Quick Reference

### Local Development

**Start Server (Port 3003):**
```powershell
cd C:\Users\empir\TekupVault\apps\vault-api
$env:PORT=3003
$env:DOTENV_CONFIG_PATH="../../.env"
node -r dotenv/config -r ts-node/register src/index.ts
```

**Test Health:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3003/health"
```

**Stop Server:**
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3003).OwningProcess | Stop-Process -Force
```

---

## 🔑 API Keys & Environment

**Location:** `C:\Users\empir\TekupVault\.env`

**Required Variables:**
```env
PORT=3003
NODE_ENV=development
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
GITHUB_TOKEN=ghp_...
OPENAI_API_KEY=sk-proj-...
API_KEY=tekup_secret_key_2024
```

---

## 🌐 Endpoints

### Local (Port 3003)
- Health: `http://localhost:3003/health`
- MCP Discovery: `http://localhost:3003/.well-known/mcp.json`
- MCP Endpoint: `http://localhost:3003/mcp`

### Production
- Health: `https://tekupvault.onrender.com/health`
- MCP Discovery: `https://tekupvault.onrender.com/.well-known/mcp.json`
- MCP Endpoint: `https://tekupvault.onrender.com/mcp`

---

## 🛠️ MCP Tools (6 Available)

### 1. search
Semantic search using embeddings
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {
      "query": "your search query",
      "limit": 5
    }
  },
  "id": 1
}
```

### 2. fetch
Retrieve document by ID
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "fetch",
    "arguments": {
      "id": "document-id-here"
    }
  },
  "id": 2
}
```

### 3. list_repositories
List all synced repositories
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "list_repositories",
    "arguments": {}
  },
  "id": 3
}
```

### 4. get_sync_status
Get sync status for repositories
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_sync_status",
    "arguments": {}
  },
  "id": 4
}
```

### 5. search_knowledge
Alternative search endpoint
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "search_knowledge",
    "arguments": {
      "query": "your query"
    }
  },
  "id": 5
}
```

### 6. get_repository_info
Get detailed repository information
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_repository_info",
    "arguments": {
      "repository": "github.com/user/repo"
    }
  },
  "id": 6
}
```

---

## 🔧 Troubleshooting

### Problem: Environment variables not loading
**Solution:**
```powershell
# Must be in vault-api directory
cd C:\Users\empir\TekupVault\apps\vault-api

# Set path explicitly
$env:DOTENV_CONFIG_PATH="../../.env"

# Run with dotenv preload
node -r dotenv/config -r ts-node/register src/index.ts
```

### Problem: Port conflict
**Check what's using ports:**
```powershell
Get-NetTCPConnection -LocalPort 3000,3001,3002,3003 -State Listen
```

**Current allocation:**
- Port 3000: Next.js
- Port 3001: Tekup-Billy
- Port 3003: TekupVault ✅

### Problem: Production MCP tools failing
**Root Cause:** SUPABASE_SERVICE_KEY missing/incorrect

**Fix:**
1. Go to https://dashboard.render.com
2. Select TekupVault service
3. Environment tab
4. Update SUPABASE_SERVICE_KEY
5. Redeploy

---

## 📊 Database Info

**Provider:** Supabase  
**Documents:** 1,063  
**Embeddings:** 800  
**Repositories:** 4  

**Tables:**
- `vault_documents`
- `vault_embeddings`
- `vault_sync_status`
- `vault_metadata`

---

## 🔗 Important Links

- **Production:** https://tekupvault.onrender.com
- **Render Dashboard:** https://dashboard.render.com/web/srv-d3nbh1er433s73bejq0g
- **Supabase:** https://supabase.com/dashboard/project/twaoebtlusudzxshjral

---

## 📚 Documentation Files

1. `TEKUPVAULT_SESSION_REPORT_2025-10-22.md` - Full session report
2. `TEKUPVAULT_LOCAL_TEST_SUCCESS.md` - Test results
3. `TEKUPVAULT_ENDUSER_INTEGRATION_EXAMPLE.tsx` - Integration examples
4. `TEKUPVAULT_MCP_LIVE_TEST.js` - Browser test suite
5. `COMET_BROWSER_TEKUPVAULT_PROMPT.md` - Comet investigation guide
6. `TEKUPVAULT_QUICK_START_GUIDE.md` - This file

---

## ⚡ Current Status

**Code:** ✅ Fully functional  
**Local:** ✅ Working on port 3003  
**Production:** ⚠️ MCP tools need environment fix  

**Next Action:** Update SUPABASE_SERVICE_KEY in Render dashboard

---

*Last Updated: October 22, 2025*
