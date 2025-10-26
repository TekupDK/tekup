# 🚨 RenOS - Critical Issues Debug & Fix Plan

**Date:** 7. Oktober 2025  
**Test Conducted By:** User  
**Status:** CRITICAL ISSUES IDENTIFIED  

---

## 📊 **SEVERITY OVERVIEW**

| Priority | Count | Issues |
|----------|-------|--------|
| 🔴 CRITICAL | 2 | Kalender nede, Data sync broken |
| 🟠 HIGH | 4 | Services missing, AI generator broken, Bookings broken, Actions missing |
| 🟡 MEDIUM | 1 | Cache performance 0% |

**Total Issues:** 7  
**Estimated Fix Time:** 2-3 weeks  
**Business Impact:** HIGH - Multiple core features non-functional

---

## 🔴 **CRITICAL PRIORITY - FIX IMMEDIATELY**

### **Issue #1: Kalender Modul Totalt Nede**

**Status:** 🔴 **COMPLETE FAILURE**  
**Impact:** Cannot manage bookings, schedule cleaning, or sync with Google Calendar  
**Error:** "Der opstod en fejl - Vi beklager, men noget gik galt. Prøv venligst at genindlæse siden."

**Possible Root Causes:**
1. Missing Google Calendar API credentials in production
2. Frontend API endpoint mismatch
3. Backend calendar routes not mounted correctly
4. Google Calendar service account permissions issue

**Debug Steps:**
```bash
# 1. Check backend logs for calendar errors
npm run logs:backend

# 2. Verify calendar routes are mounted
grep -r "calendarRoutes" src/server.ts

# 3. Test calendar API directly
curl https://tekup-renos.onrender.com/api/calendar/find-slots \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"durationMinutes": 120}'

# 4. Check Google Calendar API credentials
echo $GOOGLE_PRIVATE_KEY | head -c 50
```

**Fix Strategy:**
1. **Immediate:** Check if `GOOGLE_PRIVATE_KEY` and `GOOGLE_IMPERSONATED_USER` are set in Render
2. **Backend:** Verify calendar routes are mounted in `src/server.ts`
3. **Frontend:** Check API endpoint URL in Calendar component
4. **Error Handling:** Add better error messages to identify exact failure point

**Files to Check:**
- `src/routes/calendar.ts` - Backend routes
- `src/server.ts` - Route mounting
- `client/src/pages/Calendar/Calendar.tsx` - Frontend component
- `src/services/calendarService.ts` - Google Calendar integration

---

### **Issue #2: Data Synchronization - Customer Stats Always 0**

**Status:** 🔴 **DATA INTEGRITY FAILURE**  
**Impact:** Customer 360 profiles useless, cannot track customer history  
**Problem:** All customers show `0 leads` and `0 bookings` despite data existing in database

**Root Cause:**
Database foreign key relationships not properly set up between:
- `Customer` ↔ `Lead` (via `customerId`)
- `Customer` ↔ `Booking` (via `customerId`)

**Evidence:**
```
Database Schema (prisma/schema.prisma):
- Lead model HAS customerId field ✅
- Booking model HAS customerId field ✅
- Customer model HAS leads[] relation ✅
- Customer model HAS bookings[] relation ✅

BUT: Data shows 0 for all customers ❌
```

**Possible Issues:**
1. Leads and Bookings created WITHOUT customerId (NULL values)
2. Database aggregation queries broken
3. Frontend not fetching related data
4. Migration lost existing relationships

**Debug Steps:**
```sql
-- 1. Check if leads have customerIds
SELECT COUNT(*) as total_leads, 
       COUNT(customerId) as leads_with_customer,
       COUNT(*) - COUNT(customerId) as orphaned_leads
FROM leads;

-- 2. Check if bookings have customerIds
SELECT COUNT(*) as total_bookings, 
       COUNT(customerId) as bookings_with_customer,
       COUNT(*) - COUNT(customerId) as orphaned_bookings
FROM bookings;

-- 3. Check customer stats
SELECT c.id, c.name, c.totalLeads, c.totalBookings,
       (SELECT COUNT(*) FROM leads WHERE customerId = c.id) as actual_leads,
       (SELECT COUNT(*) FROM bookings WHERE customerId = c.id) as actual_bookings
FROM customers c
LIMIT 10;
```

