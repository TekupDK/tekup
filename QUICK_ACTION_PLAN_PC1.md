# ⚡ Quick Action Plan - PC1 (jonaslenovo)

**Status:** PC1 på `master`, PC2 arbejder på Prisma migration  
**Mål:** Sikre PC1's arbejde og forberede merge

---

## 🚀 STEP 1: Commit Monitoring Docs (NU - 2 min)

```powershell
cd c:\Users\empir\Tekup

git add FRONTEND_SENTRY_INSTALLATION_GUIDE.md
git add MONITORING_SETUP_SESSION_2025-10-24.md  
git add UPTIMEROBOT_SETUP_GUIDE.md

git commit -m "docs: update monitoring guides with database migration completion

- Updated MONITORING_SETUP_SESSION to reflect completed migration
- Updated MONITORING_STATUS to show 80% progress
- Formatting improvements from linter"

git push origin master
```

---

## ⚠️ STEP 2: Fix monorepo/ Problem (NU - 5 min)

**Monorepo er git-in-git = problem!**

### ANBEFALET: Option B - Flyt ud

```powershell
# 1. Flyt til separat location
Move-Item apps/rendetalje/monorepo c:\Users\empir\RendetaljeMonorepo -Force

# 2. Ignorer i main repo
"apps/rendetalje/monorepo" | Out-File -Append .gitignore

# 3. Commit
git add .gitignore
git commit -m "chore: move monorepo to separate workspace

- Moved apps/rendetalje/monorepo/ to c:\Users\empir\RendetaljeMonorepo
- Prevents git-in-git submodule conflicts  
- Monorepo can be developed independently"

git push origin master
```

### Alternative: Option A - Konverter til submodule

Kun hvis du vil have det I workspace:

```powershell
# 1. Opret GitHub repo først (via web)
# https://github.com/new → "rendetalje-monorepo"

# 2. Push monorepo som separat repo
cd apps/rendetalje/monorepo
git remote add origin https://github.com/TekupDK/rendetalje-monorepo.git
git branch -M main
git push -u origin main

# 3. Tilbage til hovedrepo
cd c:\Users\empir\Tekup

# 4. Slet lokal .git mappe
Remove-Item -Recurse -Force apps/rendetalje/monorepo/.git

# 5. Tilføj som submodule
git submodule add https://github.com/TekupDK/rendetalje-monorepo.git apps/rendetalje/monorepo

# 6. Commit
git commit -m "feat: add rendetalje-monorepo as git submodule"
git push origin master
```

---

## 📋 STEP 3: Håndter archive/old-data/ (1 min)

```powershell
# Ignorer eller commit
echo "archive/old-data/" >> .gitignore
git add .gitignore
git commit -m "chore: ignore archive/old-data directory"
git push origin master
```

---

## ⏸️ STEP 4: Tag og STOP (1 min)

```powershell
# Gem sikkerhedskopi tag
git tag pc1-ready-for-prisma-merge-2025-10-25
git push origin pc1-ready-for-prisma-merge-2025-10-25

# Log status
Write-Host "✅ PC1 KL

AR - Venter på PC2's Prisma migration" -ForegroundColor Green
```

---

## ⏳ STEP 5: VENT PÅ PC2

**Gør IKKE:**
- ❌ Rør Prisma-relaterede filer
- ❌ Ændre schema.prisma
- ❌ Opdater database packages
- ❌ Merge backup branch

**Kan gøre:**
- ✅ Arbejd på monitoring (UptimeRobot setup)
- ✅ Frontend Sentry installation (ingen DB changes)
- ✅ Documentation updates
- ✅ Review PC2's commits:
  ```powershell
  git fetch --all
  git log master..origin/pre-prisma-migration-backup-20251025
  ```

---

## 🔄 STEP 6: Merge Når PC2 Er Færdig

**Når PC2 siger "Prisma migration done & pushed":**

```powershell
# 1. Fetch alle ændringer
git fetch --all

# 2. Check status
git status
git log master..origin/pre-prisma-migration-backup-20251025 --oneline

# 3. Opret lokal branch for test
git checkout -b test-prisma-merge origin/pre-prisma-migration-backup-20251025

# 4. Test Prisma virker
cd apps/production/tekup-database
npm install
npx prisma generate
npx prisma db push

# 5. Test services
cd apps/rendetalje/services/calendar-mcp
npm run test

cd ../../../production/tekup-vault
pnpm install
pnpm test

cd ../tekup-billy
npm test

# 6. Hvis alt er OK - merge til master
git checkout master
git merge test-prisma-merge --no-ff -m "feat: merge Prisma migration from PC2

Merged changes:
- Calendar-MCP migrated to Prisma client
- TekupVault API migrated to Prisma client  
- Tekup-Billy Phase 4 Prisma setup
- Database schema updates for all services
- Claude Code optimization setup
- Workspace documentation updates

Testing completed:
- All Prisma clients generate successfully
- Database migrations applied
- Services tested and functional"

# 7. Push til remote
git push origin master

# 8. Slet test branch
git branch -d test-prisma-merge
```

---

## ✅ STEP 7: Fortsæt Monitoring Setup

**Efter successful merge:**

### UptimeRobot (10 min)

```powershell
# Åbn guide
code UPTIMEROBOT_SETUP_GUIDE.md

# Følg steps:
# 1. Opret konto på uptimerobot.com/signUp
# 2. Tilføj 4 monitors (tekup-billy, vault, backend, calendar)
# 3. Konfigurer email alerts
```

### Frontend Sentry (15 min)

```powershell
# Åbn guide
code FRONTEND_SENTRY_INSTALLATION_GUIDE.md

# Følg steps:
cd apps/rendetalje/services/frontend-nextjs
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
# Følg wizard prompts
```

### Commit completion

```powershell
git add -A
git commit -m "feat: complete monitoring setup - UptimeRobot + Frontend Sentry

- Created UptimeRobot monitors for 4 services
- Installed and configured @sentry/nextjs
- Updated environment variables
- Tested error tracking in production

Monitoring status: 100% complete
- Backend Sentry ✅
- Database migration ✅  
- Sentry DSN ✅
- Render config ✅
- UptimeRobot ✅
- Frontend Sentry ✅"

git push origin master
```

---

## 🎯 SUMMARY

**Umiddelbart (10 min):**
1. ✅ Commit monitoring docs
2. ⚠️ Fix monorepo problem
3. 🏷️ Tag sikkerhedskopi
4. ⏸️ STOP og vent

**Når PC2 færdig (45 min):**
1. 🔄 Merge Prisma changes
2. 🧪 Test grundigt
3. ✅ Fortsæt monitoring setup
4. 🎉 DONE!

---

**Genereret:** 25. oktober 2025  
**For:** PC1 (jonaslenovo)  
**Baseret på:** GIT_ANALYSIS_PC1_2025-10-25.md
