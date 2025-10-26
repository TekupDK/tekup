# 🚨 RenOS Hardcoded Data & Missing Data-Bindings Audit

**Date:** 7. oktober 2025  
**Status:** CRITICAL - Customer 360 View is completely broken  
**Impact:** All customers show 0 leads/0 bookings despite database containing real data

---

## 🔍 Executive Summary

**ROOT CAUSE CONFIRMED:** `totalLeads`, `totalBookings`, and `totalRevenue` are **database fields that are never updated** when new leads/bookings are created.

### Critical Finding
- ✅ Frontend correctly fetches data from `/api/dashboard/customers`
- ✅ Backend correctly returns `totalLeads`, `totalBookings`, `totalRevenue` from database
- ✅ **GOOD NEWS:** Existing customers have correct stats (fix tool was already run)
- ❌ **PROBLEM:** New leads/bookings DO NOT update customer stats automatically
- ❌ **PROBLEM:** Customers created via `findOrCreateCustomer()` start with 0 and stay at 0
- ❌ **PROBLEM:** Stats become stale over time as new data is added

### Production Verification (7 Oct 2025)
```
Janne Nellemann Pedersen:
  - Database totalLeads: 32 ✅ (correct)
  - Actual leads in system: 32 ✅ (matches)

Thomas Dalager:
  - Database totalLeads: 19 ✅ (correct)
  - Actual leads in system: 19 ✅ (matches)

✅ Existing data is correct (fix tool was run previously)
❌ New data will NOT update stats (no automatic updates)
```

### Impact Severity
- 🔴 **CRITICAL:** New leads don't update customer stats (system degrades over time)
- 🔴 **CRITICAL:** New bookings don't update customer stats
- 🟡 **HIGH:** Newly created customers will show 0 leads/bookings forever
- 🟡 **HIGH:** Stats become increasingly inaccurate as system is used

---

## 🐛 Detailed Findings

### 1. Database Schema Problem (CRITICAL)

**File:** `prisma/schema.prisma`

```prisma
model Customer {
  id            String   @id @default(cuid())
  name          String
  email         String?  @unique
  
  // ❌ PROBLEM: These are static fields that never update
  totalLeads    Int      @default(0)  
  totalBookings Int      @default(0)
  totalRevenue  Float    @default(0)
  
  // Relations exist but aren't used for counting
  leads         Lead[]
  bookings      Booking[]
}
```

**Problem:**
- `totalLeads`, `totalBookings`, `totalRevenue` default to 0
- When a customer is created, these stay at 0 forever
- No automatic mechanism updates them

**Correct Approach:**
Either:
- A) **Remove these fields** and calculate dynamically with Prisma `_count` aggregations
- B) **Add database triggers/hooks** to update them when leads/bookings are created
- C) **Call `updateCustomerStats()` every time** a lead/booking is created (manual approach)

---

### 2. Missing Stats Updates in Lead Creation (CRITICAL)

**Files affected:**
- `src/services/leadMonitor.ts` (Leadmail.no parsing)
- `src/services/emailAutoResponseService.ts` (Email lead creation)
- `src/tools/toolsets/leadToolset.ts` (Chat tool lead creation)
- `src/api/dashboardRoutes.ts` (Manual lead creation via API)

**Problem Example (leadMonitor.ts lines 30-50):**

```typescript
async function saveLeadToDatabase(parsedLead: ParsedLead): Promise<string> {
    // Create or find customer
    if (parsedLead.email && parsedLead.name) {
        const customer = await findOrCreateCustomer(parsedLead.email, parsedLead.name);
        customerId = customer.id;
    }

    // Create lead
    const lead = await prisma.lead.create({
        data: {
            customerId,  // ✅ Link is correct
            name: parsedLead.name,
            email: parsedLead.email,
            // ... other fields
        },
    });

    // ❌ MISSING: No call to updateCustomerStats(customerId)
    // Result: customer.totalLeads stays at 0
}
```

**Fix Required:**
After EVERY `prisma.lead.create()`, add:
```typescript
if (customerId) {
    await updateCustomerStats(customerId);
}
```

---

### 3. Missing Stats Updates in Booking Creation (CRITICAL)

**Files affected:**
- `src/services/calendarService.ts` (line 583)
- `src/services/calendarSyncService.ts` (line 324)
- `src/tools/toolsets/calendarToolset.ts` (line 458)
- `src/api/bookingRoutes.ts` (line 84)