**Fix Strategy:**
1. **Database Audit:** Run SQL queries above to identify orphaned records
2. **Data Migration:** Link orphaned leads/bookings to customers via email matching
3. **Fix Aggregation:** Update `totalLeads` and `totalBookings` fields
4. **Add Triggers:** Ensure future leads/bookings automatically update customer stats
5. **API Fix:** Backend endpoints must include `.include({ leads: true, bookings: true })`

**Files to Fix:**
- `src/api/dashboardRoutes.ts` - Customer data endpoints
- `src/services/dashboardDataService.ts` - Data aggregation logic
- `prisma/migrations/` - May need data migration script
- `client/src/pages/Customer360/Customer360.tsx` - Frontend data fetching

---

## 🟠 **HIGH PRIORITY - FIX THIS WEEK**

### **Issue #3: Services Modul Tomt**

**Status:** 🟠 **NO DATA**  
**Impact:** Cannot create quotes, cannot price services, no service catalog  
**Problem:** "Ingen services fundet" - empty services list

**Root Cause:**
1. No database seeding for Services model
2. Missing Service CRUD API endpoints
3. Frontend not connected to backend

**Debug Steps:**
```sql
-- Check if Services table exists and has data
SELECT * FROM services LIMIT 10;
```

**Fix Strategy:**
1. **Database Seeding:** Create seed data for common services
   ```typescript
   // prisma/seed.ts
   const services = [
     { name: 'Privatrengøring', basePrice: 350, unit: 'hour' },
     { name: 'Flytterengøring', basePrice: 400, unit: 'hour' },
     { name: 'Hovedrengøring', basePrice: 425, unit: 'hour' },
     { name: 'Erhvervsrengøring', basePrice: 300, unit: 'hour' },
     { name: 'Vinduespolering', basePrice: 450, unit: 'hour' },
     { name: 'Airbnb Rengøring', basePrice: 375, unit: 'booking' }
   ];
   ```

2. **API Endpoints:** Create service CRUD operations
   ```typescript
   // src/api/serviceRoutes.ts
   router.get('/services', listServices);
   router.post('/services', createService);
   router.put('/services/:id', updateService);
   router.delete('/services/:id', deleteService);
   ```

3. **Frontend Integration:** Connect Services page to API

**Files to Create/Fix:**
- `prisma/seed.ts` - Add service seeding
- `src/api/serviceRoutes.ts` - Create if missing
- `src/routes/serviceRoutes.ts` - Backend routes
- `client/src/pages/Services/Services.tsx` - Frontend component

---

### **Issue #4: AI Tilbud Generator Defekt**

**Status:** 🟠 **BROKEN FEATURE**  
**Impact:** Cannot auto-generate quotes, manual work required  
**Problem:** Generates empty quotes with "0% confidence", "Ingen emne", "Ingen indhold"

**Root Cause:**
1. Gemini API not receiving proper lead data
2. Prompt engineering issues
3. Missing required fields (address, squareMeters, serviceType)

**Debug Steps:**
```typescript
// Check lead data completeness
const lead = await prisma.lead.findFirst({
  where: { id: leadId }
});

console.log('Lead data:', {
  hasAddress: !!lead.address,
  hasSquareMeters: !!lead.squareMeters,
  hasTaskType: !!lead.taskType,
  hasEmail: !!lead.email
});
```

**Fix Strategy:**
1. **Data Validation:** Ensure leads have required fields before quote generation
2. **Prompt Engineering:** Improve Gemini prompts with better context
3. **Fallback Logic:** Use default values when data missing
4. **Confidence Scoring:** Fix confidence calculation logic

**Files to Fix:**
- `src/services/geminiService.ts` - AI quote generation
- `src/agents/handlers/quoteGenerationHandler.ts` - Quote handler
- `src/api/quoteRoutes.ts` - Quote API endpoints

---

### **Issue #5: Booking Data Shows "Ukendt Kunde"**

