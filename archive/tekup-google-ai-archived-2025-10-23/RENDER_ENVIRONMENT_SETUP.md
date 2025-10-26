# 🔐 Render Environment Variables - Complete Setup

**Date:** October 7, 2025  
**Purpose:** Document all environment variables needed for RenOS deployment  
**Status:** ✅ Production configuration guide

---

## 🎯 OVERVIEW

RenOS has **TWO Render services:**
1. **Backend** (tekup-renos) - Node.js server
2. **Frontend** (tekup-renos-1) - Static site (Vite build)

Each needs different environment variables!

---

## 🔧 BACKEND ENVIRONMENT VARIABLES

**Service:** tekup-renos  
**Service ID:** srv-d3dv61ffte5s73f1uccg  
**URL:** <https://tekup-renos.onrender.com>

### **Required Variables:**

#### 1. `DATABASE_URL`
```
postgresql://rendetalje-owner:XXXXX@ep-dawn-union-a25t1w2n.eu-central-1.aws.neon.tech/rendetalje?sslmode=require
```
- **Purpose:** Neon PostgreSQL connection string
- **Used by:** Prisma ORM
- **Critical:** ✅ App crashes without this

#### 2. `GEMINI_KEY`
```
AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
- **Purpose:** Google Gemini AI API key
- **Used by:** Email auto-response, AI features
- **Critical:** ✅ AI features won't work without this

#### 3. `GOOGLE_PRIVATE_KEY`
```
-----BEGIN PRIVATE KEY-----
XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-----END PRIVATE KEY-----
```
- **Purpose:** Google Service Account private key
- **Used by:** Gmail API, Calendar API
- **Critical:** ✅ Email/calendar features won't work
- **⚠️ Format:** Must escape newlines as `\n` OR paste as multi-line

#### 4. `GOOGLE_IMPERSONATED_USER`
```
info@rendetalje.dk
```
- **Purpose:** Email to impersonate with domain-wide delegation
- **Used by:** Gmail/Calendar access
- **Critical:** ✅ Must match service account delegation

#### 5. `FRONTEND_URL`
```
https://tekup-renos-1.onrender.com
```
- **Purpose:** CORS configuration
- **Used by:** Express CORS middleware
- **Critical:** ✅ Frontend can't call backend without this

#### 6. `PORT`
```
3000
```
- **Purpose:** Server port
- **Used by:** Express server
- **Critical:** 🟡 Render auto-sets this, but good to document

#### 7. `NODE_ENV`
```
production
```
- **Purpose:** Environment mode
- **Used by:** Logging, error handling
- **Critical:** 🟡 Render auto-sets this

#### 8. `RUN_MODE` (Optional)
```
live
```
- **Purpose:** Dry-run vs live execution
- **Used by:** Email sending, calendar booking
- **Critical:** 🟡 Defaults to 'dry-run' if not set
- **Values:** `dry-run` | `live`

#### 9. `FIRECRAWL_API_KEY` (Optional - Phase 2)
```
fc-4e9c4f303c684df89902c55c6591e10a
```
- **Purpose:** Firecrawl web scraping API
- **Used by:** firecrawlService.ts (Phase 2 features)
- **Critical:** 🟢 Not needed for Phase 0

---

### **Backend Environment Summary:**

| Variable | Required | Value |
|----------|----------|-------|
| `DATABASE_URL` | ✅ YES | Neon PostgreSQL URL |
| `GEMINI_KEY` | ✅ YES | Google AI API key |
| `GOOGLE_PRIVATE_KEY` | ✅ YES | Service account key |
| `GOOGLE_IMPERSONATED_USER` | ✅ YES | <info@rendetalje.dk> |
| `FRONTEND_URL` | ✅ YES | Frontend Render URL |
| `PORT` | 🟡 Auto | 3000 |
| `NODE_ENV` | 🟡 Auto | production |
| `RUN_MODE` | 🟢 Optional | live (or dry-run) |
| `FIRECRAWL_API_KEY` | 🟢 Optional | Phase 2 only |

---

## 🌐 FRONTEND ENVIRONMENT VARIABLES

**Service:** tekup-renos-1  
**Service ID:** srv-d3e057nfte5s73f2naqg  
**URL:** <https://tekup-renos-1.onrender.com>

### **Required Variables:**

#### 1. `VITE_API_URL`
```
https://tekup-renos.onrender.com
```
- **Purpose:** Backend API base URL
- **Used by:** All API calls from frontend
- **Critical:** ✅ Frontend can't fetch data without this
- **⚠️ Note:** Must include `https://`, no trailing slash

