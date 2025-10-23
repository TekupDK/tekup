# Shortwave AI MCP Integration Test Guide

## Objective

Verify that Shortwave AI can successfully use the Tekup-Billy MCP server to:
1. Search for existing customers
2. Create new customers from email signatures
3. Update contact details (phone, email)

---

## Prerequisites

✅ Tekup-Billy MCP server running: https://tekup-billy.onrender.com  
✅ Shortwave AI configured with MCP integration  
✅ Billy.dk organization ID: `IQgm5fsl5rJ3Ub33EfAEow`

---

## Test Scenario 1: Create New Customer

### Step 1: Send Test Email to Shortwave

Send an email **TO your Shortwave inbox** with this content:

**From:** test-customer@example.com  
**Subject:** Quote Request - Cleaning Service  
**Body:**
```
Hi,

I would like a quote for cleaning services for my apartment.

Best regards,
John Test Customer
Phone: +45 12 34 56 78
Email: john.testcustomer@example.com
Company: Test Cleaning ApS
Address: Testvej 123, 2100 København Ø
```

### Step 2: Ask Shortwave AI

In Shortwave, ask:
```
"Save this customer to Billy CRM"
```

or

```
"Create a new customer in Billy from this email"
```

### Step 3: Expected Behavior

**Shortwave should:**
1. Extract customer details from email signature
2. Call MCP tool: `create_customer`
3. Create customer with details:
   - Name: John Test Customer
   - Email: john.testcustomer@example.com
   - Phone: +45 12 34 56 78
   - Company: Test Cleaning ApS
4. Return success message

**What to look for in logs:**
```powershell
# Check Render logs
.\render-cli\cli_v2.4.2.exe logs --resources srv-d3kk30t6ubrc73e1qon0 --output text --tail

# Look for:
# - POST /api/v1/tools/create_customer
# - Status: 200 OK
# - User-Agent: Contains "Shortwave" or similar
```

---

## Test Scenario 2: Search Existing Customer

### Step 1: Send Another Email

Send from same email as before:
**From:** john.testcustomer@example.com  
**Subject:** Follow-up Question  
**Body:**
```
Hi again,

Just following up on my cleaning quote request.

Best,
John
```

### Step 2: Ask Shortwave AI

```
"Find this customer in Billy CRM"
```

or

```
"Look up customer information for this email"
```

### Step 3: Expected Behavior

**Shortwave should:**
1. Extract email: john.testcustomer@example.com
2. Call MCP tool: `search_customers` with email filter
3. Find existing customer (created in Test 1)
4. Display customer details

**What to look for in logs:**
```powershell
# Look for:
# - POST /api/v1/tools/search_customers
# - params: { "email": "john.testcustomer@example.com" }
# - Status: 200 OK
# - result: Returns 1 customer match
```

---

## Test Scenario 3: Update Contact Details

### Step 1: Send Email with New Phone

**From:** john.testcustomer@example.com  
**Subject:** Updated Contact Info  
**Body:**
```
Hi,

Please note my new phone number: +45 98 76 54 32

Thanks,
John Test Customer
```

### Step 2: Ask Shortwave AI

```
"Update this customer's phone number in Billy"
```

### Step 3: Expected Behavior

**Shortwave should:**
1. Find customer by email
2. Call MCP tool: `update_contact`
3. Update phone number to: +45 98 76 54 32
4. Return success confirmation

**What to look for in logs:**
```powershell
# Look for:
# - POST /api/v1/tools/update_contact
# - params: { "contactId": "...", "phone": "+45 98 76 54 32" }
# - Status: 200 OK
```

---

## Verification Steps

### 1. Check Render Logs

```powershell
# Get today's logs
.\render-cli\cli_v2.4.2.exe logs --resources srv-d3kk30t6ubrc73e1qon0 --type request --output json --limit 100 > shortwave-test-logs.json

# Parse for Shortwave activity
$content = Get-Content shortwave-test-logs.json -Raw
$logs = $content -split '\}\{' | ForEach-Object {
    $json = $_
    if (-not $json.StartsWith('{')) { $json = '{' + $json }
    if (-not $json.EndsWith('}')) { $json = $json + '}' }
    try { $json | ConvertFrom-Json } catch {}
}

# Filter for MCP tool calls
$mcpCalls = $logs | Where-Object {
    $path = ($_.labels | Where-Object { $_.name -eq 'path' }).value
    $path -like '*/api/v1/tools/*'
}

# Check for Shortwave user-agent
$shortwaveCalls = $mcpCalls | Where-Object {
    $_.message -like '*shortwave*'
}

Write-Host "MCP calls found: $($mcpCalls.Count)"
Write-Host "Shortwave calls: $($shortwaveCalls.Count)"
```