**Problem Example:**

```typescript
const booking = await prisma.booking.create({
    data: {
        leadId,
        startTime,
        endTime,
        // ... other fields
    },
});

// ❌ MISSING: No update to customer stats
// Need to:
// 1. Get customerId from lead
// 2. Call updateCustomerStats(customerId)
```

**Fix Required:**
```typescript
const booking = await prisma.booking.create({ /* ... */ });

// Get customer from lead
const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { customerId: true },
});

if (lead?.customerId) {
    await updateCustomerStats(lead.customerId);
}
```

---

### 4. Existing Solution NOT Being Used (CRITICAL)

**File:** `src/services/customerService.ts` (lines 179-214)

**Good news:** A working `updateCustomerStats()` function **ALREADY EXISTS**:

```typescript
export async function updateCustomerStats(customerId: string): Promise<void> {
    try {
        // ✅ Correctly counts from database relations
        const [leadCount, bookingCount, quotes] = await Promise.all([
            prisma.lead.count({ where: { customerId } }),
            prisma.booking.count({
                where: { lead: { customerId } },
            }),
            prisma.quote.findMany({
                where: { lead: { customerId }, status: "accepted" },
                select: { total: true },
            }),
        ]);

        const totalRevenue = quotes.reduce((sum, quote) => sum + quote.total, 0);

        await prisma.customer.update({
            where: { id: customerId },
            data: {
                totalLeads: leadCount,
                totalBookings: bookingCount,
                totalRevenue,
                lastContactAt: new Date(),
            },
        });
    } catch (error) {
        logger.error({ error, customerId }, "Failed to update customer stats");
        throw error;
    }
}
```

**Problem:** This function is ONLY called in:
- ✅ `src/services/enhancedCustomerImportService.ts` (CSV import)
- ✅ `src/tools/customerManagementTool.ts` (CLI tool)
- ✅ `src/services/customerService.ts` → `linkLeadToCustomer()` (manual linking)

**Missing calls in:**
- ❌ Lead creation (4 places)
- ❌ Booking creation (4 places)
- ❌ Customer creation via `findOrCreateCustomer()`

---

### 5. Frontend Is Actually Correct (NO ISSUES)

**Files checked:**
- ✅ `client/src/components/Customer360.tsx`
- ✅ `client/src/pages/Customers/Customers.tsx`
- ✅ `client/src/components/Dashboard.tsx`

**Finding:** Frontend correctly:
- Fetches data from `/api/dashboard/customers`
- Displays `customer.totalLeads` and `customer.totalBookings`
- Shows loading states
- Handles errors

**No hardcoded data found in frontend components!**

The only mock data exists in `client/src/services/mockData.ts` but is NOT used when API is working.

---

### 6. API Endpoints Return Correct Data (NO ISSUES)

**File:** `src/api/dashboardRoutes.ts` (line 1108-1133)

```typescript
router.get("/customers", (req: Request, res: Response) => {
    void (async () => {
        const customers = await prisma.customer.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                totalLeads: true,      // ✅ Correctly selected
                totalBookings: true,   // ✅ Correctly selected
                totalRevenue: true,    // ✅ Correctly selected
                lastContactAt: true,
            },
        });

        res.json(customers);  // ✅ Returns correct structure
    })();
});
```

**No issues found in API layer!**

---

## 🔧 Complete Fix Plan

### Priority 1: Immediate Fixes (Can Deploy Today)

#### Fix 1A: Add Stats Update to Lead Creation

**Files to modify:**

1. **`src/services/leadMonitor.ts`** (line ~50)
```typescript
const lead = await prisma.lead.create({ /* ... */ });

// ADD THIS:
if (customerId) {
    await updateCustomerStats(customerId);
}

logger.info({ leadId: lead.id }, "Lead saved to database");
```

2. **`src/services/emailAutoResponseService.ts`** (line ~522)
```typescript
dbLead = await prisma.lead.create({ /* ... */ });

// ADD THIS:
if (dbLead.customerId) {
    await updateCustomerStats(dbLead.customerId);
}
```

3. **`src/tools/toolsets/leadToolset.ts`** (line ~156)
```typescript
const lead = await prisma.lead.create({ /* ... */ });

// ADD THIS:
if (lead.customerId) {
    await updateCustomerStats(lead.customerId);
}
```

4. **`src/api/dashboardRoutes.ts`** (line ~1574)
```typescript
const lead = await prisma.lead.create({ /* ... */ });

// ADD THIS:
if (lead.customerId) {
    await updateCustomerStats(lead.customerId);
}
```

