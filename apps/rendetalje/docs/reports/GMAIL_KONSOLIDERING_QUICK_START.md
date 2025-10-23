# Gmail Konsolidering - Quick Start Guide
**Hurtig reference til konsolidering af 4 Gmail repos**

---

## 📋 HURTIG OVERSIGT

### Status:
- ❌ **Gmail-PDF-Auto** → TOM → SLET
- ❌ **Gmail-PDF-Forwarder** → NÆSTEN TOM → SLET  
- ✅ **tekup-gmail-automation** → AKTIV (Python + Node.js) → MERGER
- ✅ **Tekup Google AI (RenOS)** → PRODUKTION (TypeScript) → MERGER

### Mål:
Konsolider til **ÉT** repository: `tekup-gmail-services`

### Estimeret Tid:
⏱️ **6-12 timer total**

---

## 🚀 START MIGRATION NU (5 TRIN)

### **TRIN 1: BACKUP** (5 min) ⚠️ VIGTIGT!

```powershell
cd C:\Users\empir
mkdir gmail-repos-backup-2025-10-22
Copy-Item -Recurse tekup-gmail-automation gmail-repos-backup-2025-10-22\
Copy-Item -Recurse "Tekup Google AI\src\services\gmail*" gmail-repos-backup-2025-10-22\
Copy-Item -Recurse "Tekup Google AI\src\services\email*" gmail-repos-backup-2025-10-22\
Copy-Item -Recurse "Tekup Google AI\src\services\lead*" gmail-repos-backup-2025-10-22\
```

---

### **TRIN 2: OPRET NYT REPO** (10 min)

```powershell
# 1. Opret repository
cd C:\Users\empir
mkdir tekup-gmail-services
cd tekup-gmail-services
git init
git branch -M main

# 2. Opret struktur
mkdir apps, shared, config, docs, tests
mkdir apps\gmail-automation
mkdir apps\gmail-mcp-server
mkdir apps\renos-gmail-services
mkdir shared\types
mkdir shared\utils
mkdir config\google-credentials
mkdir docs
mkdir tests\python
mkdir tests\typescript
mkdir tests\integration

# 3. Opret .gitignore
@"
node_modules/
__pycache__/
*.pyc
.env
.env.local
token.json
*.pickle
dist/
build/
.vscode/
.DS_Store
config/google-credentials/*.json
"@ | Out-File -FilePath .gitignore

# 4. Første commit
git add .gitignore
git commit -m "Initial commit: Repository structure"
```

---

### **TRIN 3: KOPIER KODE** (30 min)

#### 3.1 Python Gmail Automation

```powershell
# Kopier Python core
Copy-Item -Recurse "C:\Users\empir\tekup-gmail-automation\src" `
  "C:\Users\empir\tekup-gmail-services\apps\gmail-automation\"

Copy-Item "C:\Users\empir\tekup-gmail-automation\pyproject.toml" `
  "C:\Users\empir\tekup-gmail-services\apps\gmail-automation\"

Copy-Item "C:\Users\empir\tekup-gmail-automation\requirements.txt" `
  "C:\Users\empir\tekup-gmail-services\apps\gmail-automation\"

Copy-Item "C:\Users\empir\tekup-gmail-automation\Dockerfile" `
  "C:\Users\empir\tekup-gmail-services\apps\gmail-automation\"

Copy-Item "C:\Users\empir\tekup-gmail-automation\README.md" `
  "C:\Users\empir\tekup-gmail-services\apps\gmail-automation\"
```

#### 3.2 Node.js MCP Server

```powershell
# Kopier MCP server
Copy-Item -Recurse "C:\Users\empir\tekup-gmail-automation\gmail-mcp-server\*" `
  "C:\Users\empir\tekup-gmail-services\apps\gmail-mcp-server\"
```

#### 3.3 RenOS Gmail Services