### 2. Check Billy.dk Dashboard

1. Go to: https://app.billy.dk/customers
2. Search for "John Test Customer"
3. Verify customer exists with correct details:
   - Email: john.testcustomer@example.com
   - Phone: +45 98 76 54 32 (after Test 3)
   - Company: Test Cleaning ApS

### 3. Check Supabase Audit Logs (if enabled)

```sql
SELECT 
    created_at,
    tool_name,
    action,
    status,
    params->>'email' as customer_email,
    params->>'phone' as customer_phone,
    user_agent
FROM billy_audit_logs
WHERE 
    tool_name IN ('create_customer', 'search_customers', 'update_contact')
    AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## Expected Results Summary

| Test | Tool Called | Expected Status | Log Pattern |
|------|-------------|----------------|-------------|
| Create Customer | `create_customer` | 200 OK | User-Agent contains "Shortwave" |
| Search Customer | `search_customers` | 200 OK | Params include email filter |
| Update Contact | `update_contact` | 200 OK | Params include new phone |

---

## Troubleshooting

### No Shortwave Calls Detected

**Possible causes:**
1. **Shortwave MCP not configured**
   - Check Shortwave settings → Integrations → MCP
   - Verify Tekup-Billy MCP server URL is added
   - Verify API key is correct

2. **Shortwave doesn't understand prompt**
   - Try more explicit prompts: "Use Billy CRM to create customer"
   - Check if Shortwave has MCP tools discovery enabled

3. **MCP server not accessible**
   - Test manually: `curl https://tekup-billy.onrender.com/health`
   - Should return: `{"status":"ok"}`

### Shortwave Returns Error

**Check error message:**
- "Unauthorized" → API key wrong in Shortwave config
- "Organization not found" → Billy organization ID wrong
- "Rate limit" → Too many requests, wait 1 minute
- "Tool not found" → MCP server version mismatch

**Debug with manual test:**
```powershell
# Test create_customer manually
$response = Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/api/v1/tools/create_customer" -Method Post `
    -Headers @{
        "X-API-Key" = $env:BILLY_API_KEY
        "Content-Type" = "application/json"
    } `
    -Body (@{
        organizationId = $env:BILLY_ORGANIZATION_ID
        name = "Manual Test Customer"
        email = "manual@test.com"
        type = "customer"
    } | ConvertTo-Json)

Write-Host "Manual test result: $($response.contactId)" -ForegroundColor Green
```

---

## Success Criteria

✅ **Test passes if:**
1. All 3 scenarios complete without errors
2. Render logs show Shortwave user-agent
3. Customer exists in Billy.dk with correct details
4. Supabase audit logs (if enabled) show tool calls

❌ **Test fails if:**
- No MCP calls detected in logs
- Shortwave returns errors
- Customer not created/updated in Billy.dk
- Only PowerShell user-agent in logs (no Shortwave)

---

## Next Steps After Successful Test

1. ✅ Document Shortwave MCP integration in README
2. ✅ Create more test scenarios (invoice creation, product lookup)
3. ✅ Train Shortwave on Billy.dk specific workflows
4. ✅ Set up monitoring alerts for Shortwave errors
5. ✅ Create user guide for common Shortwave + Billy tasks

---

## Alternative: Test Without Shortwave

If you don't have Shortwave access yet, test with ChatGPT or Claude:

**ChatGPT with MCP:**
1. Install ChatGPT Desktop with MCP support
2. Configure Tekup-Billy MCP server
3. Ask: "Create a customer in Billy CRM named Test User"

**Claude Desktop with MCP:**
1. Configure `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "tekup-billy": {
         "url": "https://tekup-billy.onrender.com",
         "apiKey": "your-api-key"
       }
     }
   }
   ```
2. Ask: "List all customers in Billy CRM"

---

**Test Duration:** 10 minutes  
**Difficulty:** Easy  
**Impact:** Validates full AI integration workflow
