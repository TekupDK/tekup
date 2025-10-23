# Hotfix: Invoice States Correction (v1.4.2)

**Date:** October 20, 2025  
**Discovered by:** ChatGPT integration testing  
**Severity:** Medium (Schema mismatch causing tool failures)

## Problem Summary

The MCP tool definitions and TypeScript types had **incorrect invoice state enums** that didn't match Billy.dk API's actual behavior.

### What Was Wrong

**Defined states (INCORRECT):**

```typescript
state: 'draft' | 'approved' | 'sent' | 'paid' | 'cancelled'
```

**Actual Billy API states (CORRECT):**

```typescript
state: 'draft' | 'approved' | 'voided'
```

### Root Cause

- Documentation (BILLY_API_REFERENCE.md) referenced states from older Billy API or misunderstood the API
- Billy API uses **`isPaid` boolean field** instead of a `paid` state
- Billy API uses **`voided`** not `cancelled`
- **`sent`** is tracked via `sentState` field, not the main `state` field

## Impact

1. ✅ **`list_invoices` with `state="sent"`** → Failed (404)
2. ✅ **`list_invoices` with `state="paid"`** → Failed (404)
3. ✅ **Revenue calculations** → Used wrong logic (looked for non-existent states)
4. ⚠️ **ChatGPT integration** → Reported 404 errors when filtering by invalid states

## Fixes Applied

### 1. `src/tools/invoices.ts`

```typescript
// BEFORE:
state: z.enum(['draft', 'approved', 'sent', 'paid', 'cancelled'])

// AFTER:
state: z.enum(['draft', 'approved', 'voided'])
```

### 2. `src/types.ts`

```typescript
// BEFORE:
state: 'draft' | 'approved' | 'sent' | 'paid' | 'cancelled';

// AFTER:
state: 'draft' | 'approved' | 'voided';

// ADDED:
isPaid?: boolean;        // Payment tracking
balance?: number;        // Remaining amount
dueDate?: string;        // Due date (YYYY-MM-DD)
sentState?: string;      // Billy API sent tracking
```

### 3. `src/billy-client.ts` - Revenue Logic

```typescript
// BEFORE:
const paidInvoices = invoices.filter(inv => inv.state === 'paid');
const pendingInvoices = invoices.filter(inv => ['sent', 'approved'].includes(inv.state));

// AFTER:
const paidInvoices = invoices.filter(inv => inv.isPaid === true);
const pendingInvoices = invoices.filter(inv => inv.state === 'approved' && !inv.isPaid);
const overdueInvoices = invoices.filter(inv => {
  if (inv.isPaid || inv.state !== 'approved' || !inv.dueDate) return false;
  return new Date(inv.dueDate) < new Date();
});
```

## Testing Results

### Direct Billy API Test

```powershell
# All invoices grouped by state
$response = Invoke-RestMethod -Uri "https://api.billysbilling.com/v2/invoices" -Headers @{"X-Access-Token"="..."}
$response.invoices | Group-Object state

# RESULT:
Name     Count
----     -----
voided      15
approved    81
draft        2
```

✅ **Confirmed:** Billy API ONLY returns `draft`, `approved`, `voided`

### Sample Invoice Data

```json
{
  "state": "voided",
  "isPaid": false,
  "balance": 1047,
  "dueDate": null,
  "sentState": "unsent"
}
```

## Verification

✅ TypeScript compilation: **0 errors**  
✅ `list_invoices` without filter: **Works** (98 invoices returned)  
✅ `list_invoices state="draft"`: **Works**  
✅ `list_invoices state="approved"`: **Works**  
✅ `list_invoices state="voided"`: **Works**  
❌ `list_invoices state="sent"`: **Correctly fails** (invalid state)

## Deployment

**Branch:** main  
**Version:** 1.4.2 (hotfix)  
**Build:** ✅ Successful  
**Deploy:** Pending git push

## Documentation Updates Needed

1. ✅ Update `BILLY_API_REFERENCE.md` - Remove references to `sent`/`paid`/`cancelled` states
2. ✅ Update `docs/CHATGPT_SETUP.md` - Add note about valid invoice states
3. ✅ Create this hotfix document

## Lessons Learned

1. 🔍 **Always validate API responses** against documentation
2. 🧪 **Test with real API data** before deploying
3. 🤖 **ChatGPT discovered this** - AI testing is valuable!
4. 📝 **Documentation can be outdated** - trust the API response

## For ChatGPT Users

**Valid `list_invoices` state filters:**
- `draft` - Invoices not yet approved
- `approved` - Approved invoices (may or may not be paid)
- `voided` - Cancelled/voided invoices

**To check if invoice is paid:**
- Use `isPaid` field in response
- Or check `balance === 0`
- **DO NOT** filter by `state="paid"` (doesn't exist)

**Example queries:**

```
✅ list_invoices state="approved"
✅ list_invoices (no filter - returns all)
❌ list_invoices state="sent" (will fail)
```

---
**Status:** ✅ Fixed, tested, ready for deployment
