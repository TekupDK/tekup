# 🔧 Claude Debug Response - Billy MCP Server

**Dato:** 20. Oktober 2025  
**Problem:** 404 errors på alle Billy API endpoints  
**Status:** Troubleshooting

---

## ✅ SVAR PÅ CLAUDE'S SPØRGSMÅL

### 1️⃣ Hvor kører Billy MCP serveren?

**Production:** Render.com (Frankfurt region)
- **URL:** `https://tekup-billy.onrender.com`
- **Service:** Docker deployment
- **Commit:** 7ec2e2c (latest)
- **Version:** 1.4.1

**Health Status:**

```powershell
Invoke-RestMethod https://tekup-billy.onrender.com/health
```

**Expected:**

```json
{
  "status": "healthy",
  "version": "1.4.1",
  "dependencies": {
    "billy": {
      "status": "healthy",
      "lastCheck": "2025-10-20T..."
    },
    "supabase": {
      "enabled": true,
      "connected": true
    }
  }
}
```

---

### 2️⃣ Billy API Credentials (Censureret)

**Environment Variables på Render:**

```bash
# Billy API Credentials
BILLY_API_KEY=********************************  # ✅ SAT
BILLY_ORGANIZATION_ID=IQgm5fsl5rJ3Ub33EfAEow   # ✅ SAT

# MCP Server Auth
MCP_API_KEY=bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b

# Supabase (via Environment Group)
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_KEY=eyJh...
```

**Verification:**
- ✅ Billy API key exists
- ✅ Organization ID correct
- ✅ Supabase connected
- ✅ Server healthy

---

### 3️⃣ MCP Server Config

**Base Configuration:**

```typescript
// src/config.ts
export const config = {
  billy: {
    apiKey: process.env.BILLY_API_KEY,
    organizationId: process.env.BILLY_ORGANIZATION_ID,
    baseUrl: 'https://api.billysbilling.com/v2'
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  }
}
```

**Billy Client:**

```typescript
// src/billy-client.ts
class BillyClient {
  private baseUrl = 'https://api.billysbilling.com/v2';
  
  private async request(endpoint: string, options?: RequestInit) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-Access-Token': this.config.apiKey,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`Billy API Error: ${response.status}`);
    }
    
    return response.json();
  }
}
```

---

## 🔍 MULIG ÅRSAG TIL 404 ERRORS

### Hypotese 1: Forkert Organization ID i Claude's Requests

**Problem:** Claude bruger måske forkert eller ingen `organizationId` parameter.

**Billy API Kræver:**

```typescript
// KORREKT ✅
{
  "name": "list_invoices",
  "arguments": {
    "organizationId": "IQgm5fsl5rJ3Ub33EfAEow",  // KRITISK!
    "pageSize": 10
  }
}

// FORKERT ❌
{
  "name": "list_invoices",
  "arguments": {
    "organizationId": "",  // Tom eller mangler
    "pageSize": 10
  }
}
```

**Resultat ved forkert ID:** 404 Not Found (organization ikke fundet)

---

### Hypotese 2: Billy API Rate Limiting

**Problem:** For mange requests fra samme IP (Render.com)

**Billy Limits:**
- 10,000 requests/måned (free tier)
- Rate limit: 100 req/min

**Check hvis rate limited:**

```powershell
Invoke-RestMethod https://tekup-billy.onrender.com/health/metrics
```

**Look for:**

```json
{
  "billyApiCallsThisMonth": 9500  // ⚠️ Tæt på limit
}
```

---

### Hypotese 3: Claude's MCP Connection Config

**Problem:** Claude Desktop config mangler eller forkert.

**Windows Claude Config:** `%APPDATA%\Claude\claude_desktop_config.json`

**Korrekt Config for HTTP Server:**

```json
{
  "mcpServers": {
    "tekup-billy": {
      "command": "node",
      "args": [
        "C:\\Users\\empir\\Tekup-Billy\\dist\\index.js"
      ],
      "env": {
        "BILLY_API_KEY": "your_key_here",
        "BILLY_ORGANIZATION_ID": "IQgm5fsl5rJ3Ub33EfAEow"
      }
    }
  }
}
```

**ELLER via HTTP/SSE (Anbefalet for production test):**

```json
{
  "mcpServers": {
    "tekup-billy-production": {
      "url": "https://tekup-billy.onrender.com/mcp",
      "transport": "sse",
      "headers": {
        "X-API-Key": "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b"
      }
    }
  }
}
```

---

## 🎯 DIAGNOSTIK STEPS

### Step 1: Verificer Billy API Connection (Direkte Test)

```powershell
# Test Billy API direkte (uden MCP)
$headers = @{
  "X-Access-Token" = $env:BILLY_API_KEY
}

Invoke-RestMethod -Uri "https://api.billysbilling.com/v2/organization" -Headers $headers
```

**Expected:** Organization data (navn, adresse, settings)  
**If 404:** Billy API key eller organization ID forkert  
**If 401:** API key ugyldig eller udløbet

---

### Step 2: Test MCP Server Tools Endpoint

```powershell
$headers = @{
  "X-API-Key" = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b"
}

# List alle tools
Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/tools/list" -Headers $headers
```

