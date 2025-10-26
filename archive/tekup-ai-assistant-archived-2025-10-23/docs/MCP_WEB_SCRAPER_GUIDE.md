# MCP Web Scraper Setup Guide

## 🎯 Hvad er implementeret?

En Python-baseret MCP (Model Context Protocol) server der giver AI-assistenten evnen til at hente og analysere webindhold direkte, inklusiv JavaScript-renderet indhold fra delte Claude-samtaler.

## ✅ Installation Status

Alle nødvendige komponenter er installeret og testet:

- ✅ **Python 3.13.7** - Kørende og verificeret
- ✅ **Node.js v24.8.0** - Installeret (bonus, ikke påkrævet)
- ✅ **MCP Python pakke** - Installeret
- ✅ **Playwright** - Installeret med Chromium browser
- ✅ **Requests & BeautifulSoup4** - Installeret
- ✅ **MCP Web Scraper** - Oprettet og testet
- ✅ **Test Suite** - Alle tests bestået ✅

## 🚀 Næste skridt: Aktivér MCP-serveren i Cursor

### Metode 1: Via Cursor Settings (Anbefalet)

1. **Åbn Cursor Settings**
   - Tryk `Ctrl+,` eller File > Preferences > Settings

2. **Find MCP Settings**
   - Søg efter "MCP" i søgefeltet
   - Gå til Features > MCP

3. **Tilføj MCP Server**
   - Klik på "+ Add New MCP Server"
   - Indtast:
     - **Navn:** `web-scraper`
     - **Type:** `stdio`
     - **Command:** `python`
     - **Args:** `C:\Users\empir\tekup-ai-assistant\scripts\mcp_web_scraper.py`

4. **Gem og Genstart**
   - Gem ændringerne
   - Genstart Cursor fuldstændigt (luk og åbn)

### Metode 2: Via konfigurationsfil

Hvis Cursor understøtter at læse MCP-konfiguration fra fil:

```json
{
  "mcpServers": {
    "web-scraper": {
      "command": "python",
      "args": ["C:\\Users\\empir\\tekup-ai-assistant\\scripts\\mcp_web_scraper.py"]
    }
  }
}
```

Konfigurationsfilen findes allerede her: `configs/claude-desktop/mcp_config.json`

## 🔧 Tilgængelige værktøjer

Når MCP-serveren er aktiveret, har AI-assistenten adgang til:

### 1. `fetch_url` (Anbefalet til dynamisk indhold)

Bruger Playwright med Chromium til at hente indhold, inklusiv JavaScript-renderet sider.

**Eksempel brug:**
```
Brug fetch_url værktøjet til at hente indhold fra:
https://claude.ai/share/ae42cf6f-0409-4ff7-a1c1-1d78e3fb0d6a
```

**Parametre:**
- `url` (påkrævet): URL'en der skal hentes
- `wait_for` (valgfri): CSS selector at vente på før scraping

### 2. `fetch_url_simple` (Hurtigere til statiske sider)

Bruger simple HTTP requests til statiske HTML-sider.

**Eksempel brug:**
```
Brug fetch_url_simple værktøjet til at hente: https://example.com
```

## 🧪 Verificér installation

### Test MCP-serveren direkte:

```powershell
python scripts/test_mcp_scraper.py
```

Du skulle se:
```
✅ Simple HTTP: PASSED
✅ Playwright: PASSED
🎉 Alle tests bestået!
```

### Test i Cursor (efter genstart):

Åbn en ny chat og spørg:
```
Hvilke MCP-værktøjer har du adgang til?
```

Du skulle se `fetch_url` og `fetch_url_simple` i listen.

## 🎯 Brug MCP-serveren

### Eksempel 1: Hent delt Claude-samtale

```
Brug fetch_url til at hente indholdet fra denne delte Claude-samtale:
https://claude.ai/share/ae42cf6f-0409-4ff7-a1c1-1d78e3fb0d6a

Analysér derefter indholdet og giv mig en rapport.
```

### Eksempel 2: Hent og analysér enhver webside

```
Hent indholdet fra https://example.com og giv mig en opsummering.
```

## 🔍 Fejlfinding

### Problem: MCP-server vises ikke i Cursor

**Løsning:**
1. Bekræft at Python er i PATH: `python --version`
2. Kontroller den fulde sti er korrekt i konfigurationen
3. Genstart Cursor fuldstændigt
4. Tjek Cursor's output/developer tools for fejl

### Problem: Playwright timeout fejl

**Løsning:**
1. Kontroller internetforbindelse
2. Nogle sider tager længere tid - timeout kan øges i `mcp_web_scraper.py`
3. Prøv `fetch_url_simple` som alternativ for statiske sider

### Problem: UnicodeEncodeError

**Løsning:**
- Dette er allerede fikset i test-scriptet
- Hvis det sker i MCP-serveren, lad mig vide

## 📁 Fil struktur

```
tekup-ai-assistant/
├── configs/
│   └── claude-desktop/
│       ├── mcp_config.json           # MCP konfiguration
│       └── CURSOR_MCP_SETUP.md       # Detaljerede setup-instruktioner
├── scripts/
│   ├── mcp_web_scraper.py            # MCP server (hovedfil)
│   ├── test_mcp_scraper.py           # Test suite
│   └── README.md                     # Scripts dokumentation
└── docs/
    └── MCP_WEB_SCRAPER_GUIDE.md      # Denne guide
```

## 🎉 Hvad kan du nu gøre?

Med MCP Web Scraper aktiveret kan AI-assistenten:

1. ✅ Hente indhold fra delte Claude-samtaler
2. ✅ Analysere dynamisk JavaScript-renderet indhold
3. ✅ Scrape enhver offentlig tilgængelig webside
4. ✅ Automatisk analysere og rapportere om webindhold
5. ✅ Integrere web-data i dit TekUp AI Assistant workflow

## 📞 Support

Hvis du støder på problemer:

1. Kør test-scriptet: `python scripts/test_mcp_scraper.py`
2. Tjek logs i Cursor's developer tools
3. Verificér alle pakker er installeret: `pip list | findstr "mcp playwright requests"`

## 🔄 Næste opgave

Nu hvor MCP-serveren er sat op, er næste skridt:

1. **Tilføj MCP-serveren i Cursor Settings** (følg Metode 1 ovenfor)
2. **Genstart Cursor**
3. **Test at værktøjerne er tilgængelige**
4. **Hent og analysér det delte Claude-link**

Når du har aktiveret MCP-serveren i Cursor, kan du bede AI-assistenten om at hente og analysere indholdet fra:
```
https://claude.ai/share/ae42cf6f-0409-4ff7-a1c1-1d78e3fb0d6a
```

