# 🎯 Claude Phase 1 Analytics - Resume & Continue

**Date:** 20. oktober 2025  
**Status:** Test 1 påbegyndt, afbrudt af conversation length limit  
**Action:** Fortsæt alle 5 tests i denne nye chat

---

## ✅ HVAD DU ALLEREDE HAR BEKRÆFTET

**Basic Operations - ALLE VIRKER:**
- ✅ **97 invoices** fundet (Draft: 1, Approved: 80, Voided: 16)
- ✅ **61 customers** verificeret (mix af B2B og B2C)
- ✅ **67 products** verificeret (Fast rengøring, Flytterengøring, osv)
- ✅ **organizationId requirement** forstået og korrekt anvendt

**Test 1 Progress (Oktober 2025 Revenue):**
- ✅ list_invoices kaldt - 97 fakturaer fundet
- ✅ Invoice #1092: 1,745 DKK (3. oktober 2025) - Martin Holm
- ✅ Invoice #1094: 4,188 DKK (17. oktober 2025) - Mariane Thomsens G.
- 🔄 Invoice #1095: Skal hentes (18. oktober 2025)
- ⏳ Resterende oktober fakturaer skal identificeres og summeres

---

## 🎯 DIN OPGAVE NU

**Kør alle 5 Phase 1 Analytics Tests:**

### **Test 1: Oktober 2025 Total Revenue** 📊

**Mål:** Beregn total omsætning for oktober 2025

**Steps:**
1. Hent ALLE fakturaer via `list_invoices`
2. Få detaljer på hver faktura via `get_invoice`
3. Filtrer til `entryDate >= "2025-10-01" AND <= "2025-10-31"`
4. Beregn totaler:
   - Total revenue (sum af alle beløb)
   - Gennemsnit pr. faktura
   - Breakdown by state (approved, paid, draft)

**Expected Output:**

```markdown
## Test 1: Oktober 2025 Revenue

**Total Revenue:** X,XXX DKK
**Invoices Count:** X fakturaer
**Average per Invoice:** XXX DKK

**Breakdown:**
- Approved: X fakturaer (X,XXX DKK)
- Paid: X fakturaer (X,XXX DKK)
- Draft: X fakturaer (X,XXX DKK)

**Top 3 Invoices:**
1. #XXXX - X,XXX DKK - [Customer]
2. #XXXX - X,XXX DKK - [Customer]
3. #XXXX - X,XXX DKK - [Customer]
```

---

### **Test 2: Top 5 Kunder** 👥

**Mål:** Find kunder med flest fakturaer + højest total omsætning

**Steps:**
1. Hent alle fakturaer
2. Group by `contactId`
3. Beregn count + total amount per kunde
4. Hent kunde navne via `get_contact` for top 5

**Expected Output:**

```markdown
## Test 2: Top 5 Customers

### By Invoice Count:
1. [Customer Name] - X fakturaer (X,XXX DKK total)
2. [Customer Name] - X fakturaer (X,XXX DKK total)
3. [Customer Name] - X fakturaer (X,XXX DKK total)
4. [Customer Name] - X fakturaer (X,XXX DKK total)
5. [Customer Name] - X fakturaer (X,XXX DKK total)

### By Total Revenue:
1. [Customer Name] - X,XXX DKK (X fakturaer)
2. [Customer Name] - X,XXX DKK (X fakturaer)
3. [Customer Name] - X,XXX DKK (X fakturaer)
4. [Customer Name] - X,XXX DKK (X fakturaer)
5. [Customer Name] - X,XXX DKK (X fakturaer)
```

---

### **Test 3: Produkt Performance** 📦

**Mål:** Find bedst-sælgende produkter + ubrugte produkter

**Steps:**
1. Hent alle fakturaer
2. Analyser `lines[].productId` fra hver faktura
3. Group by productId, beregn total quantity + amount
4. Hent produkt navne via `get_product`
5. Identificer produkter med 0 sales

**Expected Output:**

