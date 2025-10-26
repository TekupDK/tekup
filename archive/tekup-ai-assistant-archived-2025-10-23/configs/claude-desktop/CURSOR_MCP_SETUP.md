# Cursor MCP Setup Instruktioner

## Status
✅ Node.js installeret (v24.8.0)
✅ npm installeret (11.6.0)
✅ Python installeret (3.13.7)
✅ Python MCP web scraper oprettet
✅ Playwright & Chromium installeret
✅ MCP konfigurationsfil oprettet

## Implementeret løsning
Vi bruger en **Python-baseret MCP-server** i stedet for den deprecated Puppeteer npm-pakke.

### Fordele ved vores løsning:
- ✅ Bruger Playwright (moderne, vedligeholdt)
- ✅ Kan håndtere JavaScript-renderet indhold (som Claude-samtaler)
- ✅ Inkluderer både Playwright og simple HTTP requests
- ✅ Fuld kontrol over funktionalitet

## Næste trin: Manuel konfiguration i Cursor

Da MCP-serveren skal tilføjes direkte i Cursor IDE's indstillinger, skal du følge disse trin:

### Trin 1: Åbn Cursor Settings
1. Åbn Cursor IDE
2. Tryk på `Ctrl+,` (eller gå til File > Preferences > Settings)
3. Søg efter "MCP" i søgefeltet

### Trin 2: Tilføj MCP Server
1. Find sektionen "Features > MCP"
2. Klik på "+ Add New MCP Server" knappen
3. Indtast følgende information:

**Konfiguration:**
- **Navn:** `web-scraper`
- **Type:** `stdio`
- **Command:** `python`
- **Args:** `scripts/mcp_web_scraper.py`

Eller brug den fulde sti:
- **Command:** `python`
- **Args:** `C:\Users\empir\tekup-ai-assistant\scripts\mcp_web_scraper.py`

### Trin 3: Gem og genstart
1. Gem ændringerne
2. Genstart Cursor IDE fuldstændigt (luk og åbn igen)

### Trin 4: Verificer installation
Efter genstart, åbn en ny chat og spørg:
```
Hvilke MCP-værktøjer har du adgang til?
```

Du skulle se Puppeteer-relaterede værktøjer i listen.

## Alternativ metode: Brug konfigurationsfilen

Hvis Cursor IDE understøtter at læse fra en konfigurationsfil, kan du pege den til:
```
configs/claude-desktop/mcp_config.json
```

## Tilgængelige værktøjer i MCP-serveren

Når serveren er konfigureret, har du adgang til disse værktøjer:

### 1. `fetch_url` (Anbefalet til Claude-samtaler)
- Bruger Playwright med Chromium
- Kan håndtere JavaScript-renderet indhold
- Venter på dynamisk indhold
- Kan vente på specifikke CSS selectors

**Eksempel brug:**
```
Brug fetch_url værktøjet til at hente: https://claude.ai/share/ae42cf6f-0409-4ff7-a1c1-1d78e3fb0d6a
```

### 2. `fetch_url_simple` (Hurtigere til statiske sider)
- Bruger simple HTTP requests
- Hurtigere men kan ikke håndtere JavaScript
- Godt til statiske HTML-sider

## Fejlfinding

### Problem: MCP-server vises ikke
**Løsning:** 
- Kontroller at Node.js er i din PATH
- Genstart Cursor fuldstændigt
- Tjek Cursor's output/logs for fejlmeddelelser

### Problem: Puppeteer fejler
**Løsning:**
- Prøv at køre manuelt: `npx -y @modelcontextprotocol/server-puppeteer`
- Hvis det fejler, lad mig vide så vi kan skifte til et alternativ

## Næste opgave
Når MCP-serveren er aktiveret, kan vi bruge den til at hente indhold fra:
```
https://claude.ai/share/ae42cf6f-0409-4ff7-a1c1-1d78e3fb0d6a
```

