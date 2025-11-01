# 📚 Deployment Learnings - Build Separation Pattern

## 🎯 Lektioner Fra 6. Januar 2025 Deployment Fix

Denne dok dokumenterer **kritiske learnings** fra frontend/backend separation fix, så vi undgår lignende problemer fremover.

---

## 🧠 Key Learning #1: Monorepo Build Isolation

### Problem Context

I et monorepo med både backend (Node.js/TypeScript) og frontend (React/Vite) kan builds kollidere hvis ikke korrekt separeret.

### What We Learned

#### ❌ **Bad Pattern: Single Build Command**

```json
{
  "scripts": {
    "build": "tsc && cd client && npm run build"
  }
}
```

**Problems:**

- Begge builds kører sammen
- Output directories kan overlappe
- Deployment ved ikke hvad det skal bruge
- Fejl i én build påvirker den anden

#### ✅ **Good Pattern: Separate Build Targets**

```json
{
  "scripts": {
    "build": "tsc",                    // Default = backend
    "build:backend": "tsc",            // Explicit backend
    "build:client": "cd client && npm run build",
    "build:all": "npm run build:backend && npm run build:client"
  }
}
```

**Benefits:**

- 🎯 Clear separation
- 🔧 Independent builds
- 🚀 Deployments can call specific targets
- 🧪 Easy to test separately

### When To Use This Pattern

**Always use separate build commands when:**

- ✅ You have frontend + backend in same repo
- ✅ Both use build steps (TypeScript, React, etc.)
- ✅ Deploying to different services (API + Static site)
- ✅ Using Docker or containerization
- ✅ Want independent CI/CD pipelines

**Exception (single build OK):**

- ❌ True fullstack SSR (Next.js, SvelteKit) that deploys as single unit

---

## 🧠 Key Learning #2: Docker/Deployment Isolation

### Problem Context

Deployment platforms (Render, Vercel, Netlify) copy your entire repo unless told otherwise. Backend deployments shouldn't include frontend files.

### What We Learned

#### ❌ **Bad Pattern: No Isolation**

```dockerfile
# No .dockerignore file
# Result: Entire repo copied, including client/
```

**Problems:**

- 📦 Larger deployment size
- ⏱️ Slower builds
- 🐛 Potential build conflicts
- 💾 Wasted disk space on server

#### ✅ **Good Pattern: Explicit Exclusion**

```dockerignore
# Backend deployment - exclude frontend
client/
client/**

# Also exclude
node_modules/     # Regenerated during install
tests/            # Not needed in production
docs/             # Not needed in production
*.md              # Documentation
```

**Benefits:**

