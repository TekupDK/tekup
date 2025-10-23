# 📊 Render.com Logs - Adgang & Analyse Guide

**Projekt:** Tekup-Billy MCP Server  
**Oprettet:** 20. oktober 2025  
**Formål:** Komplet guide til at tilgå, analysere og forstå production logs fra Render.com

---

## 🎯 Hurtig Start

### Adgang til Render Dashboard

1. **Log ind på Render.com**

   ```
   URL: https://dashboard.render.com
   Login: [Jonas's account]
   ```

2. **Find Tekup-Billy Service**

   ```
   Dashboard → Services → "tekup-billy-mcp"
   Service ID: srv-d3kk30t6ubrc73e1qon0
   Region: Frankfurt (EU Central)
   ```

3. **Åbn Logs Tab**

   ```
   Click på service → Tab: "Logs"
   Live logs vises automatisk (real-time streaming)
   ```

---

## 📋 Log Typer

### 1. Application Logs (Main Focus)

**Format:** JSON structured logs via Winston

```json
{
  "level": "info",
  "message": "HTTP Request",
  "timestamp": "2025-10-20T10:15:23.456Z",
  "method": "POST",
  "path": "/mcp",
  "ip": "185.123.45.67",
  "userAgent": "claude-ai/0.1.0",
  "service": "tekup-billy-mcp",
  "version": "1.3.0"
}
```

**Vigtige log patterns:**

| Log Message | Betydning | Action |
|-------------|-----------|--------|
| `Tekup-Billy MCP HTTP Server started` | Server boot success | ✅ Normal |
| `Environment validated` | Config loaded OK | ✅ Normal |
| `Billy client initialized` | API connection ready | ✅ Normal |
| `Tools registered` | All 32 tools loaded | ✅ Normal |
| `Billy API Error` | API call failed | ⚠️ Investigate |
| `MCP_API_KEY not set` | Auth disabled | 🔴 Fix env var |
| `[ChatGPT] POST /` | ChatGPT client request | 📊 Track usage |
| `[LEGACY] MCP SSE connection` | Claude.ai client | 📊 Track usage |

### 2. System Logs (Render Platform)

**Format:** Plain text from Render infrastructure

```
Oct 20 10:15:23 PM  Deployment successful (build: 1m 23s)
Oct 20 10:16:01 PM  Health check passed: /health
Oct 20 10:17:00 PM  Auto-scale: Instance count: 1 → 2
```

### 3. Build Logs

**Format:** Docker build output

```
Building Docker image...
Step 1/8 : FROM node:18-alpine
Step 2/8 : WORKDIR /app
...
Successfully built 7a8f3e2c1b9d
```

---

## 🔍 Hvordan Man Finder Specifikke Logs

### Option 1: Render Dashboard (GUI)

**Live Logs (Real-time):**

```
Dashboard → tekup-billy-mcp → Logs
- Auto-scrolling live stream
- Viser sidste 1000 linjer
- Farve-kodet efter log level
```

**Filtrering:**

```
1. Find søgefeltet øverst i logs tab
2. Skriv filter (f.eks. "Billy API Error")
3. Logs opdateres automatisk
```

**Tidsperiode:**

```
Default: Sidste 24 timer
Click "Load Earlier Logs" for ældre data
Maks: 7 dage history (Starter plan)
```

### Option 2: Render CLI

**Installation:**

```bash
# Windows PowerShell
npm install -g @renderinc/cli
render login
```

**Hent Logs:**

```bash
# Live tail (real-time)
render logs -s srv-d3kk30t6ubrc73e1qon0 --tail

# Sidste 100 linjer
render logs -s srv-d3kk30t6ubrc73e1qon0 --lines 100

# Tidsfilter
render logs -s srv-d3kk30t6ubrc73e1qon0 --since 2h
render logs -s srv-d3kk30t6ubrc73e1qon0 --since "2025-10-18 10:00"
```

### Option 3: Render API (Programmatic)

**Setup:**

```bash
# Generer API key på: https://dashboard.render.com/u/settings/api-keys
$RENDER_API_KEY = "rnd_xxxxxxxxxxxxx"
```

**Hent Logs:**

