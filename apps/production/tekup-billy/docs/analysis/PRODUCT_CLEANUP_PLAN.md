# 📦 Product Cleanup & Consolidation Plan

**Date:** 21. oktober 2025  
**Current Status:** 68 produkter (TOO MANY!)  
**Goal:** Konsolider til 10-15 core produkter  
**Priority:** HIGH (Business efficiency issue)

---

## 🚨 Problem Statement

**Current Situation:**
- **68 total products** in Billy system
- Many single-use, customer-specific products
- Overlapping product names and descriptions
- Difficult to maintain pricing consistency
- Hard to analyze product performance

**Impact:**
- ⚠️ Product sprawl makes reporting difficult
- ⚠️ Inconsistent pricing across similar services
- ⚠️ New employees confused by too many options
- ⚠️ Hard to optimize inventory/resource allocation

**Root Cause:**
- Creating new product per customer instead of using generic products
- No standardization policy
- Legacy products never archived
- No regular cleanup process

---

## 🎯 Recommended Product Structure

### Core Products (10-15 total)

**1. Fast Rengøring (Recurring Cleaning)**
- **SKU:** REN-001
- **Price:** 349 DKK/time
- **Description:** Standard recurring cleaning service (weekly/biweekly/monthly)
- **Usage:** HIGH (primary revenue driver)

**2. Hovedrengøring (Deep Cleaning)**
- **SKU:** REN-002
- **Price:** 399 DKK/time
- **Description:** Intensive deep cleaning service
- **Usage:** MEDIUM

**3. Flytterengøring (Move-out Cleaning)**
- **SKU:** REN-003
- **Price:** 349 DKK/time
- **Description:** End-of-lease cleaning
- **Usage:** HIGH (based on Oktober data: 4,688 DKK)

**4. Kontorrengøring (Office Cleaning)**
- **SKU:** REN-004
- **Price:** 325 DKK/time
- **Description:** Commercial office cleaning
- **Usage:** MEDIUM

**5. Vinduespudsning (Window Cleaning)**
- **SKU:** REN-005
- **Price:** 450 DKK/time
- **Description:** Professional window cleaning
- **Usage:** LOW-MEDIUM

**6. Airbnb Express Cleaning**
- **SKU:** REN-006
- **Price:** 349 DKK/time
- **Description:** Fast turnaround for Airbnb properties
- **Usage:** MEDIUM

**7. Byggefinalrengøring (Post-construction)**
- **SKU:** REN-007
- **Price:** 399 DKK/time
- **Description:** Heavy-duty post-construction cleanup
- **Usage:** LOW

**8. Rabat/Discount**
- **SKU:** DISCOUNT-001
- **Price:** -Variable
- **Description:** Discount line item
- **Usage:** As needed

**9. Ekstra Tjenesteydelse (Extra Service)**
- **SKU:** EXTRA-001
- **Price:** Variable
- **Description:** Ad-hoc additional services
- **Usage:** As needed

**10. Engangsmaterialer (Disposables)**
- **SKU:** MAT-001
- **Price:** Variable
- **Description:** Cleaning supplies and materials
- **Usage:** Optional add-on

---

## 🔧 Cleanup Process

### Phase 1: Audit (Week 1)

**Step 1: Export All Products**

```
Use Claude or ChatGPT with Billy MCP:
"List all 68 products with ID, name, price, and last used date"
```

**Step 2: Categorize Products**
- ✅ **Keep:** Core services still in use
- 📦 **Archive:** Legacy/unused but keep for historical invoices
- 🗑️ **Delete:** Duplicates or test products (if no invoice history)

**Step 3: Usage Analysis**

```
For each product:
- Count invoices using this product (last 12 months)
- Calculate total revenue generated
- Identify if it's duplicate of another product
```

### Phase 2: Consolidation (Week 2)

**Step 1: Create New Standard Products**
- Create 10-15 core products with proper SKUs
- Set standard pricing
- Write clear descriptions
- Add to Billy system

**Step 2: Map Old → New**
Create mapping table:

```
Old Product ID → New Product ID
"Fast rengøring - Kunde A" → REN-001 (Fast Rengøring)
"Fast rengøring - Kunde B" → REN-001 (Fast Rengøring)
"Ugentlig rengøring" → REN-001 (Fast Rengøring)
```

**Step 3: Update Documentation**
- Create product catalog for employees
- Update pricing sheet
- Train team on new product codes

### Phase 3: Archive (Week 3)

**Step 1: Archive Old Products**
- Mark old products as "Inactive" in Billy
- Keep for historical invoice reference
- Do NOT delete (breaks old invoices)

**Step 2: Update Templates**
- Update invoice templates to use new products
- Create quick-add shortcuts for common services
- Remove old products from selection lists

**Step 3: Monitor**
- Track usage of new products for 1 month
- Ensure no old products being used
- Adjust pricing if needed

---

## 📊 Expected Benefits

### Efficiency Gains

**Reporting:**
- ✅ Clear product performance metrics
- ✅ Easy to identify best-sellers
- ✅ Simple revenue analysis by service type

**Pricing:**
- ✅ Consistent pricing across customers
- ✅ Easy to update prices (10-15 vs 68)
- ✅ Clear discount strategy

**Operations:**
- ✅ Faster invoice creation (fewer choices)
- ✅ Less confusion for new employees
- ✅ Better resource planning

