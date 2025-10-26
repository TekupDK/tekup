# Frontend API URL Fix - Kritisk Problem Identificeret

## 🔍 Problem Analyse

### Symptom
- QuoteStatusTracker **ER deployed** og synlig på <www.renos.dk> ✅
- Men viser fejl: "Failed to fetch quote tracking data" ❌

### Root Cause Identificeret
Frontend kalder **forkert API URL**:

```
❌ Frontend kalder:  https://api.renos.dk/api/dashboard/quotes/status-tracking (404)
✅ Backend er på:     https://tekup-renos.onrender.com/api/dashboard/quotes/status-tracking (200)
```

### Browser Console Fejl
```
ERROR: Failed to load resource: the server responded with a status of 404 ()
URL: https://api.renos.dk/api/dashboard/quotes/status-tracking
```

### Verifikation
```powershell
# Backend API virker:
Invoke-WebRequest "https://tekup-renos.onrender.com/api/dashboard/quotes/status-tracking"
# Returns: 200 OK ✅

# Frontend kalder forkert URL:
# Browser console viser: https://api.renos.dk/api/dashboard/quotes/status-tracking
# Returns: 404 ❌
```

## 📋 Render Configuration

### render.yaml (korrekt konfigureret)
```yaml
# Frontend Static Site
- type: web
  name: tekup-renos-1
  env: static
  envVars:
    - key: VITE_API_URL
      value: https://tekup-renos.onrender.com  # ✅ KORREKT
```

### Problem
Render frontend service bruger IKKE environment variablen ved build time.  
Den bygger med en **cached eller standard værdi** i stedet.

## 🔧 Løsning

### Option 1: Manuel Render Dashboard Fix (ANBEFALET)
1. Gå til <https://dashboard.render.com>
2. Find service: **tekup-renos-1** (frontend)
3. Gå til **Settings → Environment**
4. Verificer at `VITE_API_URL = https://tekup-renos.onrender.com`
5. Klik **"Manual Deploy"** → **"Clear build cache & deploy"**
6. Vent 3-5 minutter på rebuild

### Option 2: Opdater Environment Variable via Render Dashboard
Hvis VITE_API_URL **IKKE** er sat korrekt:
1. Settings → Environment
2. Edit `VITE_API_URL`
3. Sæt til: `https://tekup-renos.onrender.com`
4. Save changes
5. Trigger redeploy

### Option 3: Update render.yaml og force redeploy
```bash
# Tilføj en kommentar for at trigger rebuild
git commit --allow-empty -m "fix: force frontend rebuild with correct VITE_API_URL"
git push origin main
```

## ✅ Verifikation Efter Fix

### Test 1: Check Browser Console
1. Gå til <www.renos.dk>
2. Åbn DevTools (F12) → Console
3. QuoteStatusTracker skulle IKKE vise 404 fejl
4. Check at den kalder: `https://tekup-renos.onrender.com/api/dashboard/quotes/status-tracking`

### Test 2: Visual Verification
QuoteStatusTracker skulle vise:
```
📊 Tilbudsoversigt
├─ Konverteringsrate: X%
├─ Accepteret: X tilbud
├─ Gns. værdi: X kr
└─ Status fordeling med bar charts
```

I stedet for:
```
❌ Fejl: Failed to fetch quote tracking data
```

## 📊 Komplet Fejl Flow

```mermaid
Browser (www.renos.dk)
  └─> QuoteStatusTracker komponent loads ✅
      └─> Fetcher data fra API
          └─> Kalder: api.renos.dk/api/dashboard/quotes/status-tracking ❌
              └─> 404 Not Found
                  └─> Viser fejl i UI

EXPECTED FLOW:
Browser (www.renos.dk)
  └─> QuoteStatusTracker komponent loads ✅
      └─> Fetcher data fra API
          └─> Kalder: tekup-renos.onrender.com/api/dashboard/quotes/status-tracking ✅
              └─> 200 OK med data
                  └─> Viser metrics i UI ✅
```

## 🎯 Konklusion

**DET GODE:**
- ✅ Frontend er deployed med QuoteStatusTracker
- ✅ Backend API endpoint virker perfekt
- ✅ Koden er korrekt implementeret

**DET DÅRLIGE:**
- ❌ Frontend bruger forkert API URL (environment variable problem)
- ❌ Render bygger ikke frontend med korrekt VITE_API_URL

**LØSNING:**
Manuel Render dashboard redeploy med "Clear build cache & deploy" for frontend service.

---

**Timestamp:** 2025-10-08 17:20  
**Status:** Identificeret - Awaiting manual Render redeploy
