# 🚀 Render.com Deployments - Komplet Oversigt

**Dato:** 22. Oktober 2025, 03:45  
**Formål:** Identificer production deployments og database dependencies

---

## 🌐 PRODUCTION SERVICES PÅ RENDER.COM

### ✅ LIVE Deployments (4 services)

#### 1. **TekupVault**

```
Service: tekupvault-api + tekupvault-worker
URL: https://tekupvault.onrender.com
Region: Frankfurt, EU
Plan: Starter
Status: 🟢 LIVE

Database:
- Nuværende: Supabase (twaoebtlusudzxshjral - Paris)
- Efter migration: Supabase (oaevagdgrasfppbrxbey - Frankfurt)

Skal opdateres:
✅ Opdater SUPABASE_URL i Render environment variables
✅ Opdater SUPABASE_ANON_KEY
✅ Opdater SUPABASE_SERVICE_KEY
✅ Opdater DATABASE_URL
```

---

#### 2. **Tekup-Billy**

```
Service: tekup-billy-mcp
URL: https://tekup-billy.onrender.com
Region: Frankfurt, EU
Plan: Starter (Docker)
Status: 🟢 LIVE

Database:
- Nuværende: Supabase (oaevagdgrasfppbrxbey - Frankfurt) ✅
- Efter migration: INGEN ÆNDRING (allerede korrekt!)

Skal opdateres:
❌ INGEN - allerede på korrekt Supabase projekt!
```

---

#### 3. **RenOS Backend**

```
Service: renos-backend
URL: https://renos-backend.onrender.com
Region: Unknown (sandsynligvis Frankfurt)
Plan: Starter
Status: 🟢 LIVE (deployed Oct 14, 2025)

Database:
- Nuværende: Supabase (oaevagdgrasfppbrxbey - Frankfurt) ✅
- Efter migration: INGEN ÆNDRING (allerede korrekt!)

Skal opdateres:
❌ INGEN - allerede på korrekt Supabase projekt!
```

---

#### 4. **RenOS Frontend**

```
Service: renos-frontend
URL: https://renos-frontend.onrender.com
Region: Unknown
Plan: Static site
Status: 🟢 LIVE

Database:
- Frontend bruger backend API
- Ingen direkte database connection

Skal opdateres:
❌ INGEN - bruger backend API
```

---

## 📋 Migration Impact på Production

### 🔴 HØJA PRIORITET - TekupVault Production

**Current Setup:**
```yaml
# TekupVault render.yaml
services:
  - type: web
    name: tekupvault-api
    envVars:
      - key: SUPABASE_URL
        value: https://twaoebtlusudzxshjral.supabase.co  # OLD
      - key: SUPABASE_ANON_KEY
        value: eyJ...  # OLD Paris projekt
      - key: SUPABASE_SERVICE_KEY
        value: eyJ...  # OLD Paris projekt
```

**Skal ændres til:**
```yaml
envVars:
  - key: SUPABASE_URL
    value: https://oaevagdgrasfppbrxbey.supabase.co  # NEW Frankfurt
  - key: SUPABASE_ANON_KEY
    value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # NEW
  - key: SUPABASE_SERVICE_KEY
    value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # NEW
```

**Hvordan opdatere:**

1. Gå til Render.com dashboard
2. Naviger til `tekupvault-api` service
3. Environment → Edit Environment Variables
4. Opdater de 3 Supabase credentials
5. **ELLER** update render.yaml og re-deploy

---

### 🟢 INGEN ÆNDRING - Billy & RenOS

**Tekup-Billy:**

- ✅ Allerede på oaevagdgrasfppbrxbey
- ✅ Environment variables korrekte
- ✅ Ingen action required

**RenOS Backend:**

- ✅ Allerede på oaevagdgrasfppbrxbey
- ✅ Environment variables korrekte
- ✅ Ingen action required

---

## 🎯 Updated Migration Plan med Render.com

### **PHASE 2.5: Update Production Environment** ⏱️ 30 min

**Efter TekupVault data er migreret lokalt:**

#### Step 1: Update Render.com Environment Variables

```bash
# Via Render.com Dashboard:
# 1. Login til dashboard.render.com
# 2. Select "tekupvault-api" service
# 3. Environment tab
# 4. Edit følgende variables:

SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo
DATABASE_URL=postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres

# 5. Save changes
# 6. Render vil automatisk re-deploy
```

#### Step 2: Monitor Deployment

```bash
# Watch Render logs for successful deploy
# Check health endpoint
curl https://tekupvault.onrender.com/health

# Expected: {"status":"healthy"}
```

#### Step 3: Test Production

