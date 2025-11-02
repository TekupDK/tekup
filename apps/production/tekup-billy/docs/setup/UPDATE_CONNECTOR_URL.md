# Opdater Custom Connector URL - Render.com → Railway

**Gammel URL:** `https://tekup-billy.onrender.com`  
**Ny URL:** `https://tekup-billy-production.up.railway.app`  
**Status:** ✅ Railway deployment klar

---

## 🔄 Opdater i Claude Web

### Metode 1: Edit Existing Connector

1. Gå til [Claude.ai](https://claude.ai)
2. Klik dit **profil-ikon** (øverst til højre)
3. Vælg **"Settings"**
4. Gå til **"Connectors"** sektion
5. Find **"Tekup-Billy Accounting"** eller **"Billy Accounting"** i listen
6. Klik på **"Edit"** eller **"⚙️"** ikon ved siden af connectoren
7. Opdater **URL** til:

   ```
   https://tekup-billy-production.up.railway.app
   ```

8. Klik **"Save"** eller **"Update"**

### Metode 2: Delete & Re-add (Hvis Edit Ikke Fungerer)

1. Gå til Settings → Connectors
2. Find **"Tekup-Billy Accounting"**
3. Klik **"Delete"** eller **"Remove"**
4. Klik **"Add custom connector"**
5. Udfyld:
   - **Name:** `Tekup-Billy Accounting` (eller bare "Billy")
   - **URL:** `https://tekup-billy-production.up.railway.app`
   - **Description:** `Billy.dk accounting operations via MCP`
6. Klik **"Add"**
7. Claude tester automatisk forbindelsen

### Verificering i Claude

Test efter opdatering:

```
@billy validate authentication
```

eller

```
@billy list available tools
```

**Forventet:** Claude kan nu se alle 27 tools og kan køre dem korrekt.

---

## 🤖 Opdater i ChatGPT

### Step 1: Find Connector Settings

1. Gå til [ChatGPT](https://chat.openai.com)
2. Klik dit **profil-ikon** (øverst til højre)
3. Vælg **"Settings"**
4. Gå til **"Beta features"** eller **"Connectors"** tab
5. Find **"billy"** custom connector i listen

### Step 2: Edit Connector

1. Klik på **"Edit"** eller **"⚙️"** ved siden af "billy" connectoren
2. Opdater **URL** feltet til:

   ```
   https://tekup-billy-production.up.railway.app
   ```

3. Klik **"Save"** eller **"Update"**

### Alternative: Delete & Re-add

Hvis edit ikke virker:

1. Klik **"Delete"** på den gamle connector
2. Klik **"Add custom connector"** eller **"Create new connection"**
3. Udfyld formularen:
   - **Navn:** `Billy Regnskab` eller `Tekup-Billy`
   - **URL:** `https://tekup-billy-production.up.railway.app`
   - **Beskrivelse:** `Billy.dk regnskabsintegration - fakturaer, kunder, produkter`
   - **Godkendelse:** ⚠️ **VÆLG "None" eller "Ingen"** - IKKE "OAuth"
4. Klik **"Create"** eller **"Opret"**

### Step 3: Test Connector

Efter opdatering, test i ny chat:

```
@billy list all invoices
```

eller

```
@billy validate authentication
```

**Forventet:** ChatGPT kan kalde Billy tools korrekt.

---

## ✅ Verificering

### Test 1: Health Check

```bash
curl https://tekup-billy-production.up.railway.app/health
```

**Forventet:**

```json
{
  "status": "healthy",
  "version": "1.4.3",
  "uptime": "...",
  "billy": {
    "connected": true
  }
}
```

### Test 2: MCP Discovery

```bash
curl https://tekup-billy-production.up.railway.app/.well-known/mcp.json
```

**Forventet:** Server info med name, version, endpoints, capabilities.

### Test 3: MCP Initialize

```bash
curl -X POST https://tekup-billy-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}'
```

**Forventet:** Server capabilities og serverInfo med description.

### Test 4: Tools List

```bash
curl -X POST https://tekup-billy-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}'
```

**Forventet:** Liste med 27 tools.

---

## 🐛 Troubleshooting

### "Connection Failed" efter URL opdatering

**Årsag:** Railway deployment kan være ved at genstarte.

**Løsning:**
1. Vent 30 sekunder
2. Tjek health endpoint: `https://tekup-billy-production.up.railway.app/health`
3. Prøv igen

### "Tools Not Found"

**Årsag:** Server ikke fuldt initialiseret.

**Løsning:**
1. Slet connectoren
2. Genstart browser
3. Tilføj connector igen med ny URL
4. Vent 10 sekunder før test

### "Timeout Error"

**Årsag:** Railway cold start (første request).

**Løsning:**
1. Send et health check request først
2. Vent 30 sekunder
3. Prøv igen - næste request er hurtig

### Gamle Tools Vises Stadig

**Årsag:** Browser cache.

**Løsning:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Genstart browser
3. Log ind igen
4. Check connectors - skulle nu vise korrekt URL

---

## 📋 Migration Checklist

- [ ] Opdateret URL i Claude Web connector
- [ ] Opdateret URL i ChatGPT custom connector
- [ ] Testet health endpoint (✅ working)
- [ ] Testet MCP discovery (✅ working)
- [ ] Testet tools/list (✅ 27 tools)
- [ ] Testet validate_auth i Claude (✅ working)
- [ ] Testet validate_auth i ChatGPT (✅ working)
- [ ] Gamle Render.com URL kan fjernes (valgfri)

---

## 🔐 Sikkerhed

**Bemærk:** Railway URL kræver ikke ændring af authentication. MCP endpoint er public (ingen API key påkrævet for discovery og tool calls).

---

## 📞 Support

Hvis problemer fortsætter:

1. Check Railway logs: <https://railway.com/project/[PROJECT_ID]/service/[SERVICE_ID>]
2. Verify deployment status i Railway dashboard
3. Test direkte med curl commands ovenfor
4. Contact: <support@tekup.dk>

---

**Last Updated:** 2025-10-31  
**Migration Status:** ✅ Ready  
**Railway URL:** <https://tekup-billy-production.up.railway.app>  
**Old Render URL:** <https://tekup-billy.onrender.com> (deprecated - kan slettes)
