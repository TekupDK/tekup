# ✅ Shortwave AI - Næste Skridt

**Deployment Status:** 🔄 Deploying fix til Render (2-3 min)  
**Fix:** Protocol version compatibility improvement  
**Commit:** `1c74209`

---

## 🎯 Hvad Vi Har Fikset

### Problem

Shortwave AI kunne ikke forbinde selvom serveren svarede korrekt. Vi fandt ud af at:
- ✅ Server initialiserer korrekt
- ✅ Session ID returneres korrekt
- ✅ Tools/list virker
- ⚠️ Server returnerede `2025-06-18` når Shortwave bad om `2024-11-05`

### Løsning

Ændret serveren til at returnere **præcis den protocol version som klienten anmoder om**:
- Shortwave sender: `2024-11-05` → Server svarer: `2024-11-05` ✅
- Andre klienter sender: `2025-06-18` → Server svarer: `2025-06-18` ✅

---

## 📝 Test Efter Deployment (om 2-3 min)

### 1. Vent På Deployment

```powershell
# Tjek health endpoint
Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/health"
```

Når dette virker, er deployment færdig.

### 2. Verificer Protocol Fix

```powershell
# Test at server nu returnerer 2024-11-05
$headers = @{ "Content-Type" = "application/json"; "Accept" = "application/json" }
$body = @{ 
    jsonrpc = "2.0"
    id = 1
    method = "initialize"
    params = @{ 
        protocolVersion = "2024-11-05"
        capabilities = @{}
        clientInfo = @{ name = "test"; version = "1.0.0" }
    }
} | ConvertTo-Json -Depth 5
$response = Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/mcp" -Method POST -Body $body -Headers $headers
Write-Host "Server returned protocol version: $($response.result.protocolVersion)"
```

**Forventet output:** `Server returned protocol version: 2024-11-05`

### 3. Reconnect I Shortwave AI

**I Shortwave:**
1. Gå til **AI integrations** (⚙️ Settings → AI Integrations)
2. Find **"Tekup-Billy Accounting"**
3. Klik **Toggle OFF** (slå fra)
4. Vent 5 sekunder
5. Klik **Toggle ON** (slå til igen)
6. **Kig efter grøn dot** ✅

### 4. Test Billy Tools

Når grøn dot vises, test med et prompt:

**Eksempel prompts:**

```
List my customers from Billy
```

```
Show me invoices from the last 30 days
```

```
What products do I have in Billy?
```

```
Show me revenue for October 2025
```

---

## 🔍 Hvis Det Stadig Ikke Virker

### Check 1: Render Logs

```
1. Gå til https://dashboard.render.com
2. Vælg "tekup-billy"
3. Klik "Logs"
4. Kig efter "shortwave-mcp-client" requests
5. Tjek om der er fejl EFTER initialize
```

### Check 2: Test Full Connection Flow

```powershell
# Simuler Shortwave's complete flow
Write-Host "Step 1: Initialize..." -ForegroundColor Cyan
$headers = @{ "Content-Type" = "application/json"; "Accept" = "application/json" }
$body = @{ 
    jsonrpc = "2.0"; id = 1; method = "initialize"
    params = @{ 
        protocolVersion = "2024-11-05"
        capabilities = @{ experimental = @{}; sampling = @{} }
        clientInfo = @{ name = "shortwave-mcp-client"; version = "0.0.1" }
    }
} | ConvertTo-Json -Depth 5
$initResponse = Invoke-WebRequest -Uri "https://tekup-billy.onrender.com/mcp" -Method POST -Body $body -Headers $headers
$sessionId = $initResponse.Headers['Mcp-Session-Id']
Write-Host "✅ Session ID: $sessionId" -ForegroundColor Green

Write-Host "`nStep 2: Send notification..." -ForegroundColor Cyan
$headers['Mcp-Session-Id'] = $sessionId
$body = @{ jsonrpc = "2.0"; method = "notifications/initialized"; params = @{} } | ConvertTo-Json
$notifyResponse = Invoke-WebRequest -Uri "https://tekup-billy.onrender.com/mcp" -Method POST -Body $body -Headers $headers
Write-Host "✅ Status: $($notifyResponse.StatusCode)" -ForegroundColor Green

Write-Host "`nStep 3: List tools..." -ForegroundColor Cyan
$body = @{ jsonrpc = "2.0"; id = 2; method = "tools/list"; params = @{} } | ConvertTo-Json
$toolsResponse = Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/mcp" -Method POST -Body $body -Headers $headers
Write-Host "✅ Found $($toolsResponse.result.tools.Count) tools:" -ForegroundColor Green
$toolsResponse.result.tools | Select-Object -First 5 | ForEach-Object { Write-Host "   - $($_.name)" }
```

Hvis alle 3 steps virker, så er problemet på Shortwave's side.

### Check 3: Cache/Timeout Issues

Hvis serveren virker perfekt men Shortwave stadig fejler:
- Shortwave cacher muligvis den gamle fejl
- Prøv at **remove og re-add** integration (ikke bare toggle):
  1. Klik "View tools" på Tekup-Billy integration
  2. Klik "Remove integration" (nederst)
  3. Vent 10 sekunder
  4. Klik "Add custom integration"
  5. Vælg "Remote MCP server"
  6. Name: `Tekup-Billy Accounting`
  7. URL: `https://tekup-billy.onrender.com/mcp`
  8. Save & Enable

---

## 📞 Hvis Intet Virker

### Kontakt Shortwave Support

Email: <support@shortwave.com>  
Discord: <https://discord.gg/shortwave>

**Information at give dem:**

```
MCP Server URL: https://tekup-billy.onrender.com/mcp
Protocol Version: 2024-11-05 (Streamable HTTP)
Tools Count: 19

Server Test Results:
✅ Initialize: 200 OK
✅ Session ID: Returned correctly
✅ Tools/List: 19 tools returned
✅ Protocol Version: Returns client's requested version

PowerShell test that works:
[paste the "Test Full Connection Flow" script]

Error shown in Shortwave:
"Failed to connect to MCP server [500]"
```

---

## ⏱️ Timeline

- **19:55** - Shortwave sendte succesfuld initialize request
- **19:58** - Vi verificerede session ID returneres korrekt
- **20:00** - Deployed protocol version fix
- **20:03** - Deployment færdig (forventet)
- **20:05** - Test reconnection i Shortwave

---

## 🎯 Success Criteria

✅ Grøn dot ved Tekup-Billy integration  
✅ Kan kalde tools fra Shortwave assistant  
✅ Billy data vises i responses

---

**Current Time:** ~20:00  
**Wait Until:** 20:03  
**Then:** Reconnect i Shortwave AI
