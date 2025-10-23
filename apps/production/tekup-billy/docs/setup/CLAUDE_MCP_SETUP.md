# Claude MCP Connector Setup for Tekup-Billy

**Dato:** October 11, 2025  
**Status:** Guide til at forbinde Tekup-Billy MCP server med Claude

---

## 🎯 Oversigt

Denne guide viser hvordan du forbinder din Tekup-Billy MCP server til Claude.ai, så Claude kan bruge Billy.dk operations direkte.

---

## 📋 Forudsætninger

- ✅ Tekup-Billy server kørende på: <https://tekup-billy.onrender.com>
- ✅ MCP_API_KEY genereret: `bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b`
- ✅ Server er healthy (test: <https://tekup-billy.onrender.com/health>)

---

## 🔧 Setup i Claude Desktop App (Local MCP)

Hvis du bruger **Claude Desktop App** og vil køre MCP serveren lokalt:

### 1. Find din Claude config fil

**Windows:**

```
%APPDATA%\Claude\claude_desktop_config.json
```

**Mac:**

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### 2. Tilføj Tekup-Billy MCP konfiguration

```json
{
  "mcpServers": {
    "billy": {
      "command": "node",
      "args": [
        "C:\\Users\\empir\\Tekup-Billy\\dist\\index.js"
      ],
      "env": {
        "BILLY_API_KEY": "REDACTED_BILLY_API_KEY",
        "BILLY_ORGANIZATION_ID": "pmf9tU56RoyZdcX3k69z1g",
        "BILLY_TEST_MODE": "false",
        "BILLY_DRY_RUN": "false",
        "SUPABASE_URL": "https://oaevagdgrasfppbrxbey.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1NTM0NDYsImV4cCI6MjA0NDEyOTQ0Nn0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8",
        "SUPABASE_SERVICE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODU1MzQ0NiwiZXhwIjoyMDQ0MTI5NDQ2fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo",
        "ENCRYPTION_KEY": "9c22d3c2cebd332a194ca9f30b99e57112d10a290d9188eda881fe09eaa01947",
        "ENCRYPTION_SALT": "9b2af923a0665b2f47c7a799b9484b28"
      }
    }
  }
}
```

### 3. Genstart Claude Desktop App

Efter at have gemt config filen, genstart Claude Desktop App for at loade den nye MCP server.

---

## 🌐 Setup i Claude.ai (HTTP MCP - Anbefalet)

Hvis du vil bruge Claude.ai web interface med din **production server**:

### Method 1: Custom Connector (Hvis tilgængelig)

1. **Go to Claude Settings → Connectors**
2. **Click "Add Custom Connector"**
3. **Configure:**

```yaml
Name: Billy MCP
Type: HTTP API
Base URL: https://tekup-billy.onrender.com/api/v1
Authentication: API Key
API Key Header: X-API-Key
API Key Value: bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b
```

4. **Test Connection** - Should return healthy status
5. **Save Connector**

### Method 2: MCP Settings JSON (Hvis Custom ikke virker)

Nogle Claude interfaces understøtter MCP config via JSON settings:

**Settings → Advanced → MCP Servers:**

```json
{
  "billy": {
    "url": "https://tekup-billy.onrender.com",
    "transport": "http",
    "headers": {
      "X-API-Key": "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b",
      "Content-Type": "application/json"
    }
  }
}
```

### Method 3: Via Zapier Integration (Workaround)

Hvis Claude ikke understøtter custom HTTP MCP direkte:

1. **Setup Zapier webhook** til at kalde din MCP server
2. **Connect Zapier til Claude** (du har allerede Zapier connected)
3. **Create Zaps for hver Billy operation:**
   - List Invoices Zap
   - Create Invoice Zap
   - Get Customer Zap
   - etc.

---

## 🧪 Test Connection

### Test 1: Health Check

I Claude chat, prøv:

```
@billy check health
```

**Expected:** Server responds med health status

### Test 2: List Invoices

```
@billy list the last 5 invoices
```

**Expected:** Returns list af fakturaer

### Test 3: Get Organization

```
@billy show me organization details
```

**Expected:** Returns Rendetalje organization info

---

## 🔍 Troubleshooting

### Issue 1: "Billy connector disconnected"

**Problem:** Claude kan ikke forbinde til serveren

**Solutions:**

1. Verify server er live: <https://tekup-billy.onrender.com/health>
2. Check MCP_API_KEY er korrekt
3. Test direkte med curl:

   ```bash
   curl -X POST https://tekup-billy.onrender.com/api/v1/tools/get_organization \
     -H "X-API-Key: bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

### Issue 2: "Authentication failed"

**Problem:** API key ikke accepteret

**Solution:**

1. Verify MCP_API_KEY i Render Environment er korrekt
2. Check at key ikke har trailing spaces
3. Test med ny genereret key hvis nødvendig

### Issue 3: "Tools not available"

**Problem:** Claude kan se connector men ikke tools

**Solution:**

1. Verify server har startet korrekt (check Render logs)
2. Confirm "Available tools: 13" i logs
3. Test tools endpoint:

   ```bash
   curl https://tekup-billy.onrender.com/api/v1/tools
   ```

### Issue 4: Claude Desktop App ikke loader MCP

**Problem:** Config fil korrekt men MCP loader ikke

**Solution:**

1. Check config fil syntax er valid JSON
2. Verify sti til `dist/index.js` er korrekt
3. Ensure project er bygget: `npm run build`
4. Check Claude Desktop logs:
   - Windows: `%APPDATA%\Claude\logs\`
   - Mac: `~/Library/Logs/Claude/`

---

## 📖 Available Tools i Claude

Når forbindelsen er etableret, har Claude adgang til:

### Invoice Operations (4 tools)

- `list_invoices` - List fakturaer med filtering
- `get_invoice` - Hent specifik faktura
- `create_invoice` - Opret ny faktura
- `update_invoice` - Opdater eksisterende faktura

### Customer Operations (3 tools)

- `list_customers` - List kontakter/kunder
- `get_customer` - Hent kunde detaljer
- `create_customer` - Opret ny kunde

### Product Operations (2 tools)

- `list_products` - List produkter
- `get_product` - Hent produkt detaljer

### Revenue Operations (1 tool)

- `get_revenue` - Beregn omsætning for periode

### Organization Operations (1 tool)

- `get_organization` - Hent organisation info

### Test Operations (2 tools)

- `list_test_scenarios` - List test scenarier
- `run_test_scenario` - Kør test scenario

---

## 💡 Usage Examples i Claude

### Example 1: List Recent Invoices

**You:**

```
@billy show me the last 10 invoices
```

**Claude will:**

1. Call `list_invoices` tool with pageSize=10
2. Format results nicely
3. Show invoice numbers, amounts, status

### Example 2: Create New Customer

**You:**

```
@billy create a new customer:
Name: Acme Corp
Email: contact@acme.com
Phone: +45 12345678
```

**Claude will:**

1. Call `create_customer` tool
2. Format customer data correctly
3. Return created customer ID

### Example 3: Get Revenue Report

**You:**

```
@billy show me revenue for October 2025
```

**Claude will:**

1. Calculate date range
2. Call `get_revenue` tool
3. Present formatted report with totals

---

## 🔐 Security Notes

### API Key Management

- ✅ MCP_API_KEY er 32-byte hex string (very secure)
- ✅ Stored i Render Environment (ikke i code)
- ✅ Required for all HTTP API calls
- ⚠️ **NEVER share API key publicly**

### Credentials

Alle Billy.dk credentials og Supabase keys er:

- Stored securely i Render Environment Groups
- Never committed til Git (.env i .gitignore)
- Encrypted in database (ENCRYPTION_KEY)

### Rate Limiting

- 100 requests per 15 minutes per IP
- Protects against abuse
- Claude requests counted separately per session

---

## 📊 Architecture

```
Claude.ai / Claude Desktop
    ↓
    ↓ (HTTP API calls with X-API-Key)
    ↓
Tekup-Billy MCP Server (Render.com)
    ↓
    ↓ (Billy.dk API calls)
    ↓
Billy.dk API
    ↓
    ↓ (Results cached)
    ↓
Supabase Database (Cache + Audit Logs)
```

---

## 🚀 Next Steps

### After Connection Established

1. **Test alle tools** - Verify hver operation virker
2. **Monitor usage** - Check Supabase audit logs
3. **Review performance** - Check response times
4. **Setup alerts** - Monitor server health

### Optimization

1. **Cache tuning** - Adjust TTL if needed
2. **Rate limiting** - Adjust hvis nødvendig
3. **Error handling** - Monitor error rates
4. **Performance** - Scale Render instance if needed

---

## 📞 Support

Hvis du har problemer:

1. **Check server health:** <https://tekup-billy.onrender.com/health>
2. **Review Render logs:** Dashboard → Logs
3. **Test tools directly:** Use curl commands
4. **Check documentation:** `docs/` folder

---

## ✅ Success Checklist

- [ ] Server er live og healthy
- [ ] MCP_API_KEY er korrekt sat
- [ ] Claude connector configuration added
- [ ] Connection test successful
- [ ] Tools visible i Claude
- [ ] Test operation completed successfully
- [ ] Audit logs working (check Supabase)

---

**Setup Guide Version:** 1.0.0  
**Last Updated:** October 11, 2025  
**Status:** Production Ready ✅
