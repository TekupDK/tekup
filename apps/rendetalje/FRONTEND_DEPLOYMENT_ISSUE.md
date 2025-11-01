# ⚠️ Frontend Deployment Issue Identified

**Problem:** Frontend ikke deployet separat fra backend

## 🔍 Issue Details

### What Happened:

- Backend NestJS deployet til: `https://rendetalje-ai-production.up.railway.app`
- Frontend Next.js blev IKKE deployet separat
- Begge blev deployet til samme service "rendetalje-ai"

### Verifikation:

```
curl https://rendetalje-ai-production.up.railway.app
# Returns: "Cannot GET /" (this is NestJS backend, not Next.js frontend)
```

### Root Cause:

Railway CLI `railway link` linkede både backend og frontend til samme service i stedet for at oprette separate services.

## ✅ Solution

Frontend skal deployes som separat service i Railway projektet.

### Option 1: Via Railway Dashboard (Anbefalet)

1. Go to: https://railway.app/dashboard
2. Login
3. Select project: **rendetalje-ai**
4. Click **"New"** → **"Service"**
5. Select **"GitHub Repo"** or **"Deploy from local directory"**
6. Configure:
   - Name: `rendetalje-frontend`
   - Root Directory: `apps/rendetalje/services/frontend-nextjs`
   - Build Command: `npm run build`
   - Start Command: `npm run start`
7. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://rendetalje-ai-production.up.railway.app`
   - `NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-key`
   - `NODE_ENV=production`
8. Deploy!

### Option 2: Via CLI (Requires manual linking)

```powershell
cd C:\Users\empir\Tekup\apps\rendetalje\services\frontend-nextjs

# Initialize new service
railway init
# Select: rendetalje-ai project
# Create new service: rendetalje-frontend

# Set environment variables
railway variables --set NEXT_PUBLIC_API_URL=https://rendetalje-ai-production.up.railway.app
railway variables --set NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
railway variables --set NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-key
railway variables --set NODE_ENV=production

# Deploy
railway up --detach
```

## 📊 Expected Result

After deploying frontend as separate service:

- ✅ Backend URL: `https://rendetalje-ai-production.up.railway.app` (existing)
- ✅ Frontend URL: `https://rendetalje-frontend-production.up.railway.app` (new)
- ✅ Frontend accessible in browser
- ✅ Chat widget functional

## 🔧 Current Workaround

Frontend kan testes lokalt mens vi venter på Railway deploy:

```powershell
cd C:\Users\empir\Tekup\apps\rendetalje\services\frontend-nextjs
npm run dev
# Open: http://localhost:3002
```

---

**Status:** Frontend deployment mangler separat service på Railway  
**Action Required:** Deploy frontend som ny service (se Option 1 eller 2)
