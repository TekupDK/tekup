# 🎯 Billy MCP - Prioritized Action Plan

**Date:** 21. oktober 2025, kl. 10:20  
**Based on:** Claude Phase 1 Analytics Final Report  
**Status:** Ready for execution

---

## 🚨 CRITICAL (Today - October 21)

### 1. Approve Draft Invoice #1 (EXPIRES TODAY!)

**Priority:** 🔴 URGENT  
**Value:** 5,235 DKK  
**Deadline:** 23:59 today (October 21, 2025)

**Action Steps:**
1. Log ind på <https://app.billy.dk>
2. Gå til "Fakturaer" → "Kladder"
3. Find draft invoice (created Oct 20, due Oct 21)
4. Review content (5,235 DKK)
5. Click "Godkend" og "Send"
6. Verify email sent to customer

**Impact if missed:** Lose 5,235 DKK invoice, must recreate with new date

---

## ⚠️ HIGH PRIORITY (This Week - Oct 21-25)

### 2. Review & Approve Draft Invoice #2

**Priority:** 🟡 HIGH  
**Value:** 698 DKK  
**Deadline:** November 19, 2025 (but review now)

**Action Steps:**
1. Log ind på Billy.dk
2. Check draft invoice #2 (698 DKK)
3. Verify customer details and line items
4. Decide: Send now or schedule for later?
5. If ready: Godkend and send

**Estimated time:** 10 minutes

### 3. Setup Payment Reminder for October 31 Invoices

