# 🚀 TekUp AI Assistant - Setup Guide

Komplet installationsguide til opsætning af din lokale AI-assistent.

## ⚙️ Prerequisites

- **Windows 10/11** (x64)
- **16GB+ RAM** (32GB+ recommended) - Du har: **64GB ✅**
- **GPU:** NVIDIA RTX series (optional but recommended) - Du har: **RTX 5070 ✅**
- **Disk Space:** ~50GB free (for models)
- **Internet:** For initial download only

---

## 📋 Phase 1: Install Ollama (10 minutes)

### Step 1: Download Ollama

**Install via winget (anbefalet):**
```powershell
winget install Ollama.Ollama
```

**Eller download manuelt:**

- Visit: <https://ollama.com/download/windows>
- Download Windows installer
- Kør installer og følg instruktioner

### Step 2: Verify Installation

```powershell
# Check version
ollama --version

# Should output: ollama version is 0.x.x
```

### Step 3: Download AI Models

**Download Qwen2.5-Coder (for coding assistance):**
```powershell
ollama pull qwen2.5-coder:14b-instruct-q4_K_M
```
⏱️ _Download size: ~8GB, takes 5-15 minutes depending on connection_

**Download Llama 3.3 (for general tasks):**
```powershell
ollama pull llama3.3:8b-instruct-q5_K_M
```
⏱️ _Download size: ~6GB_

**Download Mistral (for fast responses):**
```powershell
ollama pull mistral:7b-instruct-q4_K_M
```
⏱️ _Download size: ~4GB_

### Step 4: Test Ollama

```powershell
# List downloaded models
ollama list

# Start interactive chat with Qwen
ollama run qwen2.5-coder:14b-instruct-q4_K_M

# Type a test message:
# "Write a TypeScript function to format Danish currency"

# Exit: Ctrl+D or type /bye
```

**Expected output:**
```typescript
function formatDanishCurrency(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK'
  }).format(amount);
}
```

---

## 📋 Phase 2: Install Jan AI (5 minutes)

### Step 1: Download Jan AI

**Install via winget (anbefalet):**
```powershell
winget install Jan.Jan
```

**Eller download manuelt:**

- Visit: <https://jan.ai/download>
- Download Windows installer
- Kør installer

### Step 2: Launch Jan AI

1. Open Jan AI from Start Menu
2. Wait for initial setup to complete

### Step 3: Configure Ollama Connection

1. Click **Settings** (⚙️ icon i venstre sidebar)
2. Go to **Model Sources**
3. Click **+ Add Model Source**
4. Select **Ollama** from dropdown
5. URL: `http://localhost:11434`
6. Click **Connect**

✅ Du skulle se "Connected successfully" hvis Ollama kører

### Step 4: Configure Default Model

1. Go to **Chat** tab
2. Click **Select Model** (øverst)
3. Under "Ollama Models" vælg **qwen2.5-coder:14b-instruct-q4_K_M**
4. Click **Use Model**

### Step 5: Test Chat

Type i chat:
```
Explain TypeScript interfaces in simple terms
```

**Expected:**

- Response inden for 5-10 sekunder
- Kvalitets svar om TypeScript
- GPU utilization (check Task Manager → Performance → GPU)

---

## 📋 Phase 2.5: Install Open WebUI (Docker-based Alternative) (10 minutes)

> **Alternative til Jan AI:** Hvis du foretrækker en moderne web-baseret interface med fuld CLI-kontrol

### Prerequisites

- Docker Desktop må være installeret (check: `docker --version`)
- Ollama kørende i baggrund

### Step 1: Automated Setup (Anbefalet)

```powershell
./scripts/setup-open-webui.ps1
```

Dette script vil:

- ✅ Verificere Docker er kørende
- ✅ Hente Open WebUI Docker image
- ✅ Starte container på port 3000
- ✅ Vente på health check
- ✅ Vise næste steps

### Step 2: Manual Setup (Alternative)

Hvis du foretrækker manuel kontrol:

```powershell
# Start Docker Desktop hvis det ikke kører
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Vent 10 sekunder
Start-Sleep -Seconds 10

# Start Open WebUI container
docker run -d -p 3000:8080 `
  --add-host=host.docker.internal:host-gateway `
  --name open-webui `
  ghcr.io/open-webui/open-webui:latest
