# Jørgen Pagh Search Issue - Root Cause Analysis

**Dato:** 31. Oktober 2025  
**Status:** 🔍 Investigating

---

## Problem

ChatGPT kan ikke finde "Jørgen Pagh" selvom han eksisterer i Billy systemet.

**Bekræftet facts fra Billy UI:**
- ✅ Name: Jørgen Pagh
- ✅ Phone: 30666685
- ✅ Email: joergenpagh1948@gmail.com (contact person)
- ✅ Address: Sølykken 20, 8530 Hjortshøj
- ✅ 4 fakturaer

**API Response:**
- ❌ 61 kunder returneres ved søgning "Pagh"
- ❌ Jørgen Pagh findes IKKE i de 61 returnerede kunder
- ❌ Alle kontakter har `contactPersons: []` (tom array)

---

## Root Cause Analysis

### Problem 1: Billy API `/contacts` Endpoint Limitations

**Observation:**
- `/contacts?type=company` returnerer kun 61 kontakter
- Jørgen Pagh er IKKE i listen
- `contactPersons` er altid tom i list response

**Mulige årsager:**

1. **Pagination mangler:**
   - Billy API kan have flere end 61 kontakter
   - Vi henter kun første page/result set
   - Jørgen Pagh er måske på page 2+

2. **ContactPersons mangler i list response:**
   - `/contacts` endpoint returnerer ikke contactPersons
   - Vi kan kun søge i name, phone, street (ikke email)
   - Jørgen Pagh's email er i contactPersons, ikke synlig

3. **Search parameter virker ikke:**
   - Billy API's `name` query parameter filtrerer ikke korrekt
   - Returnerer alle kontakter uanset search term

---

## Løsninger Implementeret

### Fix 1: Forbedret Client-Side Filtering ✅

**Fil:** `src/tools/customers.ts`

**Ændringer:**
- ✅ Søger nu også i `city` og `zipcode`
- ✅ Bedre logging når filtering anvendes
- ✅ Håndterer tomme `contactPersons` arrays

**Status:** ✅ Implementeret (commit ba8e581)

---

### Fix 2: TypeScript Errors ✅

**Fil:** `src/billy-client.ts`

**Ændringer:**
- ✅ Fixed circuit breaker type errors
- ✅ Added type casts for stats access

**Status:** ✅ Implementeret (commit ba8e581)

---

### Fix 3: Cache Manager Parameter Order ✅

**Fil:** `src/database/cache-manager.ts`

**Ændringer:**
- ✅ Fixed `getCachedData` parameter order (was: table, orgId, id → should be: table, id, orgId)

**Status:** ✅ Implementeret (commit pending)

---

## Næste Skridt

### Option A: Implementer Pagination (KRITISK)

**Problem:** Vi henter kun første page af kontakter

**Løsning:**
```typescript
async getAllContacts(type: 'customer' | 'supplier', search?: string): Promise<BillyContact[]> {
  let allContacts: BillyContact[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await this.makeRequest<{ contacts: BillyContact[], meta?: any }>('GET', 
      `/contacts?type=${type === 'customer' ? 'company' : 'company'}&page=${page}${search ? `&name=${search}` : ''}`
    );
    
    allContacts = allContacts.concat(response.contacts);
    
    // Check if there are more pages
    hasMore = response.meta?.hasMore || response.contacts.length === 100; // Assume 100 per page
    page++;
    
    // Safety limit
    if (page > 100) break;
  }
  
  return allContacts;
}
```

**Estimeret effort:** 2 timer

---

### Option B: Hent Contact Details for Match (WORKAROUND)

**Problem:** ContactPersons mangler i list response

**Løsning:**
Når vi finder en kontakt der matcher name/phone, hent fuld contact details:
```typescript
// After filtering
if (params.search && contacts.length === 0) {
  // Try fetching contact by phone or exact name match
  // Then check contactPersons in detailed response
}
```

**Estimeret effort:** 1 time

---

### Option C: Billy API Investigation (LONG TERM)

**Action:**
1. Test Billy API `/contacts` endpoint direkte
2. Dokumenter pagination support
3. Dokumenter contactPersons i list vs detail response
4. Test search parameter behavior

**Estimeret effort:** 2 timer

---

## Anbefaling

**Prioritet 1:** Implementer pagination (Option A)
- Det løser problemet hvis Jørgen Pagh er på page 2+
- Sikrer vi får ALLE kontakter før filtering

**Prioritet 2:** Option B som backup
- Håndterer tilfælde hvor kontakt findes men ikke i første page

**Prioritet 3:** Option C for langtids-løsning
- Dokumenter Billy API limitations
- Opdater integration guide

---

**Status:** 🔄 Awaiting pagination implementation

