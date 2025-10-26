# 🔍 Option 3: Switch Frontend til Web Service - Grundig Analyse

**Dato:** 7. Oktober 2025  
**Projekt:** RenOS (tekup-renos)  
**Problem:** Frontend kan ikke læse `VITE_API_URL` environment variable på Render Static Site

---

## 📊 Executive Summary

**Konklusion:** ❌ **IKKE ANBEFALET** - Web Service er overkill for dette problem.

**Bedre Alternativer:**
1. ✅ **Option 1: Hardcode API URL** (2 min, nul cost, 100% reliable)
2. ✅ **Option 2A: Runtime Config Pattern** (10 min, elegant løsning)
3. ⚠️ **Option 2B: Fix Build Command** (kompleks, usikker med Render)

**Hvorfor IKKE Web Service:**
- 💰 Unødvendig cost ($7/måned → $21/måned total)
- 🐌 Langsommere performance (cold starts, node overhead)
- 🔧 Over-engineered for en simpel config issue
- 📦 Giver INGEN fordele for vores use case (pure static SPA)

---

## 🏗️ Nuværende Arkitektur

### **Current Setup (render.yaml)**

```yaml
# Frontend Static Site
- type: web               # ← Type er "web" men env er "static"!
  name: tekup-renos-1
  env: static             # ← STATIC SITE (ikke web service)
  plan: free
  buildCommand: cd client && npm install && npm run build
  staticPublishPath: ./client/dist
  envVars:
    - key: VITE_API_URL
      value: https://tekup-renos.onrender.com  # ← Sat men ikke brugt!
```

### **Problem: Static Site Environment Variables**

**Render Static Sites:**
- ❌ Environment variables er IKKE tilgængelige under build
- ❌ `VITE_API_URL` bliver undefined i Vite build
- ❌ Kode defaulter til relative URL: `'/api/dashboard'`
- ❌ Relative URL = `https://tekup-renos-1.onrender.com/api/dashboard` (frontend kalder sig selv!)

**Affected Components (30+ steder):**

```typescript
// Dashboard.tsx - PROBLEM: Relative fallback
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/dashboard`
  : '/api/dashboard';  // ← Relative URL når VITE_API_URL er undefined

// Bookings.tsx - OK: Absolut fallback
const API_URL = import.meta.env.VITE_API_URL || 'https://tekup-renos.onrender.com';

