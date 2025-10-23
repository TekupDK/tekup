# Claude Desktop Local MCP Connection

**Status:** ✅ VIRKER MED DET SAMME (ingen kodeændringer)  
**Date:** October 11, 2025

## 🎯 Quick Win: Lokal MCP Connection

Vores `src/index.ts` bruger **stdio transport** som er PERFEKT til Claude Desktop!

## 📋 Setup Steps

### 1. Build Project

```powershell
cd C:\Users\empir\Tekup-Billy
npm run build
```

### 2. Find Claude Desktop Config File

**Windows:**

```
%APPDATA%\Claude\claude_desktop_config.json
```

Fuld sti:

```
C:\Users\empir\AppData\Roaming\Claude\claude_desktop_config.json
```

### 3. Tilføj Tekup-Billy Server

Åbn/opret filen og tilføj:

```json
{
  "mcpServers": {
    "billy": {
      "command": "node",
      "args": [
        "C:\\Users\\empir\\Tekup-Billy\\dist\\index.js"
      ],
      "env": {
        "BILLY_API_KEY": "din-billy-api-key",
        "BILLY_ORGANIZATION_ID": "pmf9tU56RoyZdcX3k69z1g"
      }
    }
  }
}
```

**VIGTIGT:** Erstat `din-billy-api-key` med din faktiske Billy.dk API key fra `.env` filen.

### 4. Genstart Claude Desktop

Luk Claude Desktop helt (højreklik på taskbar icon → Exit) og åbn den igen.

### 5. Verificer Connection

I Claude Desktop, skriv:

```
@billy what tools do you have?
```

Du skulle se alle 13 tools:

- list_invoices
- create_invoice
- get_invoice
- send_invoice
- list_customers
- create_customer
- get_customer
- list_products
- create_product
- get_revenue
- list_test_scenarios
- run_test_scenario
- generate_test_data

## 🧪 Test Commands

### Organization Info

```
@billy what is my organization information?
```

### List Invoices

```
@billy show me the last 5 invoices
```

### List Customers

```
@billy list all customers
```

### Get Revenue

```
@billy what is the revenue for the last 30 days?
```

## 🔧 Troubleshooting

### Claude Desktop Doesn't Show @billy

**Check:**

1. Er `dist/index.js` bygget? (Kør `npm run build`)
2. Er stien korrekt i config? (Brug double backslash: `\\`)
3. Er environment variables korrekte?
4. Genstart Claude Desktop efter config ændring

**View logs:**

```powershell
# Claude Desktop logs location
C:\Users\empir\AppData\Roaming\Claude\logs
```

### "Server Not Found" Error

Serveren kan ikke starte. Check:

```powershell
# Test serveren manuelt
node C:\Users\empir\Tekup-Billy\dist\index.js
```

Skulle vise:

```
Tekup-Billy MCP Server v1.0.0 started
Available tools: invoices, customers, products, revenue, test-scenarios, presets
```

Hvis fejl → check `.env` file har alle nødvendige variables.

### Tools Return Errors

Verificer Billy.dk credentials:

```powershell
# Test Billy API direkte
npm run test:billy
```

## 📊 Comparison: Desktop vs Web

| Feature | Claude Desktop (stdio) | Claude.ai (HTTP) |
|---------|----------------------|------------------|
| **Status** | ✅ Virker NU | ⏳ Kræver Streamable HTTP upgrade |
| **Setup** | Config file | Custom connector form |
| **Performance** | ⚡ Hurtigst (lokal) | 🌐 Internet dependent |
| **Use Case** | Development/personal | Production/team |
| **Authentication** | Environment variables | API Key header |

## ✅ Advantages (Desktop)

- **Ingen HTTP overhead** - direkte stdio kommunikation
- **Ingen API key problemer** - env vars loader fra din .env
- **Hurtigere response** - ingen netværk latency
- **Bedre til debugging** - se logs i terminal
- **Privacy** - data forlader ikke din maskine

## ⚠️ Limitations (Desktop)

- Kun tilgængelig på din lokale maskine
- Skal genbygges ved kode ændringer (`npm run build`)
- Kræver Node.js installeret
- Kan ikke deles med team members

## 🚀 Production Plan

Når Streamable HTTP er implementeret:

- **Development:** Claude Desktop (lokal, hurtig iteration)
- **Production:** Claude.ai custom connector (team access, no install)

---

**Next:** Se `MCP_TRANSPORT_UPGRADE_PLAN.md` for Streamable HTTP implementation
