# 🚨 PRODUCTION ISSUES - Fix Guide

**Date:** October 7, 2025 (Late Evening)  
**Status:** 🔴 CRITICAL ISSUES FOUND  
**Priority:** Fix tonight before sleep

---

## 🔍 ISSUES FOUND (Browser Console)

### **Issue #1: Development Clerk Keys** 🔴 CRITICAL
```
Clerk: Clerk has been loaded with development keys.
Development instances have strict usage limits...
```

**Root Cause:**
- Frontend uses: `pk_test_YXJyaXZpbmctcmVkYmlyZC0xMi5jbGVyay5hY2NvdW50cy5kZXYk`
- This is a **test/development key** (starts with `pk_test_`)
- Production needs: `pk_live_XXXXXXXX` key

**Impact:**
- ❌ Rate limiting (strict usage limits)
- ❌ Authentication unreliable
- ❌ Not suitable for production

**Files Affected:**
- `client/.env` (local, line 2)
- Render Frontend Environment: `VITE_CLERK_PUBLISHABLE_KEY` (not set!)

---

### **Issue #2: Revenue API 429 Error** 🔴 CRITICAL
```
tekup-renos.onrender.com/api/dashboard/revenue?period=7d: 429
Error fetching dashboard data: Failed to fetch revenue data
```

**Root Cause:**
- Backend endpoint `/api/dashboard/revenue` returnerer 429 (Too Many Requests)
- Muligvis rate limiting eller endpoint ikke implementeret korrekt

**Impact:**
- ❌ Dashboard kan ikke vise revenue data
- ❌ User experience broken

**Files Affected:**
- `src/api/dashboardRoutes.ts` - Revenue endpoint
- Frontend Dashboard component

---

### **Issue #3: Jace Extension Spam** 🟡 LOW PRIORITY
```
Jace: Target element not found, retrying in 1s... (x100)
```

**Root Cause:**
- Browser extension "Jace" leder efter elementer der ikke findes
- Ikke vores fejl, men irriterende console spam

**Impact:**
- 🟡 Console spam (cosmetic issue)
- ✅ Doesn't affect functionality

**Fix:**
- Disable Jace extension når du tester
- Eller ignore (not our problem)

---

## 🔧 FIX #1: Clerk Production Keys

### **Step 1: Get Production Clerk Key**

**Go to Clerk Dashboard:**
1. Visit: <https://dashboard.clerk.com>
2. Select your production instance
3. Go to: API Keys
4. Copy **Publishable Key** (should start with `pk_live_`)

**Expected format:**
```
pk_live_Y2xlcms...long-random-string...
```

---

### **Step 2: Update Render Frontend Environment**

**Via Render Dashboard:**
```
1. Go to: https://dashboard.render.com/static/srv-d3e057nfte5s73f2naqg
2. Click: "Environment" tab
3. Add variable:
   Key: VITE_CLERK_PUBLISHABLE_KEY
   Value: pk_live_XXXXXXXXXXXXXXXXX (your production key)
4. Click: "Save Changes"
5. Trigger manual deploy (frontend doesn't auto-deploy on env change)
```

**Via Render API (Alternative):**
```powershell
$env:RENDER_API_KEY = "rnd_spBHfqtMGYf51WJKgfuLL0aGvNzD"

# Add Clerk key to frontend
$body = @{
  envVars = @(
    @{
      key = "VITE_CLERK_PUBLISHABLE_KEY"
      value = "pk_live_YOUR_PRODUCTION_KEY_HERE"
    }
  )
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://api.render.com/v1/services/srv-d3e057nfte5s73f2naqg/env-vars" `
  -Method PUT `
  -Headers @{"Authorization"="Bearer $env:RENDER_API_KEY"; "Content-Type"="application/json"} `
  -Body $body

# Trigger deploy
Invoke-RestMethod `
  -Uri "https://api.render.com/v1/services/srv-d3e057nfte5s73f2naqg/deploys" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $env:RENDER_API_KEY"; "Content-Type"="application/json"} `
  -Body '{"clearCache":"clear"}'
