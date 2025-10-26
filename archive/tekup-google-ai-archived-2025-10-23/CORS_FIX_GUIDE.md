# 🚨 CORS FIX GUIDE - Production Backend

**Problem:** Backend blokerer API requests fra frontend pga. manglende CORS headers.

**Root Cause:** Render backend mangler environment variables for CORS configuration.

---

## ✅ **Quick Fix - Add Environment Variables**

### 1. Gå til Render Dashboard
```
https://dashboard.render.com
→ Vælg "tekup-renos" (backend service)
→ Environment tab
```

### 2. Tilføj Disse Environment Variables

```ini
# Frontend URL (Required)
FRONTEND_URL=https://tekup-renos-1.onrender.com

# CORS Origin (Required)
CORS_ORIGIN=https://tekup-renos-1.onrender.com
```

### 3. Save & Deploy
```
Klik "Save Changes"
→ Backend vil auto-deploy (2-3 min)
→ CORS headers vil nu blive sat korrekt
```

---

## 🔍 **Hvordan Virker Det**

### Backend CORS Logic (src/server.ts)
```typescript
const allowedOrigins = [
  frontendUrl,              // Fra FRONTEND_URL env var
  corsOrigin,               // Fra CORS_ORIGIN env var
  "https://tekup-renos-1.onrender.com" // Hardcoded backup
].filter(Boolean);

// Hvis origin matcher, set header:
res.header("Access-Control-Allow-Origin", origin);
```

### Nuværende Problem
```
❌ FRONTEND_URL = undefined (ikke sat)
❌ CORS_ORIGIN = undefined (ikke sat)
✅ Hardcoded fallback = "https://tekup-renos-1.onrender.com"

Men: Hardcoded værdi bruges kun hvis origin matcher PRÆCIST
Browser sender Origin header → Backend checker liste → Ikke fundet → Blokerer
```

---

## 📊 **Expected Behavior Efter Fix**

### Before (Nu)
```
Request: Origin: https://tekup-renos-1.onrender.com
Backend: Tjekker allowedOrigins = [undefined, undefined, "...onrender.com"]
Backend: Origin matcher IKKE (pga. array filter)
Response: Ingen Access-Control-Allow-Origin header
Browser: ❌ CORS ERROR
```

### After (Med Env Vars)
```
Request: Origin: https://tekup-renos-1.onrender.com
Backend: Tjekker allowedOrigins = ["...onrender.com", "...onrender.com", "...onrender.com"]
Backend: Origin matcher! ✅
Response: Access-Control-Allow-Origin: https://tekup-renos-1.onrender.com
Browser: ✅ SUCCESS
```

---

## 🧪 **Verification Steps**

### 1. Check Render Logs (Efter Deploy)
```
Render Dashboard → tekup-renos → Logs

Søg efter:
"CORS Configuration: {
  frontendUrl: 'https://tekup-renos-1.onrender.com',
  corsOrigin: 'https://tekup-renos-1.onrender.com',
  allowedOrigins: [...],
}"
```

### 2. Test API Endpoint
```powershell
# Test fra PowerShell (skal returnere CORS header)
curl.exe -I https://tekup-renos.onrender.com/api/health -H "Origin: https://tekup-renos-1.onrender.com"

# Forventet output:
# Access-Control-Allow-Origin: https://tekup-renos-1.onrender.com
```

### 3. Test i Browser
```
1. Gå til https://tekup-renos-1.onrender.com/dashboard
2. Åbn DevTools (F12) → Console
3. Refresh siden (F5)
4. Forventet: Ingen CORS errors
5. Dashboard widgets skal loade data
```

---

## 🚀 **Alternative Fix (Code Change)**

Hvis du ikke kan ændre env vars nu, kan vi hardcode det midlertidigt:

### Option A: Hardcode i server.ts (Quick & Dirty)
```typescript
// src/server.ts linje ~103
const allowedOrigins = process.env.NODE_ENV === "production"
    ? [
        "https://tekup-renos-1.onrender.com", // Hardcoded
        "https://tekup-renos.onrender.com"    // Backend URL også
      ]
    : [/* dev origins */];
```

**Pros:** Virker med det samme efter deploy  
**Cons:** Ikke flexibelt, hardcoded URLs

### Option B: Mere Permissive CORS (Development Only)
```typescript
// src/server.ts linje ~128
if (process.env.NODE_ENV !== "production") {
    res.header("Access-Control-Allow-Origin", origin || "*");
} else {
    // Temporarily allow all origins (NOT RECOMMENDED FOR PRODUCTION)
    res.header("Access-Control-Allow-Origin", origin || "*");
}
```

**⚠️ SECURITY WARNING:** Tillader alle origins - kun til debugging!

---

## 📝 **Environment Variables Checklist**

### Backend (tekup-renos)
```ini
✅ DATABASE_URL             # Already set
✅ GOOGLE_PRIVATE_KEY       # Already set
✅ GEMINI_KEY              # Already set
❌ FRONTEND_URL            # MISSING - Add this!
❌ CORS_ORIGIN             # MISSING - Add this!
```

### Frontend (tekup-renos-frontend)
```ini
✅ VITE_CLERK_PUBLISHABLE_KEY  # Already set
✅ VITE_API_URL                # Should be backend URL
```

---

## 🎯 **Recommended Action**

### Immediate (5 minutes)
1. ✅ Gå til Render Dashboard
2. ✅ Add FRONTEND_URL + CORS_ORIGIN env vars
3. ✅ Save → Auto-deploy
4. ✅ Vent 2-3 min på deploy
5. ✅ Refresh browser + test

### Verification (2 minutes)
6. ✅ Check Render logs for CORS config
7. ✅ Test API endpoint med curl
8. ✅ Test Dashboard i browser

### Cleanup (Optional)
9. 📝 Document env vars i README
10. 📝 Add til .env.example

---

## ❓ **FAQ**

### Q: Hvorfor virkede nogle widgets?
**A:** Widgets der bruger mock data eller localStorage virkede. Kun widgets med API calls fejlede.

### Q: Hvorfor sker det først nu?
**A:** Frontend blev deployed til ny URL (`tekup-renos-1.onrender.com`). Backend kendte ikke denne origin.

### Q: Er det sikkerhedsproblem?
**A:** Nej, CORS er en browser security feature. Det er godt at det blokerer ukendte origins.

### Q: Skal jeg også opdatere frontend env vars?
**A:** Tjek at `VITE_API_URL=https://tekup-renos.onrender.com` er sat korrekt.

---

## ✅ **Success Criteria**

Efter fix skal du se:

### Console (DevTools)
```
✅ Ingen CORS errors
✅ API requests succeeder
✅ Dashboard widgets loader data
```

### Network Tab
```
Response Headers:
✅ Access-Control-Allow-Origin: https://tekup-renos-1.onrender.com
✅ Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
✅ Access-Control-Allow-Credentials: true
```

### Dashboard
```
✅ Cache stats vises (50% hit rate)
✅ Email quality stats vises
✅ Follow-up tracking vises
✅ Rate limits vises
✅ Revenue chart vises
```

---

**Estimated Fix Time:** 5 minutes  
**Deployment Time:** 2-3 minutes  
**Total:** ~8 minutes til working dashboard 🚀
