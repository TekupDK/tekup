# 🎯 PRODUCTION DOMAIN MIGRATION - <www.renos.dk>

**Date:** October 7, 2025 (Late Evening)  
**Change:** Migrating from tekup-renos-1.onrender.com → <www.renos.dk>  
**Status:** 🔄 IN PROGRESS

---

## 📋 COMPLETE CHECKLIST

### ✅ **Step 1: Domain Setup (DONE)**
- [x] Domain purchased: <www.renos.dk>
- [x] DNS CNAME records added (pointing to Render)
- [ ] DNS propagation (wait 10-60 min)
- [ ] Clerk domain verified

### 🔄 **Step 2: Update Environment Variables**

#### **Frontend (Render: srv-d3e057nfte5s73f2naqg)**
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_XXXXXX  # NEW production key from Clerk
VITE_API_URL=https://tekup-renos.onrender.com  # Backend URL (unchanged for now)
VITE_FRONTEND_URL=https://www.renos.dk  # NEW DOMAIN
```

#### **Backend (Render: srv-d3dv61ffte5s73f1uccg)**
```bash
FRONTEND_URL=https://www.renos.dk  # NEW DOMAIN for CORS
CORS_ORIGIN=https://www.renos.dk  # NEW DOMAIN for CORS
ALLOWED_ORIGINS=https://www.renos.dk  # NEW DOMAIN
```

### 🔄 **Step 3: Update Code (if needed)**

Check for hardcoded URLs:
- client/src/ - Any hardcoded onrender.com URLs?
- Redirects, callbacks, etc.

### 🔄 **Step 4: Clerk Production Key**

Once DNS is verified in Clerk:
1. Get pk_live_XXXXXX key
2. Add to frontend environment
3. Remove pk_test_ key

### 🔄 **Step 5: Deploy**

1. Commit code changes
2. Push to GitHub
3. Render auto-deploys
4. Test <www.renos.dk>

---

## 🚀 EXECUTION COMMANDS

### **Update Render Environment Variables:**

```powershell
$env:RENDER_API_KEY="rnd_spBHfqtMGYf51WJKgfuLL0aGvNzD"

# Update Backend CORS
$backendEnv = @(
    @{ key = "FRONTEND_URL"; value = "https://www.renos.dk" }
    @{ key = "CORS_ORIGIN"; value = "https://www.renos.dk" }
) | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://api.render.com/v1/services/srv-d3dv61ffte5s73f1uccg/env-vars" `
  -Method PATCH `
  -Headers @{
    "Authorization" = "Bearer $env:RENDER_API_KEY"
    "Content-Type" = "application/json"
  } `
  -Body $backendEnv

# Update Frontend URLs (after getting Clerk pk_live_ key)
$frontendEnv = @(
    @{ key = "VITE_CLERK_PUBLISHABLE_KEY"; value = "pk_live_XXXXXX" }  # Replace!
    @{ key = "VITE_FRONTEND_URL"; value = "https://www.renos.dk" }
) | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://api.render.com/v1/services/srv-d3e057nfte5s73f2naqg/env-vars" `
  -Method PATCH `
  -Headers @{
    "Authorization" = "Bearer $env:RENDER_API_KEY"
    "Content-Type" = "application/json"
  } `
  -Body $frontendEnv
```

---

## 🧪 VERIFICATION STEPS

### **1. DNS Propagation Check**
```powershell
# Check DNS
nslookup www.renos.dk

# Should show CNAME pointing to Render
```

### **2. Clerk Domain Verification**
```
1. Go to Clerk dashboard
2. Check domain status
3. Wait for "Verified" status
4. Get production pk_live_ key
```

### **3. Test New Domain**
```
1. Visit: https://www.renos.dk
2. Check if it loads (may take time for DNS)
3. Try login
4. Test Customer 360
```

---

## ⏰ TIMELINE

**Now:**
- Update backend CORS URLs
- Wait for Clerk verification

**When Clerk Verified:**
- Get pk_live_ key
- Update frontend environment
- Deploy

**After Deploy:**
- Test <www.renos.dk>
- Verify login works
- Check all features

---

## 📝 NOTES

- Keep onrender.com backend URL for now
- Optional: Later add api.renos.dk subdomain
- DNS can take 10-60 minutes to propagate
- Clerk verification requires DNS to be live

---

**Status:** Ready to execute! Waiting for Clerk production key.
