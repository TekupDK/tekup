# 🎯 OPDATERET PLAN - Med TekupDK Organisation

**Dato:** 23. Oktober 2025, 03:30 CET  
**Baseret på:** TekupDK GitHub organisation strategi

---

## 📊 HVAD JEG NU FORSTÅR

### **TekupDK Organisation Strategi:**

```
LOKAL STRUKTUR:
c:\Users\empir\Tekup/
├── production/
├── development/
├── services/
└── archive/

GITHUB STRUKTUR:
github.com/TekupDK/
├── tekup-database          ← Separate repos
├── tekup-vault             ← hver med sin git
├── tekup-billy
├── rendetalje-os
├── tekup-ai
└── ... (9+ repos total)

WORKFLOW:
- MULTI-REPO (ikke monorepo)
- Hver service = separat GitHub repo
- Local workspace synkroniseres via git
- 2-computer workflow ready
```

**Dette er INDUSTRY STANDARD** ✅ (OpenAI, Anthropic, Microsoft approach)

---

## 🎯 MIN REVIDEREDE PLAN

### **FASE 1: AFKLAR & DOKUMENTER** (30 min) 🔴 **FØRST!**

#### **1.1 Undersøg Tekup-Cloud/backend & frontend**
```powershell
# Sammenlign strukturer
cd C:\Users\empir\Tekup-Cloud
Get-ChildItem backend\src -Recurse -File | Measure-Object | Select-Object Count
Get-ChildItem frontend\src -Recurse -File | Measure-Object Count

cd C:\Users\empir\RendetaljeOS
Get-ChildItem apps\backend\src -Recurse -File | Measure-Object | Select-Object Count
Get-ChildItem apps\frontend\src -Recurse -File | Measure-Object | Select-Object Count

# Se git history
cd C:\Users\empir\Tekup-Cloud
git log --oneline --since="2025-10-01" -- backend/ frontend/ | head -20
```

**BESLUTNING:** Behold eller Arkiver?

---

#### **1.2 Opdater Tekup/README.md**
Match `production/development/services` struktur (som i GITHUB guide)

---

### **FASE 2: FÆRDIGGØR LOKAL STRUKTUR** (45 min) 📁

**Formål:** Klar lokal organisation INDEN GitHub push

```powershell
# Production services (CRITICAL!)
Move-Item "C:\Users\empir\tekup-database" "C:\Users\empir\Tekup\production\tekup-database"
Move-Item "C:\Users\empir\TekupVault" "C:\Users\empir\Tekup\production\tekup-vault"
Move-Item "C:\Users\empir\Tekup-Billy" "C:\Users\empir\Tekup\production\tekup-billy"

# Development projects
Move-Item "C:\Users\empir\RendetaljeOS" "C:\Users\empir\Tekup\development\rendetalje-os"
Move-Item "C:\Users\empir\tekup-ai" "C:\Users\empir\Tekup\development\tekup-ai"
Move-Item "C:\Users\empir\Tekup-Cloud" "C:\Users\empir\Tekup\development\tekup-cloud"
Move-Item "C:\Users\empir\tekup-cloud-dashboard" "C:\Users\empir\Tekup\development\tekup-cloud-dashboard"

# Services
Move-Item "C:\Users\empir\tekup-gmail-services" "C:\Users\empir\Tekup\services\tekup-gmail-services"
Move-Item "C:\Users\empir\tekup-chat" "C:\Users\empir\Tekup\services\tekup-chat"
Move-Item "C:\Users\empir\tekup-ai-assistant" "C:\Users\empir\Tekup\services\tekup-ai-assistant"

# Archive
Move-Item "C:\Users\empir\Tekup Google AI" "C:\Users\empir\Tekup\archive\tekup-google-ai-archived-2025-10-23"
```

**RESULTAT:**
```
c:\Users\empir\Tekup/
├── production/         (3 repos - €270K)
│   ├── tekup-database/
│   ├── tekup-vault/
│   └── tekup-billy/
├── development/        (4 repos - €300K)
│   ├── rendetalje-os/
│   ├── tekup-ai/
│   ├── tekup-cloud/
│   └── tekup-cloud-dashboard/
├── services/           (3 repos)
│   ├── tekup-gmail-services/
│   ├── tekup-chat/
│   └── tekup-ai-assistant/
└── archive/            (3 legacy)
```

