# 🔧 Customer Stats Fix - Implementation Guide

**Task:** Add `updateCustomerStats()` calls to 9 files  
**Time:** ~2 hours  
**Priority:** CRITICAL  
**Status:** Ready to implement

---

## 📋 Pre-Implementation Checklist

- [ ] Create branch: `git checkout -b fix/customer-stats-auto-update`
- [ ] Verify local dev environment works: `npm run dev`
- [ ] Read full analysis: `HARDCODED_DATA_AUDIT.md`

---

## 🛠️ Implementation Steps

### Step 1: Lead Creation Files (5 files)

#### File 1: `src/services/leadMonitor.ts`

**Line to find:** ~50 (after `const lead = await prisma.lead.create`)

**Add import at top:**
```typescript
import { updateCustomerStats } from "./customerService";
```

**Add after lead creation:**
```typescript
const lead = await prisma.lead.create({
    data: {
        customerId,
        // ... existing fields
    },
});

// ✅ ADD THIS:
if (customerId) {
    await updateCustomerStats(customerId);
    logger.debug({ customerId, leadId: lead.id }, "Updated customer stats after lead creation");
}

logger.info(
    { leadId: lead.id, name: parsedLead.name },
    "Lead saved to database"
);
```

---

#### File 2: `src/services/emailAutoResponseService.ts`

**Line to find:** ~522 (after `dbLead = await prisma.lead.create`)

**Add import at top:**
```typescript
import { updateCustomerStats } from "./customerService";
```

**Add after lead creation:**
```typescript
dbLead = await prisma.lead.create({
    data: {
        customerId: customer.id,
        // ... existing fields
    },
});

// ✅ ADD THIS:
if (dbLead.customerId) {
    await updateCustomerStats(dbLead.customerId);
    logger.debug({ customerId: dbLead.customerId, leadId: dbLead.id }, "Updated customer stats after lead creation");
}
```

---

#### File 3: `src/tools/toolsets/leadToolset.ts`

**Line to find:** ~156 (after `const lead = await prisma.lead.create`)

**Add import at top:**
```typescript
import { updateCustomerStats } from "../../services/customerService";
```

**Add after lead creation:**
```typescript
const lead = await prisma.lead.create({
    data: {
        customerId,
        // ... existing fields
    },
});

// ✅ ADD THIS:
if (lead.customerId) {
    await updateCustomerStats(lead.customerId);
}

return {
    success: true,
    leadId: lead.id,
    message: `Lead created successfully for ${lead.name}`,
};
```

---

#### File 4: `src/api/dashboardRoutes.ts`

**Line to find:** ~1574 (after `const lead = await prisma.lead.create`)

**Add import at top:**
```typescript
import { updateCustomerStats } from "../services/customerService";
```

**Add after lead creation:**
```typescript
const lead = await prisma.lead.create({
    data: {
        customerId,
        // ... existing fields
    },
});

// ✅ ADD THIS:
if (lead.customerId) {
    await updateCustomerStats(lead.customerId);
}

logger.info({ leadId: lead.id }, "Lead created via API");
res.status(201).json(lead);
```

---

#### File 5: `src/tools/importHistoricalLeads.ts`

**Line to find:** ~82 (after `const lead = await prisma.lead.create`)

**Add import at top:**
```typescript
import { updateCustomerStats } from "../services/customerService";
```

**Add after lead creation:**
```typescript
const lead = await prisma.lead.create({
    data: {
        customerId,
        // ... existing fields
    },
});

// ✅ ADD THIS:
if (customerId) {
    await updateCustomerStats(customerId);
}

createdCount++;
logger.info({ leadId: lead.id }, `Historical lead imported`);
```

---

### Step 2: Booking Creation Files (4 files)

#### File 6: `src/services/calendarService.ts`

**Line to find:** ~583 (after `const booking = await prisma.booking.create`)

**Add import at top:**
```typescript
import { updateCustomerStats } from "./customerService";
```

**Add after booking creation:**
```typescript
const booking = await prisma.booking.create({
    data: {
        leadId,
        // ... existing fields
    },
});

// ✅ ADD THIS:
const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { customerId: true },
});
if (lead?.customerId) {
    await updateCustomerStats(lead.customerId);
    logger.debug({ customerId: lead.customerId, bookingId: booking.id }, "Updated customer stats after booking creation");
}

logger.info({ bookingId: booking.id }, "Booking created successfully");
return booking;
```

---

#### File 7: `src/services/calendarSyncService.ts`

**Line to find:** ~324 (after `const booking = await prisma.booking.create`)

**Add import at top:**
```typescript
import { updateCustomerStats } from "./customerService";
```

**Add after booking creation:**
```typescript
const booking = await prisma.booking.create({
    data: {
        leadId: lead.id,
        // ... existing fields
    },
});

// ✅ ADD THIS:
if (lead.customerId) {
    await updateCustomerStats(lead.customerId);
    logger.debug({ customerId: lead.customerId, bookingId: booking.id }, "Updated customer stats after calendar sync");
}

bookingsCreated++;
```

