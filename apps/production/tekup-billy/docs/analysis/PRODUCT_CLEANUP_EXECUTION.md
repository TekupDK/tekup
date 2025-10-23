# 🎯 Product Cleanup - Final Execution Plan

**Date:** 21. oktober 2025, kl. 10:30  
**Based on:** Claude's detailed 68-product analysis + ChatGPT's API/CSV methodology  
**Status:** Ready to execute

---

## 📊 Analysis Summary

### Current State (Confirmed by Claude)

**68 products total - categorized:**
- ✅ **8 core products** to keep (REN-001 to REN-005 + 3 specials)
- 🔄 **5 Airbnb products** to consolidate → 1 product (REN-006)
- 📦 **30 moving cleaning variants** to archive (customer-specific, dated)
- 📦 **15 recurring cleaning variants** to archive (address-specific)
- 📦 **10 misc/one-off products** to archive (special tasks, website dev??)

**Key Problems Identified:**
- 81% of products (55) are single-use or historical
- Only 15 out of 68 have proper SKU codes (productNo)
- Product names contain dates, addresses, customer names
- Impossible to do meaningful revenue analytics
- 5-10 minutes per invoice (searching for right product)

---

## 🎯 Recommended Final Product Catalog

### Core 7 Products (349 DKK/hour standard)

**REN-001 - Fast Rengøring**  
*Recurring private cleaning (weekly/biweekly)*

**REN-002 - Hovedrengøring**  
*Deep cleaning (first time/periodic)*

**REN-003 - Flytterengøring**  
*Complete move-out cleaning*

**REN-004 - Erhvervsrengøring**  
*Commercial/office cleaning*

**REN-005 - Specialrengøring**  
*Descaling, single rooms, special tasks*

**REN-006 - Airbnb Rengøring (Kindred)**  
*Check-in/check-out for partners*  
*Consolidates 5 existing Airbnb products*

**REN-007 - Vinduespudsning**  
*Window cleaning (standalone or add-on)*

### Optional: Fixed-Price Products

**REN-101 - Villa Rengøring - Fast Pris**  
*For customers with agreed monthly rate*

**REN-102 - Flytterengøring - Fast Pris**  
*For pre-agreed fixed-price moving jobs*

### Special: Adjustments

**REN-099 - Rabat/Justering**  
*For discount lines on invoices*

**Total: 10 products** (down from 68 = 85% reduction!)

---

## 🚀 Execution Plan - Hybrid Approach (Recommended)

### Phase 1: Quick Wins (TODAY - Oct 21)

**Step 1: Archive Obviously Historical Products (30 min)**

**Products to archive immediately (30 products):**

**Flytterengøring variants (all with specific dates/addresses/names):**
- Flytterengøring - Henrik Brøsted (31. juli 2025)
- Flytterengøring - Holme Parkvej 57
- Flytterengøring - Krekærlundsvej 70
- Flytterengøring - Patrick Ville
- Flytterengøring + vinduespudsning - Broloftet 14
- Flytterengøring – Montanagade 55
- [... all other customer-specific moving products]

**How to archive in Billy.dk:**
1. Log in to <https://app.billy.dk>
2. Gå til Indstillinger → Produkter
3. For hver produkt: Klik "Rediger" → Marker "Inaktiv" → Gem
4. **DO NOT DELETE** (breaks historical invoices!)

**Expected result:** 68 → 38 products (30 archived)

---

### Phase 2: Data Analysis (TOMORROW - Oct 22)

**Step 2: Run Full Invoice Usage Analysis**

**Use ChatGPT's API methodology:**

```
Prompt til ChatGPT/Claude med Billy MCP:

"Analyze all Billy products with invoice usage data.

For each of the remaining 38 products, return:
1. Product name
2. Product ID
3. Usage count (number of invoices using this product)
4. Total revenue (sum of line amounts)
5. Last used date
6. Recommendation (Keep/Archive/Delete)

Use these rules:
- KEEP if used within last 180 days OR revenue >= 10,000 DKK lifetime
- ARCHIVE if used but not within last 365 days and revenue < 10,000 DKK
- DELETE if usage count = 0 (never used)

Return as CSV and Markdown table, sorted by recommendation then revenue."
```

**Expected output:**
- CSV file with all 38 products analyzed
- Clear recommendations per product
- Usage statistics to validate decisions

**Time:** 1-2 hours (including analysis and review)

---

### Phase 3: Final Cleanup (Oct 23-25)

**Step 3: Execute Final Archiving (Based on Data)**

**Wednesday Oct 23:**
- Review ChatGPT/Claude analysis results
- Identify final products to archive (expect 20-25 more)
- Validate that 7-10 core products remain
- Get team buy-in if needed

**Thursday Oct 24:**
- Archive remaining historical/duplicate products
- Keep only REN-001 to REN-007 + specials
- Verify: 68 → 10-12 active products

**Friday Oct 25:**
- Test creating invoices with new product catalog
- Verify invoice templates updated
- Document any missing products

**Time:** 2-3 hours total

---

### Phase 4: Create New Products (Oct 25)

**Step 4: Add Missing Standard Products**

**Products to create in Billy.dk:**

**REN-006 - Airbnb Rengøring (Kindred)**
- SKU: REN-006
- Name: Airbnb Rengøring (Kindred)
- Price: 349 DKK/hour (or fixed per job)
- Description: Check-in/check-out cleaning for Kindred partnership
- Replaces: 5 existing Airbnb products

**REN-007 - Vinduespudsning**
- SKU: REN-007
- Name: Vinduespudsning
- Price: 450 DKK/hour
- Description: Professional window cleaning (standalone or add-on)
- Replaces: Various window cleaning products