```

---

### **Step 3: Update Local client/.env (Optional)**

**For local testing:**
```bash
# client/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY_HERE
VITE_API_URL=https://tekup-renos.onrender.com
```

**⚠️ Don't commit this to Git!**

---

## 🔧 FIX #2: Revenue API 429 Error

### **Investigation Steps:**

**Step 1: Check if endpoint exists**
```powershell
# Test revenue endpoint
Invoke-RestMethod "https://tekup-renos.onrender.com/api/dashboard/revenue?period=7d"
```

**Step 2: Check backend logs**
```powershell
# Via Render API
$env:RENDER_API_KEY = "rnd_spBHfqtMGYf51WJKgfuLL0aGvNzD"
$logs = Invoke-RestMethod `
  "https://api.render.com/v1/services/srv-d3dv61ffte5s73f1uccg/logs" `
  -Headers @{"Authorization"="Bearer $env:RENDER_API_KEY"}
$logs | Select-String "revenue" -Context 3
```

**Step 3: Check route implementation**
```bash
# Search for revenue endpoint in code
grep -r "revenue" src/api/
```

---

### **Possible Fixes:**

**Option A: Endpoint doesn't exist (most likely)**
```typescript
// Add to src/api/dashboardRoutes.ts

router.get('/revenue', async (req, res) => {
  try {
    const period = req.query.period || '7d';
    
    // Calculate revenue from bookings
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'completed'
      },
      select: {
        estimatedCost: true,
        createdAt: true
      }
    });
    
    const revenue = bookings.reduce((sum, b) => sum + (b.estimatedCost || 0), 0);
    
    res.json({
      revenue,
      period,
      bookingsCount: bookings.length
    });
  } catch (error) {
    console.error('Revenue endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});
```

**Option B: Rate limiting issue**
```typescript
// Check if rate limiter is too strict
// Look for express-rate-limit middleware in server.ts
```

**Option C: Remove revenue from frontend (quick fix)**
```typescript
// Comment out revenue fetch in Dashboard component
// Dashboard will work without it
```

---

## 🧪 VERIFICATION AFTER FIXES

### **Test 1: Clerk Production Keys**
```
1. Clear browser cache (Ctrl+Shift+Delete)
2. Visit: https://tekup-renos-1.onrender.com
3. F12 → Console
4. Expected: NO warning about development keys
5. Try login
6. Expected: Login works smoothly
```

### **Test 2: Revenue API**
```powershell
# After implementing endpoint
Invoke-RestMethod "https://tekup-renos.onrender.com/api/dashboard/revenue?period=7d"

# Expected: {"revenue": 1234, "period": "7d", "bookingsCount": 5}
```

### **Test 3: Full Dashboard**
```
1. Login to: https://tekup-renos-1.onrender.com/dashboard
2. Check all sections load:
   - Stats overview
   - Revenue chart (if fixed)
   - Customer list
   - Recent activity
3. Navigate to Customer 360
4. Verify all 3 tabs work
```

---

## 📋 ACTION PLAN (Tonight)

### **Priority 1: Fix Clerk Keys** ⏰ 10 min
```
1. Get production Clerk key from dashboard
2. Add to Render frontend environment
3. Trigger manual deploy
4. Wait 5-7 min for deployment
5. Test login
```

### **Priority 2: Investigate Revenue API** ⏰ 15 min
```
1. Search codebase for revenue endpoint
2. If missing → Add basic implementation
3. If exists → Check rate limiting
4. Test endpoint manually
5. Verify dashboard loads
```

### **Priority 3: Document Fixes** ⏰ 5 min
```
1. Update LIVE_DEPLOYMENT_MAP.md
2. Update RENDER_ENVIRONMENT_SETUP.md
3. Create PRODUCTION_ISSUES_RESOLVED.md
```

---

## 🎯 EXPECTED RESULTS

**After Fix #1 (Clerk):**
- ✅ No development key warning
- ✅ Login works reliably
- ✅ No rate limiting issues

**After Fix #2 (Revenue):**
- ✅ Dashboard loads completely
- ✅ No 429 errors in console
- ✅ Revenue data displays (or gracefully hidden)

**After Both Fixes:**
- ✅ Production-ready authentication
- ✅ Dashboard fully functional
- ✅ Ready for 2-week validation

---

## 📝 CURRENT STATUS

**Identified Issues:**
- 🔴 Clerk development keys (CRITICAL)
- 🔴 Revenue API 429 error (HIGH)
- 🟡 Jace extension spam (LOW - ignore)

**Ready to Fix:**
- ✅ Root causes identified
- ✅ Fix procedures documented
- ✅ Verification steps ready

**Next Steps:**
1. Get production Clerk key
2. Update Render environment
3. Deploy fixes
4. Test & verify

---

**Status:** Ready to execute fixes! 🚀  
**Time Estimate:** 30 minutes total  
**Impact:** Resolves all critical production issues