#### 2. `VITE_CLERK_PUBLISHABLE_KEY`
```
pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
- **Purpose:** Clerk authentication public key
- **Used by:** ClerkProvider in main.tsx
- **Critical:** ✅ Users can't login without this

---

### **Frontend Environment Summary:**

| Variable | Required | Value |
|----------|----------|-------|
| `VITE_API_URL` | ✅ YES | Backend Render URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ YES | Clerk public key |

---

## 🧪 HOW TO VERIFY ENVIRONMENT VARIABLES

### **Method 1: Check Render Dashboard**

**Backend:**
1. Go to: <https://dashboard.render.com/web/srv-d3dv61ffte5s73f1uccg>
2. Click "Environment" tab
3. Verify all variables listed above exist

**Frontend:**
1. Go to: <https://dashboard.render.com/static/srv-d3e057nfte5s73f2naqg>
2. Click "Environment" tab
3. Verify VITE_* variables exist

---

### **Method 2: Test Backend Endpoints**

```powershell
# Test health (doesn't need DB)
Invoke-RestMethod "https://tekup-renos.onrender.com/health"
# Expected: {"status":"ok","timestamp":"..."}

# Test database connection
Invoke-RestMethod "https://tekup-renos.onrender.com/api/dashboard/customers"
# Expected: Array of customers
# ❌ If fails: DATABASE_URL wrong

