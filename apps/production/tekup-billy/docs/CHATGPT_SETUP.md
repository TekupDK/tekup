# ChatGPT Custom Connector Setup Guide

**Billy MCP Server for ChatGPT**  
**Status:** ✅ Ready to Use  
**Last Updated:** 11. Oktober 2025, 21:41  

---

## 📋 Quick Setup (2 minutter)

### Step 1: Åbn Custom Connector Dialog

1. Gå til ChatGPT
2. Klik på dit navn/profil (top right)
3. Vælg **"Settings"** → **"Beta features"** eller **"Integrations"**
4. Find **"Custom Connectors"** eller **"Developer Tools"**
5. Klik **"Add custom connector"** eller **"Create new connection"**

### Step 2: Udfyld Formularen

**Navn:**

```
Billy Regnskab
```

**Beskrivelse (valgfri):**

```
Billy.dk regnskabsintegration - fakturaer, kunder, produkter og omsætning. 13 accounting tools til automation.
```

**URL til MCP-server:**

```
https://tekup-billy-production.up.railway.app
```

**Godkendelse:**
- ⚠️ **VIGTIGT:** Vælg **"None"** / **"Ingen"** / **"No authentication"**
- ❌ **ALDRIG** vælg "OAuth" - server kræver IKKE authentication på MCP endpoint
- MCP endpoint (`/mcp`) er public og kræver ingen API key

**Port (hvis efterspurgt):**

```
443 (HTTPS default)
```

### Step 3: Klik "Opret" / "Create"

ChatGPT vil nu:
1. ✅ Teste forbindelsen til serveren
2. ✅ Hente liste over tilgængelige tools (13 tools)
3. ✅ Aktivere Billy connector

---

## 🧪 Test Connectoren

Efter setup, test med disse kommandoer:

### Test 1: List Available Tools

```
List all Billy tools
```

eller

```
@billy show me what you can do
```

### Test 2: Get Revenue Data

```
@billy get revenue analytics for October 2025
```

### Test 3: List Invoices

```
@billy list all invoices from this month
```

### Test 4: Customer Search

```
@billy search for customers
```

---

## 📊 Tilgængelige Tools (13 Total)

### 💼 Fakturaer (4 tools)

- `list_invoices` - List fakturaer med filtrering
- `create_invoice` - Opret ny faktura
- `get_invoice` - Hent faktura detaljer
- `send_invoice` - Send faktura via email

### 👥 Kunder (3 tools)

- `list_customers` - List kunder med søgning
- `create_customer` - Opret ny kunde
- `get_customer` - Hent kunde detaljer

### 📦 Produkter (2 tools)

- `list_products` - List produkter
- `create_product` - Opret nyt produkt

### 📈 Omsætning (1 tool)

- `get_revenue` - Omsætningsanalyse med gruppering

### 🧪 Test (3 tools)

- `list_test_scenarios` - List test scenarios
- `run_test_scenario` - Kør test scenario
- `generate_test_data` - Generer test data

---

## 🔧 Teknisk Information

### Endpoints

**MCP Protocol:**

```
POST https://tekup-billy-production.up.railway.app/ (ChatGPT)
POST https://tekup-billy-production.up.railway.app/mcp (Claude)
```

**Protokol Versioner:**
- 2025-03-26 (MCP 1.0)
- 2025-06-18 (MCP 1.1)

**Transport:**
- Streamable HTTP
- JSON-RPC 2.0

### Authentication

- **MCP Endpoint:** Ingen authentication (public)
- **REST API:** API Key required (`/api/v1`)

### Rate Limiting

- Managed by Render.com
- Reasonable use policy

---

## 🐛 Troubleshooting

### "Fejl ved oprettelse af forbindelse"

**Mulige årsager:**
1. ⏳ **Timeout** - Server var i dvale (Render free tier)
   - **Løsning:** Vent 30 sekunder, prøv igen
   - Server vågner automatisk ved første request

2. 🔒 **Network issue** - Firewall eller proxy blocker
   - **Løsning:** Check netværk, prøv andet netværk

3. ❌ **Forkert URL** - Tastefejl i URL
   - **Løsning:** Verificer URL er `https://tekup-billy.onrender.com`

### "Request timeout"