**Priority:** 🟡 HIGH  
**Value:** 3,315 DKK at risk  
**Deadline:** October 28, 2025 (before they're due)

**Invoices:**
- Invoice #1089: 1,570 DKK (due Oct 31)
- Invoice #1088: 1,745 DKK (due Oct 31)

**Action Steps:**
1. Calendar reminder: October 28, 2025
2. Prepare payment reminder email template
3. On Oct 28: Send friendly reminder to both customers
4. On Oct 31: Check if payments received
5. On Nov 1: If not paid, send 2nd reminder

**Template Email:**

```
Hej [Customer Name],

Blot en venlig påmindelse om at faktura #[XXXX] på [AMOUNT] DKK 
forfalder den 31. oktober 2025.

Hvis du allerede har betalt, bedes du se bort fra denne mail.

Med venlig hilsen,
[Your Business]
```

**Estimated time:** 30 minutes setup + 15 min execution

### 4. Start Product Cleanup Audit

**Priority:** 🟡 HIGH  
**Current:** 68 products (too many!)  
**Goal:** Consolidate to 10-15 core products  
**Timeline:** 3 weeks part-time

**Week 1 Actions (This Week):**
1. Review `PRODUCT_CLEANUP_PLAN.md`
2. Schedule Claude/ChatGPT session to analyze all 68 products
3. Create mapping table (old products → new standard products)
4. Get team buy-in on new product structure

**Estimated time:** 2-3 hours this week

**See:** `PRODUCT_CLEANUP_PLAN.md` for detailed steps

---

## 🟢 MEDIUM PRIORITY (Next 2 Weeks - Oct 21 - Nov 4)

### 5. Implement Automated Draft Invoice Monitoring

**Priority:** 🟢 MEDIUM  
**Goal:** Never miss draft approval deadlines again

**Options:**

**Option A: Billy.dk Native Features**
- Check if Billy has draft reminders
- Setup notifications if available

**Option B: Manual Calendar Reminders**
- Weekly check: Every Friday at 15:00
- Review all draft invoices
- Approve or schedule for later

**Option C: Billy MCP Automation (Future)**
- Create scheduled task to check drafts
- Send Slack/email notification if draft > 2 days old
- Requires: Billy MCP webhook setup

**Recommended:** Start with Option B (manual), plan Option C

**Estimated time:** 30 min setup + 15 min/week ongoing

### 6. Create Product Catalog for Team

**Priority:** 🟢 MEDIUM  
**Dependencies:** Complete product cleanup first  
**Goal:** Clear reference for which products to use when

**Action Steps:**
1. Wait for product cleanup completion (Week 3)
2. Create simple 1-page product catalog
3. Share with team (PDF + print copy)
4. Brief team on new product structure (15 min meeting)

**Template:** See `PRODUCT_CLEANUP_PLAN.md` → "Product Catalog Template"

**Estimated time:** 1 hour

### 7. Setup Monthly Analytics Report

**Priority:** 🟢 MEDIUM  
**Goal:** Track business performance monthly

**Action Steps:**
1. Create monthly analytics prompt for Claude/ChatGPT
2. Schedule: First Monday of each month
3. Run same 5 tests as Phase 1 Analytics
4. Compare month-over-month trends
5. Save report in `reports/YYYY-MM-analytics.md`

**Prompt Template:**

```
Run Billy MCP Phase 1 Analytics for [Month YYYY]:

1. Total revenue for [month]
2. Top 5 customers
3. Product performance
4. Draft invoices status
5. Overdue invoices

Compare with previous month and highlight trends.
```

**Estimated time:** 30 min/month

---

## 🔵 LOW PRIORITY (Nice to Have - Next Month)

### 8. Build Customer Aggregation Endpoint

**Priority:** 🔵 LOW  
**Goal:** Optimize customer analytics (avoid N+1 queries)

**Problem:** Currently requires fetching ALL invoices to calculate customer stats

**Solution:** Add new Billy MCP tool:

```typescript
billy:get_customer_stats(contactId) → {
  totalInvoices: number,
  totalRevenue: number,
  avgInvoiceAmount: number,
  lastInvoiceDate: string,
  paymentHistory: {
    onTime: number,
    late: number,
    averageDaysToPayment: number
  }
}
```

**Benefit:** 1 API call instead of 98+ calls for customer analysis

**Estimated time:** 4-6 hours development + testing

### 9. Setup Proactive Invoice Follow-up Workflow

**Priority:** 🔵 LOW  
**Goal:** Automate payment reminders

**Workflow:**
1. 7 days before due date: Friendly heads-up email
2. 3 days before due date: Payment reminder
3. On due date: Final reminder
4. 7 days overdue: Late payment notice
5. 14 days overdue: Escalation email

**Implementation:**
- Option A: Billy.dk native reminders (check if available)
- Option B: External automation (Zapier, Make.com)
- Option C: Billy MCP custom workflow (requires development)

**Estimated time:** 2-3 hours setup

### 10. Create Billy MCP Dashboard

**Priority:** 🔵 LOW  
**Goal:** Visual dashboard for business metrics

**Features:**
- Real-time revenue tracking
- Customer payment status
- Draft invoice alerts
- Product performance charts
- Monthly comparison graphs

**Options:**
- Option A: Notion dashboard (manual updates)
- Option B: Google Sheets with API integration
- Option C: Custom web dashboard (React + Billy MCP)

**Estimated time:** 8-12 hours development

---

## 📊 Summary & Timeline

### This Week (Oct 21-25)

**Monday (Today):**
- 🔴 Approve draft invoice #1 (5,235 DKK) - **15 min**
- 🟡 Review draft invoice #2 (698 DKK) - **10 min**
- 🟡 Setup Oct 31 payment reminders - **30 min**

**Tuesday-Friday:**
- 🟡 Product cleanup audit (Claude session) - **2-3 hours**
- 🟢 Create draft invoice monitoring system - **30 min**

**Total Time This Week:** ~4 hours

### Next 2 Weeks (Oct 28 - Nov 4)

**Week 2:**
- Product cleanup implementation (archive old, create new)
- Execute payment reminders (Oct 31 invoices)
- Setup monthly analytics report

**Week 3:**
- Complete product cleanup
- Create product catalog for team
- Train team on new structure

**Total Time:** ~8-10 hours over 2 weeks

### Month 2 (November)

- Monitor new product usage
- Run first monthly analytics report
- Plan automation improvements (if needed)

**Total Time:** ~2-3 hours/month ongoing

---

## 🎯 Success Metrics

### Immediate (This Week)

- ✅ Draft invoice #1 approved and sent (5,235 DKK secured)
- ✅ Payment reminders scheduled (3,315 DKK protected)
- ✅ Product audit complete (mapping table created)

### Short Term (Month 1)

- ✅ Product count reduced from 68 → 10-15
- ✅ Invoice creation time reduced by 50%
- ✅ Zero missed draft approvals
- ✅ Payment collection rate maintained at 97.5%+

### Long Term (Quarter 1 2025)

- ✅ Monthly analytics automated
- ✅ Product performance clearly tracked
- ✅ Proactive payment follow-up implemented
- ✅ Team satisfied with new product structure

---

## 📞 Quick Reference

### Critical Contacts

**Billy.dk Support:** <https://help.billy.dk>  
**Organization ID:** IQgm5fsl5rJ3Ub33EfAEow  
**MCP Server:** <https://tekup-billy.onrender.com>

### Key Documents

- `CLAUDE_PHASE1_FINAL_REPORT.md` - Full analytics report
- `PRODUCT_CLEANUP_PLAN.md` - Detailed product consolidation guide
- `CLAUDE_PHASE1_RESUME.md` - Test suite for future use

### Quick Commands

**Health Check:**

```powershell
Invoke-RestMethod https://tekup-billy.onrender.com/health
```

**Monthly Analytics (via Claude/ChatGPT):**

```
Run Billy MCP Phase 1 Analytics for [current month]
Compare with previous month trends
```

---

**Action Plan Created:** 21. oktober 2025, kl. 10:20  
**Next Review:** 28. oktober 2025 (check payment reminders)  
**Status:** Ready for execution ✅
