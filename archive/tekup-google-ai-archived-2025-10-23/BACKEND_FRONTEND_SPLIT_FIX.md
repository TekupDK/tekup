# Backend/Frontend Split Deployment Fix

**Dato**: 6. oktober 2025  
**Status**: 🔧 KRITISK FIX IMPLEMENTERET

## 🚨 Problem Identificeret

### Root Cause
Render deployment havde **conflicting service configurations**:
- **Backend** (`tekup-renos`): Node.js service prøvede at serve BÅDE backend API OG frontend
- **Frontend** (`tekup-renos-1`): Static site service (korrekt konfigureret)
- **Conflict**: Backend crashede fordi `node dist/index.js` forsøgte at køre frontend build

### Symptomer
```
npm error path /app
npm error command failed
npm error signal SIGTERM
```

Backend logs viste:
- ✅ Database connection OK
- ✅ Lead parsing OK
- ❌ Server crash ved start
- ❌ No open ports detected

Frontend:
- ❌ Viste default Clerk login
- ❌ Ingen assets loaded
- ❌ SPA routing broken

## ✅ Løsning Implementeret

### 1. Opdateret render.yaml

**Before** (BROKEN):
```yaml
buildCommand: npm install && npx prisma generate && npm run build
startCommand: npx prisma migrate deploy && npm run start:prod
```

**After** (FIXED):
```yaml
buildCommand: npm install --omit=dev && npx prisma generate && npm run build
startCommand: npx prisma migrate deploy && node dist/index.js
```

**Changes**:
- ✅ `--omit=dev`: Skip dev dependencies (faster, smaller build)
- ✅ `node dist/index.js`: Direct Node execution (ikke npm script)
- ✅ Separate backend build fra frontend build

### 2. Created .dockerignore

**Purpose**: Exclude frontend fra backend deployment

```
client/
client/**
client/node_modules/
client/dist/
client/src/
client/public/
```

**Impact**:
- Backend deployment ONLY includes `src/`, `prisma/`, `package.json`
- Frontend deployment (tekup-renos-1) ONLY includes `client/`
- No conflicts, clean separation

### 3. Verified Backend Build

```powershell
npm run build
✓ TypeScript compiled
✓ dist/index.js exists
✓ 169 files in dist/
✓ All critical files present
```

## 📊 Deployment Architecture

### Backend Service (tekup-renos)
```yaml
Type: web (Node.js)
Region: frankfurt
Build: npm install --omit=dev && npx prisma generate && npm run build
Start: npx prisma migrate deploy && node dist/index.js
Health: /health
Port: 3000
Output: dist/ (TypeScript compiled)
```

### Frontend Service (tekup-renos-1)
```yaml
Type: static
Region: frankfurt
Build: cd client && npm install && npm run build
Publish: ./client/dist
SPA: Rewrite /* → /index.html
Assets: /assets/*.js, /assets/*.css
```

### Database (Neon.tech)
```
Provider: PostgreSQL (Neon.tech serverless)
Region: eu-central-1
Connection: TLS required
```

## 🚀 Deployment Steps

### 1. Commit Changes
```powershell
git add render.yaml .dockerignore
git commit -m "fix(deploy): Separate backend and frontend builds

- Backend: Direct node dist/index.js execution
- Frontend: Static site remains unchanged
- Added .dockerignore to exclude client/ from backend
- Fixes SIGTERM crash and port binding issues"
```

### 2. Push to GitHub
```powershell
git push origin main
```

### 3. Render Auto-Deploy
**Backend** (`tekup-renos`):
- Triggers on push
- Builds with NEW configuration
- Should complete without SIGTERM
- Health check /health should return 200 OK

**Frontend** (`tekup-renos-1`):
- No changes needed
- Already correct
- Will continue to serve from client/dist

### 4. Verification (After 3-5 minutes)

**Backend API**:
```powershell
curl.exe https://tekup-renos.onrender.com/api/health
# Should return: {"status":"ok","uptime":...}
```

**Frontend**:
```powershell
curl.exe https://tekup-renos-1.onrender.com
# Should return HTML with NEW hashes (index-BTvDsayV.js)
```

**Check Logs**:
```
Render Dashboard → tekup-renos → Logs
Should see:
✓ Build successful
✓ Database connected
✓ Server listening on port 3000
✓ No SIGTERM errors
```

## 🎯 Expected Results

### Backend Logs (SUCCESS)
```
Building with npm...
✓ Dependencies installed
✓ Prisma client generated
✓ TypeScript compiled
Deploying...
✓ Prisma migrations deployed
✓ Server started on port 3000
✓ Health check: OK
Service is live 🎉
```

### Frontend
- ✅ Modern dashboard design
- ✅ Assets loaded (new hashes)
- ✅ SPA routing works
- ✅ Clerk authentication works
- ✅ API calls to backend work

## 📋 Troubleshooting

### If Backend Still Fails

**1. Check Render Dashboard Logs**:
```
tekup-renos → Logs → Look for errors
```

**2. Verify Build Output**:
```
Should see:
- npm install --omit=dev
- npx prisma generate
- npm run build (tsc)
- node dist/index.js
```

**3. Check Environment Variables**:
```
DATABASE_URL → Should point to Neon.tech
PORT → Should be 3000
NODE_ENV → Should be production
```

**4. Manual Deploy**:
```
Render Dashboard → tekup-renos
→ Manual Deploy
→ "Clear build cache & deploy"
```

### If Frontend Shows Old Version

**Client-side cache problem** (NOT deployment):
1. F12 → Application → Service Workers → Unregister
2. F12 → Application → Storage → Clear site data
3. Ctrl+Shift+R (hard refresh)
4. Test in Incognito mode

## 📝 Files Modified

| File | Status | Description |
|------|--------|-------------|
| render.yaml | ✅ UPDATED | Backend build/start commands fixed |
| .dockerignore | ✅ CREATED | Excludes client/ from backend |
| verify-backend-build.ps1 | ✅ CREATED | Local verification script |
| BACKEND_FRONTEND_SPLIT_FIX.md | ✅ CREATED | This documentation |

## 🔐 Security Notes

- ✅ `.dockerignore` prevents exposing frontend source in backend
- ✅ `--omit=dev` reduces attack surface (no dev dependencies)
- ✅ Separate services = better isolation
- ✅ Frontend can't access backend env vars

## 🎓 Lessons Learned

### Don't Do This
❌ Mix backend and frontend in same service
❌ Use `npm run start:prod` in production (overhead)
❌ Include client/ in backend deployment

### Do This
✅ Separate services for backend/frontend
✅ Direct `node dist/index.js` execution
✅ Use `.dockerignore` for clean builds
✅ Verify builds locally first

## ✅ Success Criteria

- [ ] Backend deploys without SIGTERM
- [ ] Backend /health returns 200 OK
- [ ] Frontend shows modern design
- [ ] Frontend assets load (new hashes)
- [ ] SPA routing works (no 404s)
- [ ] API calls succeed
- [ ] No console errors

---

**Status**: 🚀 READY FOR DEPLOYMENT  
**Next Action**: Commit + Push → Wait 5 min → Verify