```bash
# Test search endpoint
curl https://tekupvault.onrender.com/api/search?q=test

# Test MCP endpoint
curl https://tekupvault.onrender.com/.well-known/mcp.json

# Verify embeddings work
curl -X POST https://tekupvault.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

---

## 🔄 Deployment Flow

### **Development → Production**

```
LOCAL MIGRATION (Phase 2):
1. Migrer data til RenOS Supabase projekt
2. Update local .env files
3. Test locally
4. Commit changes
   ↓
PRODUCTION UPDATE (Phase 2.5):
5. Update Render environment variables
6. Render auto-deploys
7. Test production endpoints
8. Verify all works
   ↓
CLEANUP (Phase 6):
9. Decommission Paris Supabase projekt
10. Update documentation
```

---

## 📊 Render Services Summary

| Service | URL | Database | Action Needed |
|---------|-----|----------|---------------|
| **TekupVault API** | tekupvault.onrender.com | Paris → Frankfurt | ✅ Update env vars |
| **TekupVault Worker** | (background) | Paris → Frankfurt | ✅ Update env vars |
| **Tekup-Billy MCP** | tekup-billy.onrender.com | Frankfurt ✅ | ❌ None |
| **RenOS Backend** | renos-backend.onrender.com | Frankfurt ✅ | ❌ None |
| **RenOS Frontend** | renos-frontend.onrender.com | N/A | ❌ None |

---

## ⚠️ KRITISK: Zero-Downtime Strategy

### **Problem:**

- TekupVault production kører 24/7
- ChatGPT MCP integration peger på <https://tekupvault.onrender.com>
- Kan ikke have downtime

### **Løsning: Blue-Green Deployment**

#### Option A: Quick Cutover (Minimal Downtime)

```
1. Migrer data til RenOS projekt (done offline)
2. Test lokalt alt virker
3. Update Render env vars → Auto redeploy (~2-3 min)
4. Test production
5. Done
```
**Downtime:** ~2-3 minutter (under re-deploy)

---

#### Option B: Zero Downtime (Advanced)

```
1. Deploy ny "tekupvault-api-v2" service
2. Point til RenOS Supabase projekt
3. Test v2 service
4. Update DNS/load balancer
5. Decommission v1
```
**Downtime:** 0 minutter  
**Complexity:** Højere

---

**Anbefaling:** Option A er fin - 2-3 min downtime er acceptabelt

---

## 🎯 Updated Timeline

| Phase | Task | Time | Includes Render? |
|-------|------|------|------------------|
| 1 | Setup & Backup | 1-2h | ❌ Local only |
| 2 | TekupVault Migration | 2-3h | ❌ Local only |
| **2.5** | **Update Render Prod** | **30min** | **✅ Production** |
| 3 | Billy Optimization | 1h | ⚠️ Already correct |
| 4 | RendetaljeOS Update | 3-4h | ⚠️ Already correct |
| 5 | Testing | 1-2h | ✅ Test production |
| 6 | Docs & Cleanup | 1h | ✅ Update docs |
| **TOTAL** | **End-to-end** | **9.5-13.5h** | - |

---

## ✅ Checklist for Production Update

### TekupVault Render.com

- [ ] Data migreret til RenOS Supabase projekt
- [ ] Lokal testing passed
- [ ] Git committed og pushed
- [ ] Login til Render dashboard
- [ ] Update SUPABASE_URL
- [ ] Update SUPABASE_ANON_KEY
- [ ] Update SUPABASE_SERVICE_KEY
- [ ] Update DATABASE_URL (optional)
- [ ] Save changes (triggers auto-deploy)
- [ ] Monitor deployment logs
- [ ] Test <https://tekupvault.onrender.com/health>
- [ ] Test search endpoint
- [ ] Test MCP endpoint
- [ ] Verify ChatGPT integration still works

### Tekup-Billy & RenOS

- [x] Already on correct Supabase projekt ✅
- [ ] Verify health checks
- [ ] No action needed

---

## 📝 Render Dashboard Links

**Login:** <https://dashboard.render.com>

**Services:**

- TekupVault API: <https://dashboard.render.com/web/tekupvault-api>
- TekupVault Worker: <https://dashboard.render.com/web/tekupvault-worker>  
- Tekup-Billy: <https://dashboard.render.com/web/tekup-billy-mcp>
- RenOS Backend: <https://dashboard.render.com/web/renos-backend>

---

## 🚨 Rollback Plan for Production

**Hvis production fejler efter update:**

```bash
# Quick rollback i Render dashboard:
# 1. Gå til service
# 2. Environment tab
# 3. Revert til gamle values:

SUPABASE_URL=https://twaoebtlusudzxshjral.supabase.co
SUPABASE_ANON_KEY=[old Paris key]
SUPABASE_SERVICE_KEY=[old Paris key]

# 4. Save → Auto redeploy til working state
# 5. Downtime: 2-3 minutter
```

---

**Status:** Updated migration plan med Render.com production  
**Next:** Klar til at starte migration!