5. **`src/tools/importHistoricalLeads.ts`** (line ~82)
```typescript
const lead = await prisma.lead.create({ /* ... */ });

// ADD THIS:
if (customerId) {
    await updateCustomerStats(customerId);
}
```

---

#### Fix 1B: Add Stats Update to Booking Creation

**Files to modify:**

1. **`src/services/calendarService.ts`** (line ~583)
```typescript
const booking = await prisma.booking.create({ /* ... */ });

// ADD THIS:
const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { customerId: true },
});
if (lead?.customerId) {
    await updateCustomerStats(lead.customerId);
}
```

2. **`src/services/calendarSyncService.ts`** (line ~324)
```typescript
const booking = await prisma.booking.create({ /* ... */ });

// ADD THIS:
const lead = await prisma.lead.findUnique({
    where: { id: booking.leadId },
    select: { customerId: true },
});
if (lead?.customerId) {
    await updateCustomerStats(lead.customerId);
}
```

3. **`src/tools/toolsets/calendarToolset.ts`** (line ~458)
```typescript
const booking = await prisma.booking.create({ /* ... */ });

// ADD THIS:
const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { customerId: true },
});
if (lead?.customerId) {
    await updateCustomerStats(lead.customerId);
}
```

4. **`src/api/bookingRoutes.ts`** (line ~84)
```typescript
const booking = await prisma.booking.create({ /* ... */ });

// ADD THIS:
const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { customerId: true },
});
if (lead?.customerId) {
    await updateCustomerStats(lead.customerId);
}
```

---

### Priority 2: One-Time Database Fix

After deploying the code fixes above, run this CLI tool to fix ALL existing customers:

```powershell
# Run in dry-run mode first to see what will change
npm run db:fix-relations

# Then run live to actually update
npm run db:fix-relations -- --live
```

This uses the existing tool in `src/tools/fixDatabaseRelations.ts` which:
- Links orphaned leads to customers
- Recalculates `totalLeads`, `totalBookings`, `totalRevenue` for ALL customers
- Creates missing customers from orphaned leads

---

### Priority 3: Better Long-Term Solution (Optional)

#### Option A: Use Dynamic Counts (Recommended)

**Remove static fields from schema:**

```prisma
model Customer {
  id            String   @id @default(cuid())
  name          String
  email         String?  @unique
  
  // REMOVE these static fields:
  // totalLeads    Int      @default(0)  
  // totalBookings Int      @default(0)
  // totalRevenue  Float    @default(0)
  
  // Keep relations:
  leads         Lead[]
  bookings      Booking[]
}
```

**Update API to calculate dynamically:**

```typescript
router.get("/customers", async (req, res) => {
    const customers = await prisma.customer.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            _count: {
                select: {
                    leads: true,
                    bookings: true,
                }
            },
        },
    });

    // Transform response
    const customersWithStats = customers.map(c => ({
        ...c,
        totalLeads: c._count.leads,
        totalBookings: c._count.bookings,
    }));

    res.json(customersWithStats);
});
```

**Pros:**
- ✅ Always accurate (counts from actual relations)
- ✅ No manual updates needed
- ✅ No risk of desync

**Cons:**
- ⚠️ Slightly slower queries (negligible for small datasets)
- ⚠️ Requires schema migration

---

#### Option B: Add Prisma Middleware (Alternative)

Keep static fields but auto-update with middleware:

```typescript
// src/services/databaseService.ts
prisma.$use(async (params, next) => {
  const result = await next(params);

  // After creating/deleting a lead
  if (params.model === 'Lead' && ['create', 'delete'].includes(params.action)) {
    const lead = result;
    if (lead.customerId) {
      await updateCustomerStats(lead.customerId);
    }
  }

  // After creating/deleting a booking
  if (params.model === 'Booking' && ['create', 'delete'].includes(params.action)) {
    const booking = result;
    const lead = await prisma.lead.findUnique({
      where: { id: booking.leadId },
      select: { customerId: true },
    });
    if (lead?.customerId) {
      await updateCustomerStats(lead.customerId);
    }
  }

  return result;
});
```

**Pros:**
- ✅ Automatic updates on all create/delete operations
- ✅ Centralized logic (no need to remember in every file)
- ✅ Works for CLI tools, API, and services

