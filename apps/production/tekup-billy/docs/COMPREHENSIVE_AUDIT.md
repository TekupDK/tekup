# Comprehensive tekup-billy Audit

**Dato:** 31. Oktober 2025  
**Formål:** Find og fix alle lignende problemer som search bug i list_customers  
**Status:** 🔄 Igangværende

---

## 🔍 Identificerede Problemer

### 1. ✅ FIXED: list_customers - Search Filtering
**Problem:** Billy API returnerer alle kunder selv når search parameter er angivet  
**Fix:** Client-side filtering fallback implementeret  
**Status:** ✅ Fixet i commit 3489e90

### 2. ❌ TODO: list_products - Search Filtering
**Problem:** Samme problem som customers - ingen client-side filtering  
**Location:** `src/tools/products.ts` linje 65  
**Fix Needed:** Tilføj samme client-side filtering som customers

### 3. ❌ TODO: list_invoices - Mangler Search Parameter
**Problem:** Ingen search parameter overhovedet - kun date/state/contactId filtering  
**Location:** `src/tools/invoices.ts` linje 13-36  
**Fix Needed:** Tilføj search parameter for invoiceNo, customer name, etc.

---

## 📋 Audit Checklist

### Tools Audit

#### ✅ customers.ts
- [x] Search parameter: ✅ Implementeret
- [x] Client-side filtering: ✅ Fixet
- [x] Pagination: ✅ Korrekt
- [x] Error handling: ✅ Korrekt

#### ❌ products.ts
- [x] Search parameter: ✅ Implementeret
- [ ] Client-side filtering: ❌ MANGER
- [x] Pagination: ✅ Korrekt
- [x] Error handling: ✅ Korrekt

#### ❌ invoices.ts
- [ ] Search parameter: ❌ MANGER
- [ ] Client-side filtering: ❌ Ikke relevant (ingen search)
- [x] Pagination: ✅ Korrekt
- [x] Error handling: ✅ Korrekt

#### ✅ revenue.ts
- [x] Search: N/A (date range query)
- [x] Filtering: ✅ Via date range
- [x] Error handling: ✅ Korrekt

---

## 🔧 Fixes Required

### Fix 1: list_products Client-Side Filtering

**File:** `src/tools/products.ts`  
**Line:** 65-79  
**Action:** Tilføj samme client-side filtering som customers

```typescript
let products = await client.getProducts(params.search);

// Client-side filtering fallback
if (params.search && params.search.trim()) {
  const searchTerm = params.search.trim().toLowerCase();
  products = products.filter((product) => {
    const name = (product.name || "").toLowerCase();
    const productNo = (product.productNo || "").toLowerCase();
    const description = (product.description || "").toLowerCase();
    
    return (
      name.includes(searchTerm) ||
      productNo.includes(searchTerm) ||
      description.includes(searchTerm)
    );
  });
}
```

### Fix 2: list_invoices Search Parameter

**File:** `src/tools/invoices.ts`  
**Action:** Tilføj search parameter til schema og implementer client-side filtering

**Schema Update:**
```typescript
const listInvoicesSchema = z.object({
  // ... existing fields ...
  search: z
    .string()
    .optional()
    .describe("Search term to filter by invoice number, customer name, or description"),
  // ... rest of schema ...
});
```

**Implementation:**
- Client-side filtering på invoiceNo, customer name (via contactId lookup), og line descriptions
- Note: Kræver customer lookup for at søge i customer name

---

## 📊 Billy API Limitations

### Known Issues

1. **Search Parameter Behavior:**
   - Billy API's `name` query parameter er ikke pålidelig
   - Returnerer ofte alle records i stedet for filtrerede
   - Løsning: Client-side filtering fallback

2. **OAuth Token Limitations:**
   - Email/phone ikke supporteret på CREATE contact
   - organizationId query param ikke tilladt med OAuth tokens
   - Contact persons kan ikke modificeres

3. **Invoice Search:**
   - Billy API har ingen indbygget search på invoice text
   - Kun filtering på: date range, state, contactId
   - Løsning: Client-side search på invoiceNo og line descriptions

---

## 🧪 Test Plan

### Test 1: list_products Search
```bash
POST /api/v1/tools/list_products
{
  "arguments": {
    "search": "Test"
  }
}
```
**Expected:** Kun produkter med "Test" i navn/productNo/description

### Test 2: list_invoices Search (efter fix)
```bash
POST /api/v1/tools/list_invoices
{
  "arguments": {
    "search": "INV-"
  }
}
```
**Expected:** Kun fakturaer med "INV-" i invoiceNo

### Test 3: Pagination Consistency
**Verify:** Alle list operations returnerer samme pagination format:
```json
{
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "returned": 20,
    "hasMore": true
  }
}
```

---

## 📝 Implementation Order

1. ✅ Fix list_customers (DONE)
2. ✅ Fix list_products (DONE)
3. ✅ Add search to list_invoices (DONE)
4. ⏳ Test alle fixes
5. ⏳ Deploy og verify

---

**Status:** ✅ Alle fixes implementeret og klar til testing