---

### **FASE 3: PUSH TIL GITHUB (TekupDK)** (1 time) 🚀 **NYT!**

#### **3.1 Setup GitHub Authentication**
```powershell
# Install GitHub CLI hvis ikke installeret
winget install --id GitHub.cli

# Login til GitHub
gh auth login
# Vælg: GitHub.com → HTTPS → Login with browser
```

---

#### **3.2 Push Production Repos** (KRITISK)

```powershell
# tekup-database
cd C:\Users\empir\Tekup\production\tekup-database
git add .
git commit -m "chore: migrate to TekupDK organisation structure"

# Create repo in TekupDK org & push
gh repo create TekupDK/tekup-database --private --source=. --push

# Eller hvis repo allerede eksisterer:
git remote add origin https://github.com/TekupDK/tekup-database.git
git branch -M main
git push -u origin main

# TekupVault
cd C:\Users\empir\Tekup\production\tekup-vault
git add .
git commit -m "chore: migrate to TekupDK organisation + database migration"
gh repo create TekupDK/tekup-vault --private --source=. --push

# Tekup-Billy
cd C:\Users\empir\Tekup\production\tekup-billy
git add .
git commit -m "chore: migrate to TekupDK organisation + v1.4.3 updates"
gh repo create TekupDK/tekup-billy --private --source=. --push
```

---

#### **3.3 Push Development Repos**

```powershell
# RendetaljeOS
cd C:\Users\empir\Tekup\development\rendetalje-os
git add .
git commit -m "chore: migrate to TekupDK organisation + monorepo updates"
gh repo create TekupDK/rendetalje-os --private --source=. --push

# tekup-ai
cd C:\Users\empir\Tekup\development\tekup-ai
git add .
git commit -m "chore: migrate to TekupDK organisation + Phase 1 complete"
gh repo create TekupDK/tekup-ai --private --source=. --push

# Tekup-Cloud
cd C:\Users\empir\Tekup\development\tekup-cloud
git add .
git commit -m "docs: add discovery reports + workspace updates"
gh repo create TekupDK/tekup-cloud --private --source=. --push

# tekup-cloud-dashboard
cd C:\Users\empir\Tekup\development\tekup-cloud-dashboard
git add .
git commit -m "chore: migrate to TekupDK organisation"
gh repo create TekupDK/tekup-cloud-dashboard --private --source=. --push
```

---

#### **3.4 Push Services**

```powershell
# tekup-gmail-services
cd C:\Users\empir\Tekup\services\tekup-gmail-services
git add .
git commit -m "chore: migrate to TekupDK organisation + v1.0.0"
gh repo create TekupDK/tekup-gmail-services --private --source=. --push

# tekup-chat
cd C:\Users\empir\Tekup\services\tekup-chat
git add .
git commit -m "chore: migrate to TekupDK organisation + v1.1.0"
gh repo create TekupDK/tekup-chat --private --source=. --push

# tekup-ai-assistant
cd C:\Users\empir\Tekup\services\tekup-ai-assistant
git add .
git commit -m "chore: migrate to TekupDK organisation + v1.5.0"
gh repo create TekupDK/tekup-ai-assistant --public --source=. --push
```

---

#### **3.5 Batch Script (ANBEFALET)**

