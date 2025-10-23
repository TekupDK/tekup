# 🔧 MCP Server Configuration Fixes

**Problem:** 3 MCP servers ikke starter korrekt
**Status:** 2 fixable, 1 valgfri

---

## ❌ Problem 1: upstash/context7 - Invalid Header

**Fejl:**

```json
"headers": {
    "undefined": "{context7_api_key}"  // ❌ "undefined" er ugyldig key
}
```

**Fix:**

```json
"headers": {
    "x-api-key": "{context7_api_key}"  // ✅ Korrekt header navn
}
```

**Eller uden API key (hvis du ikke har en):**

```json
"headers": {}  // ✅ Tom hvis gratis tier
```

---

## ❌ Problem 2: microsoft/markitdown - uvx ikke i PATH

**Status:** ✅ **FIXED!** Du har lige installeret uvx

**Næste:**

1. Genstart VS Code (så PATH opdateres)
2. Server starter automatisk

---

## ⚠️ Problem 3: chromedevtools/chrome-devtools-mcp

**Kræver:** Chrome/Chromium installeret + konfiguration

**Valgfri fix (hvis du vil bruge Chrome automation):**

```json
"chromedevtools/chrome-devtools-mcp": {
    "type": "stdio",
    "command": "npx",
    "args": [
        "chrome-devtools-mcp@latest"
        // Fjern alle ${input:...} args hvis du bare vil default
    ],
    "gallery": "https://api.mcp.github.com/2025-09-15/v0/servers/13749964-2447-4c31-bcab-32731cced504",
    "version": "0.0.1-seed"
}
```

**Eller disable den:**

```json
// Bare slet hele "chromedevtools/chrome-devtools-mcp" blokken
```

---

## ✅ CORRECTED FULL CONFIG

Gem dette som din MCP config:

```json
{
    "servers": {
        "upstash/context7": {
            "type": "http",
            "url": "https://mcp.context7.com/mcp",
            "headers": {
                "x-api-key": "{context7_api_key}"
            },
            "gallery": "https://api.mcp.github.com/v0/servers/dcec7705-b81b-4e0f-8615-8032604be7ad",
            "version": "1.0.0"
        },
        "microsoft/playwright-mcp": {
            "type": "stdio",
            "command": "npx",
            "args": [
                "@playwright/mcp@latest"
            ],
            "gallery": "https://api.mcp.github.com/v0/servers/41b79849-7e6c-4fc7-82c0-5a611ea21523",
            "version": "0.0.1-seed"
        },
        "render": {
            "url": "https://mcp.render.com/mcp",
            "headers": {
                "Authorization": "Bearer rnd_spBHfqtMGYf51WJKgfuLL0aGvNzD"
            },
            "type": "http"
        },
        "firecrawl": {
            "args": [
                "-y",
                "firecrawl-mcp"
            ],
            "env": {
                "FIRECRAWL_API_KEY": "fc-4e9c4f303c684df89902c55c6591e10a"
            },
            "command": "npx",
            "type": "stdio"
        },
        "microsoft/markitdown": {
            "type": "stdio",
            "command": "uvx",
            "args": [
                "markitdown-mcp==0.0.1a4"
            ],
            "gallery": "https://api.mcp.github.com/2025-09-15/v0/servers/976a2f68-e16c-4e2b-9709-7133487f8c14",
            "version": "1.0.0"
        }
    }
}
```

**Note:** Jeg fjernede `chromedevtools/chrome-devtools-mcp` da den kræver Chrome setup.

---

## 📍 Hvor er MCP Config Filen?

**Windows VS Code:**

```
%APPDATA%\Code\User\globalStorage\github.copilot-chat\mcp.json
```

**PowerShell kommando til at åbne:**

```powershell
code "$env:APPDATA\Code\User\globalStorage\github.copilot-chat\mcp.json"
```

**Eller via VS Code:**

1. Ctrl+Shift+P
2. Søg: "Preferences: Open User Settings (JSON)"
3. Eller direkte i fil explorer: `%APPDATA%\Code\User\globalStorage\github.copilot-chat\`

---

## 🔑 Context7 API Key (Valgfri)

**Hvis du har en Context7 API key:**

Tilføj til din konfiguration:

```json
"headers": {
    "x-api-key": "din_rigtige_api_key_her"
}
```

**Hvis du IKKE har en API key:**

Context7 har muligvis en gratis tier uden auth. Prøv:

**Option A: Fjern headers helt**

```json
"upstash/context7": {
    "type": "http",
    "url": "https://mcp.context7.com/mcp",
    "gallery": "https://api.mcp.github.com/v0/servers/dcec7705-b81b-4e0f-8615-8032604be7ad",
    "version": "1.0.0"
}
```

**Option B: Prøv Authorization header**

```json
"headers": {
    "Authorization": "Bearer {context7_api_key}"
}
```

---

## ⚡ QUICK FIX STEPS

1. **Åbn MCP config:**

   ```powershell
   code "$env:APPDATA\Code\User\globalStorage\github.copilot-chat\mcp.json"
   ```

2. **Ret linje 6:**

   ```diff
   - "undefined": "{context7_api_key}"
   + "x-api-key": "{context7_api_key}"
   ```

   **ELLER** fjern header helt hvis ingen API key:

   ```diff
   - "headers": {
   -     "undefined": "{context7_api_key}"
   - },
   + "headers": {},
   ```

3. **Slet chromedevtools sektion** (linjer ~20-40)

4. **Gem filen**

5. **Genstart VS Code** (så PATH opdateres for uvx)

6. **Verificer:**
   - Ctrl+Shift+P → "Developer: Show Logs"
   - Se efter "MCP" i logs
   - Skulle nu starte uden fejl

---

## ✅ SUCCESS CRITERIA

Efter fix og genstart:

```
✅ upstash/context7: Started
✅ microsoft/playwright-mcp: Started  
✅ render: Started
✅ firecrawl: Started
✅ microsoft/markitdown: Started
```

Ingen fejlmeddelelser om "unable to start successfully".

---

## 🆘 HVIS DET STADIG FEJLER

**Context7 fejler stadig?**
→ Disable den helt (fjern hele blokken)
→ Du har render/firecrawl/playwright som backup

**Markitdown fejler stadig?**
→ Check uvx version: `uvx --version`
→ Skulle være 0.9.2+

**Playwright/Firecrawl fejler?**
→ Kør `npx clear-npx-cache`
→ Prøv igen

---

**Prøv fix'ene og rapportér tilbage!** 🚀
