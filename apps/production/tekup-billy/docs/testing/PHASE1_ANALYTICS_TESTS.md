# 📊 Billy MCP - Phase 1 Analytics Tests

**Test Phase:** Analytics & Reporting (Read-Only)  
**Risk Level:** 🟢 SAFE (No data modifications)  
**Dato:** 20. Oktober 2025

---

## ✅ PREREQUISITES VERIFIED

- ✅ Billy MCP Connection: Working
- ✅ Organization ID: IQgm5fsl5rJ3Ub33EfAEow
- ✅ Data Available: 97 invoices, 61 customers, 67 products
- ✅ MCP Server: v1.4.1 (Production)

---

## 🧪 TEST SEKVENS - PHASE 1

### Test 1: Monthly Revenue Analysis

**Prompt:**

```
Show me total revenue for October 2025. List all approved invoices from October 1-31, 2025, and calculate:
1. Total revenue (sum of all approved invoice amounts)
2. Number of invoices
3. Average invoice amount
4. Breakdown by invoice state (approved vs draft vs paid)
```

**Expected Output:**
- Total revenue in DKK
- Count of invoices per state
- Average invoice value
- Date range confirmation

**Success Criteria:**
- ✅ Response includes numeric totals
- ✅ All invoices within October 2025 date range
- ✅ Breakdown by invoice state accurate

---

### Test 2: Top Customers Analysis

**Prompt:**

```
Analyze my customer base and show:
1. Top 5 customers by total invoice count
2. Top 5 customers by total revenue (sum of invoice amounts)
3. For each top customer, show:
   - Customer name
   - Total invoices
   - Total revenue
   - Latest invoice date
```

**Expected Output:**
- Two ranked lists (by count and by revenue)
- Customer names from existing 61 customers
- Revenue calculated from approved invoices
- Most recent activity dates

**Success Criteria:**
- ✅ Two separate top-5 lists
- ✅ Customers ranked correctly
- ✅ Revenue totals accurate
- ✅ Includes customer names (e.g., "Kindred Concepts", "Anthropic")

---

### Test 3: Product Performance Analysis

**Prompt:**

```
Analyze product performance and show:
1. Top 3 best-selling products by total revenue
2. For each product, include:
   - Product name
   - Unit price
   - Number of times invoiced
   - Total revenue generated
3. Also show: Products that have NEVER been invoiced
```

**Expected Output:**
- Top 3 products from existing 67 products
- Revenue calculations based on invoice line items
- List of unused products (if any)
- Product names (e.g., "Fast rengøring", "Flytterengøring")

**Success Criteria:**
- ✅ Top 3 products ranked by revenue
- ✅ Includes usage count per product
- ✅ Identifies unused products
- ✅ Shows standard pricing (e.g., 349 kr/time)

---

### Test 4: Draft Invoices Workflow Check

**Prompt:**

```
Show me all draft invoices that need attention:
1. List all invoices with state="draft"
2. For each draft invoice, show:
   - Invoice number
   - Customer name
   - Amount
   - Created date
   - Age (days since created)
3. Sort by oldest first
4. Highlight any draft older than 30 days
```

**Expected Output:**
- Currently 1 draft invoice (from verification)
- Invoice details including customer
- Age calculation in days
- Sorted by creation date

**Success Criteria:**
- ✅ Lists all draft invoices
- ✅ Includes customer names
- ✅ Shows invoice age
- ✅ Flags old drafts (>30 days)

---

### Test 5: Payment Status & Overdue Analysis

**Prompt:**

```
Analyze invoice payment status:
1. Show all invoices where:
   - State = "approved" (sent to customer)
   - Due date < today (October 20, 2025)
   - Payment status = unpaid
2. For each overdue invoice:
   - Invoice number
   - Customer name
   - Amount
   - Due date
   - Days overdue
3. Calculate total overdue amount
4. Show top 3 customers with highest overdue amounts
```

**Expected Output:**
- List of overdue invoices
- Days overdue calculation
- Total overdue amount in DKK
- Customers ranked by overdue amount

**Success Criteria:**
- ✅ Correct due date filtering (< Oct 20, 2025)
- ✅ Days overdue calculated accurately
- ✅ Total overdue amount summed
- ✅ Customer ranking by debt amount

---

## 📋 TEST EXECUTION CHECKLIST

**Before Starting:**
- [ ] Verify MCP connection active
- [ ] Confirm organizationId in use
- [ ] Note start time

**During Tests:**
- [ ] Run Test 1: Monthly Revenue
- [ ] Run Test 2: Top Customers  
- [ ] Run Test 3: Product Performance
- [ ] Run Test 4: Draft Invoices
- [ ] Run Test 5: Overdue Analysis

**After Completion:**
- [ ] Review all responses for accuracy
- [ ] Check response times (<5 seconds per query)
- [ ] Verify cache hit rate improvement
- [ ] Document any errors or issues

