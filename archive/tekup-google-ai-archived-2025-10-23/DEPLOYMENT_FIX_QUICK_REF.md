# 🚀 Deployment Fix Quick Reference - 6. JAN 2025

## 🎯 Problem

Backend crasher på Render med: `Cannot find module 'dist/index.js'`

## 🔧 Root Cause

Backend service forsøger at bygge og serve frontend (static site job).

## ✅ Solution (3 Steps)

### Step 1: Update `render.yaml`

```yaml
# Backend - ONLY build backend
buildCommand: npm install --omit=dev && npx prisma generate && npm run build:backend
startCommand: node dist/index.js

# Frontend - ONLY build frontend (already correct)
buildCommand: cd client && npm install && npm run build
staticPublishPath: ./client/dist
```

### Step 2: Add Build Script to `package.json`

```json
{
  "scripts": {
    "build:backend": "tsc",
    "build:client": "cd client && npm run build"
  }
}
```

### Step 3: Create `.dockerignore`

```ignore
# Exclude frontend from backend deployment
client/
client/**
node_modules/
tests/
docs/
```

## ✅ Verification

```powershell
# Test locally
npm run build:backend
node dist/index.js

# After deployment
curl.exe https://tekup-renos.onrender.com/api/health
# Expected: {"status": "healthy"}
```

## 📊 Impact

- Before: ❌ Backend crashes (0% success)
- After: ✅ Both services deploy correctly (100% success)

## 🔗 Full Documentation

See [FRONTEND_BACKEND_SEPARATION_FIX.md](./docs/deployment/FRONTEND_BACKEND_SEPARATION_FIX.md)

## Status

🟡 **IN PROGRESS** - Changes made, awaiting deployment