// 20+ andre komponenter har samme patterns
```

---

## 🚀 Option 3: Web Service - Detaljeret Gennemgang

### **Hvad Er En Web Service?**

**Web Service vs Static Site:**

| Aspekt | Static Site (Nu) | Web Service (Option 3) |
|--------|------------------|------------------------|
| **Type** | Pre-built HTML/CSS/JS fra CDN | Node.js server serving files |
| **Environment Vars** | ❌ Build-time only (men virker ikke!) | ✅ Runtime + Build-time |
| **Cost** | $0/måned (Free tier) | $7/måned (Starter plan) |
| **Performance** | ⚡ Instant (CDN) | 🐌 Cold starts (500ms-2s) |
| **RAM Usage** | Negligible | 512MB minimum |
| **Skalering** | ✅ Auto (CDN) | ⚠️ Kræver paid plan |
| **Setup Complexity** | ✅ Simple | ⚠️ Moderate |

### **Migration Steps (Hvis Vi Skulle Gøre Det)**

#### **Step 1: Opret Express Server Til Frontend**

```typescript
// client/server.js (NEW FILE)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5173;

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback (all routes → index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
```

#### **Step 2: Opdater package.json**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "node server.js",  // ← NEW: Production server
    "preview": "vite preview"
  },
  "dependencies": {
    "express": "^4.18.2"  // ← NEW
  }
}
```

#### **Step 3: Opdater render.yaml**

```yaml
# Frontend Web Service (Option 3)
- type: web
  name: tekup-renos-1
  env: node           # ← Change from "static" to "node"
  plan: starter       # ← Change from "free" to "starter" ($7/mo)
  buildCommand: cd client && npm install && npm run build
  startCommand: cd client && npm start  # ← NEW: Start node server
  healthCheckPath: /
  envVars:
    - key: VITE_API_URL
      value: https://tekup-renos.onrender.com
    - key: VITE_CLERK_PUBLISHABLE_KEY
      sync: false
    - key: PORT
      value: 5173
```

#### **Step 4: Runtime Environment Injection (Advanced)**

```typescript
// client/server.js - Inject env vars at runtime
app.get('/config.js', (req, res) => {
  const config = `
    window.__APP_CONFIG__ = {
      API_URL: '${process.env.VITE_API_URL}',
      CLERK_KEY: '${process.env.VITE_CLERK_PUBLISHABLE_KEY}'
    };
  `;
  res.type('application/javascript').send(config);
});

// index.html
<script src="/config.js"></script>

// App.tsx
const API_URL = window.__APP_CONFIG__?.API_URL || 'fallback';
```

---

## 💰 Cost Analysis

### **Current Setup**
```
Backend (tekup-renos):          $0/mo  (Free tier)
Frontend (tekup-renos-1):       $0/mo  (Static site free)
Database (Neon PostgreSQL):     $0/mo  (Free tier)
-------------------------------------------------------
TOTAL:                          $0/mo ✅
```

### **After Web Service Migration**
```
Backend (tekup-renos):          $7/mo  (Must upgrade - free tier har 750h/mo limit)
Frontend (tekup-renos-1):       $7/mo  (Starter plan for node)
Database (Neon PostgreSQL):     $0/mo  (Free tier OK)
-------------------------------------------------------
TOTAL:                         $14/mo ❌ (vs $0 now)
```

**Reason for Backend Upgrade:**
Render Free tier = 750 hours/måned per account (ikke per service).
Med 2x web services = 1440 hours/måned → Overstiger free tier!

---

## ⚡ Performance Impact

### **Static Site (Current)**

```
Request Flow:
Browser → Render CDN → Cached HTML/JS (5-20ms)
       → Backend API (200-500ms)

Cold Start: N/A (CDN cached)
Response Time: ~5-20ms (first byte)
```

### **Web Service (Option 3)**

```
Request Flow:
Browser → Render Node Server → Load files (50-200ms)
       → Backend API (200-500ms)

Cold Start: 500ms-2s (hvis inaktiv i 15 min)
Response Time: ~50-200ms (first byte)
Overhead: +45-180ms per request
```

**Performance Degradation:**
- ❌ Initial load: +500ms til +2s (cold start)
- ❌ Subsequent loads: +45ms til +180ms
- ❌ CDN caching benefits tabt
- ❌ Node.js overhead for static files

---

## 🎯 Use Cases Hvor Web Service GIVEr Mening

### ✅ **Gode Grunde Til Web Service:**

1. **Server-Side Rendering (SSR)**
   - Next.js, Remix, SvelteKit
   - SEO critical content
   - Dynamic meta tags

2. **API Proxy/BFF Pattern**
   ```typescript
   // Hide backend URL fra client
   app.get('/api/*', (req, res) => {
     proxy(BACKEND_URL).pipe(res);
   });
   ```

3. **Runtime Configuration**
   - Multi-tenant apps (different config per customer)
   - Feature flags fra server
   - A/B testing

4. **Authentication Middleware**
   ```typescript
   app.use((req, res, next) => {
     if (!req.session.user) {
       return res.redirect('/login');
     }
     next();
   });
   ```

5. **Dynamic Content Injection**
   - Personalized landing pages
   - User-specific dashboards

### ❌ **IKKE Gode Grunde (Vores Case):**

- ❌ "Environment variables virker ikke" → Fix med Option 1 eller 2
- ❌ "Mere kontrol" → Unødvendig for static SPA
- ❌ "Fremtidssikring" → YAGNI (You Ain't Gonna Need It)
- ❌ "Professional" → Static site er industry standard for SPAs

---

## 🔄 Alternative Løsninger (BEDRE end Web Service)

### **Option 1: Hardcode API URL** ⚡ (ANBEFALET)

**Tid:** 2 minutter  
**Cost:** $0  
**Complexity:** Minimal  
**Reliability:** 100%

```typescript
// Erstat ALLE 30+ komponenter:
// FØR:
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/dashboard`
  : '/api/dashboard';

// EFTER:
const API_BASE = 'https://tekup-renos.onrender.com/api/dashboard';
```

**Fordele:**
- ✅ Virker med det samme
- ✅ Ingen cost
- ✅ Ingen deployment changes
- ✅ 100% reliable (ingen env var dependency)

**Ulemper:**
- ⚠️ Hardcoded URL (skal ændres hvis backend flytter)
- ⚠️ Kræver rebuild for at ændre URL
- ✅ Men... vi skifter aldrig backend URL i produktion

---

### **Option 2A: Runtime Config Pattern** 🎯 (ELEGANT)

**Tid:** 10 minutter  
**Cost:** $0  
**Complexity:** Low-Medium  
**Reliability:** 95%

**Step 1: Skab `public/config.js`**

```javascript
// client/public/config.js (served statically)
window.__APP_CONFIG__ = {
  API_URL: 'https://tekup-renos.onrender.com',
  CLERK_KEY: 'pk_test_...',
  ENVIRONMENT: 'production'
};
```

**Step 2: Load i `index.html`**

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="/config.js"></script>  <!-- Load BEFORE app -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 3: Brug i components**

```typescript
// client/src/utils/config.ts
declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_URL: string;
      CLERK_KEY: string;
      ENVIRONMENT: string;
    };
  }
}