**Expected:** 32 tools listed  
**If 401:** MCP API key forkert  
**If 404:** Forkert endpoint URL

---

### Step 3: Test Specifik Billy Tool

```powershell
$headers = @{
  "X-API-Key" = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b"
  "Content-Type" = "application/json"
}

$body = @{
  name = "list_invoices"
  arguments = @{
    organizationId = "IQgm5fsl5rJ3Ub33EfAEow"
    pageSize = 5
  }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/tools/call" -Method Post -Headers $headers -Body $body
```

**Expected:** List af 5 fakturaer  
**If 404:** Billy API issue (check logs)  
**If 500:** Server error (check Render logs)

---

### Step 4: Check Render Logs

**Dashboard:** <https://dashboard.render.com>

**Look for:**

```
❌ Billy API Error: 404
❌ Organization not found
❌ Invalid API key
✅ Supabase enabled - caching active
```

**CLI:**

```bash
render login
render logs -s srv-d3kk30t6ubrc73e1qon0 --tail
```

---

## 🔧 FIXES BASERET PÅ DIAGNOSTIK

### Fix 1: Hvis Organization ID Problem

**Løsning:** Verificer korrekt ID bruges i alle requests.

**For Claude:** Send altid `organizationId: "IQgm5fsl5rJ3Ub33EfAEow"` i alle tool calls.

**Eksempel:**

```
Prompt: "List my invoices"

Claude skal inkludere:
{
  "name": "list_invoices",
  "arguments": {
    "organizationId": "IQgm5fsl5rJ3Ub33EfAEow"  // ✅ KRITISK
  }
}
```

---

### Fix 2: Hvis Billy API Key Udløbet

**Symptom:** 401 Unauthorized på Billy API

**Løsning:**
1. Log ind på Billy.dk
2. Gå til **Indstillinger** → **API**
3. Klik **Generer nyt API token**
4. Opdater `BILLY_API_KEY` på Render
5. Redeploy server

---

### Fix 3: Hvis Rate Limit Nået

**Symptom:** 429 Too Many Requests

**Løsning:**
1. Check metrics: `/health/metrics`
2. Hvis `billyApiCallsThisMonth > 9000`:
   - Vent til næste måned
   - ELLER opgradér Billy.dk plan
   - ELLER enable Supabase caching (reducerer API calls 60-80%)

---

### Fix 4: Hvis Claude Config Forkert

**Løsning:** Opdater Claude Desktop config.

**Windows:**

```powershell
notepad $env:APPDATA\Claude\claude_desktop_config.json
```

**Indsæt:**

```json
{
  "mcpServers": {
    "tekup-billy": {
      "url": "https://tekup-billy.onrender.com/mcp",
      "transport": "sse",
      "headers": {
        "X-API-Key": "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b"
      }
    }
  }
}
```

**Genstart Claude Desktop.**

---

## 📊 FORVENTET OUTPUT

### Healthy System

**Health Check:**

```json
{
  "status": "healthy",
  "version": "1.4.1",
  "dependencies": {
    "billy": { "status": "healthy" },
    "supabase": { "enabled": true, "connected": true }
  }
}
```

**List Invoices:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 5 invoices:\n\nID: abc123\nNumber: 2025-001\nCustomer: Acme Corp\nAmount: 10000 DKK\nState: approved"
    }
  ]
}
```

---

## 🎯 QUICK DEBUG CHECKLIST

**Kør disse commands i rækkefølge:**

```powershell
# 1. Health check
Invoke-RestMethod https://tekup-billy.onrender.com/health

# 2. List tools
$headers = @{ "X-API-Key" = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b" }
Invoke-RestMethod https://tekup-billy.onrender.com/tools/list -Headers $headers

# 3. Test invoice list
$body = '{"name":"list_invoices","arguments":{"organizationId":"IQgm5fsl5rJ3Ub33EfAEow","pageSize":3}}'
Invoke-RestMethod https://tekup-billy.onrender.com/tools/call -Method Post -Headers $headers -Body $body -ContentType "application/json"

# 4. Check metrics
Invoke-RestMethod https://tekup-billy.onrender.com/health/metrics
```

**Expected Success:**
- ✅ Step 1: Status healthy
- ✅ Step 2: 32 tools returned
- ✅ Step 3: 3 invoices returned
- ✅ Step 4: Low error rate, good cache hit rate

---

## 📞 NÆSTE SKRIDT FOR CLAUDE

**Send mig output fra:**

```
1. Health check output
2. Tools list output (første 5 tools er nok)
3. Specific error message når du kalder list_invoices
4. Din Claude Desktop config (censurér API keys)
```

**Med den info kan jeg:**
- Identificere præcis hvor fejlen opstår
- Give dig en exact fix
- Opdatere MCP server hvis nødvendigt

---

## 🔗 Related Documentation

- **Setup Guide:** `docs/CLAUDE_DESKTOP_SETUP.md`
- **API Reference:** `docs/BILLY_API_REFERENCE.md`
- **Health Monitoring:** `docs/operations/SUPABASE_CACHING_SETUP.md`
- **Troubleshooting:** `docs/operations/RENDER_LOGS_GUIDE.md`

---

**🎯 Lad mig få output fra Quick Debug Checklist, så fixer vi det!**