```powershell
# PowerShell
$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
}

Invoke-RestMethod `
  -Uri "https://api.render.com/v1/services/srv-d3kk30t6ubrc73e1qon0/logs" `
  -Headers $headers `
  -Method GET
```

---

## 📊 Log Analyse - De Sidste Par Dage

### Lokale Logs (Udvikling)

**Filer:**

```
logs/user-actions-2025-10-11.json   # 11. oktober
logs/user-actions-2025-10-12.json   # 12. oktober
logs/exceptions.log                  # Fejl log
logs/rejections.log                  # Promise rejections
```

**Analyse:**

```powershell
# Vis sidste 50 linjer fra 12. oktober
Get-Content logs\user-actions-2025-10-12.json -Tail 50

# Count tool calls per dag
(Get-Content logs\user-actions-2025-10-12.json | ConvertFrom-Json).Count

# Find specifikke actions
Get-Content logs\user-actions-2025-10-12.json | Select-String "createCustomer"
```

### Production Logs (Render.com)

**Hvad at kigge efter:**

1. **Tool Usage Patterns**

   ```
   Søg: "tools/call"
   Analyse: Hvilke tools bruges mest?
   ```

2. **Error Rates**

   ```
   Søg: "Billy API Error"
   Analyse: Fejl patterns, specifikke endpoints
   ```

3. **Client Types**

   ```
   Søg: "ChatGPT|Claude|shortwave|RenOS"
   Analyse: Hvilke klienter bruger systemet?
   ```

4. **Response Times**

   ```
   Søg: "executionTime"
   Analyse: Performance metrics per tool
   ```

5. **Authentication Issues**

   ```
   Søg: "Unauthorized|401|403"
   Analyse: Auth failures, invalid API keys
   ```

---

## 🚨 Common Log Patterns & Troubleshooting

### ✅ Normal Operation

```json
{
  "level": "info",
  "message": "Tekup-Billy MCP HTTP Server started",
  "httpApi": "http://localhost:3000",
  "mcpSse": "http://localhost:3000/mcp",
  "healthCheck": "http://localhost:3000/health",
  "toolCount": 32
}
```

**Betyder:** Server er startet korrekt med alle tools loaded

---

### ⚠️ Billy API Rate Limiting

```json
{
  "level": "warn",
  "message": "Billy API rate limit approaching",
  "requestsInWindow": 95,
  "maxRequests": 100
}
```

**Action:** Reducer API calls, implementer caching

---

### 🔴 Authentication Failure

```json
{
  "level": "error",
  "message": "Billy API Error",
  "status": 401,
  "details": "Invalid API key"
}
```

**Action:**
1. Check `BILLY_API_KEY` i Render Environment
2. Verify key på Billy.dk dashboard
3. Regenerér key hvis expired

---

### 🔴 Database Connection Error

```json
{
  "level": "error",
  "message": "Supabase connection failed",
  "error": "Connection timeout"
}
```

**Action:**
1. Check `SUPABASE_URL` og `SUPABASE_ANON_KEY`
2. Verify Supabase project er online
3. Check network connectivity fra Render til Supabase

---

### 📊 High Traffic Pattern

```json
{
  "level": "info",
  "message": "Rate limit: Using Redis for distributed rate limiting",
  "windowMs": 900000,
  "max": 100
}
```

**Betyder:** Redis er aktiv for distributed rate limiting (skalerbar)

---

## 📈 Metrics at Tracke

### 1. Request Volume

```
Metric: Total requests per time
Query: Count lines with "HTTP Request"
Ideal: < 1000/hour (Starter plan)
```

### 2. Error Rate

```
Metric: Errors / Total requests
Query: Count "level":"error" vs total
Ideal: < 1% error rate
```

### 3. Tool Usage Distribution

```
Metric: Tool call frequency
Query: Count by "toolName"
Top 5:
  1. list_invoices
  2. create_customer
  3. list_customers
  4. create_invoice
  5. update_customer
```

### 4. Client Distribution

```
Metric: Requests by client type
Query: Count by "userAgent"
Breakdown:
  - Claude.ai: 40%
  - ChatGPT: 30%
  - RenOS Backend: 20%
  - Shortwave: 10%
