# 🎯 Prompt til Claude - Phase 1 Analytics Tests

**Copy/paste dette til Claude:**

---

Perfekt at basic operations virker! Nu skal vi teste analytics funktionerne. Jeg har lavet en struktureret test plan til dig.

## 📊 PHASE 1: ANALYTICS & REPORTING TESTS

Du skal køre 5 tests - alle er READ-ONLY, så helt safe (ingen data ændres).

**Full test guide:** Se `docs/testing/PHASE1_ANALYTICS_TESTS.md` for detaljer.

---

### Test 1: Monthly Revenue Analysis

**Opgave:**
Show me total revenue for October 2025. List all approved invoices from October 1-31, 2025, and calculate:
1. Total revenue (sum of all approved invoice amounts)
2. Number of invoices
3. Average invoice amount
4. Breakdown by invoice state (approved vs draft vs paid)

---

### Test 2: Top Customers Analysis

**Opgave:**
Analyze my customer base and show:
1. Top 5 customers by total invoice count
2. Top 5 customers by total revenue (sum of invoice amounts)
3. For each top customer, show: Customer name, Total invoices, Total revenue, Latest invoice date

---

### Test 3: Product Performance Analysis

**Opgave:**
Analyze product performance and show:
1. Top 3 best-selling products by total revenue
2. For each product: Product name, Unit price, Number of times invoiced, Total revenue generated
3. Also show: Products that have NEVER been invoiced

---

### Test 4: Draft Invoices Workflow Check

**Opgave:**
Show me all draft invoices that need attention:
1. List all invoices with state="draft"
2. For each: Invoice number, Customer name, Amount, Created date, Age in days
3. Sort by oldest first
4. Highlight any draft older than 30 days

---

### Test 5: Payment Status & Overdue Analysis

**Opgave:**
Analyze invoice payment status:
1. Show all invoices where: State = "approved", Due date < today (October 20, 2025), Payment status = unpaid
2. For each overdue invoice: Invoice number, Customer name, Amount, Due date, Days overdue
3. Calculate total overdue amount
4. Show top 3 customers with highest overdue amounts

---

## 📋 WHEN YOU'RE DONE

Fill in this template:

```markdown
# Phase 1 Analytics Test Results

**Test Date:** October 20, 2025

## Summary
- Tests Executed: 5/5
- Tests Passed: _/5
- Average Response Time: _ seconds

## Quick Results
- Test 1 (Revenue): _ DKK total
- Test 2 (Top Customer): _
- Test 3 (Best Product): _
- Test 4 (Drafts): _ drafts found
- Test 5 (Overdue): _ DKK overdue

## Issues
_Any errors or problems?_
```

---

**🚀 Kør alle 5 tests og rapportér resultaterne!**
