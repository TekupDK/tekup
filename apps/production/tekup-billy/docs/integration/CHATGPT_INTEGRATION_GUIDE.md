# 🤖 ChatGPT Integration Guide - Tekup-Billy MCP

**Dato:** 20. Oktober 2025  
**Status:** Production Ready ✅  
**ChatGPT Version:** ChatGPT Plus/Team/Enterprise required

---

## 📋 Overview

Denne guide viser hvordan du integrerer Tekup-Billy MCP Server med ChatGPT's Custom Actions feature, så du kan administrere Billy.dk direkte fra ChatGPT.

**Hvad kan du gøre:**
- 📊 Liste og søge i fakturaer, kunder, produkter
- ✏️ Oprette nye kunder og produkter
- 🔄 Opdatere eksisterende data
- 💰 Tjekke revenue og saldi
- 📧 Sende fakturaer via email

---

## ✅ Forudsætninger

### 1. ChatGPT Abonnement

**Krav:** ChatGPT Plus, Team, eller Enterprise
- ❌ **Free tier understøtter IKKE Custom Actions**
- ✅ **Plus ($20/måned)** - Fuld adgang til Custom Actions
- ✅ **Team/Enterprise** - Fuld adgang + team deling

**Check dit abonnement:**
1. Gå til [ChatGPT Settings](https://chat.openai.com/settings)
2. Se "Plan" under dit navn
3. Hvis "Free" - upgrade til Plus først

### 2. Tekup-Billy MCP Server

- **Status:** ✅ Live på Render.com
- **Base URL:** `https://tekup-billy.onrender.com`
- **API Key:** `bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b`
- **Health Check:** `https://tekup-billy.onrender.com/health`

---

## 🚀 Setup Instructions

### Metode 1: Custom GPT (Anbefalet)

**Fordele:**
- Persistente connections
- Kan deles med andre (Team/Enterprise)
- Dedikeret interface
- Custom instructions

#### Step 1: Create New GPT

1. Gå til [ChatGPT](https://chat.openai.com)
2. Klik dit profilbillede (top-right)
3. Vælg **"My GPTs"**
4. Klik **"Create a GPT"**

#### Step 2: Configure GPT

**Name:**

```
Tekup Billy Assistant
```

**Description:**

```
Your Billy.dk accounting assistant. Manages invoices, customers, products, and revenue directly in ChatGPT.
```

**Instructions:**

```
You are a specialized accounting assistant integrated with Billy.dk through the Tekup-Billy MCP server.

CAPABILITIES:
- List and search invoices, customers, products
- Create new customers and products
- Update existing data
- Check revenue and balances
- Send invoices via email

PERSONALITY:
- Professional and efficient
- Proactive with suggestions
- Always confirm before creating/updating
- Use emojis for clarity (📊 invoices, 👤 customers, 📦 products, 💰 revenue)

IMPORTANT RULES:
1. Always show organizationId in responses (for transparency)
2. Confirm destructive actions before executing
3. Format dates as YYYY-MM-DD
4. Show amounts with currency (DKK/EUR)
5. Use tables for lists (better readability)

WORKFLOW PATTERNS:
- When user asks "show invoices" → Use list_invoices with smart defaults
- When creating customer → Ask if they want Danish B2B template
- When creating product → Offer to auto-calculate EUR price from DKK
- When errors occur → Explain clearly and suggest fixes
```

**Conversation starters (valgfri):**

```
📊 Show my recent invoices
👤 Create a new customer
📦 List all products
💰 What's my total revenue this month?
```

#### Step 3: Add Actions (API Integration)

1. Scroll til **"Actions"** section
2. Klik **"Create new action"**
3. Vælg **"Import from URL"**

**OpenAPI Schema URL:**

```
https://tekup-billy.onrender.com/openapi.json
```

4. Klik **"Import"**
5. ChatGPT vil automatisk parse alle 32 tools

#### Step 4: Configure Authentication

1. Under "Authentication" vælg **"API Key"**
2. Select **"Custom Header"**
3. Fill in:

```
Header Name:  X-API-Key
Header Value: bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b
```

4. Klik **"Save"**

#### Step 5: Test & Publish

1. Klik **"Test"** i top-right
2. Prøv en simpel query: "Show me my invoices"
3. Hvis det virker → Klik **"Publish"**
4. Vælg synlighed:
   - **"Only me"** - Privat
   - **"Anyone with link"** - Kan deles
   - **"Public"** (kun Enterprise) - Offentlig GPT store

---

### Metode 2: Actions i Regular Chat (Alternativ)

**Fordele:**
- Hurtigere setup (5 min)
- Ingen GPT creation nødvendig
- God til quick tests

**Ulemper:**
- Ikke persistent (skal opsættes hver gang)
- Kan ikke deles
- Begrænset til én chat session

#### Step 1: Start New Chat

1. Gå til [ChatGPT](https://chat.openai.com)
2. Start en ny chat

#### Step 2: Enable Actions

1. Klik **paperclip icon** (eller tryk `/`)
2. Vælg **"Actions"**
3. Klik **"Add action"**

#### Step 3: Import Schema

**Option A: Via URL**

```
https://tekup-billy.onrender.com/openapi.json
```

**Option B: Paste JSON** (hvis URL fejler)

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Tekup-Billy MCP Server",
    "version": "1.4.1",
    "description": "Billy.dk accounting integration via MCP"
  },
  "servers": [
    {
      "url": "https://tekup-billy.onrender.com"
    }
  ],
  "paths": {
    "/tools/list": {
      "get": {
        "summary": "List all available tools",
        "operationId": "listTools",
        "responses": {
          "200": {
            "description": "List of available tools"
          }
        }
      }
    },
    "/tools/call": {
      "post": {
        "summary": "Call a tool",
        "operationId": "callTool",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "arguments": { "type": "object" }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "ApiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "X-API-Key"
      }
    }
  },
  "security": [
    { "ApiKeyAuth": [] }
  ]
}
```

#### Step 4: Configure Auth

Same as Method 1:

```
Header Name:  X-API-Key
Header Value: bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b
```

#### Step 5: Test

Prompt:

```
Use the Tekup-Billy action to list my invoices
```

---

## 🧪 Testing Workflow

### Test Plan: Basic Operations

#### Test 1: Health Check

```
Check if Billy API is healthy
```

**Expected Output:**

```
✅ Billy API is healthy
✅ Supabase cache connected
✅ All systems operational
Version: 1.4.1
Uptime: XXs
```

---

#### Test 2: List Invoices

```
Show me my last 5 invoices
```

**Expected Output:**

```
📊 Recent Invoices:

| ID | Invoice # | Customer | Amount | State | Due Date |
|----|-----------|----------|--------|-------|----------|
| abc | 2025-001 | Acme Corp | 10,000 DKK | approved | 2025-11-01 |
| def | 2025-002 | TechCo | 5,500 DKK | draft | 2025-11-05 |
...
```

---

#### Test 3: Search Customer

```
Find customer named "Acme"
```

**Expected Output:**

```
👤 Found Customer:

Name: Acme Corporation
ID: customer_abc123
Type: Company
Email: info@acme.com
Phone: +45 12345678
Created: 2025-01-15
```

---

#### Test 4: Create Customer (Template Test)

```
Create a new Danish B2B customer named "Test Company ApS"
Email: test@test.dk
Phone: +45 87654321
```

**Expected Response:**

```
Would you like me to use the Danish B2B template? This includes:
✅ Set as company (isCompany: true)
✅ Country: Denmark
✅ Type: Customer
✅ Default invoice settings

Confirm to proceed?
```

**User:** "Yes"

**Expected Output:**

```
✅ Customer created successfully!

Name: Test Company ApS
ID: customer_xyz789
Email: test@test.dk
Phone: +45 87654321
Type: Company (B2B)
Country: Denmark
```

---

#### Test 5: Create Product with EUR Pricing

```
Create a consulting product:
Name: "Senior Consulting Hour"
Price: 1200 DKK per hour
```

**Expected Response:**

```
Would you like me to auto-calculate EUR pricing? 
1200 DKK = ~161 EUR (DKK/EUR rate: 7.45)

Confirm to add both currencies?
```

**User:** "Yes"

**Expected Output:**

```
✅ Product created with multi-currency pricing!

Name: Senior Consulting Hour
ID: product_abc456

Prices:
💰 1200 DKK per hour
💶 161 EUR per hour

Account: Default sales account
```

---

#### Test 6: Revenue Check

```
What's my total revenue for October 2025?
```

**Expected Output:**

```
💰 Revenue Report - October 2025

Total Revenue: 125,450 DKK

Breakdown:
📊 Approved invoices: 100,000 DKK (10 invoices)
📋 Paid invoices: 85,000 DKK (8 invoices)
⏳ Outstanding: 15,000 DKK (2 invoices)
✏️ Draft invoices: 25,450 DKK (5 invoices)

Note: Draft invoices not included in total revenue.
```

---

#### Test 7: Send Invoice

```
Send invoice #2025-001 to the customer's email
```

**Expected Response:**

```
⚠️ Confirm: Send invoice 2025-001 to info@acme.com?

Invoice Details:
Customer: Acme Corporation
Amount: 10,000 DKK
Due Date: 2025-11-01
State: approved

Proceed?
```

**User:** "Yes"

**Expected Output:**

```
✅ Invoice sent successfully!

Sent to: info@acme.com
Invoice: #2025-001
Delivery method: Email
Status: Delivered

Customer will receive:
- Invoice PDF
- Payment instructions
- Due date reminder
```

---

#### Test 8: Error Handling

```
Get invoice with ID "invalid123"
```

**Expected Output:**

```
❌ Invoice not found

Error: No invoice found with ID "invalid123"

💡 Suggestions:
- Check if the invoice ID is correct
- Use "list invoices" to see available invoices
- Try searching by invoice number instead

Would you like me to list recent invoices?
```

---

## 📊 Performance Testing

### Cache Performance Test

**Goal:** Verify Supabase caching gives 5x speedup

#### Test A: First Request (Cache Miss)

```
List all customers
```

**Expected:** ~250-500ms response time
**ChatGPT shows:** "Fetching customers from Billy..."

#### Test B: Second Request (Cache Hit)

```
List all customers again
```

**Expected:** ~50-100ms response time (5x faster!)
**ChatGPT shows:** "Retrieved from cache..."

---

### Load Test (Optional)

**Goal:** Test rate limiting and circuit breaker

```
Make 20 rapid requests:
- List invoices (5 times)
- List customers (5 times)
- List products (5 times)
- List accounts (5 times)
```

**Expected Behavior:**
- First 15 requests: Normal speed
- Requests 16-20: Rate limited (429 status)
- Circuit breaker: Kicks in if >50% fail
- No crashes or errors

---

## 🔍 Troubleshooting

### Problem 1: "Action failed to execute"

**Cause:** API key invalid eller endpoint down

**Fix:**
1. Check health: `https://tekup-billy.onrender.com/health`
2. Verify API key i ChatGPT settings
3. Check Render deployment status

---

### Problem 2: "Slow responses (>5 seconds)"

**Cause:** Cache not active or Render cold start

**Fix:**
1. Check cache status: `/health/metrics`
2. Look for `"supabase": { "enabled": true }`
3. If cold start - wait 30s and retry

---

### Problem 3: "No data returned"

**Cause:** Billy organization tom eller forkert organizationId

**Fix:**
1. Check organizationId in prompt
2. Verify data exists i Billy.dk dashboard
3. Try different tool (e.g., list_accounts always returns data)

---

### Problem 4: "Authentication failed"

**Cause:** API key mangler eller forkert format

**Fix:**
1. Re-enter API key in ChatGPT
2. Ensure **NO spaces** before/after key
3. Verify header name: `X-API-Key` (case-sensitive)

---

## 🎓 Best Practices

### 1. Use Natural Language

**Good:**

```
Show me unpaid invoices from this month
```

**Avoid:**

```
Call list_invoices with state=approved and entryDateGte=2025-10-01
```

ChatGPT vil automatisk konvertere natural language til korrekte API calls.

---

### 2. Be Specific with Dates

**Good:**

```
Invoices from October 1 to October 15, 2025
```

**Avoid:**

```
Recent invoices (ambiguous)
```

---

### 3. Confirm Before Destructive Actions

**Good:**

```
ChatGPT: "Are you sure you want to send this invoice?"
User: "Yes, send it"
```

**Avoid:**

```
Send all invoices (too broad, dangerous)
```

---

### 4. Use Templates

**Good:**

```
Create Danish B2B customer using template
```

**Benefit:**
- Faster (1 API call instead of 2)
- Fewer errors (pre-validated data)
- Consistent formatting

---

## 📈 Advanced Usage

### Multi-Step Workflows

#### Workflow 1: New Customer + Invoice

**User:**

```
Create a customer "New Corp" and send them an invoice for 10,000 DKK for consulting services
```

**ChatGPT will:**
1. Create customer "New Corp" (using template if detected as Danish)
2. Get customer ID from response
3. Create product "Consulting Services" (or use existing)
4. Create invoice with customer + product
5. Send invoice via email
6. Confirm all steps completed

---

#### Workflow 2: Revenue Analysis

**User:**

```
Compare my revenue from September vs October 2025
```

**ChatGPT will:**
1. Fetch invoices for September (entryDateGte/Lte)
2. Calculate total approved invoices
3. Fetch invoices for October
4. Calculate total approved invoices
5. Show comparison table with growth %

---

#### Workflow 3: Customer Health Check

**User:**

```
Show me customers who haven't been invoiced in the last 3 months
```

**ChatGPT will:**
1. List all customers
2. List all invoices from last 3 months
3. Cross-reference customer IDs
4. Show customers with no invoices
5. Suggest follow-up actions

---

## 📚 Example Prompts Library

### Invoices

```
- Show me draft invoices that need approval
- Find all overdue invoices
- What's the total value of unpaid invoices?
- Create an invoice for customer X for 5000 DKK
- Send invoice #2025-042 via email
- Export last month's invoices as a summary
```

### Customers

```
- List all company customers (B2B)
- Find customers in Copenhagen
- Create a new customer with email test@test.dk
- Update customer X with new phone number
- Show me customers created this month
- Which customers have the highest invoice totals?
```

### Products

```
- List all active products
- Create a product "Web Hosting" for 299 DKK/month
- Update product X with new price 500 DKK
- Show products with EUR pricing
- Find products in account 1000 (sales)
```

### Revenue & Analytics

```
- Total revenue this quarter
- Compare revenue Q1 vs Q2 2025
- Show me my top 5 customers by revenue
- What's my average invoice amount?
- Revenue by product category
```

---

## 🔗 Related Documentation

- **Shortwave Guide:** `docs/integration/SHORTWAVE_INTEGRATION_GUIDE.md`
- **API Reference:** `docs/BILLY_API_REFERENCE.md`
- **Health Monitoring:** `docs/operations/SUPABASE_CACHING_SETUP.md`
- **Templates:** `src/templates/entity-templates.ts`

---

## 🆘 Support

**Issues:**
- GitHub: [TekupDK/Tekup-Billy/issues](https://github.com/TekupDK/Tekup-Billy/issues)

**Health Check:**
- `https://tekup-billy.onrender.com/health`

**Logs:**
- Render Dashboard: `https://dashboard.render.com`

**API Key Reset:**
- Contact Jonas Abde

---

**🎉 Enjoy Billy.dk in ChatGPT! 🤖**