---

## 📊 EXPECTED RESPONSE FORMAT

### Sample Response Structure

```markdown
## Test 1: Monthly Revenue Analysis

**Period:** October 1-31, 2025

**Total Revenue:** 125,450 DKK

**Invoice Breakdown:**
- Approved: 80 invoices (100,000 DKK)
- Paid: 65 invoices (85,000 DKK)
- Draft: 1 invoice (5,450 DKK)
- Voided: 16 invoices (0 DKK - excluded)

**Average Invoice Amount:** 1,250 DKK

**Analysis:**
- Revenue on track for monthly target
- Low draft count indicates efficient workflow
- High approval rate (80/97 = 82.5%)
```

---

## 🎯 SUCCESS METRICS

**Phase 1 Complete When:**
- ✅ All 5 tests executed successfully
- ✅ Response times < 5 seconds average
- ✅ No 404 or 500 errors
- ✅ Data accuracy verified against Billy.dk dashboard
- ✅ Cache hit rate > 60% (check `/health/metrics`)

**Performance Targets:**
- Response time: <5s per query
- Cache hit rate: >60% after 2nd run
- Error rate: 0%
- Data accuracy: 100%

---

## 🔍 VALIDATION STEPS

**After All Tests:**

1. **Compare with Billy.dk Dashboard**
   - Log in to Billy.dk
   - Verify revenue totals match
   - Check customer names accurate
   - Confirm invoice counts

2. **Check MCP Performance**

   ```powershell
   Invoke-RestMethod https://tekup-billy.onrender.com/health/metrics
   ```

   **Look for:**
   - Cache hit rate: Should increase to 60-80%
   - Average response time: Should be <100ms for cached requests
   - Error rate: Should remain at 0%

3. **Review Logs**
   - Check Render logs for any warnings
   - Verify Supabase cache hits
   - Confirm no Billy API rate limit warnings

---

## ⚠️ KNOWN EDGE CASES

### Invoice State Transitions

- Some invoices may be "approved" but also "paid"
- Include both states in revenue calculations
- Exclude "voided" from all revenue totals

### Multi-Currency Handling

- Most invoices in DKK (Danish Kroner)
- Some may include EUR pricing
- Convert all to DKK for totals (or show separately)

### Product Line Items

- One invoice can have multiple products
- Same product can appear multiple times
- Count usage by unique invoice occurrences

### Customer Matching

- Some customers may have similar names
- Use customer ID for accurate matching
- Handle cases where customer was deleted

---

## 🎯 NEXT STEPS AFTER PHASE 1

**If All Tests Pass:**
→ Proceed to Phase 2: Create Operations (test environment)

**If Any Failures:**
1. Document exact error message
2. Check Billy API status
3. Verify organizationId in failing requests
4. Review MCP server logs
5. Report to development team

**Performance Optimization:**
- If cache hit rate < 60% → Investigate cache invalidation
- If response time > 5s → Check network latency
- If errors > 0% → Review Billy API limits

---

## 📚 REFERENCE LINKS

- **MCP Server Health:** <https://tekup-billy.onrender.com/health>
- **Metrics Dashboard:** <https://tekup-billy.onrender.com/health/metrics>
- **Billy API Docs:** `docs/BILLY_API_REFERENCE.md`
- **Troubleshooting:** `docs/troubleshooting/CLAUDE_DEBUG_RESPONSE.md`

---

## 💬 REPORT TEMPLATE

**Copy this and fill in after tests:**

```markdown
# Phase 1 Analytics Test Results

**Test Date:** October 20, 2025
**Tester:** Claude AI
**MCP Version:** 1.4.1

## Summary
- Tests Executed: 5/5
- Tests Passed: _/5
- Tests Failed: _/5
- Average Response Time: _ seconds
- Cache Hit Rate: _%

## Test Results

### Test 1: Monthly Revenue ✅/❌
- Total Revenue: _ DKK
- Invoice Count: _
- Response Time: _s
- Notes: _

### Test 2: Top Customers ✅/❌
- Top Customer: _ (_ invoices, _ DKK)
- Response Time: _s
- Notes: _

### Test 3: Product Performance ✅/❌
- Best Product: _ (_ revenue)
- Response Time: _s
- Notes: _

### Test 4: Draft Invoices ✅/❌
- Draft Count: _
- Oldest Draft: _ days
- Response Time: _s
- Notes: _

### Test 5: Overdue Analysis ✅/❌
- Overdue Count: _
- Total Overdue: _ DKK
- Response Time: _s
- Notes: _

## Issues Encountered
_List any errors, performance issues, or data discrepancies_

## Recommendations
_Suggestions for improvements or next steps_

## Phase 2 Ready?
✅ Yes - Proceed to Create Operations
❌ No - Address issues first
```

---

**🚀 KLAR TIL TEST! Send hele denne fil til Claude og bed ham køre alle 5 tests!**
