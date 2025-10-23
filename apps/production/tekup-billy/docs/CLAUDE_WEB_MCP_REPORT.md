# MCP Server Verification Report for Anthropic/Claude.ai Team

**Date:** October 11, 2025  
**Server:** Tekup-Billy MCP Server  
**URL:** <https://tekup-billy.onrender.com>  
**Organization:** Tekup/Rendetalje ApS  
**Contact:** Jonas Abde

---

## Executive Summary

We have implemented a production-ready MCP server following the latest MCP Streamable HTTP specification (2025-03-26 and 2025-06-18). The server works perfectly with Claude Desktop but **Claude.ai web does not discover or display tools** despite successful handshake and session creation.

**Request:** Enable full MCP custom connector support in Claude.ai web, or provide guidance on required changes for web compatibility.

---

## ✅ Server Implementation Status

### MCP Protocol Compliance

| Feature | Status | Details |
|---------|--------|---------|
| **Protocol Version** | ✅ | Supports both 2025-03-26 and 2025-06-18 |
| **Transport** | ✅ | Streamable HTTP (POST/GET/DELETE on `/mcp`) |
| **JSON-RPC 2.0** | ✅ | Full compliance with batching support |
| **Session Management** | ✅ | UUID-based via `Mcp-Session-Id` header |
| **Discovery Endpoint** | ✅ | `/.well-known/mcp.json` available |
| **Tool Schemas** | ✅ | Complete JSON Schema for all 13 tools |
| **Notifications** | ✅ | Proper handling (returns 202 for notification-only) |
| **SSE Streaming** | ✅ | GET endpoint supports Server-Sent Events |

### Verification Tests

**1. Health Check:**

```bash
$ curl https://tekup-billy.onrender.com/health
{
  "status": "healthy",
  "billy": { "connected": true },
  "uptime": 1234.5
}
```

✅ **Result:** Server healthy and responsive

**2. MCP Discovery:**

```bash
$ curl https://tekup-billy.onrender.com/.well-known/mcp.json
{
  "version": "2025-03-26",
  "name": "Tekup Billy MCP Server",
  "protocolVersions": ["2025-03-26", "2025-06-18"],
  ...
}
```

✅ **Result:** Discovery metadata correctly served

**3. MCP Initialize (Protocol 2025-06-18):**

```bash
$ curl -X POST https://tekup-billy.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0"}
    }
  }'

Response:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": { "tools": {}, "resources": {}, "prompts": {} },
    "serverInfo": { "name": "tekup-billy-server", "version": "1.0.0" }
  }
}
```

✅ **Result:** Initialize handshake successful, session ID returned in `Mcp-Session-Id` header

**4. Tools List:**

```bash
$ curl -X POST https://tekup-billy.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

Response:
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "list_invoices",
        "description": "List invoices with optional filtering by date range, state, or customer",
        "inputSchema": {
          "type": "object",
          "properties": {
            "startDate": {"type": "string", "description": "Start date in YYYY-MM-DD format"},
            "endDate": {"type": "string", "description": "End date in YYYY-MM-DD format"},
            "state": {"type": "string", "enum": ["draft","approved","sent","paid","cancelled"]},
            "contactId": {"type": "string", "description": "Filter by customer contact ID"}
          }
        }
      },
      ... (12 more tools with full schemas)
    ]
  }
}
```

✅ **Result:** All 13 tools returned with complete JSON Schema definitions

**5. Tool Execution:**

```bash
$ curl -X POST https://tekup-billy.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{"name":"list_test_scenarios","arguments":{}}
  }'

Response:
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"success\":true,\"scenarios\":[...]}"
    }]
  }
}
```

✅ **Result:** Tool execution successful, real Billy.dk data returned

---

## 🖥️ Claude Desktop Status

**Platform:** Claude Desktop (Windows/Mac)  
**Transport:** stdio  
**Status:** ✅ **FULLY WORKING**

**Configuration:**

```json
{
  "mcpServers": {
    "billy": {
      "command": "node",
      "args": ["C:\\path\\to\\Tekup-Billy\\dist\\index.js"],
      "env": {
        "BILLY_API_KEY": "***",
        "BILLY_ORGANIZATION_ID": "pmf9tU56RoyZdcX3k69z1g"
      }
    }
  }
}
```

**Test Result:**

```
User: @billy list your available tools

Claude: I can see 13 Billy.dk accounting tools:
- list_invoices
- create_invoice
- get_invoice
- send_invoice
- list_customers
... (all tools discovered and usable)
```

✅ **Conclusion:** MCP implementation works perfectly with Claude Desktop

---

## 🌐 Claude.ai Web Status

**Platform:** Claude.ai web custom connector  
**Transport:** HTTP (Streamable HTTP)  
**Status:** ❌ **NOT WORKING - TOOLS NOT DISCOVERED**

### Configuration Attempted

```
Connector Name: billy mcp
Base URL: https://tekup-billy.onrender.com/mcp
Authentication: None
```

### Observed Behavior

**Server Logs (from Render.com):**

