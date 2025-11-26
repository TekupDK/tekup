# Shortwave Billy Integration Setup Guide

**Recommended URL:** Railway (v3.0.0) - Production Ready
**Last Updated:** November 26, 2025

---

## 🎯 Quick Setup

### Step 1: Find Shortwave's Billy Integration

1. Åbn Shortwave
2. Gå til Settings → AI → Integrations/Connectors
3. Find "Billy" eller "Billy MCP" connector

### Step 2: Set Railway URL

**Production URL (Railway - v3.0.0):**
```
https://tekup-billy-production.up.railway.app
```

### Step 3: Test Integration

Send denne besked til Shortwave:

```
@friday validate Billy auth and show version
```

**Forventet response:**
```json
{
  "success": true,
  "version": "3.0.0",
  "organization": "Rendetalje",
  "features": [
    "hierarchical tools",
    "summary-first approach",
    "97% token reduction",
    "smart cache fallback",
    "authentication-aware caching"
  ]
}
```

### Step 4: Test Customer Operations

**Test 1: Get Business Overview**
```
@friday show me a summary of Billy status
```

Expected: Summary with total invoices, customers, unpaid amounts (10-50 tokens)

**Test 2: Find Unpaid Invoices**
```
@friday show unpaid invoices
```

Expected: Filtered list of unpaid invoices (100-500 tokens)

**Test 3: Update Customer (Tom Frandsen)**
```
@friday update customer Tom Frandsen (ID: 57DvDpbSQJqcCFvNNTntZg) with:
- Email: tom.frandsen58@gmail.com
- Phone: 22 61 62 10
- Address: Alkevej 2, 8250 Egå, Danmark
```

**Forventet resultat:**
```
✅ Customer updated successfully
- Name: Tom Frandsen
- Email: tom.frandsen58@gmail.com
- Phone: 22 61 62 10
- Address: Alkevej 2, 8250 Egå, Danmark
```

---

## 🚀 v3.0 New Features

### Hierarchical Tools (3-Level Architecture)

**Level 1: Summaries** (10-50 tokens)
- `get_invoice_summary` - Overview of all invoices
- `get_customer_summary` - Overview of all customers
- `get_business_overview` - Complete business status

**Level 2: Filtered Lists** (100-500 tokens)
- `list_unpaid_invoices` - Only unpaid invoices
- `list_overdue_invoices` - Only overdue invoices
- `search_customers` - Fuzzy search with suggestions
- `search_invoices` - Filter by status, date, amount

**Level 3: Details** (500-2000 tokens)
- `get_invoice_details` - Full invoice with line items
- `get_customer_details` - Complete customer information

### Benefits
- 🎯 **97% Token Reduction** - Summary-first prevents context overload
- 🚀 **50-75% Fewer Tool Calls** - Smart workflow guidance
- ✅ **No "Lost in the Middle"** - Lists limited to 20 items
- 🧠 **Smart Next Actions** - `_nextActions` hints guide LLM
- 🔍 **Fuzzy Search** - Handles Danish characters (æ, ø, å)

---

## 🧪 Test Cases

### Test Case 1: Business Overview Workflow

**Before v3.0 (10,000+ tokens):**
```
1. list_invoices → 139 invoices × 50 fields = 6,950 tokens
2. list_customers → 137 customers × 40 fields = 5,480 tokens
3. LLM confused, calls list_invoices again...
= 3+ tool calls, 10,000+ tokens
```

**After v3.0 (35 tokens):**
```
1. get_business_overview → 35 tokens
   {
     invoices: {total: 139, unpaid: 12, overdue: 3},
     customers: {total: 137, active: 120},
     revenue: {thisMonth: 45000, unpaid: 15600}
   }
= 1 tool call, 35 tokens
```

**97% reduction!**

### Test Case 2: Find Specific Invoice

**Before v3.0:**
```
1. list_invoices → 10,000 tokens
2. Invoice #70 lost in middle
3. list_invoices again → 10,000 tokens
4. Still can't find it...
= Multiple tool calls, context meltdown
```

**After v3.0:**
```
1. search_invoices(customerName: "Tom Frandsen") → 120 tokens
2. get_invoice_details(id) → 500 tokens
= 2 tool calls, 620 tokens
```

---

## ✅ Verification Checklist

After setup:

- [ ] Billy MCP version is 3.0.0 (`/version` endpoint)
- [ ] `get_business_overview` returns summary (<50 tokens)
- [ ] `list_unpaid_invoices` returns filtered list (<500 tokens)
- [ ] `search_customers` with fuzzy matching works
- [ ] Tom Frandsen customer update succeeds
- [ ] No "Billy API limitation" errors
- [ ] All operations succeed on first attempt
- [ ] Authentication errors don't return cached data

---

## 📞 Troubleshooting

### Issue: Shortwave Shows Old Version

**Check URL in Shortwave settings:**
```
Should be: https://tekup-billy-production.up.railway.app
```

**Fix:**
1. Clear Shortwave cache/cookies
2. Re-authenticate with Billy connector
3. Verify version shows "3.0.0"

### Issue: Railway Endpoint Not Working

**Check health:**
```bash
curl https://tekup-billy-production.up.railway.app/health
```

**If error:**
1. Check Railway dashboard for service status
2. Check Railway logs: `railway logs --follow`
3. Verify environment variables:
   - `BILLY_API_KEY`
   - `BILLY_ORGANIZATION_ID`

### Issue: Tools Not Working as Expected

**Check which version you're on:**
```
@friday show Billy version
```

**If < 3.0.0:**
- Verify Railway URL is correct
- Check Railway deployment status
- Wait for deployment to complete (2-3 minutes)

---

## 🎯 Expected Behavior

### Summary Tools (Level 1)
```typescript
// Response includes guidance
{
  total: 139,
  unpaid: 12,
  overdue: 3,
  _nextActions: ["list_unpaid_invoices", "list_overdue_invoices"],
  _tokenUsage: 15
}
```

### Filtered Lists (Level 2)
```typescript
// Limited to 20 items, sorted by priority
{
  invoices: [...], // Max 20 items
  _hasMore: true,
  _nextActions: ["get_invoice_details", "send_invoice"],
  _tokenUsage: 120
}
```

### Detail Tools (Level 3)
```typescript
// Complete information for single item
{
  invoice: {...},
  lineItems: [...],
  customer: {...},
  _tokenUsage: 500
}
```

---

## 📚 Related Documentation

- [BILLY_LLM_RESEARCH.md](./BILLY_LLM_RESEARCH.md) - Research på hvorfor v3.0 var nødvendig
- [BILLY_V3_ARCHITECTURE.md](./BILLY_V3_ARCHITECTURE.md) - Complete architecture
- [MIGRATION_V2_TO_V3.md](./MIGRATION_V2_TO_V3.md) - Migration details
- [V3_VALIDATION.md](./V3_VALIDATION.md) - Validation against research
- [CHANGELOG.md](../CHANGELOG.md) - All release notes

---

## 🎉 Success Criteria

You'll know v3.0 works when:

1. ✅ Business overview shows in <50 tokens
2. ✅ Finding invoices takes 2 tool calls (not 5+)
3. ✅ No "Lost in the Middle" errors
4. ✅ Tom Frandsen customer fully updated
5. ✅ All operations succeed on first attempt
6. ✅ Shortwave shows version "3.0.0"
7. ✅ Response times <2s for summaries

---

**Version:** 2.0
**Status:** Production Ready
**Deployment:** Railway Only