```powershell
# Save as: C:\Users\empir\Tekup\scripts\push-all-to-tekupdk.ps1

$repos = @(
    @{Path="production\tekup-database"; Name="tekup-database"; Private=$true},
    @{Path="production\tekup-vault"; Name="tekup-vault"; Private=$true},
    @{Path="production\tekup-billy"; Name="tekup-billy"; Private=$true},
    @{Path="development\rendetalje-os"; Name="rendetalje-os"; Private=$true},
    @{Path="development\tekup-ai"; Name="tekup-ai"; Private=$true},
    @{Path="development\tekup-cloud"; Name="tekup-cloud"; Private=$true},
    @{Path="development\tekup-cloud-dashboard"; Name="tekup-cloud-dashboard"; Private=$true},
    @{Path="services\tekup-gmail-services"; Name="tekup-gmail-services"; Private=$true},
    @{Path="services\tekup-chat"; Name="tekup-chat"; Private=$true},
    @{Path="services\tekup-ai-assistant"; Name="tekup-ai-assistant"; Private=$false}
)

foreach ($repo in $repos) {
    $fullPath = "C:\Users\empir\Tekup\$($repo.Path)"
    $repoName = $repo.Name
    $isPrivate = $repo.Private
    
    Write-Host "`n=== Processing: $repoName ===" -ForegroundColor Cyan
    
    cd $fullPath
    
    # Check if git repo
    if (!(Test-Path ".git")) {
        Write-Host "Initializing git..." -ForegroundColor Yellow
        git init
    }
    
    # Stage all changes
    git add .
    
    # Commit
    $commitMsg = "chore: migrate to TekupDK organisation"
    git commit -m $commitMsg
    
    # Create repo on GitHub
    $visibility = if ($isPrivate) { "--private" } else { "--public" }
    
    Write-Host "Creating GitHub repo: TekupDK/$repoName" -ForegroundColor Green
    gh repo create "TekupDK/$repoName" $visibility --source=. --push
    
    Write-Host "✅ $repoName pushed to TekupDK!" -ForegroundColor Green
}

Write-Host "`n🎉 ALL REPOS PUSHED TO TEKUPDK ORGANISATION!" -ForegroundColor Green
```

**KØR:**
```powershell
cd C:\Users\empir\Tekup
.\scripts\push-all-to-tekupdk.ps1
```

---

### **FASE 4: VERIFY GITHUB ORGANISATION** (15 min) ✅

**Tjek at alt er på plads:**

```powershell
# List all repos i TekupDK org
gh repo list TekupDK

# Forventet output:
# TekupDK/tekup-database
# TekupDK/tekup-vault
# TekupDK/tekup-billy
# TekupDK/rendetalje-os
# TekupDK/tekup-ai
# TekupDK/tekup-cloud
# TekupDK/tekup-cloud-dashboard
# TekupDK/tekup-gmail-services
# TekupDK/tekup-chat
# TekupDK/tekup-ai-assistant

# Tjek hver repo har branches
gh repo view TekupDK/tekup-database
gh repo view TekupDK/tekup-vault
# ... osv
```

**Verify på GitHub.com:**
- Go to https://github.com/TekupDK
- Check all 10 repos eksisterer
- Check README.md vises korrekt
- Check commits synced

---

### **FASE 5: SETUP BRANCH PROTECTION** (15 min) 🔐

**For CRITICAL repos (production):**

```powershell
# tekup-database
gh api repos/TekupDK/tekup-database/branches/main/protection -X PUT -f required_pull_request_reviews.required_approving_review_count=1

# tekup-vault
gh api repos/TekupDK/tekup-vault/branches/main/protection -X PUT -f required_pull_request_reviews.required_approving_review_count=1

# tekup-billy
gh api repos/TekupDK/tekup-billy/branches/main/protection -X PUT -f required_pull_request_reviews.required_approving_review_count=1
```

**Eller via GitHub UI:**
1. Go to repo → Settings → Branches
2. Add rule for `main` branch
3. Enable "Require pull request reviews"
4. Save

---

### **FASE 6: DEPLOY PRODUCTION** (30 min) 🚀

**Opdater Render.com med nye GitHub URLs:**

```yaml
# For hver service på Render.com:

1. TekupVault
   - Go to Render dashboard
   - Settings → GitHub → Change repo
   - Select: TekupDK/tekup-vault
   - Branch: main
   - Save & Redeploy

2. Tekup-Billy
   - Settings → GitHub → Change repo
   - Select: TekupDK/tekup-billy
   - Branch: main
   - Save & Redeploy

3. RendetaljeOS (backend + frontend)
   - Backend: TekupDK/rendetalje-os
   - Frontend: TekupDK/rendetalje-os
   - Update deployment settings
