# Tekup-Billy MCP Connector Status

**Last Updated:** 2025-10-31  
**Deployment:** Railway Production

---

## ✅ Connector Status: OPERATIONAL

### Claude Web

- **Status:** ✅ Connected
- **URL:** `https://tekup-billy-production.up.railway.app`
- **Authentication:** None (Public MCP endpoint)
- **Tools Available:** 27

### ChatGPT

- **Status:** ✅ Connected
- **Name:** Tekup - Billy
- **URL:** `https://tekup-billy-production.up.railway.app/`
- **Authentication:** Ingen (None) ✅
- **Tools Available:** 27
- **Created:** October 31, 2025

### Cursor IDE

- **Status:** ⚠️ Timeout issues (Cursor client-side)
- **URL:** `https://tekup-billy-production.up.railway.app/mcp`
- **Transport:** streamable-http
- **Server Status:** ✅ Working (verified with curl)

---

## 📋 Available Tools (27 Total)

### Invoice Operations (8 tools)

- `list_invoices` - List invoices with filtering
- `create_invoice` - Create new invoice
- `get_invoice` - Get invoice details
- `send_invoice` - Send invoice via email
- `update_invoice` - Update existing invoice
- `approve_invoice` - ⚠️ Approve invoice (PERMANENT)
- `cancel_invoice` - Cancel invoice
- `mark_invoice_paid` - Mark as paid

### Customer Operations (4 tools)

- `list_customers` - List customers with search
- `create_customer` - Create new customer
- `get_customer` - Get customer details
- `update_customer` - Update customer

### Product Operations (3 tools)

- `list_products` - List products
- `create_product` - Create product
- `update_product` - Update product

### Revenue Operations (1 tool)

- `get_revenue` - Revenue analytics

### Preset Operations (6 tools)

- `analyze_user_patterns` - Analyze behavior patterns
- `generate_personalized_presets` - Generate presets
- `get_recommended_presets` - Get recommendations
- `execute_preset` - Execute preset workflow
- `list_presets` - List all presets
- `create_custom_preset` - Create custom preset

### Debug Tools (2 tools)

- `validate_auth` - Validate authentication
- `test_connection` - Test API endpoint

### Test Tools (3 tools)

- `list_test_scenarios` - List test scenarios
- `run_test_scenario` - Run test scenario
- `generate_test_data` - Generate test data

---

## 🔗 Connection URLs

### MCP Endpoints

- **Discovery:** `https://tekup-billy-production.up.railway.app/.well-known/mcp.json`
- **MCP (Claude):** `https://tekup-billy-production.up.railway.app/mcp`
- **MCP (ChatGPT):** `https://tekup-billy-production.up.railway.app/` (root endpoint)

### Health & Status

- **Health Check:** `https://tekup-billy-production.up.railway.app/health`
- **Railway Dashboard:** https://railway.com/project/e2df644d-428f-498e-8b34-e73b3388060c

---

## ✅ Verification Tests

### Test 1: Health Check

```bash
curl https://tekup-billy-production.up.railway.app/health
```

**Expected:** `{"status":"healthy","version":"1.4.3",...}`

### Test 2: MCP Discovery

```bash
curl https://tekup-billy-production.up.railway.app/.well-known/mcp.json
```

**Expected:** Server info with name, version, endpoints, capabilities

### Test 3: Validate Auth (via MCP)

**Claude/ChatGPT:**

```
@billy validate authentication
```

**Expected:** "✅ AUTH SUCCESS - Billy API forbundet til Rendetalje"

### Test 4: List Customers

**Claude/ChatGPT:**

```
@billy list all customers
```

**Expected:** List of customers (61 total verified)

---

## 🔐 Authentication Notes

**MCP Endpoints (Public):**

- `/mcp` - No authentication required
- `/.well-known/mcp.json` - No authentication required
- `/` (root for ChatGPT) - No authentication required

**REST API (Authenticated):**

- `/api/v1/*` - Requires `X-API-Key` header
- Used for direct API access (not MCP)

---

## 📝 Migration History

**2025-10-31:**

- ✅ Migrated from Render.com to Railway
- ✅ Updated Claude Web connector URL
- ✅ Created ChatGPT connector with Railway URL
- ✅ Verified all 27 tools accessible
- ✅ Fixed MCP serverInfo for discovery
- ✅ Updated TekupVault sync configuration

**Previous (Render.com):**

- URL: `https://tekup-billy.onrender.com` (deprecated)
- Status: Archived, no longer in use

---

## 🎯 Production Readiness

- ✅ Railway deployment: Online
- ✅ Health checks: Passing
- ✅ MCP discovery: Working
- ✅ Tools list: Complete (27 tools)
- ✅ Authentication: Valid
- ✅ Claude Web: Connected
- ✅ ChatGPT: Connected
- ⚠️ Cursor: Client timeout (server working)

---

**Status:** ✅ PRODUCTION READY  
**Version:** 1.4.3  
**Last Verified:** 2025-10-31