**Status:** 🟠 **DATA DISPLAY ISSUE**  
**Impact:** Cannot identify customers, cannot send booking confirmations  
**Problem:** All bookings show "Ukendt kunde" and "Ingen email"

**Root Cause:**
Same as Issue #2 - Foreign key relationships broken

**Fix Strategy:**
1. **Fix Data Relations:** Link bookings to customers
2. **Email Fallback:** Use lead email if customer email missing
3. **Frontend Display:** Show lead name if customer name missing

**Files to Fix:**
- `client/src/pages/Bookings/Bookings.tsx` - Frontend display logic
- `src/api/bookingRoutes.ts` - Backend data fetching with proper joins

---

### **Issue #6: Handlingsknapper Mangler**

**Status:** 🟠 **MISSING UI**  
**Impact:** Cannot edit, delete, or manage data  
**Problem:** "HANDLINGER" columns empty in all tables

**Root Cause:**
1. Frontend components not rendering action buttons
2. Conditional rendering hiding buttons
3. Missing permissions or auth check

**Debug Steps:**
```typescript
// Check if action buttons are conditionally rendered
// Look for code like:
{isAdmin && <Button>Edit</Button>}
{hasPermission('delete') && <Button>Delete</Button>}
```

**Fix Strategy:**
1. **Remove Auth Checks:** Make buttons visible (auth happens on backend)
2. **Add Button Components:** Implement Edit/Delete/View actions
3. **Add Confirmation Modals:** Confirm before destructive actions

**Files to Fix:**
- `client/src/pages/Leads/Leads.tsx`
- `client/src/pages/Bookings/Bookings.tsx`
- `client/src/pages/Customers/Customers.tsx`
- `client/src/components/ui/DataTable.tsx` - Reusable action buttons

---

## 🟡 **MEDIUM PRIORITY - FIX NEXT WEEK**

### **Issue #7: Cache Performance 0%**

**Status:** 🟡 **PERFORMANCE ISSUE**  
**Impact:** Slower API responses, higher server load  
**Problem:** Dashboard shows cache hit rate at 0%

**Root Cause:**
1. Cache keys not matching between set and get operations
2. Cache TTL too short
3. Cache service not being used

**Debug Steps:**
```typescript
// src/services/cacheService.ts
// Add logging to cache operations
cache.set(key, value, ttl);
console.log('Cache SET:', key, 'TTL:', ttl);

const result = cache.get(key);
console.log('Cache GET:', key, 'Hit:', !!result);
```

**Fix Strategy:**
1. **Audit Cache Keys:** Ensure consistency
2. **Increase TTL:** Set appropriate cache durations
3. **Monitor Cache:** Add metrics to track hit rate

**Files to Fix:**
- `src/services/cacheService.ts`
- `src/api/dashboardRoutes.ts` - Add caching to endpoints

---

## 🛠️ **COMPREHENSIVE FIX ROADMAP**

### **Week 1: Critical Fixes**
**Days 1-2:** Database Relations & Data Migration
- [ ] Run database audit queries
- [ ] Create migration script to link orphaned records
- [ ] Update customer stats (totalLeads, totalBookings)
- [ ] Test Customer 360 displays correct data

**Days 3-4:** Calendar Module Fix
- [ ] Verify Google Calendar API credentials
- [ ] Check calendar route mounting
- [ ] Add error logging to calendar service
- [ ] Test calendar UI loads without errors
- [ ] Test booking creation via calendar

**Day 5:** Booking Display Fix
- [ ] Update booking queries to include customer data
- [ ] Add email fallback logic
- [ ] Test booking list shows customer names

---

### **Week 2: High Priority Fixes**
**Days 1-2:** Services Module Implementation
- [ ] Create service seeding script
- [ ] Run database seed
- [ ] Create service CRUD API endpoints
- [ ] Connect frontend to backend
- [ ] Test service creation/editing

**Days 3-4:** AI Quote Generator Fix
- [ ] Add lead data validation
- [ ] Improve Gemini prompts
- [ ] Fix confidence scoring
- [ ] Test quote generation with sample data