```

**Verify services:**
```bash
curl https://tekupvault.onrender.com/health
curl https://tekup-billy.onrender.com/health
curl https://renos-backend.onrender.com/health
```

---

### **FASE 7: CLEANUP & DOKUMENTATION** (15 min) 📝

#### **7.1 Slet tomme mapper i root**
```powershell
# Efter verify at alt er moved
cd C:\Users\empir

# Slet tomme mapper
Remove-Item "agent-orchestrator" -Force -ErrorAction SilentlyContinue
Remove-Item "ansel" -Force -ErrorAction SilentlyContinue
Remove-Item "backups" -Force -ErrorAction SilentlyContinue
# ... osv (14 tomme mapper)
```

#### **7.2 Opdater dokumentation**
```powershell
# Opdater README_START_HERE.md
# Opdater Tekup/README.md
# Opdater Tekup/docs/
```

#### **7.3 Create workspace docs repo**
```powershell
cd C:\Users\empir\Tekup\docs
git init
git add .
git commit -m "Initial commit: TekupDK workspace documentation"
gh repo create TekupDK/tekup-workspace-docs --public --source=. --push
```

---

## 📊 OPDATERET TIDSESTIMAT

```
Fase 1: Afklar + Opdater README    30 min
Fase 2: Move til Tekup struktur    45 min
Fase 3: Push til TekupDK          60 min (eller 10 min med batch script!)
Fase 4: Verify GitHub             15 min
Fase 5: Branch protection         15 min
Fase 6: Update Render deploys     30 min
Fase 7: Cleanup & docs            15 min
───────────────────────────────────────
TOTAL:                           210 min = 3.5 timer
```

**Med batch script:** ~2 timer total! ⚡

---

## 🎯 FORDELE VED TEKUPDK APPROACH

### **1. Multi-Computer Workflow** ✅
- PC 1 (hovedcomputer): `git push`
- PC 2 (anden computer): `git pull`
- Perfekt synkronisering!

### **2. Team Collaboration** ✅
- Klar til at invitere team members
- Granular access control per repo
- Clear ownership

### **3. Independent Deployment** ✅
- Hver service kan deployes separat
- Independent versioning
- Render.com integration klar

### **4. Industry Standard** ✅
- OpenAI, Anthropic, Microsoft pattern
- Well-understood workflow
- Easy to contribute

### **5. Clean Local Workspace** ✅
- Organiseret struktur
- Clear separation (production/dev/services)
- Easy to navigate

---

## 🚀 MIN OPDATEREDE ANBEFALING

### **START MED DETTE (nu):**

1. **✅ AFKLAR Tekup-Cloud/backend & frontend** (10 min)
   - Undersøg formål
   - Beslut behold/arkiver

2. **✅ FIX Tekup/README.md** (5 min)
   - Match production/development/services struktur

3. **📁 MOVE projekter til Tekup struktur** (45 min)
   - Production, development, services, archive

4. **🚀 PUSH TIL TEKUPDK med batch script** (10 min!)
   - Alle 10 repos på GitHub
   - Automated process

5. **✅ VERIFY & SETUP protection** (30 min)
   - Check GitHub repos
   - Branch protection for production

6. **🚀 UPDATE Render.com** (30 min)
   - Point til TekupDK repos
   - Redeploy services

---

## ✅ RESULTAT EFTER COMPLETION

```
LOKAL:
c:\Users\empir\Tekup/          ← Clean organiseret workspace
├── production/ (3 repos)
├── development/ (4 repos)
├── services/ (3 repos)
└── archive/ (3 legacy)

GITHUB:
github.com/TekupDK/            ← Professional organisation
├── 10 repos (tekup-database, tekup-vault, etc.)
├── Branch protection på critical repos
└── Ready for team collaboration

DEPLOYMENT:
Render.com                     ← Connected til TekupDK
├── TekupVault → TekupDK/tekup-vault
├── Tekup-Billy → TekupDK/tekup-billy
└── RendetaljeOS → TekupDK/rendetalje-os

TOTAL: ~2 timer med batch script! 🎉
```

---

**Skal jeg starte med Fase 1 (undersøg Tekup-Cloud)?** 🚀

Eller vil du jeg laver batch scriptet først så vi er klar til Fase 3?