- ⚡ Faster deployments (smaller size)
- 🎯 Clear separation (backend doesn't touch frontend)
- 🛡️ No accidental conflicts
- 💰 Lower bandwidth costs

### When To Use `.dockerignore`

**Always create `.dockerignore` when:**

- ✅ Using monorepo structure
- ✅ Deploying backend separately from frontend
- ✅ Using Docker for deployment
- ✅ Using Render, Railway, or similar platforms
- ✅ Want to reduce deployment size

**What To Exclude:**
```dockerignore
# Always exclude:
client/           # Frontend (if separate deployment)
tests/            # Tests (run in CI, not production)
docs/             # Documentation
*.md              # Markdown files
.git/             # Git history
node_modules/     # Regenerated during npm install
```

---

## 🧠 Key Learning #3: Service Type Matching

### Problem Context

Deployment platforms offer different service types. Using the wrong type causes failures.

### What We Learned

#### Service Types (Render.com Example)

**Type 1: `web` (Node.js/Dynamic)**
```yaml
type: web
env: node
buildCommand: npm install && npm run build:backend
startCommand: node dist/index.js
```

**Use for:**

- ✅ Express/Fastify APIs
- ✅ Backend services
- ✅ WebSocket servers
- ✅ SSR applications (Next.js)

**Type 2: `static` (Static Files)**
```yaml
type: static
buildCommand: cd client && npm install && npm run build
staticPublishPath: ./client/dist
```

**Use for:**

- ✅ React/Vue/Svelte SPAs
- ✅ Static HTML/CSS/JS
- ✅ Pre-built documentation sites
- ✅ Vite/Webpack build output

#### ❌ **Common Mistake: Type Mismatch**

```yaml
# DON'T: Backend as static site
type: static
startCommand: node dist/index.js  # ❌ Won't work!

# DON'T: Frontend as Node service
type: web
startCommand: npm run preview     # ❌ Wrong approach!
```

#### ✅ **Correct Pattern: Matching Types**

```yaml
services:
  # Backend = web service
  - type: web
    name: api
    startCommand: node dist/index.js
    
  # Frontend = static service  
  - type: static
    name: frontend
    staticPublishPath: ./client/dist
```

### Decision Tree

**Is it a Node.js server?**

- Yes → Use `web` service
- No → Continue

**Does it serve static files only?**

- Yes → Use `static` service
- No → Check platform docs

---

## 🧠 Key Learning #4: Build vs Runtime Separation

### Problem Context

Build-time dependencies (TypeScript, Vite) shouldn't be in production. Runtime dependencies (Express, Prisma) should.

### What We Learned

#### Package.json Structure

```json
{
  "dependencies": {
    "express": "^4.18.0",      // Runtime ✅
    "prisma": "^5.0.0",         // Runtime (migrations)
    "@google-cloud/aiplatform": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",     // Build-time only
    "@types/node": "^20.0.0",   // Build-time only
    "vitest": "^1.0.0"          // Testing only
  }
}
```

#### Build Commands

```yaml
# ✅ Production: Skip devDependencies
buildCommand: npm install --omit=dev && npm run build:backend

# ❌ Development: Install everything
buildCommand: npm install && npm run build:backend
```

**Why `--omit=dev` matters:**

- 📦 Smaller `node_modules/` (50-70% reduction)
- ⚡ Faster installs
- 🛡️ No accidental dev tools in production
- 💰 Lower bandwidth usage

### When To Use `--omit=dev`

**Always use in:**

- ✅ Production deployments
- ✅ Docker production images
- ✅ CI/CD deployment steps

**Don't use in:**

- ❌ Local development
- ❌ Test environments
- ❌ CI/CD test steps

---

## 🧠 Key Learning #5: Verification Before Deployment

### Problem Context

Builds that work locally can fail in production due to environment differences.

### What We Learned

#### Local Production Simulation

```powershell
# Clean everything
Remove-Item -Recurse -Force dist, node_modules

# Install exactly like production
npm install --omit=dev

# Build exactly like production
npx prisma generate
npm run build:backend

# Test exactly like production
$env:NODE_ENV="production"
node dist/index.js
```

**This catches:**

- ✅ Missing dependencies
- ✅ Build script errors
- ✅ Path issues
- ✅ Environment variable problems

#### Verification Script Pattern

```powershell
# verify-production.ps1
Write-Host "Testing production build..." -ForegroundColor Cyan

# Step 1: Clean
Remove-Item -Recurse -Force dist

# Step 2: Install (production mode)
npm install --omit=dev
if ($LASTEXITCODE -ne 0) { exit 1 }

# Step 3: Build
npm run build:backend
if ($LASTEXITCODE -ne 0) { exit 1 }

# Step 4: Verify output
if (-not (Test-Path "dist/index.js")) {
    Write-Host "❌ Build failed: dist/index.js not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Production build verified" -ForegroundColor Green
```

### Verification Checklist

**Before every deployment:**

- [ ] Clean build from scratch
- [ ] Install with `--omit=dev`
- [ ] Verify output files exist
- [ ] Test start command locally
- [ ] Check environment variables
- [ ] Review `.dockerignore` excludes

---

## 📊 Pattern Summary

| Concern | Bad Pattern | Good Pattern |
|---------|-------------|--------------|
| **Build Commands** | Single `build` for everything | `build:backend`, `build:client` |
| **Deployment Isolation** | No `.dockerignore` | Exclude `client/` for backend |
| **Service Types** | Backend as static site | Match service to app type |
| **Dependencies** | Include devDependencies | `--omit=dev` in production |
| **Verification** | Trust it works | Test production build locally |

---

## 🎯 Anvendelse I RenOS

### Hvordan Vi Bruger Det Nu

**1. Backend Deployment (tekup-renos):**
```yaml
buildCommand: npm install --omit=dev && npx prisma generate && npm run build:backend
startCommand: node dist/index.js
```

**2. Frontend Deployment (tekup-renos-1):**
```yaml
type: static
buildCommand: cd client && npm install && npm run build
staticPublishPath: ./client/dist
```

**3. Local Development:**
```powershell
# Run both
npm run dev:all

# Or separately
npm run dev          # Backend only
npm run dev:client   # Frontend only
```

**4. Before Deployment:**
```powershell
# Verify backend build
.\verify-production.ps1

# Verify both services
.\test-deployment.ps1
```

### Future-Proofing

**When adding new services:**

1. Decide: `web` or `static`?
2. Create dedicated build command
3. Add to `.dockerignore` if needed
4. Update verification scripts
5. Document in README

**When changing build process:**

1. Test locally with production commands
2. Check `.dockerignore` still correct
3. Verify output paths
4. Update docs
5. Test deployment in staging

---

## 🔗 Related RenOS Docs

- [Frontend/Backend Separation Fix](./FRONTEND_BACKEND_SEPARATION_FIX.md) - Full fix details
- [Deployment Guide](./guides/DEPLOYMENT.md) - Complete deployment guide
- [RenOS Development Guide](../../.github/copilot-instructions.md) - Architecture patterns
- [Build Configuration](../architecture/BUILD_SYSTEM.md) - Build system docs

---

## ✅ Checklist For Future Deployments

Copy this checklist for every new deployment or service:

### Pre-Deployment

- [ ] Separate build commands exist (`build:backend`, `build:client`)
- [ ] `.dockerignore` excludes unnecessary files
- [ ] Service type matches app type (`web` vs `static`)
- [ ] Production dependencies correct (no dev deps)
- [ ] Environment variables configured
- [ ] Health check endpoint implemented

### Verification

- [ ] Clean build from scratch succeeds
- [ ] `--omit=dev` install works
- [ ] Output files in correct location
- [ ] Start command works locally
- [ ] Verification script passes
- [ ] Docs updated

### Post-Deployment

- [ ] Health endpoint returns 200
- [ ] API calls work
- [ ] Frontend loads correctly
- [ ] Logs show no errors
- [ ] Performance acceptable
- [ ] Document any issues found

---

**Created:** 6. januar 2025  
**Purpose:** Prevent future build/deployment conflicts  
**Applies To:** All monorepo deployments with separate frontend/backend

**Key Takeaway:** 🎯 Always separate concerns, verify locally, document everything.
