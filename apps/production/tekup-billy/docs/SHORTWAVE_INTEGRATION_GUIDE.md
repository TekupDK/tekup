# 📧 Shortwave Integration Guide - Tekup-Billy MCP

## Overview

This guide explains how to integrate your **Tekup-Billy MCP Server** with **Shortwave email app** using the new MCP SSE endpoint.

---

## ✅ Prerequisites

### 1. Shortwave Account

- **Website:** <https://www.shortwave.com>
- **Required Plan:** Business, Premier, or Max
- **Your Plan:** ✅ Max (confirmed)

### 2. Tekup-Billy MCP Server

- **Status:** ✅ Live on Render.com
- **URL:** <https://tekup-billy.onrender.com>
- **MCP Endpoint:** `https://tekup-billy.onrender.com/mcp`
- **API Key:** `sp0ZLWofqSDXPx5OjQa64FHVwRYzeuyr`

---

## 🚀 Setup Instructions

### Step 1: Open Shortwave Desktop App

Download if you haven't already:

- **Mac:** <https://www.shortwave.com/download>
- **Windows:** <https://www.shortwave.com/download>

**Note:** While MCP works in web version, desktop app is recommended for best experience.

---

### Step 2: Navigate to AI Integrations

1. Open Shortwave
2. Click **Settings** (gear icon)
3. Go to **Integrations** section
4. Click **AI integrations**

---

### Step 3: Add Custom MCP Server

1. Click **"Add custom integration"**
2. Select **"Remote MCP server"**

---

### Step 4: Configure Tekup-Billy

Fill in the form with these exact values:

```
Server Name: Tekup-Billy Accounting

MCP Endpoint URL: https://tekup-billy.onrender.com/mcp

Description (optional): Billy.dk accounting integration - invoices, customers, products, revenue
```

---

### Step 5: Authentication

Shortwave will ask how to authenticate. Choose **"Custom Header"**:

```
Header Name: X-API-Key
Header Value: sp0ZLWofqSDXPx5OjQa64FHVwRYzeuyr
```

---

### Step 6: Save and Enable

1. Click **"Save"**
2. Toggle the switch to **enable** the server
3. Wait for connection status
4. Look for **green dot** ✅ = Connected successfully!

---

## 🎯 Usage in Shortwave

Once connected, you can use Tekup-Billy directly in your email inbox!

### Example Prompts

#### 📊 List Invoices

```
Show me my recent invoices from Billy
```

**Shortwave AI will:**

- Call `list_invoices` tool
- Display invoice list with numbers, amounts, states
- Show customer names and dates

---

#### 💰 Check Revenue

```
What's my revenue for October 2025?
```

**Shortwave AI will:**

- Call `get_revenue` tool with date range
- Show total revenue
- Break down by period if requested

---

#### 📝 Create Invoice

```
Create an invoice for customer "Acme Corp" for 5000 kr
```

**Shortwave AI will:**

- Ask for missing details (products, quantities)
- Call `create_invoice` tool
- Confirm invoice created
- Optionally send via email

---

#### 👥 Find Customer

```
Find contact information for customer ID: abc123
```

**Shortwave AI will:**

- Call `get_customer` tool
- Show customer details (name, email, phone, address)

---

#### 📦 List Products

```
Show me all products in Billy
```

**Shortwave AI will:**

- Call `list_products` tool
- Display product catalog with names, SKUs, prices

---

## 🔧 Available Tools in Shortwave

Your Shortwave AI Assistant now has access to **13 Billy.dk tools**:

### Invoices (4 tools)

- **list_invoices** - List all invoices with filters
- **create_invoice** - Create new invoice
- **get_invoice** - Get invoice details by ID
- **send_invoice** - Send invoice to customer via email

### Customers (3 tools)

- **list_customers** - List all customers/contacts
- **create_customer** - Create new customer
- **get_customer** - Get customer details by ID

### Products (2 tools)

- **list_products** - List all products
- **create_product** - Create new product

### Revenue (1 tool)

- **get_revenue** - Get revenue analytics with date ranges

### Testing (3 tools)

- **list_test_scenarios** - List available test scenarios
- **run_test_scenario** - Run specific test
- **generate_test_data** - Generate test data

---

## ⚙️ Technical Details

### MCP Protocol

- **Transport:** Server-Sent Events (SSE)
- **Endpoint:** `https://tekup-billy.onrender.com/mcp`
- **Authentication:** X-API-Key header
- **Protocol Version:** MCP 1.0

### Connection Flow

```
1. Shortwave → GET /mcp with X-API-Key
2. Tekup-Billy → Establish SSE connection
3. Shortwave → List available tools
4. User → Ask question in email
5. Shortwave AI → Call appropriate tool
6. Tekup-Billy → Execute tool, return result
7. Shortwave AI → Format response for user
```

---

## 🐛 Troubleshooting

### Connection Failed (Red Dot ❌)

**Problem:** Server not responding

**Solutions:**

1. Verify server is running: <https://tekup-billy.onrender.com/health>
2. Check API key is correct (no extra spaces)
3. Ensure Render.com service is awake (free tier sleeps after inactivity)
4. Try refreshing Shortwave

---

### Authentication Error

**Problem:** "Unauthorized" or "Invalid API key"

**Solutions:**

