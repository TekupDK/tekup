# 🚀 Quick Start: MCP Web Scraper

## ✅ Alt er installeret og testet!

MCP Web Scraper er klar til brug. Du skal bare aktivere den i Cursor.

## 📝 3 Simple skridt (5 minutter)

### 1️⃣ Åbn Cursor Settings
- Tryk `Ctrl+,`
- Søg efter "MCP"

### 2️⃣ Tilføj MCP Server
Klik "+ Add New MCP Server" og indtast:

```
Navn:     web-scraper
Type:     stdio
Command:  python
Args:     C:\Users\empir\tekup-ai-assistant\scripts\mcp_web_scraper.py
```

### 3️⃣ Genstart Cursor
- Gem ændringerne
- Luk og åbn Cursor igen

## ✨ Test det virker

Spørg i Cursor chat:
```
Hvilke MCP-værktøjer har du adgang til?
```

Du skulle se: `fetch_url` og `fetch_url_simple`

## 🎯 Brug det!

Nu kan du bede AI-assistenten om:

```
Brug fetch_url til at hente indholdet fra:
https://claude.ai/share/ae42cf6f-0409-4ff7-a1c1-1d78e3fb0d6a

Analysér indholdet og giv mig en detaljeret rapport.
```

---

## 📚 Mere hjælp?

- **Komplet guide:** [docs/MCP_WEB_SCRAPER_GUIDE.md](docs/MCP_WEB_SCRAPER_GUIDE.md)
- **Implementeringsrapport:** [MCP_IMPLEMENTATION_REPORT.md](MCP_IMPLEMENTATION_REPORT.md)
- **Test MCP-serveren:** Kør `python scripts/test_mcp_scraper.py`

## 🐛 Problemer?

Hvis MCP-serveren ikke vises:
1. Kontroller at stien er korrekt
2. Prøv fuld sti i stedet for relativ
3. Genstart Cursor fuldstændigt
4. Tjek `scripts/README.md` for fejlfinding

---

**🎉 Du er klar til at hente og analysere webindhold med AI!**