---

#### File 8: `src/tools/toolsets/calendarToolset.ts`

**Line to find:** ~458 (after `const booking = await prisma.booking.create`)

**Add import at top:**
```typescript
import { updateCustomerStats } from "../../services/customerService";
```

**Add after booking creation:**
```typescript
const booking = await prisma.booking.create({
    data: {
        leadId,
        // ... existing fields
    },
});

// ✅ ADD THIS:
const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { customerId: true },
});
if (lead?.customerId) {
    await updateCustomerStats(lead.customerId);
}

return {
    success: true,
    bookingId: booking.id,
    message: "Booking created successfully",
};
```

---

#### File 9: `src/api/bookingRoutes.ts`

**Line to find:** ~84 (after `const booking = await prisma.booking.create`)

**Add import at top:**
```typescript
import { updateCustomerStats } from "../services/customerService";
```

**Add after booking creation:**
```typescript
const booking = await prisma.booking.create({
    data: {
        leadId,
        // ... existing fields
    },
});

// ✅ ADD THIS:
const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { customerId: true },
});
if (lead?.customerId) {
    await updateCustomerStats(lead.customerId);
}

logger.info({ bookingId: booking.id }, "Booking created via API");
res.status(201).json(booking);
```

---

## ✅ Post-Implementation Checklist

### Local Testing
- [ ] Run build: `npm run build` (no errors)
- [ ] Run tests: `npm test` (all pass)
- [ ] Test locally: Create test lead → verify customer stats update
- [ ] Test locally: Create test booking → verify customer stats update

### Code Quality
- [ ] All 9 files modified
- [ ] All imports added correctly
- [ ] All `await` keywords present
- [ ] All `if` checks for null/undefined customerId
- [ ] Debug logging added (optional but recommended)

### Git Workflow
- [ ] Commit changes: `git add .`
- [ ] Commit message: `git commit -m "fix: auto-update customer stats on lead/booking creation"`
- [ ] Push to GitHub: `git push origin fix/customer-stats-auto-update`
- [ ] Create PR if needed or merge directly to main

### Deployment
- [ ] Wait for Render auto-deploy (~5-7 min)
- [ ] Monitor logs: Check for errors in Render dashboard
- [ ] Smoke test: Create test lead via production API
- [ ] Verify: Check customer stats updated

### Production Validation
- [ ] Create test lead via Leadmail.no monitoring
- [ ] Check customer stats in Customer 360 View
- [ ] Create test booking via API
- [ ] Check customer stats updated correctly
- [ ] Verify no errors in production logs

---

## 🧪 Testing Commands

### Local Testing

```powershell
# Build backend
npm run build:backend

# Run tests
npm test

# Start dev server
npm run dev:all
```

### Production Testing

```powershell
# Create test lead (after deployment)
# Wait for next Leadmail.no email or use API

# Check customer stats
$customer = Invoke-RestMethod "https://tekup-renos.onrender.com/api/dashboard/customers" | Where-Object { $_.email -eq "test@example.com" }
Write-Host "totalLeads: $($customer.totalLeads)"
Write-Host "totalBookings: $($customer.totalBookings)"

# Expected: Counts should increment after lead/booking creation
```

---

## 🚨 Troubleshooting

### Import Error
```
Error: Cannot find module './customerService'
```
**Fix:** Check import path is correct relative to file location

### TypeScript Error
```
Property 'updateCustomerStats' does not exist
```
**Fix:** Ensure function is exported in `src/services/customerService.ts`

### Stats Not Updating
```
Customer stats still showing old values
```
**Checklist:**
- [ ] Is `customerId` defined/not null?
- [ ] Is `await` keyword present?
- [ ] Check logs for errors during update
- [ ] Verify function was actually called (add console.log)

---

## 📊 Success Metrics

✅ **Code Changes:**
- [ ] 9 files modified successfully
- [ ] Build passes with no errors
- [ ] All tests pass

✅ **Functional Testing:**
- [ ] New lead creation updates customer stats
- [ ] New booking creation updates customer stats
- [ ] Customer 360 View shows correct data
- [ ] Dashboard metrics are accurate

✅ **Production Validation:**
- [ ] No errors in production logs
- [ ] Stats update in real-time
- [ ] System performance unchanged

---

## 📚 Related Files

- **Main Analysis:** `HARDCODED_DATA_AUDIT.md`
- **Quick Reference:** `CUSTOMER_STATS_BUG_QUICK_FIX.md`
- **Customer Service:** `src/services/customerService.ts` (contains `updateCustomerStats()`)
- **Database Schema:** `prisma/schema.prisma`

---

**Ready to implement?** Start with Step 1, File 1 and work through systematically.

**Need help?** Refer to `HARDCODED_DATA_AUDIT.md` for detailed context and reasoning.
