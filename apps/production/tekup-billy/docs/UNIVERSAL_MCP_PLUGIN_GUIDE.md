# Universal MCP Plugin - Cross-Platform Integration Guide

**Server:** Tekup-Billy MCP Server  
**Status:** ✅ Production Ready  
**URL:** <https://tekup-billy.onrender.com>  
**MCP Version:** 2025-03-26 & 2025-06-18  

---

## 🌐 Platform Support Matrix

| Platform | Support | Transport | Status | Instructions |
|----------|---------|-----------|--------|--------------|
| **Claude Desktop** | ✅ Full | stdio | Working | See [Claude Desktop Setup](#claude-desktop) |
| **Claude.ai Web** | ✅ Full | HTTP | Working (Pro/Max/Team/Enterprise) | See [Claude Web Setup](#claude-web) |
| **ChatGPT** | 🔄 Untested | HTTP | Should work | See [ChatGPT Setup](#chatgpt) |
| **VS Code Copilot** | ✅ Full | stdio | Working | See [VS Code Setup](#vs-code) |
| **Cline/Windsurf** | 🔄 Untested | stdio | Should work | Standard MCP config |
| **Custom Clients** | ✅ Full | HTTP/stdio | Working | See [Custom Integration](#custom) |

---

## 🔌 Integration Methods

### Method 1: MCP Protocol (Recommended)

**Best for:** AI agents, LLM platforms with native MCP support

**Endpoint:** `https://tekup-billy.onrender.com/mcp`  
**Protocol:** MCP Streamable HTTP (2025-03-26, 2025-06-18)  
**Authentication:** None (public endpoint)  
**Discovery:** `/.well-known/mcp.json`

**Tools Available:** 13 Billy.dk operations

- 4 Invoice tools (list, create, get, send)
- 3 Customer tools (list, create, get)  
- 2 Product tools (list, create)
- 1 Revenue tool (get analytics)
- 3 Test tools (scenarios, run, generate)

### Method 2: REST API (Fallback)

**Best for:** Traditional integrations, webhooks, non-MCP clients

**Base URL:** `https://tekup-billy.onrender.com/api/v1`  
**Authentication:** API Key (Header: `X-API-Key`)  
**Endpoints:** `/tools` (list), `/tools/:toolName` (execute)

---

## 📱 Platform-Specific Setup

### Claude Desktop

**Status:** ✅ Fully Working

**Config File:** `%APPDATA%\Claude\claude_desktop_config.json` (Windows)  
**Config File:** `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)

```json
{
  "mcpServers": {
    "billy": {
      "command": "node",
      "args": ["C:\\path\\to\\Tekup-Billy\\dist\\index.js"],
      "env": {
        "BILLY_API_KEY": "your-billy-api-key",
        "BILLY_ORGANIZATION_ID": "your-org-id"
      }
    }
  }
}
```

**Test:**

```
@billy list your available tools
```

### Claude.ai Web

**Status:** ✅ Fully Working (Requires Pro, Max, Team, or Enterprise plan)

**Step 1: Add Custom Connector**

For **Pro/Max Plans:**

1. Navigate to **Settings** > **Connectors**
2. Scroll to the bottom and click **"Add custom connector"**
3. Enter server URL: `https://tekup-billy.onrender.com`
4. (Optional) Click **"Advanced settings"** if OAuth is needed
5. Click **"Add"** to finish

For **Team/Enterprise Plans:**

1. **Admin/Owner** navigates to **Admin settings** > **Connectors**
2. Click **"Add custom connector"** at the bottom
3. Enter server URL: `https://tekup-billy.onrender.com`
4. (Optional) Add OAuth Client ID/Secret if needed
5. Click **"Add"**
6. **All users** can now individually connect to the connector

**Step 2: Enable Connector in Chat**

1. Open a new chat in Claude.ai
2. Click the **"Search and tools"** button (lower left corner)
3. Find "Tekup-Billy" in the list of connectors
4. Click **"Connect"** (if authentication is required)
5. Enable the specific tools you want to use:
   - ✅ Invoice tools (list, create, get, send)
   - ✅ Customer tools (list, create, get)
   - ✅ Product tools (list, create)
   - ✅ Revenue analytics
   - ✅ Test tools

**Step 3: Use Billy Tools**

```
@billy list all invoices from this month
@billy create a new customer named "Acme Corp"
@billy get revenue analytics grouped by month
```

**Security Notes:**

- Only connect to trusted MCP servers
- Review tool approval requests carefully
- Disable tools you don't need before using Research
- You can disconnect anytime via Settings > Connectors

### VS Code Copilot

**Status:** ✅ Working

**Config:** Add to `.vscode/settings.json`:

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "text": "Use @billy for Billy.dk accounting operations"
    }
  ]
}
```

**Usage:** Same as Claude Desktop (stdio transport)

### ChatGPT (OpenAI)

**Status:** 🔄 Untested (Should work with OpenAPI spec)

**Setup:**

1. Go to ChatGPT Settings → Plugins → Add Custom Plugin
2. Enter server URL: `https://tekup-billy.onrender.com`
3. Provide OpenAPI spec: `https://tekup-billy.onrender.com/openapi.json` (coming soon)

**Alternative:** Use REST API directly with API key

### Custom MCP Client

**Example using MCP SDK:**

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamable.js';

const transport = new StreamableHTTPClientTransport(
  new URL('https://tekup-billy.onrender.com/mcp')
);

const client = new Client({
  name: 'my-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// List tools
const tools = await client.listTools();
console.log(tools);

// Call tool
const result = await client.callTool({
  name: 'list_invoices',
  arguments: { pageSize: 10 }
});
console.log(result);
```

---

## 🧪 Testing & Verification

### Quick Health Check

```bash
# Test server health
curl https://tekup-billy.onrender.com/health

# Test MCP discovery
curl https://tekup-billy.onrender.com/.well-known/mcp.json

# Test MCP initialize
curl -X POST https://tekup-billy.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0"}
    }
  }'

# Test tools list
curl -X POST https://tekup-billy.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

### PowerShell Testing

```powershell
# Initialize
$body = @{
  jsonrpc="2.0"
  id=1
  method="initialize"
  params=@{
    protocolVersion="2025-06-18"
    capabilities=@{}
    clientInfo=@{name="test";version="1.0"}
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/mcp" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -Headers @{"Accept"="application/json"}

# List tools
$body = @{jsonrpc="2.0";id=2;method="tools/list";params=@{}} | ConvertTo-Json
Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/mcp" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -Headers @{"Accept"="application/json"}
```

---

## 🔐 Security & Authentication

### MCP Endpoint (`/mcp`)

- **Authentication:** None (public access)
- **Purpose:** Tool discovery and execution for LLM platforms
- **Rate Limiting:** Managed by Render.com
- **Session Management:** UUID-based, 30-minute timeout

### REST API (`/api/v1`)

- **Authentication:** Required (API Key via `X-API-Key` header)
- **Purpose:** Traditional REST integration
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **Security:** Billy API key encrypted in environment

**Best Practice:** Use MCP endpoint for LLM integrations, REST API for backend services.

---

## 📊 Available Tools

All tools support both MCP and REST protocols:

### Invoice Operations

- `list_invoices` - List invoices with filtering
- `create_invoice` - Create new invoice
- `get_invoice` - Get invoice details  
- `send_invoice` - Send invoice via email

### Customer Operations

- `list_customers` - List customers with search
- `create_customer` - Create new customer
- `get_customer` - Get customer details

### Product Operations

- `list_products` - List products with search
- `create_product` - Create new product

### Revenue Operations

- `get_revenue` - Get revenue analytics with grouping

### Test Operations

- `list_test_scenarios` - List available test scenarios
- `run_test_scenario` - Run specific scenario
- `generate_test_data` - Generate test data

---

## 🐛 Troubleshooting

### Issue: Tools Not Showing in Claude.ai Web

**Possible Causes:**

1. **Connector not added** - You need to add the custom connector in Settings > Connectors first
2. **Plan limitation** - Custom connectors require Pro, Max, Team, or Enterprise plan
3. **Tools not enabled** - Use "Search and tools" button to enable specific tools
4. **Authentication needed** - Some connectors require clicking "Connect" first

**Solutions:**

1. ✅ Follow the [Claude Web Setup](#claude-web) steps above
2. ✅ Make sure you have a Pro, Max, Team, or Enterprise plan
3. ✅ Enable tools via "Search and tools" menu in chat
4. ✅ For Team/Enterprise: Admin must add connector first, then users connect individually

**Alternative:**

- Use Claude Desktop (stdio transport, works on all plans)
- Use REST API as programmatic workaround

### Issue: Connection Timeout

**Check:**

```bash
curl https://tekup-billy.onrender.com/health
```

**Expected:** `{"status":"healthy","billy":{"connected":true}}`

### Issue: Tool Execution Fails

**Check Billy.dk API:**

```bash
curl https://tekup-billy.onrender.com/api/v1/tools \
  -H "X-API-Key: your-key"
```

**Common Causes:**

- Billy API key expired or invalid
- Organization ID incorrect
- Network/firewall issues

---

## 📚 Additional Resources

**Documentation:**

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Billy.dk API Docs](https://www.billy.dk/api)
- [Project README](../README.md)
- [Deployment Guide](./DEPLOYMENT_COMPLETE.md)

**Support:**

- GitHub Issues: <https://github.com/TekupDK/Tekup-Billy/issues>
- Email: <support@tekup.dk>

---

**Last Updated:** October 11, 2025  
**Server Version:** 1.0.0  
**MCP Protocol:** 2025-03-26, 2025-06-18
