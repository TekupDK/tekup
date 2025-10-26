# TekUp AI Assistant - Scripts

Samling af automation scripts og test suites til TekUp AI Assistant projektet.

---

## 📂 Script Oversigt

| Script | Type | Status | Beskrivelse |
|--------|------|--------|-------------|
| `mcp_web_scraper.py` | MCP Server | ✅ | Web scraping med Playwright |
| `test_mcp_scraper.py` | Test | ✅ | Test MCP web scraper |
| `test_tekupvault.py` | Test | ✅ | TekupVault test suite (620 linjer) |
| `deploy-docs.ps1` | Deploy | ✅ | GitHub Pages deployment |
| `manage-docker.ps1` | Management | ✅ | Docker container management |
| `monitor-stack.ps1` | Monitoring | ✅ | System monitoring |
| `monitor-downloads.ps1` | Monitoring | ✅ | Ollama model downloads |

---

## 🗄️ TekupVault Test Suite

### Overview
Komplet test suite til TekupVault - AI-powered chat history archival system.

**Fil:** `test_tekupvault.py` (620 linjer)  
**Features:** Chat arkivering, semantic search, artifact extraction  
**Status:** ✅ 5/5 tests passed

### Kør Tests
```powershell
$env:PYTHONIOENCODING="utf-8"; python scripts/test_tekupvault.py
```

### Tests Inkluderet
1. **Archive Chat Session** - Arkiver samtaler med AI metadata
2. **Retrieve Context** - Semantisk søgning i historie
3. **Extract Code Snippets** - Udtræk kode automatisk
4. **Semantic Search Accuracy** - Test search relevans
5. **Complete Workflow** - End-to-end test

### Dokumentation
Se `README_TEKUPVAULT.md` for detaljer.

---

## 🌐 MCP Web Scraper

### Filer
- `mcp_web_scraper.py` - MCP-server til web-scraping med Playwright
- `test_mcp_scraper.py` - Test script til at verificere MCP-serveren virker

### Installation
Alle nødvendige pakker er allerede installeret:
- ✅ Python 3.13.7
- ✅ mcp
- ✅ playwright
- ✅ requests
- ✅ beautifulsoup4

### Test MCP-serveren
For at teste om MCP-serveren virker korrekt:

```powershell
python scripts/test_mcp_scraper.py
```

Dette vil:
1. Hente en test-URL
2. Vise resultatet
3. Bekræfte at Playwright fungerer

### Brug i Cursor
Se `configs/claude-desktop/CURSOR_MCP_SETUP.md` for instruktioner om hvordan du tilføjer MCP-serveren i Cursor IDE.

### Værktøjer
Når MCP-serveren er konfigureret, har AI-assistenten adgang til:

#### `fetch_url`
Henter webindhold vha. Playwright (kan håndtere JavaScript)

**Parametre:**
- `url` (påkrævet): URL'en der skal hentes
- `wait_for` (valgfri): CSS selector at vente på

**Eksempel:**
```json
{
  "url": "https://claude.ai/share/ae42cf6f-0409-4ff7-a1c1-1d78e3fb0d6a",
  "wait_for": ".conversation-content"
}
```

#### `fetch_url_simple`
Henter webindhold vha. HTTP requests (hurtigere, men kan ikke håndtere JavaScript)

**Parametre:**
- `url` (påkrævet): URL'en der skal hentes

**Eksempel:**
```json
{
  "url": "https://example.com"
}
```

### Fejlfinding

#### MCP-serveren starter ikke
1. Kontroller Python-installationen: `python --version`
2. Kontroller at alle pakker er installeret: `pip list | findstr mcp`
3. Test scriptet direkte: `python scripts/mcp_web_scraper.py`

#### Playwright fejler
1. Bekræft Chromium er installeret: `python -m playwright install chromium`
2. Test Playwright: `python scripts/test_mcp_scraper.py`

#### Timeout fejl
- Øg timeout i `mcp_web_scraper.py` (standard er 30 sekunder)
- Nogle sider kræver længere tid til at loade dynamisk indhold

---

## 🐳 Docker Management Scripts

### manage-docker.ps1
PowerShell script til at administrere Docker containers (Open WebUI).

**Commands:**
```powershell
.\scripts\manage-docker.ps1 start   # Start Open WebUI
.\scripts\manage-docker.ps1 stop    # Stop containers
.\scripts\manage-docker.ps1 restart # Restart containers
.\scripts\manage-docker.ps1 logs    # View logs
.\scripts\manage-docker.ps1 status  # Check status
```

### monitor-stack.ps1
Real-time monitoring af Docker stack.

```powershell
.\scripts\monitor-stack.ps1
```

**Viser:**
- Container status
- Resource usage (CPU, memory)
- Network activity
- Logs (real-time)

---

## 📊 Monitoring Scripts

### monitor-downloads.ps1
Overvåger Ollama model downloads med progress bars.

```powershell
.\scripts\monitor-downloads.ps1
```

**Features:**
- Real-time download progress
- ETA calculation
- Speed monitoring
- Model size tracking

---

## 🚀 Deployment Scripts

### deploy-docs.ps1
Deployer MkDocs dokumentation til GitHub Pages.

```powershell
.\scripts\deploy-docs.ps1
```

**Process:**
1. Bygger HTML med MkDocs
2. Pusher til gh-pages branch
3. Deployer automatisk til GitHub Pages

**Result:** Live docs på `https://jonasabde.github.io/tekup-ai-assistant`

---

## 🧪 Test Scripts

### test_mcp_scraper.py
Test MCP web scraper funktionalitet.

```powershell
python scripts/test_mcp_scraper.py
```

### test_tekupvault.py
Omfattende test suite til TekupVault (620 linjer).

```powershell
$env:PYTHONIOENCODING="utf-8"; python scripts/test_tekupvault.py
```

**Coverage:**
- Chat archival
- Vector embeddings
- Semantic search
- Artifact extraction
- Complete workflows

---

## 📚 Documentation

Hvert script har sin egen README:
- `README_TEKUPVAULT.md` - TekupVault detaljer

---

## 🔧 Development Setup

### Requirements
```powershell
# Python dependencies
pip install mcp playwright requests beautifulsoup4

# Install Playwright browsers
python -m playwright install chromium

# PowerShell 5.1+ (built-in on Windows)
```

### Testing
```powershell
# Test alle scripts
python scripts/test_mcp_scraper.py
python scripts/test_tekupvault.py

# Test Docker
.\scripts\manage-docker.ps1 status
```

---

## 💡 Tips & Best Practices

### Performance
- MCP web scraper: Brug `fetch_url_simple` for statiske sider (hurtigere)
- TekupVault: Mock implementations er hurtige til test
- Docker: Stop containers når ikke i brug (sparer ressourcer)

### Security
- Aldrig commit API keys eller secrets
- Brug environment variables til credentials
- Review logs før deling

### Debugging
```powershell
# Verbose output
$env:DEBUG=1; python scripts/your_script.py

# Check logs
Get-Content logs/script_name.log -Tail 50
```

---

**Sidst opdateret:** 2025-10-16  
**Total Scripts:** 7  
**Total Lines:** ~2000+