# Test AI feature
Invoke-RestMethod "https://tekup-renos.onrender.com/api/dashboard/stats/overview"
# Expected: Stats object
# ❌ If fails: GEMINI_KEY or DATABASE_URL wrong
```

---

### **Method 3: Check Frontend Console**

```
1. Open: https://tekup-renos-1.onrender.com
2. F12 → Console tab
3. Type: console.log(import.meta.env)
4. Check if VITE_API_URL and VITE_CLERK_PUBLISHABLE_KEY exist
```

**⚠️ Note:** Vite only exposes `VITE_*` prefixed variables to browser!

---

## 🔧 HOW TO SET ENVIRONMENT VARIABLES

### **Via Render Dashboard (Recommended):**

**Backend:**
```
1. Go to: https://dashboard.render.com/web/srv-d3dv61ffte5s73f1uccg
2. Click "Environment" tab
3. Click "Add Environment Variable"
4. Enter key and value
5. Click "Save Changes"
6. Render auto-deploys with new env vars
```

**Frontend:**
```
1. Go to: https://dashboard.render.com/static/srv-d3e057nfte5s73f2naqg
2. Click "Environment" tab
3. Add VITE_* variables
4. Save Changes
5. Trigger manual deploy (frontend doesn't auto-deploy on env change)
```

---

### **Via Render API (Advanced):**

```powershell
$env:RENDER_API_KEY = "rnd_spBHfqtMGYf51WJKgfuLL0aGvNzD"

# Update backend env var
$body = @{
  envVars = @(
    @{
      key = "GEMINI_KEY"
      value = "AIzaSyXXXXXXXXXXXXXXX"
    }
  )
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://api.render.com/v1/services/srv-d3dv61ffte5s73f1uccg/env-vars" `
  -Method PATCH `
  -Headers @{"Authorization"="Bearer $env:RENDER_API_KEY"} `
  -Body $body `
  -ContentType "application/json"
```

---

## 🚨 COMMON PROBLEMS

### **Problem 1: Frontend can't reach backend**

**Symptom:** CORS errors in browser console  
**Cause:** `VITE_API_URL` or `FRONTEND_URL` wrong

**Fix:**
```
Backend FRONTEND_URL must match Frontend URL exactly:
  Backend: FRONTEND_URL=https://tekup-renos-1.onrender.com
  Frontend: VITE_API_URL=https://tekup-renos.onrender.com
```

---

### **Problem 2: Users can't login**

**Symptom:** "Missing Clerk Publishable Key" error  
**Cause:** `VITE_CLERK_PUBLISHABLE_KEY` not set

**Fix:**
```
1. Get key from: https://dashboard.clerk.com/apps/app_XXX/api-keys
2. Add to Frontend environment
3. Redeploy frontend
```

---

### **Problem 3: Database connection fails**

**Symptom:** 500 errors on API calls  
**Cause:** `DATABASE_URL` wrong or database unreachable

**Fix:**
```
1. Get correct URL from: https://console.neon.tech/app/projects/
2. Verify format: postgresql://user:pass@host/db?sslmode=require
3. Update backend environment
4. Redeploy backend
```

---

### **Problem 4: GOOGLE_PRIVATE_KEY format error**

**Symptom:** "Error parsing private key" in logs  
**Cause:** Newlines not escaped properly

**Fix:**
```
Option A: Escape newlines as \n
  -----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n

Option B: Use multi-line string in Render dashboard
  Click "Multi-line" checkbox when adding variable
```

---

## 📋 ENVIRONMENT VARIABLES CHECKLIST

### **Before Deployment:**
- [ ] All backend required vars set
- [ ] All frontend required vars set
- [ ] DATABASE_URL tested (can connect)
- [ ] GOOGLE_PRIVATE_KEY format correct (no parse errors)
- [ ] FRONTEND_URL matches actual frontend URL
- [ ] VITE_API_URL matches actual backend URL
- [ ] CLERK keys from correct environment (test vs prod)

### **After Deployment:**
- [ ] Backend health endpoint works
- [ ] Frontend loads without errors
- [ ] Users can login
- [ ] API calls work (no CORS errors)
- [ ] Database queries work
- [ ] AI features respond

---

## 🔐 SECURITY NOTES

**DO NOT:**
- ❌ Commit environment variables to Git
- ❌ Share keys in Slack/Discord
- ❌ Use production keys in development
- ❌ Expose GOOGLE_PRIVATE_KEY to frontend

**DO:**
- ✅ Store keys in password manager (1Password, LastPass)
- ✅ Rotate keys if exposed
- ✅ Use Render's built-in secrets storage
- ✅ Limit service account permissions to minimum needed
- ✅ Monitor Render logs for security issues

---

## 📝 WHERE VARIABLES ARE USED IN CODE

### **Backend:**

**DATABASE_URL:**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Auto-used by Prisma Client
const prisma = new PrismaClient()
```

**GEMINI_KEY:**
```typescript
// src/config.ts
export const env = {
  GEMINI_KEY: process.env.GEMINI_KEY || '',
}

// src/llm/geminiProvider.ts
const genAI = new GoogleGenerativeAI(env.GEMINI_KEY);
```

**GOOGLE_PRIVATE_KEY:**
```typescript
// src/services/googleAuth.ts
const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: [...],
  subject: process.env.GOOGLE_IMPERSONATED_USER,
});
```

**FRONTEND_URL:**
```typescript
// src/server.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

---

### **Frontend:**

**VITE_API_URL:**
```typescript
// client/src/components/Customer360.tsx
const API_URL = import.meta.env.VITE_API_URL || 'https://tekup-renos.onrender.com';

// Used in fetch calls
const response = await fetch(`${API_URL}/api/dashboard/customers`);
```

**VITE_CLERK_PUBLISHABLE_KEY:**
```typescript
// client/src/main.tsx
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
)
```

---

## 🎯 QUICK REFERENCE

**Get all backend env vars:**
```powershell
$env:RENDER_API_KEY = "rnd_spBHfqtMGYf51WJKgfuLL0aGvNzD"
$service = Invoke-RestMethod `
  "https://api.render.com/v1/services/srv-d3dv61ffte5s73f1uccg" `
  -Headers @{"Authorization"="Bearer $env:RENDER_API_KEY"}
$service.service.serviceDetails.env
```

**Test if backend has correct DATABASE_URL:**
```powershell
# If this works, DATABASE_URL is correct:
Invoke-RestMethod "https://tekup-renos.onrender.com/api/dashboard/customers"
```

**Test if frontend has correct VITE_API_URL:**
```javascript
// In browser console on https://tekup-renos-1.onrender.com:
console.log(import.meta.env.VITE_API_URL)
// Should print: "https://tekup-renos.onrender.com"
```

---

**Status:** Complete environment variables documentation! ✅  
**Next:** Test live deployment and fix any env var issues