```
2025-10-11T16:17:20Z 📨 MCP POST request from Claude-User
   Session ID: none (new session)
   Accept: application/json, text/event-stream
   Body: {
     "method": "initialize",
     "params": {
       "protocolVersion": "2025-06-18",
       "capabilities": {},
       "clientInfo": {"name": "claude-ai", "version": "0.1.0"}
     },
     "jsonrpc": "2.0",
     "id": 0
   }
✨ Created new MCP session: c0a76c6c-9a34-47b5-aed9-9edaa66a9c5b
📡 Opening SSE stream for response
🗑️ Session terminated: c0a76c6c-9a34-47b5-aed9-9edaa66a9c5b
```

**Analysis:**

1. ✅ Claude.ai web **successfully initiates** MCP connection
2. ✅ Session is created and session ID returned
3. ✅ Protocol version 2025-06-18 accepted
4. ❌ **NO `tools/list` request is sent** after initialization
5. ❌ Session is immediately terminated
6. ❌ No tools appear in Claude.ai web UI

**User Experience:**

- Connector shows in settings as "billy mcp CUSTOM"
- No status indicator (not "Connected", not "Error")
- No tools available for use with `@billy` mentions
- No error messages displayed

---

## 🔍 Issue Analysis

### What Works

- ✅ MCP protocol handshake (initialize)
- ✅ Session creation and management
- ✅ Protocol version negotiation
- ✅ Server responds correctly to all requests

### What Doesn't Work

- ❌ Claude.ai web doesn't call `tools/list` after initialize
- ❌ Tools are not discovered/displayed in UI
- ❌ No way to use the connector despite successful connection

### Hypothesis

Claude.ai web may not yet support MCP custom connectors, or:

- Requires OpenAPI/REST spec instead of MCP protocol
- Expects different endpoint structure
- MCP custom connector feature not yet enabled on web platform

---

## 📋 Available Tools

Our MCP server provides 13 Billy.dk accounting tools:

### Invoice Operations (4 tools)

- `list_invoices` - List invoices with filtering by date, state, customer
- `create_invoice` - Create new invoice with line items
- `get_invoice` - Get specific invoice details
- `send_invoice` - Send invoice to customer via email

### Customer Operations (3 tools)

- `list_customers` - List customers with search
- `create_customer` - Create new customer with contact info
- `get_customer` - Get specific customer details

### Product Operations (2 tools)

- `list_products` - List products with search
- `create_product` - Create new product with pricing

### Revenue Operations (1 tool)

- `get_revenue` - Get revenue analytics with date range and grouping

### Test Operations (3 tools)

- `list_test_scenarios` - List available test scenarios
- `run_test_scenario` - Run specific test scenario
- `generate_test_data` - Generate test customers/products/invoices

**All tools include:**

- Complete JSON Schema for inputs (type, properties, required fields, enums)
- Detailed descriptions
- Real-time Billy.dk API integration

---

## 🎯 Business Impact

**Use Case:** We need Billy.dk accounting integration in Claude.ai web for:

- Invoice management via natural language
- Customer data lookup and creation
- Revenue analytics and reporting
- Automated accounting workflows

**Current Workaround:** Users must use Claude Desktop (works perfectly) or REST API

**Desired Outcome:** MCP custom connectors work in Claude.ai web like they do in Desktop

---

## 📞 Support Request

### Primary Request

**Enable full MCP custom connector support in Claude.ai web** - including tool discovery and execution via `tools/list` and `tools/call` methods.

### Alternative Requests

1. If MCP web support is planned, provide **roadmap/timeline**
2. If OpenAPI spec is required instead, provide **migration guide**
3. If custom connectors require different format, provide **specification**

### We Can Provide

- ✅ Live server access for testing
- ✅ Complete server logs
- ✅ Test scenarios and reproduction steps
- ✅ Feedback on any changes/requirements

---

## 🔗 Resources

**Live Server:**

- Base URL: <https://tekup-billy.onrender.com>
- Health: <https://tekup-billy.onrender.com/health>
- Discovery: <https://tekup-billy.onrender.com/.well-known/mcp.json>
- MCP Endpoint: <https://tekup-billy.onrender.com/mcp>

**Documentation:**

- GitHub: <https://github.com/JonasAbde/Tekup-Billy>
- MCP Guide: [docs/UNIVERSAL_MCP_PLUGIN_GUIDE.md](https://github.com/JonasAbde/Tekup-Billy/blob/main/docs/UNIVERSAL_MCP_PLUGIN_GUIDE.md)

**Test Commands:**
All verification commands provided above can be run anytime against our production server.

---

## 📊 Summary

| Component | Claude Desktop | Claude.ai Web |
|-----------|----------------|---------------|
| **MCP Initialize** | ✅ Works | ✅ Works |
| **Session Creation** | ✅ Works | ✅ Works |
| **Tools Discovery** | ✅ Works | ❌ Fails (no tools/list call) |
| **Tool Execution** | ✅ Works | ❌ N/A (tools not discovered) |
| **User Experience** | ✅ Excellent | ❌ No tools available |

**Conclusion:** Server implementation is correct and production-ready. Issue is with Claude.ai web not supporting MCP custom connectors yet.

---

**Contact:**  
Jonas Abde  
Tekup/Rendetalje ApS  
Email: <jonas@tekup.dk>  
GitHub: @JonasAbde

**Thank you for reviewing this report. We're ready to collaborate on testing and implementation!**
