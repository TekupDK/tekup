# 🚨 Customer Stats Bug - Quick Fix Summary

**Problem:** New leads and bookings don't update customer statistics

**Root Cause:** `totalLeads` and `totalBookings` database fields are never updated when new leads/bookings are created

**Current Status:** 
- ✅ Existing customers have correct stats (fix tool was run)
- ❌ New leads don't auto-update stats
- ❌ New bookings don't auto-update stats
- ❌ System degrades over time as data is added

---

## 🔧 Quick Fix (2 hours)

### What to Add

After EVERY `prisma.lead.create()` or `prisma.booking.create()`:

```typescript
// Import at top of file
import { updateCustomerStats } from "../services/customerService";

// After creating a lead with customerId
if (customerId) {
    await updateCustomerStats(customerId);
}

// After creating a booking
const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { customerId: true },
});
if (lead?.customerId) {
    await updateCustomerStats(lead.customerId);
}
```

---

## 📂 Files to Modify (9 files)

### Lead Creation (5 files)
1. `src/services/leadMonitor.ts` (line ~50)
2. `src/services/emailAutoResponseService.ts` (line ~522)
3. `src/tools/toolsets/leadToolset.ts` (line ~156)
4. `src/api/dashboardRoutes.ts` (line ~1574)
5. `src/tools/importHistoricalLeads.ts` (line ~82)

### Booking Creation (4 files)
1. `src/services/calendarService.ts` (line ~583)
2. `src/services/calendarSyncService.ts` (line ~324)
3. `src/tools/toolsets/calendarToolset.ts` (line ~458)
4. `src/api/bookingRoutes.ts` (line ~84)

---

## 🎯 Testing

```powershell
# After deploying code fix, run database fix tool
npm run db:fix-relations -- --live

# Verify in browser
# Open: https://tekup-renos-1.onrender.com/customer360
# Expected: Customers should show real lead/booking counts (not zeros)
```

---

## ✅ Success Criteria

- [ ] New leads auto-update customer stats
- [ ] New bookings auto-update customer stats
- [ ] Customer 360 View shows real data
- [ ] Dashboard metrics are accurate

---

**Full details:** See `HARDCODED_DATA_AUDIT.md`