```markdown
## Test 3: Product Performance

### Top 3 Best-Selling Products:
1. **[Product Name]** - X,XXX DKK (XXX enheder solgt)
2. **[Product Name]** - X,XXX DKK (XXX enheder solgt)
3. **[Product Name]** - X,XXX DKK (XXX enheder solgt)

### Unused Products (0 sales):
- [Product Name] (XXX DKK/unit)
- [Product Name] (XXX DKK/unit)
```

---

### **Test 4: Draft Fakturaer Status** 📝

**Mål:** Få overblik over kladdefakturaer der venter på godkendelse

**Steps:**
1. Filtrer fakturaer til `state: "draft"`
2. Analyser aging (dage siden oprettelse)
3. Beregn total potentiel omsætning

**Expected Output:**

```markdown
## Test 4: Draft Invoices

**Total Draft Invoices:** X fakturaer
**Total Potential Revenue:** X,XXX DKK

**Aging Analysis:**
- 0-7 dage: X fakturaer (X,XXX DKK)
- 8-30 dage: X fakturaer (X,XXX DKK)
- >30 dage: X fakturaer (X,XXX DKK)

**Oldest Draft:**
- Invoice #XXXX - X dage gammel - X,XXX DKK - [Customer]
```

---

### **Test 5: Forfaldne Betalinger** ⚠️

**Mål:** Find fakturaer der er overskredet betalingsfrist

**Steps:**
1. Hent alle fakturaer med `state: "approved"` (sendt men ikke betalt)
2. Beregn due date: `entryDate + paymentTermsDays`
3. Filtrer til `dueDate < today` (20. oktober 2025)
4. Beregn total gæld

**Expected Output:**

```markdown
## Test 5: Overdue Invoices

**Total Overdue:** X fakturaer
**Total Outstanding Amount:** X,XXX DKK

**Aging:**
- 1-30 dage over: X fakturaer (X,XXX DKK)
- 31-60 dage over: X fakturaer (X,XXX DKK)
- >60 dage over: X fakturaer (X,XXX DKK)

**Top 3 Overdue:**
1. #XXXX - X dage over - X,XXX DKK - [Customer]
2. #XXXX - X dage over - X,XXX DKK - [Customer]
3. #XXXX - X dage over - X,XXX DKK - [Customer]
```

---

## 🔧 VIGTIGE NOTATER

### API Limitations du skal kende

- ❌ `list_invoices` understøtter **IKKE** date filtering parameters
- ✅ Workaround: Fetch all → filter client-side på `entryDate`
- ✅ Brug `state` parameter til at pre-filtre (fx kun "approved")

### Organization ID (ALTID påkrævet)

```json
{
  "organizationId": "IQgm5fsl5rJ3Ub33EfAEow"
}
```

### Performance Tips

- Batch fetching med `pageSize: 100` hvis muligt
- Cache hits giver 5x speedup - gentagne queries er hurtige
- Brug `state` filtering til at reducere dataset før client-side filtering

---

## 📊 SUCCESS CRITERIA

✅ **Alle 5 tests gennemført**  
✅ **Response times <10 sekunder per test**  
✅ **Ingen 404 errors**  
✅ **Realistiske tal** (valideret mod known data)  
✅ **Struktureret rapport** (brug format templates ovenfor)

---

## 📝 FINAL REPORT FORMAT

Når alle 5 tests er færdige, rapporter i dette format:

```markdown
# 🎯 Billy MCP Phase 1 Analytics - Final Report

**Test Date:** 20. oktober 2025  
**Test Duration:** X minutter  
**Status:** ✅ ALL TESTS PASSED

---

## Test 1: Oktober 2025 Revenue
[Din output her]

---

## Test 2: Top 5 Customers
[Din output her]

---

## Test 3: Product Performance
[Din output her]

---

## Test 4: Draft Invoices
[Din output her]

---

## Test 5: Overdue Invoices
[Din output her]

---

## 📊 Performance Metrics
- **Total API Calls:** X
- **Average Response Time:** X ms
- **Cache Hit Rate:** X%
- **Errors:** 0

---

## ✅ Conclusion
[Din vurdering: Er Billy MCP klar til production usage?]
```

---

## 🚀 START NU

Kør alle 5 tests i rækkefølge. Brug MCP tools direkte - du har allerede verificeret de virker!

**Let's go! 🎯**