```

### Step 3: Monitor Stack Status

```powershell
# Monitor alle tjenester (Ollama, Open WebUI, Docker)
./scripts/monitor-stack.ps1
```

**Expected output:**
```
TekUp Stack Monitor

Ollama Server:
   [OK] Ollama is running

Open WebUI:
   [OK] Open WebUI is running

Docker Container:
   [OK] Container is running
   open-webui Up X minutes

Done
```

### Step 4: Access Open WebUI

1. Open browser: <http://localhost:3000>
2. Opret admin account (første bruger)
3. Gå til **Settings → Models**
4. Add connection: `http://host.docker.internal:11434`
5. Select dine Ollama modeller:
   - qwen2.5-coder:14b-instruct-q4_K_M
   - llama3.3:8b-instruct-q5_K_M
   - mistral:7b-instruct-q4_K_M

### Step 5: Test Chat

Send besked i Open WebUI:
```
Write a TypeScript function to calculate invoice total with tax
```

**Expected:** Response inden for 5-10 sekunder

---

## 🛠️ Docker Management CLI Commands

### Check Status

```powershell
./scripts/manage-docker.ps1 -Action status
```

### View Real-time Logs

```powershell
./scripts/manage-docker.ps1 -Action logs
```

### Stop Container

```powershell
./scripts/manage-docker.ps1 -Action stop
```

### Start Container

```powershell
./scripts/manage-docker.ps1 -Action start
```

### Health Check

```powershell
./scripts/manage-docker.ps1 -Action health
```

---

## 📚 Full CLI Control Guide

Se komplet guide med alle commands:

- **[CLI Control Guide](guides/cli-control.md)** - Alle Docker/Ollama/Open WebUI commands
- **[Docker Troubleshooting](guides/docker-troubleshooting.md)** - Fælles problemer og løsninger

---

## 📋 Phase 3: Configure Billy.dk Integration (15 minutes)

### Step 1: Understand Current Setup

Du har allerede:

- **Tekup-Billy** deployed på: <https://tekup-billy.onrender.com>
- **API endpoints** til Billy.dk (invoices, customers, products)

### Step 2: Find Jan AI Config Location

Jan AI config fil er typisk her:
```
C:\Users\empir\AppData\Roaming\jan\extensions\
```

eller

```
C:\Users\empir\.jan\extensions\
```

### Step 3: Create MCP Config

**Opret fil:** `mcp-config.json` i extensions folder

**Content (start simple):**
```json
{
  "mcpServers": {
    "tekup-billy": {
      "command": "node",
      "args": [
        "-e",
        "const http = require('http'); const fetch = require('node-fetch'); const server = http.createServer(async (req, res) => { if (req.method === 'POST' && req.url === '/mcp/tools/list') { res.writeHead(200, {'Content-Type': 'application/json'}); res.end(JSON.stringify({tools: [{name: 'create_invoice', description: 'Create invoice in Billy.dk', inputSchema: {type: 'object', properties: {customer_id: {type: 'string'}, hours: {type: 'number'}, description: {type: 'string'}}, required: ['customer_id', 'hours']}}]})); } else if (req.method === 'POST' && req.url === '/mcp/tools/call') { let body = ''; req.on('data', chunk => body += chunk); req.on('end', async () => { const data = JSON.parse(body); if (data.name === 'create_invoice') { const result = await fetch('https://tekup-billy.onrender.com/billy/invoices', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data.arguments) }); const json = await result.json(); res.writeHead(200, {'Content-Type': 'application/json'}); res.end(JSON.stringify(json)); } }); } }); server.listen(3001); console.log('Billy MCP running on port 3001');"
      ]
    }
  }
}
```

**Note:** Dette er en simpel inline MCP server. I Phase 2 bygger vi en proper server.

### Step 4: Restart Jan AI

1. Close Jan AI helt
2. Åbn igen
3. Check at MCP server starter (se console/logs)

### Step 5: Test Billy Integration (Manual First)

**Test API direkte først:**
```powershell
# Test Tekup-Billy API
curl https://tekup-billy.onrender.com/billy/customers

# Should return customer list
```

---

## 📋 Phase 4: Verify Everything Works (5 minutes)

### Checklist