**Day 5:** Action Buttons Implementation
- [ ] Add Edit/Delete/View buttons to all tables
- [ ] Implement confirmation modals
- [ ] Add backend delete endpoints
- [ ] Test CRUD operations work end-to-end

---

### **Week 3: Polish & Testing**
**Days 1-2:** Cache Performance
- [ ] Fix cache key consistency
- [ ] Increase cache TTL
- [ ] Add cache metrics
- [ ] Monitor cache hit rate improvements

**Days 3-5:** End-to-End Testing
- [ ] Test all modules work together
- [ ] Test user workflows (lead → quote → booking)
- [ ] Performance testing
- [ ] Bug fixes for discovered issues

---

## 📋 **TESTING PROTOCOL**

### **Test Checklist per Module:**

**Dashboard ✅ (Already Working):**
- [x] Metrics loading correctly
- [ ] Real-time data updates
- [ ] Cache performance >50%

**Kalender 🔴 (Critical):**
- [ ] Page loads without error
- [ ] Can view existing bookings
- [ ] Can create new bookings
- [ ] Google Calendar sync works
- [ ] Booking confirmation emails sent

**Leads 🟡 (Partial):**
- [x] Can view leads list
- [x] Can create new leads
- [ ] AI quote generation works
- [ ] Lead-to-customer conversion
- [ ] Email automation triggers

**Bookinger 🟠 (Broken):**
- [ ] Customer information shows correctly
- [ ] Email addresses visible
- [ ] Status updates work
- [ ] Can edit/cancel bookings
- [ ] Email notifications sent

**Kunder 🟠 (Stats Broken):**
- [x] Can view customer list
- [x] Basic editing works
- [ ] Statistics show correct numbers
- [ ] Customer 360 displays full profile
- [ ] Related leads/bookings visible

**Services 🟠 (Empty):**
- [ ] Can view services list
- [ ] Can create new services
- [ ] Can edit service pricing
- [ ] Services appear in quote generation

**Tilbud 🟠 (Broken):**
- [ ] AI generation creates valid quotes
- [ ] Confidence >80%
- [ ] Quote contains proper details
- [ ] Can send quote to customer
- [ ] Quote acceptance tracking

---

## 🎯 **SUCCESS METRICS**

After fixes are complete, we should achieve:

| Metric | Current | Target |
|--------|---------|--------|
| Kalender uptime | 0% (broken) | 100% |
| Customer 360 accuracy | 0% (all zeros) | 100% |
| AI quote success rate | 0% | >80% |
| Booking customer identification | 0% | 100% |
| Cache hit rate | 0% | >50% |
| Services available | 0 | 6+ |
| Action buttons functional | 0% | 100% |

---

## 🚀 **IMMEDIATE NEXT STEPS**

1. **RIGHT NOW:** Check Render environment variables
   ```bash
   # Critical variables to verify:
   - GOOGLE_PRIVATE_KEY
   - GOOGLE_IMPERSONATED_USER
   - DATABASE_URL
   - GEMINI_KEY
   ```

2. **TODAY:** Run database audit
   ```sql
   -- Check data integrity
   -- See Issue #2 debug steps above
   ```

3. **THIS WEEK:** Fix calendar module
   - Add error logging
   - Test API endpoints
   - Verify Google Calendar permissions

4. **NEXT WEEK:** Implement remaining fixes per roadmap

---

## 📞 **ESCALATION PLAN**

If issues persist after fixes:

**Technical Escalation:**
1. Check Render logs for errors: <https://dashboard.render.com>
2. Review Sentry error tracking (if enabled)
3. Test in local development environment
4. Consider rolling back to last known working version

**Business Escalation:**
1. Document impact on business operations
2. Prioritize features by revenue impact
3. Consider temporary workarounds
4. Communicate timeline to stakeholders

---

**Next Action:** Skal jeg starte med at fixe kalender modulet eller database relations først?

Jeg anbefaler at starte med **database relations** da det påvirker flere issues (Customer 360, Bookings, Leads), men kalender er også kritisk.

Hvad vil du have mig til at fixe først? 🚀