```

### 5. Response Time

```
Metric: Average execution time
Query: Average "executionTime"
Ideal: < 500ms (Billy API latency)
```

---

## 🛠️ Log Download & Backup

### Manual Download (Dashboard)

```
1. Render Dashboard → tekup-billy-mcp → Logs
2. Click "Export Logs" button (øverst til højre)
3. Select tidsperiode (max 7 dage)
4. Download som .txt fil
5. Gem i: docs/operations/logs/YYYY-MM-DD-render-logs.txt
```

### Automated Backup Script

```powershell
# backup-render-logs.ps1
$SERVICE_ID = "srv-d3kk30t6ubrc73e1qon0"
$OUTPUT_DIR = "docs/operations/logs"
$DATE = Get-Date -Format "yyyy-MM-dd"

# Hent logs via CLI
render logs -s $SERVICE_ID --lines 10000 > "$OUTPUT_DIR\$DATE-render-logs.txt"

Write-Host "✅ Logs backed up: $OUTPUT_DIR\$DATE-render-logs.txt"
```

**Automation:**

```powershell
# Kør dagligt kl 23:00
# Windows Task Scheduler → Create Task
# Action: powershell.exe -File "C:\path\to\backup-render-logs.ps1"
```

---

## 📊 Log Retention Policy

### Render.com Limits

| Plan | Log Retention | Export |
|------|---------------|--------|
| Starter (Free) | 7 dage | Manual download |
| Standard | 30 dage | Manual download |
| Pro | 90 dage | API access |

### Recommendation

**For Tekup-Billy (Starter plan):**
1. **Weekly backup** - Download logs hver uge
2. **Store lokalt** - Gem i `docs/operations/logs/`
3. **Cloud backup** - Upload til S3/Google Drive
4. **Retention** - Behold minimum 90 dage

---

## 🔧 Advanced Log Analysis

### 1. User Journey Tracking

**Goal:** Se hvilket flow en bruger gennemgår

```powershell
# Find alle requests fra specifik session
Get-Content logs\user-actions-2025-10-12.json | 
  ConvertFrom-Json | 
  Where-Object { $_.sessionId -eq "abc123" } |
  Sort-Object timestamp |
  Format-Table action, tool, timestamp
```

**Output:**

```
action           tool        timestamp
------           ----        ---------
list_customers   customers   2025-10-12T10:00:00.000Z
create_invoice   invoices    2025-10-12T10:01:23.456Z
send_invoice     invoices    2025-10-12T10:02:45.789Z
```

### 2. Error Pattern Analysis

**Goal:** Identificer gentagne fejl

```powershell
# Group errors by message
Get-Content logs\exceptions.log | 
  Select-String "Billy API Error" | 
  Group-Object | 
  Sort-Object Count -Descending |
  Select-Object Count, Name -First 10
```

### 3. Performance Bottleneck Detection

**Goal:** Find langsomme endpoints

```powershell
# Find requests over 1000ms
Get-Content logs\user-actions-2025-10-12.json | 
  ConvertFrom-Json | 
  Where-Object { $_.metadata.executionTime -gt 1000 } |
  Select-Object action, tool, @{N='Time';E={$_.metadata.executionTime}}
```

---

## 📚 Related Documentation

- **[USAGE_PATTERNS_REPORT.md](./USAGE_PATTERNS_REPORT.md)** - Detaljeret usage statistik
- **[DEPLOYMENT_COMPLETE.md](../DEPLOYMENT_COMPLETE.md)** - Deployment guide
- **[MONITORING_SETUP.md](./MONITORING_SETUP.md)** - Monitoring & alerting setup
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues og fixes

---

## ✅ Best Practices

1. **Check logs dagligt** - 5 min review hver morgen
2. **Monitor error rate** - Alert hvis > 5% errors
3. **Track tool usage** - Optimize hyppigt brugte tools
4. **Backup weekly** - Download logs hver søndag
5. **Document incidents** - Log alle production issues
6. **Review monthly** - Kvartalsk performance review

---

**Last Updated:** 20. oktober 2025  
**Maintainer:** Jonas Abde  
**Service:** tekup-billy-mcp (srv-d3kk30t6ubrc73e1qon0)  
**Region:** Frankfurt (EU Central)
