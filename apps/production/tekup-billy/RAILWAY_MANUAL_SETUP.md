# Railway Manual Setup - Force Dockerfile

**Problem:** Railway keeps using Railpack instead of Dockerfile

## ✅ Manual Fix Required in Railway Dashboard

Railway is auto-detecting this as a workspace and ignoring `railway.json`. You need to manually configure it:

### Step 1: Service Settings → Build

1. **Open Railway Dashboard**
2. **Go to:** `tekup-billy` service → **Settings** → **Build**
3. **Builder:** Select **"Dockerfile"** (NOT Railpack/Nixpacks)
4. **Dockerfile Path:** `apps/production/tekup-billy/Dockerfile`
5. **Docker Context:** `apps/production/tekup-billy`

### Step 2: Service Settings → Source

1. **Root Directory:** Set to `apps/production/tekup-billy`
   - This tells Railway which directory contains the service

### Step 3: Verify Configuration

After setting, the build should:
- Use Dockerfile from `apps/production/tekup-billy/Dockerfile`
- Build context: `apps/production/tekup-billy/`
- Start command: Uses Dockerfile CMD (`npx tsx src/http-server.ts`)

### Alternative: Railway CLI

If you have Railway CLI installed:

```bash
railway service --set builder=DOCKERFILE
railway service --set dockerfilePath=apps/production/tekup-billy/Dockerfile
railway service --set dockerContext=apps/production/tekup-billy
```

---

**Note:** The `railway.json` file should work, but Railway's auto-detection is overriding it for workspace projects. Manual configuration is required.