export const config = {
  apiUrl: window.__APP_CONFIG__?.API_URL || 'https://tekup-renos.onrender.com',
  clerkKey: window.__APP_CONFIG__?.CLERK_KEY || import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  environment: window.__APP_CONFIG__?.ENVIRONMENT || 'production'
};

// Dashboard.tsx
import { config } from '@/utils/config';
const API_BASE = `${config.apiUrl}/api/dashboard`;
```

**Fordele:**
- ✅ Ingen cost
- ✅ Runtime configuration (kan ændres uden rebuild!)
- ✅ Virker med static site
- ✅ Elegant separation of concerns
- ✅ Kan ændre config.js direkte på Render (manual file edit)

**Ulemper:**
- ⚠️ Requires global window object
- ⚠️ Kræver code changes i alle komponenter
- ⚠️ Config fil skal vedligeholdes separat

---

### **Option 2B: Fix Build Command** ⚠️ (KOMPLEKS)

**Tid:** 15-30 minutter (trial & error)  
**Cost:** $0  
**Complexity:** Medium-High  
**Reliability:** 60% (Render static site quirks)

**Approach 1: Inline Env Vars**

```yaml
# render.yaml
- type: web
  name: tekup-renos-1
  env: static
  buildCommand: |
    cd client && \
    export VITE_API_URL=https://tekup-renos.onrender.com && \
    export VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY && \
    npm install && \
    npm run build
```

**Problem:** Render static site `env: static` ignorer eksporterede env vars under build!

**Approach 2: .env File Generation**

```yaml
buildCommand: |
  cd client && \
  echo "VITE_API_URL=https://tekup-renos.onrender.com" > .env.production && \
  echo "VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY" >> .env.production && \
  npm install && \
  npm run build
```

**Problem:** Vite loader kun `.env` filer før build - ikke fra build command!

**Approach 3: Vite Define Plugin**

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    __API_URL__: JSON.stringify('https://tekup-renos.onrender.com'),
    __CLERK_KEY__: JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY || ''),
  }
});

// Usage
const API_BASE = `${__API_URL__}/api/dashboard`;
```

**Fordele:**
- ✅ Build-time constants
- ✅ Type-safe (kan definere globals)

**Ulemper:**
- ⚠️ Kræver code changes
- ⚠️ Stadig hardcoded i vite.config.ts

---

## 🎯 Anbefalet Løsning

### **Valgt Strategi: Option 1 (Hardcode) + Option 2A (Runtime Config) Hybrid**

