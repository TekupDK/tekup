# Render Frontend Fix - Kunder Side Virker Ikke

## 🐛 Problem
Kunder-siden knapper (Opret/Rediger/Slet) virker ikke fordi frontend ikke kan connecte til backend API.

## 🔍 Root Cause
Frontend environment variable `VITE_API_URL` er ikke sat i Render, så den bruger `localhost:3000` i stedet for production backend.

## ✅ Løsning

### Step 1: Tilføj Environment Variable på Render

1. Gå til <https://dashboard.render.com>
2. Find **tekup-renos-frontend** service
3. Gå til **Environment** tab
4. Tilføj ny environment variable:
   ```
   Key: VITE_API_URL
   Value: https://tekup-renos.onrender.com
   ```
5. Klik **Save Changes**

### Step 2: Redeploy Frontend

Render vil automatisk rebuilde frontend efter du gemmer environment variables.

**Hvis ikke automatisk:**
1. Gå til **Manual Deploy** tab
2. Klik **Deploy latest commit**

### Step 3: Verificer Fix

1. Åbn <https://tekup-renos-frontend.onrender.com>
2. Gå til **Kunder** siden
3. Test knapper:
   - ✅ **Opret Kunde** - skal åbne modal og gemme kunde
   - ✅ **Rediger** - skal åbne modal med existing data
   - ✅ **Slet** - skal vise confirmation og slette kunde

## 🧪 Test Backend Virker

Backend API virker allerede perfekt:

```bash
# Test i PowerShell
Invoke-RestMethod -Uri "https://tekup-renos.onrender.com/api/dashboard/customers" -Method Get

# Du skulle se 9+ kunder:
# - Mikkel Weggerby
# - Heidi Laila Madsen
# - Sandy Dalum
# - Christina Kuhlmann
# - etc.
```

## 📝 Fallback i Koden

Customers.tsx har allerede fallback:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://tekup-renos.onrender.com';
```

Så selv uden environment variable burde det virke - MEN Vite injecter env vars ved **build time**, ikke runtime.

Derfor SKAL `VITE_API_URL` være sat INDEN build.

## ⏱️ Expected Time

- Tilføj env var: 2 minutter
- Rebuild: 3-5 minutter
- Total: **~7 minutter**

## 🎯 Efter Fix

Alle funktioner virker:
- ✅ Opret kunde med navn, email, telefon, adresse
- ✅ Rediger existing kunde
- ✅ Slet kunde (med confirmation)
- ✅ Søg og filter kunder
- ✅ Sortér efter kolonner
- ✅ Export til CSV

---

**Status:** KLAR TIL FIX (venter kun på Render env var)