**How to create:**
1. Billy.dk → Indstillinger → Produkter → Nyt Produkt
2. Fill in SKU, name, price, description
3. Mark as active
4. Save

**Time:** 20 minutes

---

### Phase 5: Documentation & Training (Week of Oct 28)

**Step 5: Update Internal Documentation**

**Create Quick Reference Sheet:**

| SKU | Product | Price | When to Use |
|-----|---------|-------|-------------|
| REN-001 | Fast Rengøring | 349/hr | Weekly/biweekly recurring |
| REN-002 | Hovedrengøring | 399/hr | Deep cleaning |
| REN-003 | Flytterengøring | 349/hr | Move-out cleaning |
| REN-004 | Erhvervsrengøring | 325/hr | Office/commercial |
| REN-005 | Specialrengøring | 349/hr | Descaling, special tasks |
| REN-006 | Airbnb (Kindred) | 349/hr | Airbnb turnovers |
| REN-007 | Vinduespudsning | 450/hr | Window cleaning |
| REN-099 | Rabat | Variable | Discounts only |

**Training Email Template:**

```
Hej team,

Vi har ryddet op i produktkataloget - fra 68 til 10 produkter! 🎉

Fra i dag bruger vi kun disse 7-10 standardprodukter når I opretter fakturaer.

[Attach quick reference sheet]

Vigtigste ændringer:
- Brug REN-001 til REN-007 for alle standard opgaver
- Tilføj IKKE nye produkter uden godkendelse
- Brug produktbeskrivelsen til kunde-specifikke detaljer
- Gamle produkter er arkiveret men findes stadig på historiske fakturaer

Spørgsmål? Kontakt [manager navn]

Tak for jeres hjælp med at holde systemet simpelt!
```

**Time:** 1 hour

---

## 📊 Expected Results

### Efficiency Gains

**Before (68 products):**
- ⏱️ 5-10 min per invoice (finding right product)
- 📊 Impossible to analyze product performance
- 💰 Inconsistent pricing across similar services
- 😵 Confusing for new employees

**After (10 products):**
- ⏱️ 1-2 min per invoice (simple dropdown)
- 📊 Clear product performance metrics
- 💰 Consistent 349 DKK/hour standard
- 😊 Easy for anyone to create invoices

### ROI Calculation

**Time Savings:**
- 3-8 min saved per invoice
- 50 invoices/month average
- **2.5-6.5 hours saved per month**

**Value:**
- 6 hours × 349 DKK = **~2,100 DKK/month**
- **25,000 DKK/year** in efficiency gains

**Investment:**
- 6-7 hours one-time cleanup effort
- **Payback period: <1 month!** 🚀

---

## ⚠️ Risk Mitigation

### DO NOT

- ❌ Delete old products (breaks historical invoices)
- ❌ Create customer-specific products
- ❌ Use inconsistent naming
- ❌ Skip team communication

### DO

- ✅ Archive instead of delete
- ✅ Use generic products + detailed descriptions
- ✅ Follow SKU naming convention (REN-00X)
- ✅ Document everything
- ✅ Train team on new structure

---

## 🎯 This Week's Action Items

### Monday Oct 21 (TODAY) - 30 minutes

- [x] Review this plan
- [ ] Archive 30 obviously historical products
- [ ] Result: 68 → 38 products

### Tuesday Oct 22 - 2 hours

- [ ] Run full invoice usage analysis (ChatGPT/Claude)
- [ ] Get CSV with usage stats for remaining 38 products
- [ ] Review recommendations

### Wednesday Oct 23 - 1 hour

- [ ] Final decision on which products to archive
- [ ] Get team buy-in if needed
- [ ] Prepare archive list

### Thursday Oct 24 - 2 hours

- [ ] Archive remaining historical products
- [ ] Create REN-006 and REN-007
- [ ] Verify: 68 → 10-12 active products

### Friday Oct 25 - 1 hour

- [ ] Test invoice creation with new catalog
- [ ] Document any issues
- [ ] Create quick reference sheet

### Week of Oct 28 - 1 hour

- [ ] Send training email to team
- [ ] Print and post quick reference
- [ ] Monitor usage first week

**Total Time Investment:** 6-7 hours over 5 days

---

## 📞 Next Actions - Choose Your Path

**Option A: Start Archiving Now (Aggressive)** 🚀

```
Action: Archive 30 obvious duplicates TODAY
Time: 30 minutes
Risk: Low (clearly historical products)
Benefit: Immediate simplification (68 → 38)
```

**Option B: Data Analysis First (Safe)** 🔍

```
Action: Run ChatGPT/Claude invoice usage analysis
Time: 2 hours tomorrow
Risk: Very low (data-driven decisions)
Benefit: Validate assumptions before cleanup
```

**Option C: Both! (Recommended)** 🎯

```
Action 1: Archive 30 obvious today (30 min)
Action 2: Run analysis tomorrow (2 hours)
Action 3: Final cleanup Thu-Fri (2 hours)
Total: 4.5 hours over week
Best of both worlds!
```

---

## 🚀 Ready to Start?

**Immediate next step:**

1. Open Billy.dk
2. Go to Indstillinger → Produkter
3. Start archiving the 30 customer-specific moving products
4. Tomorrow: Run ChatGPT/Claude analysis for remaining products

**Need help with:**
- [ ] Running the Billy API analysis (ChatGPT/Claude)
- [ ] Creating the quick reference sheet
- [ ] Writing the team training email
- [ ] Testing new product catalog

Lad mig vide hvad du vil starte med! 😊

---

**Plan Created:** 21. oktober 2025, kl. 10:30  
**Priority:** HIGH  
**Expected Completion:** 25. oktober 2025  
**ROI:** 25,000 DKK/year in efficiency gains  
**Payback Period:** <1 month 🎯