- [ ] **Ollama running:** `ollama list` viser 3 modeller
- [ ] **Jan AI connected:** Jan AI kan se Ollama models
- [ ] **Chat works:** Kan få responses fra AI
- [ ] **GPU utilized:** Task Manager viser GPU usage når AI svarer
- [ ] **Tekup-Billy accessible:** API svarer på requests

### Test Commands i Jan AI

**Test 1: General query**
```
What is TypeScript?
```

**Test 2: Coding assistance**
```
Write a React component for a booking form with fields:
- Customer name
- Date picker
- Service type dropdown (Basic, Deep, Move-out)
- Duration (2-8 hours)
```

**Test 3: Danish response**
```
Forklar hvad React hooks er på dansk
```

---

## 🐛 Troubleshooting

### Ollama won't start

```powershell
# Check if already running
tasklist | findstr ollama

# Kill and restart
taskkill /F /IM ollama.exe
ollama serve
```

### Model download fails

```powershell
# Check disk space
Get-PSDrive C | Select-Object Used,Free

# Clear Ollama cache
Remove-Item -Recurse -Force $env:USERPROFILE\.ollama\models\blobs\sha256-*

# Retry download
ollama pull qwen2.5-coder:14b-instruct-q4_K_M
```

### Jan AI can't connect to Ollama

1. **Ensure Ollama is running:**
   ```powershell
   ollama serve
   ```

2. **Check port 11434 is free:**
   ```powershell
   netstat -an | findstr 11434
   ```
   Should show: `LISTENING` on port 11434

3. **Restart Jan AI** completely

4. **Check firewall:** Windows Defender might block localhost connections
   - Settings → Windows Security → Firewall → Allow an app
   - Add Ollama and Jan AI

### GPU not being used

1. **Check NVIDIA drivers:**
   ```powershell
   nvidia-smi
   ```

2. **Verify Ollama sees GPU:**
   ```powershell
   ollama run qwen2.5-coder:14b-instruct-q4_K_M "test"
   ```
   Should show GPU usage in Task Manager

3. **If CPU only:** Models will work but slower (10-30 sek vs 3-5 sek)

### Jan AI MCP server not starting

1. **Check Node.js installed:**
   ```powershell
   node --version
   ```
   Should show v24.8.0 or similar

2. **Check MCP config syntax:** Validate JSON
   ```powershell
   Get-Content "C:\Users\empir\.jan\extensions\mcp-config.json" | ConvertFrom-Json
   ```

3. **Check Jan AI logs:**
   - Open Jan AI
   - Settings → Advanced → Show Logs
   - Look for MCP errors

---

## 📊 Performance Expectations

### With Your Hardware (RTX 5070 8GB + 64GB RAM)

| Model | Response Time | Quality | Use Case |
|-------|---------------|---------|----------|
| Qwen2.5-Coder 14B | 3-5 sek | Excellent | Coding, debugging |
| Llama 3.3 8B | 2-3 sek | Very Good | General chat, business |
| Mistral 7B | 1-2 sek | Good | Quick answers |

### GPU Memory Usage

| Model | VRAM Used | Can Run? |
|-------|-----------|----------|
| Qwen 14B Q4 | ~7GB | ✅ Yes |
| Llama 8B Q5 | ~5GB | ✅ Yes |
| Mistral 7B Q4 | ~3.5GB | ✅ Yes |
| Multiple simultaneously | 8GB+ | ⚠️ One at a time |

---

## 📊 Next Steps

Once Phase 1-4 complete:

1. ✅ **See [WORKFLOWS.md](WORKFLOWS.md)** for usage examples
2. ✅ **See [ARCHITECTURE.md](ARCHITECTURE.md)** for system overview
3. ⏳ **Configure RenOS integration** (Phase 3)
4. ⏳ **Setup system monitoring** (Phase 4)

---

## 🎯 Success Metrics

After completing setup, you should achieve:

- ✅ **AI response time:** <5 sekunder (typically 2-4 sek)
- ✅ **Chat quality:** Coherent, relevant responses
- ✅ **GPU utilization:** 70-90% during inference
- ✅ **System stability:** No crashes, smooth operation

---

**Estimated Total Time:** 30-40 minutes  
**Your Status:** 🚧 Start with Phase 1 (Ollama installation)

**Need help?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) eller se chat.md for tidligere diskussioner.

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-15  
**Author:** TekUp AI Assistant Project