```powershell
# Opret struktur
mkdir "C:\Users\empir\tekup-gmail-services\apps\renos-gmail-services\src\services"
mkdir "C:\Users\empir\tekup-gmail-services\apps\renos-gmail-services\src\handlers"
mkdir "C:\Users\empir\tekup-gmail-services\apps\renos-gmail-services\src\llm"

# Kopier Gmail services
$services = @(
  "gmailService.ts",
  "gmailLabelService.ts",
  "emailAutoResponseService.ts",
  "emailResponseGenerator.ts",
  "emailIngestWorker.ts",
  "emailGateway.ts",
  "leadMonitor.ts",
  "leadParser.ts",
  "leadParserService.ts",
  "leadParsingService.ts",
  "googleAuth.ts"
)

foreach ($service in $services) {
  $sourcePath = "C:\Users\empir\Tekup Google AI\src\services\$service"
  if (Test-Path $sourcePath) {
    Copy-Item $sourcePath `
      "C:\Users\empir\tekup-gmail-services\apps\renos-gmail-services\src\services\"
    Write-Host "✅ Copied $service"
  } else {
    Write-Host "⚠️ Not found: $service"
  }
}

# Kopier email handlers
Copy-Item -Recurse "C:\Users\empir\Tekup Google AI\src\agents\handlers\*email*" `
  "C:\Users\empir\tekup-gmail-services\apps\renos-gmail-services\src\handlers\"

# Kopier AI providers (for email generation)
Copy-Item "C:\Users\empir\Tekup Google AI\src\llm\geminiProvider.ts" `
  "C:\Users\empir\tekup-gmail-services\apps\renos-gmail-services\src\llm\"
Copy-Item "C:\Users\empir\Tekup Google AI\src\llm\openAiProvider.ts" `
  "C:\Users\empir\tekup-gmail-services\apps\renos-gmail-services\src\llm\"
```

---

### **TRIN 4: KONFIGURATION** (30 min)

#### 4.1 Root README.md

```powershell
@"
# Tekup Gmail Services
**Unified Gmail & Email Automation Platform**

## 🎯 Services

### 1. gmail-automation (Python)
- PDF forwarding
- Receipt processing
- Economic API integration

### 2. gmail-mcp-server (Node.js)
- MCP protocol server
- Filter & label management
- OAuth2 auto-authentication

### 3. renos-gmail-services (TypeScript)
- AI email generation (Gemini)
- Lead monitoring & parsing
- Email approval workflow
- Calendar integration

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
cd apps/gmail-automation && pip install -e .
cd apps/gmail-mcp-server && npm install
cd apps/renos-gmail-services && npm install

# Start all services
docker-compose up
\`\`\`

## 📚 Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [Gmail Automation](docs/GMAIL_AUTOMATION.md)
- [MCP Server](docs/MCP_SERVER.md)
- [AI Email Generation](docs/AI_EMAIL_GENERATION.md)
"@ | Out-File -FilePath "C:\Users\empir\tekup-gmail-services\README.md"
```

#### 4.2 Docker Compose

```powershell
@"
version: '3.8'

services:
  gmail-automation:
    build: ./apps/gmail-automation
    container_name: gmail-automation
    environment:
      - GMAIL_CLIENT_ID=\${GMAIL_CLIENT_ID}
      - GMAIL_CLIENT_SECRET=\${GMAIL_CLIENT_SECRET}
      - ECONOMIC_RECEIPT_EMAIL=\${ECONOMIC_RECEIPT_EMAIL}
    volumes:
      - ./config/google-credentials:/app/config
      - ./logs:/app/logs
    restart: unless-stopped

  gmail-mcp-server:
    build: ./apps/gmail-mcp-server
    container_name: gmail-mcp-server
    ports:
      - "3010:3010"
    environment:
      - GMAIL_CLIENT_ID=\${GMAIL_CLIENT_ID}
      - GMAIL_CLIENT_SECRET=\${GMAIL_CLIENT_SECRET}
    restart: unless-stopped

  renos-gmail-services:
    build: ./apps/renos-gmail-services
    container_name: renos-gmail-services
    ports:
      - "3011:3011"
    environment:
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - GEMINI_KEY=\${GEMINI_KEY}
      - SUPABASE_URL=\${SUPABASE_URL}
      - SUPABASE_ANON_KEY=\${SUPABASE_ANON_KEY}
      - GMAIL_CLIENT_ID=\${GMAIL_CLIENT_ID}
      - GMAIL_CLIENT_SECRET=\${GMAIL_CLIENT_SECRET}
    restart: unless-stopped

networks:
  default:
    name: tekup-gmail-network
"@ | Out-File -FilePath "C:\Users\empir\tekup-gmail-services\docker-compose.yml"
```