Server tager for lang tid at svare (cold start):
- **Løsning:** Vent 30-60 sekunder efter første request
- Efterfølgende requests er hurtige

### Tools Vises Ikke

Hvis connector oprettes men tools ikke vises:
1. ✅ Check at connector er "enabled" i settings
2. ✅ Prøv at @mention connectoren: `@billy`
3. ✅ Reload ChatGPT siden
4. ✅ Slet og genopret connectoren

### Alternative Metode: REST API

Hvis MCP connector ikke virker, brug REST API:

**Endpoint:**

```
POST https://tekup-billy.onrender.com/api/v1/tools/list_invoices
```

**Headers:**

```json
{
  "Content-Type": "application/json",
  "X-API-Key": "your-api-key"
}
```

**Body:**

```json
{
  "pageSize": 10,
  "page": 1
}
```

---

## 💡 Use Cases

### Omsætningsanalyse

```
@billy analyze my revenue for October 2025 grouped by week
```

### Faktura Management

```
@billy list all unpaid invoices
@billy create invoice for customer [ID] with product [ID]
@billy send invoice [ID] to customer email
```

### Kunde Lookup

```
@billy find customer by name "Acme Corp"
@billy show me customer details for [ID]
```

### Produkt Katalog

```
@billy list all products with prices
@billy create new product "Consulting Hour" at 995 DKK
```

---

## 🔐 Sikkerhed & Privacy

### Data Flow

```
ChatGPT ↔️ Billy MCP Server ↔️ Billy.dk API
```

### Data Storage

- ❌ MCP Server gemmer INGEN data (stateless)
- ✅ Alle data hentes live fra Billy.dk
- ✅ Ingen logging af følsomme data

### Credentials

- Billy API credentials gemt sikkert i environment variables
- Ingen authentication påkrævet på MCP endpoint (public discovery)

---

## 📚 Additional Resources

**Dokumentation:**
- [Universal MCP Plugin Guide](./UNIVERSAL_MCP_PLUGIN_GUIDE.md)
- [Billy API Reference](./BILLY_API_REFERENCE.md)
- [Project README](../README.md)

**Live Server:**
- URL: <https://tekup-billy-production.up.railway.app>
- Health: <https://tekup-billy-production.up.railway.app/health>
- Discovery: <https://tekup-billy-production.up.railway.app/.well-known/mcp.json>

**Support:**
- GitHub Issues: <https://github.com/TekupDK/Tekup-Billy/issues>
- Email: <support@tekup.dk>

---

## ✅ Verification Checklist

Efter setup, verificer:

- [ ] Connector vises i ChatGPT settings
- [ ] Connector status er "Connected" eller "Enabled"
- [ ] Tools vises når du @mentioner Billy
- [ ] Test kommando returnerer data
- [ ] No errors in console (F12)

---

**Status:** ✅ ChatGPT MCP Support AKTIV  
**Server Version:** 1.0.0  
**MCP Protocol:** 2025-03-26, 2025-06-18  
**Deployment:** Live på Render.com  

**Compatibility:**
- ✅ ChatGPT (POST /)
- ✅ Claude.ai Web (POST /mcp)
- ✅ Claude Desktop (stdio)
- ✅ VS Code Copilot (stdio)
- ✅ Custom MCP Clients (HTTP/stdio)

---

## 🔧 Teknisk Implementation Details

### POST / Endpoint (ChatGPT)

```typescript
// Force JSON-only response (no SSE streaming)
app.post('/', (req, res) => {
    req.headers['accept'] = 'application/json';  // Override Accept header
    req.setTimeout(15000);                        // 15s timeout guard
    handleMcpPost(req, res);                      // Process MCP request
});
```

**Why JSON-only?**
- ChatGPT expects immediate JSON response
- SSE streaming would cause connection to hang
- Timeout guard prevents indefinite waiting
- Claude endpoint (`POST /mcp`) still supports SSE for Claude.ai compatibility

**Request/Response:**

```bash
# Request
POST https://tekup-billy.onrender.com/
Content-Type: application/json
Accept: application/json

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}

# Response (immediate JSON)
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "serverInfo": { "name": "tekup-billy-server", "version": "1.0.0" }
  }
}
```

---

*Guide opdateret efter tilføjelse af ChatGPT compatibility fixes (commits e804bed, 86615ce)*