**Analytics:**
- ✅ Claude/ChatGPT can analyze product performance accurately
- ✅ Easy to identify underperforming services
- ✅ Clear trends over time

### Time Savings

**Before (68 products):**
- Creating invoice: 5-10 min (finding right product)
- Monthly reporting: 2-3 hours (messy data)
- Price updates: 1-2 hours (checking 68 products)

**After (10-15 products):**
- Creating invoice: 2-3 min (quick selection)
- Monthly reporting: 30 min (clean data)
- Price updates: 15-20 min (checking 10-15 products)

**Total Monthly Savings:** ~6-8 hours

---

## 🚀 Implementation Steps

### Week 1: Audit & Analysis

**Day 1-2: Data Collection**

```
Prompt for Claude/ChatGPT:
"Analyze all 68 products. For each product, tell me:
1. Product name and ID
2. Number of invoices using it (all time)
3. Total revenue generated
4. Last used date
5. Recommendation: Keep, Archive, or Delete"
```

**Day 3-4: Categorization**
- Review Claude's analysis
- Decide on 10-15 core products
- Create mapping table (old → new)

**Day 5: Planning**
- Write product descriptions
- Set standard prices
- Create implementation timeline

### Week 2: Implementation

**Day 1: Create New Products**
- Add 10-15 new products to Billy
- Use proper SKU codes (REN-001, REN-002, etc.)
- Set descriptions and prices

**Day 2: Test New Products**
- Create test invoices with new products
- Verify pricing calculations
- Ensure descriptions are clear

**Day 3-4: Archive Old Products**
- Mark old products as inactive
- Update invoice templates
- Remove from quick-select lists

**Day 5: Training**
- Brief team on new product structure
- Share product catalog
- Update internal documentation

### Week 3: Monitoring

**Daily:**
- Check for any old products being used
- Monitor new product usage
- Collect feedback from team

**End of Week:**
- Review product usage statistics
- Adjust pricing if needed
- Document lessons learned

---

## 📋 Product Catalog Template

### Standard Product List (For Employee Reference)

| SKU | Product Name | Price | When to Use |
|-----|-------------|-------|-------------|
| REN-001 | Fast Rengøring | 349 DKK/time | Weekly/biweekly recurring cleaning |
| REN-002 | Hovedrengøring | 399 DKK/time | Deep cleaning, spring cleaning |
| REN-003 | Flytterengøring | 349 DKK/time | Move-out, end-of-lease |
| REN-004 | Kontorrengøring | 325 DKK/time | Commercial office spaces |
| REN-005 | Vinduespudsning | 450 DKK/time | Window cleaning service |
| REN-006 | Airbnb Express | 349 DKK/time | Fast Airbnb turnovers |
| REN-007 | Byggefinalrengøring | 399 DKK/time | Post-construction cleanup |
| DISCOUNT-001 | Rabat | -Variable | Discounts and credits |
| EXTRA-001 | Ekstra Tjenesteydelse | Variable | Ad-hoc services |
| MAT-001 | Engangsmaterialer | Variable | Cleaning supplies |

**Notes:**
- All prices are per hour unless noted
- Use product description field for customer-specific details
- Don't create new products without manager approval
- Use DISCOUNT-001 for all discounts (specify reason in description)

---

## 🎯 Success Metrics

### Week 1 Goals

- ✅ All 68 products analyzed
- ✅ Mapping table created (old → new)
- ✅ 10-15 new products defined

### Week 2 Goals

- ✅ New products created in Billy
- ✅ Old products archived
- ✅ Team trained on new structure

### Week 3 Goals

- ✅ 100% of new invoices use new products
- ✅ 0 usage of old products
- ✅ Invoice creation time reduced by 50%

### Month 1 Review

- ✅ Product performance clearly visible
- ✅ Team satisfaction improved
- ✅ Reporting time reduced by 60%
- ✅ No need to create new products

---

## ⚠️ Common Pitfalls to Avoid

### DON'T

- ❌ Delete old products (breaks historical invoices)
- ❌ Create customer-specific products
- ❌ Use inconsistent naming
- ❌ Skip the archive step
- ❌ Forget to train team

### DO

- ✅ Archive instead of delete
- ✅ Use generic products + detailed descriptions
- ✅ Follow SKU naming convention
- ✅ Keep products for historical reference
- ✅ Document everything

---

## 🔗 Related Documents

- `CLAUDE_PHASE1_FINAL_REPORT.md` - Original analysis identifying product sprawl
- Billy Product Management Guide (to be created)
- Invoice Template Updates (to be created)
- Employee Training Materials (to be created)

---

## 📞 Next Actions

**Immediate (This Week):**
1. Review this plan with team
2. Schedule product audit session with Claude/ChatGPT
3. Get buy-in from all stakeholders

**Short Term (Next 2 Weeks):**
1. Execute Week 1-2 implementation steps
2. Create new products in Billy
3. Archive old products

**Long Term (Next Month):**
1. Monitor new product usage
2. Collect feedback and adjust
3. Create automated reporting on product performance

---

**Plan Created:** 21. oktober 2025  
**Priority:** HIGH  
**Estimated Time:** 3 weeks part-time effort  
**Expected ROI:** 6-8 hours saved per month + better insights
