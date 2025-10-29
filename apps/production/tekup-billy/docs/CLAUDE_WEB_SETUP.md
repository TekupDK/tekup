# Claude.ai Web - Quick Setup Guide

**Billy MCP Server for Claude.ai Web**  
**Status:** ✅ Ready to Use  
**Requirements:** Claude Pro, Max, Team, or Enterprise plan  

---

## 📋 Prerequisites

- Active Claude.ai subscription (Pro, Max, Team, or Enterprise)
- Billy.dk account with API access
- Server URL: `https://tekup-billy.onrender.com`

---

## 🚀 Setup Steps

### Step 1: Add Billy as Custom Connector

#### For Pro/Max Users

1. Open [Claude.ai](https://claude.ai)
2. Click your profile icon (top right)
3. Select **"Settings"**
4. Navigate to **"Connectors"** section
5. Scroll to the bottom
6. Click **"Add custom connector"**
7. Enter the following:
   - **Server URL:** `https://tekup-billy.onrender.com`
   - **Name:** Billy Accounting (auto-detected)
   - **Description:** Billy.dk accounting operations (auto-detected)
8. Click **"Add"**

#### For Team/Enterprise Users

**Phase 1: Admin Setup (Primary Owner/Owner only)**

1. Open [Claude.ai](https://claude.ai)
2. Navigate to **Admin settings** > **Connectors**
3. Click **"Add custom connector"** at the bottom
4. Enter server URL: `https://tekup-billy.onrender.com`
5. Click **"Add"**

**Phase 2: User Setup (All team members)**

1. Each user navigates to their **Settings** > **Connectors**
2. Find "Billy Accounting" in the list
3. Click **"Connect"** (if prompted)
4. Enable desired tools

---

### Step 2: Enable Billy Tools in Chat

1. Open a **new chat** in Claude.ai
2. Look for the **"Search and tools"** button (🔍 icon, lower left)
3. Click the button to open the tools menu
4. Find **"Billy Accounting"** or **"Tekup-Billy"** in the list
5. Toggle **ON** the tools you want to use:

**Available Tools:**

- ✅ `list_invoices` - List and filter invoices
- ✅ `create_invoice` - Create new invoices
- ✅ `get_invoice` - Get invoice details
- ✅ `send_invoice` - Send invoices via email
- ✅ `list_customers` - Search customers
- ✅ `create_customer` - Add new customers
- ✅ `get_customer` - Get customer details
- ✅ `list_products` - Browse products
- ✅ `create_product` - Add new products
- ✅ `get_revenue` - Revenue analytics
- ✅ `list_test_scenarios` - Test scenarios
- ✅ `run_test_scenario` - Run tests
- ✅ `generate_test_data` - Generate test data

---

### Step 3: Start Using Billy

**Example prompts:**

```
@billy list all invoices from the last 30 days

@billy create a new customer:
- Name: Acme Corporation
- Email: contact@acme.com
- Country: DK

@billy show me revenue analytics grouped by month for 2025

@billy create an invoice for customer ID abc123 with product xyz789

@billy send invoice inv-12345 to customer@email.com
```

**Tips:**

- Use `@billy` to invoke Billy tools
- Claude will ask for approval before executing actions
- You can click "Allow always" for trusted operations
- Disable unused tools before using Research

---

## 🔒 Security & Privacy

**Important Security Notes:**

✅ **Safe Practices:**

- Only enable tools you need for the current task
- Review Claude's tool approval requests carefully
- Billy server uses public MCP endpoint (no auth needed for discovery)
- Your Billy.dk API credentials are secure on the server

⚠️ **Before Using Research:**

- Disable any tools that modify data (create, send, etc.)
- Only leave read-only tools enabled (list, get)
- Research makes many automatic tool calls

🔐 **Data Privacy:**

- Connector uses your individual permissions
- Data flows: Claude.ai ↔️ Billy MCP Server ↔️ Billy.dk API
- Server hosted on Render.com (Frankfurt region)
- No data stored on MCP server (stateless)

**Disconnect Anytime:**

- Settings > Connectors > Select Billy > Remove
- Or disable specific tools via "Search and tools" menu

---

## 🐛 Troubleshooting

### Tools Don't Appear in Menu

**Check:**

1. ✅ Connector added in Settings > Connectors?
2. ✅ Have Pro/Max/Team/Enterprise plan?
3. ✅ Clicked "Search and tools" button in chat?
4. ✅ For Team/Enterprise: Admin added connector first?

**Fix:**

- Return to Step 1 and add connector
- Upgrade to Pro/Max plan if on Free tier
- For Team users: Ask admin to add connector first

### "Connection Failed" Error

**Test server health:**

```powershell
# PowerShell
Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/health"
```

**Expected response:**

```json
{
  "status": "healthy",
  "billy": {
    "connected": true
  }
}
```

**If unhealthy:**

- Server may be restarting (Render free tier sleeps after inactivity)
- Try again in 30-60 seconds
- Check GitHub repo status: <https://github.com/TekupDK/Tekup-Billy>

### Tool Execution Fails

**Common causes:**

1. Billy.dk API credentials incorrect
2. Organization ID mismatch
3. Network timeout

**Solutions:**

- Check Billy.dk account status
- Verify API key is active
- Contact support: <support@tekup.dk>

### "Approval Required" Every Time

**To avoid repeated approvals:**

1. When Claude asks to execute tool
2. Review the action carefully
3. If tool is trusted, click **"Allow always"**
4. Claude will remember for this tool in future chats

**Safety tip:** Only use "Allow always" for read-only tools (list, get) or when you fully trust the operation.

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| List invoices | `@billy list invoices` |
| Create customer | `@billy create customer named X` |
| Get revenue | `@billy show revenue analytics` |
| Create invoice | `@billy create invoice for customer X` |
| Send invoice | `@billy send invoice ID to email` |
| List products | `@billy list all products` |
| Test connection | `@billy list your test scenarios` |

---

## 📚 Additional Resources

**Documentation:**

- [Universal MCP Plugin Guide](./UNIVERSAL_MCP_PLUGIN_GUIDE.md)
- [Billy.dk API Reference](../BILLY_API_REFERENCE.md)
- [Project README](../README.md)
- [Claude Custom Connectors Docs](https://support.anthropic.com/en/articles/9930959)

**Server Info:**

- Live Server: <https://tekup-billy.onrender.com>
- Health Check: <https://tekup-billy.onrender.com/health>
- MCP Discovery: <https://tekup-billy.onrender.com/.well-known/mcp.json>
- GitHub: <https://github.com/TekupDK/Tekup-Billy>

**Support:**

- GitHub Issues: <https://github.com/TekupDK/Tekup-Billy/issues>
- Email: <support@tekup.dk>

---

**Last Updated:** October 11, 2025  
**Server Version:** 1.0.0  
**MCP Protocol:** 2025-03-26, 2025-06-18  
**Claude.ai Support:** ✅ Pro, Max, Team, Enterprise