#### 4.3 Environment Template

```powershell
@"
# Gmail API Credentials
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_PROJECT_ID=your-project-id
GMAIL_USER_EMAIL=your-email@gmail.com

# Economic API
ECONOMIC_RECEIPT_EMAIL=receipts@e-conomic.com
ECONOMIC_API_KEY=your-economic-api-key

# AI Services
OPENAI_API_KEY=your-openai-key
GEMINI_KEY=your-gemini-key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Calendar
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Configuration
LOG_LEVEL=INFO
RUN_MODE=dry-run
PORT=3011
"@ | Out-File -FilePath "C:\Users\empir\tekup-gmail-services\.env.example"
```

---

### **TRIN 5: TEST & COMMIT** (20 min)

```powershell
cd C:\Users\empir\tekup-gmail-services

# Test Python service
cd apps\gmail-automation
pip install -e .
python -m pytest
cd ..\..

# Test MCP server
cd apps\gmail-mcp-server
npm install
npm test
cd ..\..

# Test RenOS services
cd apps\renos-gmail-services
npm install
# npm test (når tests er opsat)
cd ..\..

# Git commit
git add .
git commit -m "Migration complete: All Gmail services consolidated"

# Optional: Push til GitHub
# git remote add origin https://github.com/tekup/tekup-gmail-services.git
# git push -u origin main
```

---

## ✅ VERIFIKATION CHECKLIST

Efter migration, verificer:

- [ ] ✅ Alle 3 services har deres kode
- [ ] ✅ README.md i root forklarer strukturen
- [ ] ✅ docker-compose.yml virker
- [ ] ✅ .env.example indeholder alle nødvendige keys
- [ ] ✅ Python tests kører (gmail-automation)
- [ ] ✅ Node.js tests kører (gmail-mcp-server)
- [ ] ✅ Git repository er initialiseret
- [ ] ✅ Første commit er lavet
- [ ] ✅ Backup af gamle repos er gemt

---

## 🧹 CLEANUP (EFTER 1 UGE SUCCESS)

**VIGTIGT:** Vent 1 uge med at slette gamle repos for at sikre alt virker!

```powershell
# Når alt virker efter 1 uge:

# Slet tomme repos
Remove-Item -Recurse -Force "C:\Users\empir\Gmail-PDF-Auto"
Remove-Item -Recurse -Force "C:\Users\empir\Gmail-PDF-Forwarder"

# Arkiver tekup-gmail-automation
Rename-Item "C:\Users\empir\tekup-gmail-automation" `
  "C:\Users\empir\tekup-gmail-automation-ARCHIVED-2025-10-22"

# Marker i Tekup Google AI at Gmail services er flyttet
# (Tilføj note i README.md)
```

---

## 📊 FORDELE OVERSIGT

### Før Konsolidering:
- 4 repositories
- 2 tomme (Gmail-PDF-Auto, Gmail-PDF-Forwarder)
- 2 aktive med 70% overlap
- Fragmenteret dokumentation
- Duplikeret Gmail API håndtering

### Efter Konsolidering:
- ✅ 1 unified repository
- ✅ 3 tydelige services
- ✅ Shared utilities og types
- ✅ Centraliseret dokumentation
- ✅ Unified Docker deployment
- ✅ Reduceret vedligeholdelse (60% mindre)

---

## 🆘 TROUBLESHOOTING

### Problem: Import errors i TypeScript
**Løsning:** Opdater import paths til at bruge relative paths

### Problem: Python dependencies konflikt
**Løsning:** Brug virtual environment per service

### Problem: Docker build fejler
**Løsning:** Tjek Dockerfile paths er korrekte relativt til build context

### Problem: Gmail API credentials virker ikke
**Løsning:** Verificer `.env` file er kopieret og udfyldt korrekt

---

## 📞 SUPPORT

- **Dokumentation:** [Full Analysis](GMAIL_REPOS_KONSOLIDERING_ANALYSE.md)
- **Issues:** Opret issue i git repository
- **Email:** info@tekup.dk

---

**Success!** 🎉 Du har nu ét unified Gmail services repository!

**Næste skridt:**
1. Test alle services grundigt
2. Opdater andre projekter til at bruge det nye repo
3. Opdater dokumentation
4. Efter 1 uge: Slet gamle repos