**Cons:**
- ⚠️ Adds latency to every create/delete operation
- ⚠️ Can cause nested transaction issues if not careful

---

## 📊 Testing Plan

### 1. Test Lead Creation Updates Stats

```powershell
# Before fix - check current customer stats
Invoke-RestMethod "https://tekup-renos.onrender.com/api/dashboard/customers?limit=1"

# Create a new lead (via Leadmail.no monitoring or API)
npm run leads:check

# After fix - verify stats updated
Invoke-RestMethod "https://tekup-renos.onrender.com/api/dashboard/customers?limit=1"
# Expected: totalLeads should increment by 1
```

### 2. Test Booking Creation Updates Stats

```powershell
# Create booking via API
$body = @{
    leadId = "some-lead-id"
    startTime = "2025-10-08T10:00:00Z"
    endTime = "2025-10-08T12:00:00Z"
} | ConvertTo-Json

Invoke-RestMethod "https://tekup-renos.onrender.com/api/bookings" `
    -Method POST -Body $body -ContentType "application/json"

# Verify customer stats updated
Invoke-RestMethod "https://tekup-renos.onrender.com/api/dashboard/customers?limit=1"
# Expected: totalBookings should increment by 1
```

### 3. Test Database Fix Tool

```powershell
# Dry-run first
npm run db:fix-relations

# Check output for how many customers will be updated
# Then run live
npm run db:fix-relations -- --live

# Verify Customer 360 View shows correct data
# Open https://tekup-renos-1.onrender.com/customer360
```

---

## 🎯 Success Criteria

✅ **Phase 1 (Code Fixes):**
- [ ] All 5 lead creation points call `updateCustomerStats()`
- [ ] All 4 booking creation points call `updateCustomerStats()`
- [ ] Tests pass showing stats update correctly
- [ ] Code deployed to production

✅ **Phase 2 (Data Fix):**
- [ ] Database fix tool runs successfully on production
- [ ] All customers show correct `totalLeads` and `totalBookings`
- [ ] Customer 360 View displays real data (not zeros)

✅ **Phase 3 (Validation):**
- [ ] Create new test lead → verify customer stats update
- [ ] Create new test booking → verify customer stats update
- [ ] Customer 360 View shows correct lead/booking history
- [ ] Dashboard statistics are accurate

---

## 💰 Time Estimates

| Task | Estimated Time | Priority |
|------|---------------|----------|
| Add stats updates to lead creation (5 files) | 30 min | P1 |
| Add stats updates to booking creation (4 files) | 30 min | P1 |
| Add import statement to all files | 10 min | P1 |
| Test locally | 20 min | P1 |
| Deploy to production | 10 min | P1 |
| Run database fix tool | 15 min | P1 |
| Verify in Customer 360 View | 10 min | P1 |
| **Total (Priority 1 only)** | **2 hours 5 min** | - |
| Long-term solution (Option A or B) | 2-3 hours | P3 |

---

## 📝 Deployment Checklist

- [ ] Create feature branch: `git checkout -b fix/customer-stats-updates`
- [ ] Apply all Priority 1 fixes (9 files to modify)
- [ ] Test locally with new lead creation
- [ ] Test locally with new booking creation
- [ ] Run `npm run build` - verify no errors
- [ ] Commit changes: `git commit -m "fix: add customer stats updates to lead/booking creation"`
- [ ] Push to GitHub: `git push origin fix/customer-stats-updates`
- [ ] Wait for Render auto-deploy (~5-7 min)
- [ ] Run database fix tool on production
- [ ] Verify Customer 360 View shows correct data
- [ ] Test creating new lead → stats update
- [ ] Test creating new booking → stats update
- [ ] Merge to main if all tests pass

---

## 🚀 Related Issues

This fix resolves:
- Customer 360 View showing empty data
- Dashboard statistics being inaccurate
- No way to track customer engagement
- Blocks sales team from prioritizing high-value customers

This also improves:
- Data consistency across the system
- Trust in dashboard metrics
- User confidence in the system

---

## 📚 Related Documentation

- **Customer 360 View Spec:** See CUSTOMER_360_SPEC.md (if exists)
- **Database Relations:** See prisma/schema.prisma
- **Customer Service API:** See src/services/customerService.ts
- **Fix Database Relations Tool:** See src/tools/fixDatabaseRelations.ts

---

**Prepared by:** GitHub Copilot  
**Review Status:** Ready for implementation  
**Next Action:** Apply Priority 1 fixes immediately