1. Double-check API key: `sp0ZLWofqSDXPx5OjQa64FHVwRYzeuyr`
2. Verify header name is `X-API-Key` (case-sensitive)
3. Re-enter credentials in Shortwave
4. Check for extra spaces when copying API key

---

### Tools Not Appearing

**Problem:** AI doesn't suggest Billy tools

**Solutions:**

1. Verify green dot in integration card
2. Try explicitly asking: "Use Tekup-Billy to list invoices"
3. Check Shortwave has Max/Premier/Business plan
4. Restart Shortwave app

---

### Slow Responses

**Problem:** Tool calls take long time

**Solutions:**

1. First call wakes up Render.com service (30s cold start)
2. Subsequent calls should be fast (1-5s)
3. Upgrade Render.com from free to paid tier
4. Check Billy.dk API status

---

## 📊 Shortwave Limitations

**Current MCP Beta Limitations:**

1. **Tool Limit:** Maximum 40 tools at once
   - Tekup-Billy has 13 tools ✅

2. **Resources:** Not supported yet
   - Only tool calls work

3. **Prompts:** Not supported yet
   - Custom prompts unavailable

4. **Sampling:** Not supported yet
   - No streaming responses

5. **Local MCP:** Desktop app only
   - Remote MCP works everywhere ✅

---

## 🎨 Use Cases

### For Accountants

```
"Show unpaid invoices over 30 days old"
"Create invoice for [customer] with [product]"
"What's total revenue this quarter?"
```

### For Business Owners

```
"How much did we invoice last month?"
"List all customers in Copenhagen"
"Send invoice #1234 to customer"
```

### For Sales Teams

```
"Find customer contact for [company name]"
"Create invoice for recent sale"
"Check payment status of invoice [number]"
```

---

## 🔐 Security Best Practices

### API Key Protection

- ✅ Never share your API key publicly
- ✅ Use environment variables in code
- ✅ Rotate keys every 90 days
- ✅ Keep in password manager

### Access Control

- ✅ Only share with authorized team members
- ✅ Use separate keys for different environments
- ✅ Monitor API usage in Render.com logs
- ✅ Revoke compromised keys immediately

---

## 📈 Performance Tips

### Cold Starts

- **First request:** 30-60 seconds (Render.com wake-up)
- **Subsequent requests:** 1-5 seconds
- **Solution:** Upgrade to Render.com paid tier (no sleep)

### Caching

- Shortwave may cache tool results briefly
- Force refresh by being specific: "Show me today's invoices"
- Revenue data updates in real-time from Billy.dk

### Batch Operations

- Ask for multiple things at once:

  ```
  "Show me:
  1. Recent invoices
  2. Total revenue this month
  3. Top 5 customers"
  ```

---

## 🎉 Success Indicators

You've successfully integrated when you see:

✅ **Green dot** in Shortwave integration card
✅ **Tool suggestions** when asking about invoices
✅ **Actual data** from Billy.dk in responses
✅ **Fast responses** after first query

---

## 📝 Example Conversation

```
You: "Show me invoices from this week"

Shortwave AI: *Calls list_invoices with date filter*

AI Response:
"Here are your invoices from this week:

1. Invoice #1045 - Acme Corp - 12,500 DKK (Sent)
2. Invoice #1046 - Tech Solutions - 8,300 DKK (Draft)
3. Invoice #1047 - Design Studio - 15,000 DKK (Approved)

Total: 35,800 DKK

Would you like me to send any of these?"

---

You: "Send invoice 1046 to the customer"

AI: *Calls send_invoice tool*

AI Response:
"✅ Invoice #1046 has been sent to Tech Solutions at contact@techsolutions.com"
```

---

## 🚀 Next Steps

After successful setup:

1. **Test Basic Query**
   - Try: "List my Billy invoices"
   - Verify data appears

2. **Explore Tools**
   - Ask about customers, products, revenue
   - Test invoice creation

3. **Setup Shortcuts**
   - Create Shortwave snippets for common queries
   - Train AI with your specific use cases

4. **Monitor Usage**
   - Check Render.com logs
   - Review Billy.dk API usage
   - Optimize based on patterns

---

## 💡 Pro Tips

### Shortwave Shortcuts

Create snippets for common queries:

```
/billy-invoices → "Show me recent Billy invoices"
/billy-revenue → "What's my revenue this month?"
/billy-customers → "List all Billy customers"
```

### Context Awareness

Shortwave AI understands context:

```
You: "Show invoices from Acme Corp"
AI: *Shows invoices*
You: "Send the latest one"
AI: *Knows you mean latest Acme Corp invoice*
```

### Email Integration

Forward Billy invoice PDFs to Shortwave, then:

```
"Save this invoice to Billy"
"Create customer from this email"
"Generate invoice based on this quote"
```

---

## 📞 Support

**Issues with Tekup-Billy MCP:**

- Check health: <https://tekup-billy.onrender.com/health>
- Review logs in Render.com dashboard
- Test endpoint manually with curl
- GitHub issues: <https://github.com/JonasAbde/Tekup-Billy/issues>

**Issues with Shortwave:**

- Shortwave support: <support@shortwave.com>
- Discord community: Join via shortwave.com
- Documentation: <https://shortwave.com/docs>
- Check status: <https://status.shortwave.com>

---

**Integration Status:** ✅ Ready to Use  
**Last Updated:** October 10, 2025  
**Version:** 1.0.0