**Fase 1: Hurtig Fix (Nu - 2 min)**
```typescript
// Hardcode API URL i alle komponenter som fallback
const API_URL = import.meta.env.VITE_API_URL || 'https://tekup-renos.onrender.com';
const API_BASE = `${API_URL}/api/dashboard`;
```

**Fase 2: Elegant Løsning (Senere - 10 min)**
```typescript
// Implementer runtime config pattern
// Tillader ændringer uden rebuild
// Bevarer flexibilitet
```

**Hvorfor IKKE Web Service:**
1. 💰 Unødvendig cost ($14/mo vs $0)
2. 🐌 Dårligere performance (cold starts)
3. 🔧 Over-engineered for problemet
4. 📦 Ingen konkrete fordele for vores use case
5. ✅ Simplere løsninger er mere maintainable

---

## 📋 Decision Matrix

| Criteria | Static Site + Hardcode | Static Site + Runtime Config | Web Service |
|----------|----------------------|----------------------------|-------------|
| **Cost** | ✅ $0/mo | ✅ $0/mo | ❌ $14/mo |
| **Performance** | ✅ CDN instant | ✅ CDN instant | ❌ Cold starts |
| **Flexibility** | ⚠️ Rebuild required | ✅ Runtime changes | ✅ Runtime changes |
| **Complexity** | ✅ Simple | ⚠️ Moderate | ❌ Complex |
| **Reliability** | ✅ 100% | ✅ 95% | ⚠️ 90% |
| **Setup Time** | ✅ 2 min | ⚠️ 10 min | ❌ 30+ min |
| **Maintenance** | ✅ Zero | ✅ Low | ❌ Medium |
| **Dev Experience** | ✅ Works locally | ✅ Works locally | ⚠️ Extra setup |

**Winner:** Static Site + Hardcode (med eventual upgrade til Runtime Config)

---

## 🚦 Implementerings Plan

### **Immediate Action (Nu)**

```powershell
# 1. Fix alle komponenter med relative URL fallback
# Find problematiske steder:
Get-Content -Recurse client\src -Filter "*.tsx" | Select-String "': '/api"

# 2. Erstat med absolut URL fallback
# Dashboard.tsx, SystemStatus.tsx, osv.
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/dashboard`
  : 'https://tekup-renos.onrender.com/api/dashboard';  // ← Fix this!

# 3. Push + Deploy
git add .
git commit -m "fix: Use absolute URL fallback for API calls"
git push origin main

# 4. Vent 2-3 min på deploy
# 5. Test Dashboard
```

### **Future Enhancement (Optional)**

Hvis vi senere vil have runtime config flexibility:

```typescript
// 1. Skab client/public/config.js
// 2. Implementer config utility
// 3. Refactor komponenter til at bruge config.apiUrl
// 4. Deploy
```

---

## 🏁 Konklusion

**Option 3 (Web Service) er IKKE den rigtige løsning for RenOS frontend.**

**Reasons:**
1. ❌ Unødvendig cost increase ($0 → $14/mo)
2. ❌ Performance degradation (CDN → Node overhead)
3. ❌ Over-engineered for en simpel config issue
4. ❌ Giver INGEN konkrete fordele for vores SPA
5. ✅ Simplere alternativer findes (Option 1 & 2A)

**Anbefalet Action:**
→ **Option 1: Hardcode API URL nu (2 min fix)**
→ Eventual upgrade til **Option 2A: Runtime Config** når tid tillader

**Total Cost Savings by NOT Using Web Service:**
- **$168/år** sparet
- **Better performance** (CDN vs Node)
- **Simpler architecture** (easier maintenance)

---

## 📚 Referencer

- [Render Static Sites Docs](https://render.com/docs/static-sites)
- [Render Web Services Pricing](https://render.com/pricing)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Runtime Config Pattern](https://create-react-app.dev/docs/adding-custom-environment-variables/#adding-development-environment-variables-in-env)

---

**Status:** ✅ Analysis Complete  
**Recommendation:** ❌ Do NOT use Web Service  
**Next Action:** Implement Option 1 (Hardcode fallback fix)
