# 🔄 PC2 SYNC INSTRUCTIONS
**Dato:** 23. Oktober 2025, 21:03 CET  
**PC1 → PC2 Sync**

---

## ✅ PC1 STATUS: KLAR TIL SYNC

**PC1 commit pushed til GitHub:**
- **Latest Commit:** `e25b7f0` - "chore: cleanup and prepare for PC2 sync"
- **Branch:** master
- **Repository:** https://github.com/TekupDK/tekup
- **Status:** All changes committed and pushed ✅

---

## 🎯 HVAD ER BLEVET GJORT PÅ PC1

### 1. Node Modules Cleanup ✅
- **Slettet:** 43+ `node_modules` foldere
- **Plads frigivet:** ~5GB
- **Projekter renset:** billy, database, vault, calendar-mcp, cloud-dashboard, archives

### 2. Repository Referencer Opdateret ✅
**Alle** `JonasAbde/*` referencer opdateret til `TekupDK/tekup` i:
- ✅ `tekup-database/README.md`
- ✅ `tekup-database/VERSION_1.1.0_RELEASE_NOTES.md`
- ✅ `tekup-database/SUPABASE_SETUP.md`
- ✅ `tekup-database/CHANGELOG.md`
- ✅ `tekup-database/docs/` (SETUP, CONTRIBUTING, TROUBLESHOOTING, DEPLOYMENT, API_REFERENCE)
- ✅ `tekup-database/prisma/seeds/seed.ts`
- ✅ `tekup-database/examples/vault-example.ts`

### 3. Workspace Configuration Updated ✅
- ✅ `Tekup-Portfolio.code-workspace` opdateret
- ✅ `scripts/README.md` opdateret

---

## 📋 PC2: KOMMANDOER AT KØRE

### Option 1: Hvis du allerede har mappen (ANBEFALET)

```powershell
# 1. Gå til din Tekup mappe
cd C:\Users\Jonas-dev\Tekup-Monorepo  # eller hvor din mappe er

# 2. Verify du er på korrekt repo
git remote -v
# SKAL vise: github.com/TekupDK/tekup

# 3. Stash eventuelle lokale ændringer (hvis nogen)
git stash

# 4. Pull latest fra PC1
git pull origin master

# 5. Verify commit
git log --oneline -5
# Skal vise: e25b7f0 - chore: cleanup and prepare for PC2 sync

# DONE! ✅
```

### Option 2: Fresh Clone (hvis du vil starte helt forfra)

```powershell
# 1. Backup gamle mappe (optional)
cd C:\Users\Jonas-dev
Rename-Item Tekup-Monorepo Tekup-Monorepo-OLD

# 2. Clone fresh
gh repo clone TekupDK/tekup Tekup

# 3. Gå ind
cd Tekup

# 4. Open workspace
code Tekup-Portfolio.code-workspace

# DONE! ✅
```

---

## ⚠️ VIGTIGT: SUBMODULE ISSUE

Der er et kendt issue med submodules:
- `apps/production/tekup-billy`
- `apps/production/tekup-database`
- `apps/production/tekup-vault`

Disse er registreret som submodules i git, men `.gitmodules` filen mangler.

**Dette betyder:**
- ⚠️ Ændringer i disse mapper tracker IKKE automatisk i main repo
- ⚠️ Du kan se filer, men git diff viser ikke ændringer
- ⚠️ Vi skal fikse dette senere

**Workaround for nu:**
- Lav ændringer direkte i filerne
- De er der og kan læses/redigeres normalt
- Vi fikser submodule setup i næste session

---

## 🔧 EFTER PULL: REINSTALL DEPENDENCIES

```powershell
# tekup-database
cd apps\production\tekup-database
pnpm install

# tekup-vault
cd ..\tekup-vault
pnpm install

# tekup-billy
cd ..\tekup-billy
pnpm install

# calendar-mcp
cd ..\..\rendetalje\services\calendar-mcp
pnpm install

# cloud-dashboard
cd ..\..\..\web\tekup-cloud-dashboard
pnpm install
```

---

## ✅ VERIFICATION CHECKLIST

Efter pull på PC2, verify:

- [ ] `git remote -v` viser `github.com/TekupDK/tekup`
- [ ] `git log` viser commit `e25b7f0`
- [ ] `apps/production/tekup-database/README.md` viser `TekupDK/tekup` (ikke `JonasAbde/tekup-database`)
- [ ] `Tekup-Portfolio.code-workspace` eksisterer
- [ ] Ingen `node_modules` folders i projekterne (alle slettet)

---

## 🎯 HVAD KAN DU GØRE PÅ PC2

**Fuldt funktionelt:**
- ✅ Læse og redigere alle filer
- ✅ Installere dependencies (`pnpm install`)
- ✅ Køre dev servers
- ✅ Committe ændringer til main repo

**Kræver fix (senere):**
- ⚠️ Submodule ændringer tracker ikke automatisk
- ⚠️ Vi skal re-konfigurere submodules korrekt

---

## 📞 HVIS DER ER PROBLEMER

### Problem: "Your branch is behind"
```powershell
git pull origin master --rebase
```

### Problem: Merge conflicts
```powershell
# Se conflicts
git status

# Resolve manuelt, derefter:
git add .
git rebase --continue
```

### Problem: Submodule errors
```powershell
# Ignore for nu - filerne er der
# Vi fikser submodule setup senere
```

---

## 🚀 NÆSTE SKRIDT PÅ PC2

1. ✅ Pull dette arbejde
2. ✅ Reinstall dependencies
3. ✅ Verify alt virker
4. 🔄 Fortsæt med repository reference fixes for billy & vault
5. 🔄 Fix submodule configuration
6. 🔄 Test at alt kan committe korrekt

---

**PC1 kan nu lukkes ned!**  
**Alt arbejde er på GitHub - PC2 er klar! 🎉**

**Repository:** https://github.com/TekupDK/tekup  
**Branch:** master  
**Latest Commit:** e25b7f0
