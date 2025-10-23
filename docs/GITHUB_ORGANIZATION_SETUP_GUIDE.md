# 🚀 TekupDK GitHub Organization - Setup Guide

**Created:** 23. Oktober 2025, 08:45 CET  
**Organization:** github.com/TekupDK  
**Purpose:** Multi-computer workspace synchronization & team collaboration

---

## 📊 **EXECUTIVE SUMMARY**

### **Din Situation:**
- ✅ GitHub organization "TekupDK" oprettet
- 💻 2 computere (PC 1: hovedcomputer, PC 2: skal sættes op)
- 🎯 Workspace skal synkroniseres mellem begge
- 👥 Klar til team expansion

### **Anbefalet Strategi:**
**MULTI-REPO** (separate repositories) ✅

**Rationale:**
- Hver service/app er sit eget repo
- Nemmere team collaboration
- Independent versioning og deployment
- Matches din nuværende struktur
- Industry standard (OpenAI, Anthropic, Google)

---

## 🎯 **MONOREPO VS MULTI-REPO**

### **Monorepo (ÉN stor repo)**
```
github.com/TekupDK/tekup-workspace
└── Alle projekter i én repo
```

**Pros:**
- ✅ Easy code sharing
- ✅ Atomic commits across projects
- ✅ Single place for everything

**Cons:**
- ❌ Huge repo size (slow clone/pull)
- ❌ Complex CI/CD
- ❌ All-or-nothing access control
- ❌ Hard for external contributors

**Who uses:** Google, Meta (internal only)

---

### **Multi-Repo (Mange separate repos)** ✅ ANBEFALET
```
github.com/TekupDK/
├── tekup-database
├── tekup-vault
├── tekup-billy
├── rendetalje-os
├── tekup-ai
└── ... (each project separate)
```

**Pros:**
- ✅ Independent versioning
- ✅ Independent deployment
- ✅ Granular access control
- ✅ Faster clone/pull per repo
- ✅ Clear ownership
- ✅ Easy to contribute to specific project

**Cons:**
- ❌ Code sharing requires packages
- ❌ More repos to manage
- ❌ Cross-repo changes harder

**Who uses:** OpenAI, Anthropic, Microsoft, 99% of companies

---

## 📁 **ANBEFALET GITHUB STRUKTUR**

### **TekupDK Organization Layout:**

```
github.com/TekupDK/
│
├── tekup-database              ← Central DB (CRITICAL)
├── tekup-vault                 ← Knowledge layer
├── tekup-billy                 ← Billy.dk MCP
├── rendetalje-os               ← Cleaning platform
├── tekup-ai                    ← AI infrastructure
├── tekup-cloud                 ← RenOS tools + calendar MCP
├── tekup-cloud-dashboard       ← Unified dashboard
├── tekup-gmail-services        ← Email automation
├── tekup-ai-assistant          ← AI docs & configs
│
├── .github                     ← Organization-level templates
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/              (shared GitHub Actions)
│
└── tekup-workspace-docs        ← Workspace documentation (optional)
```

---

## 🔐 **GITHUB ORGANIZATION SETUP**

### **Step 1: Basic Settings** (5 min)

```
Organization Settings:
├── Base permissions: None (explicit access only)
├── Member privileges:
│   ├── Allow members to create public repos: NO
│   ├── Allow members to create private repos: YES
│   └── Allow members to fork private repos: NO
└── Two-factor authentication: REQUIRED ✅
```

**How to:**
1. Go to https://github.com/orgs/TekupDK/settings
2. Set base permissions to "None"
3. Require 2FA for all members
4. Configure member privileges

---

### **Step 2: Teams Setup** (10 min)

```
TekupDK/
├── @TekupDK/owners             (You)
│   └── Access: Owner (all repos)
│
├── @TekupDK/core-team          (Future team members)
│   └── Access: Write (most repos)
│
├── @TekupDK/production-team    (Production deployments)
│   └── Access: Admin (production repos only)
│
└── @TekupDK/contributors       (External contributors)
    └── Access: Read/Triage (selected repos)
```

**How to create:**
1. Go to https://github.com/orgs/TekupDK/teams
2. Click "New team"
3. Create each team with appropriate access

---

### **Step 3: Create Repositories** (30 min)

**Production repos (høj prioritet):**
```bash
# Log ind på GitHub
# Go to https://github.com/orgs/TekupDK

# Create repositories:
1. tekup-database (Private)
2. tekup-vault (Private or Public)
3. tekup-billy (Private or Public)
```

**Development repos:**
```bash
4. rendetalje-os (Private)
5. tekup-ai (Private)
6. tekup-cloud (Private)
7. tekup-cloud-dashboard (Private)
8. tekup-gmail-services (Private)
9. tekup-ai-assistant (Public - docs)
```

**For each repo:**
- [x] Description
- [x] README.md
- [x] .gitignore (Node, TypeScript)
- [x] LICENSE (MIT)
- [x] Branch protection (main branch)

---

### **Step 4: Repository Settings** (per repo)

**Critical settings:**
```yaml
Branches:
  - main:
      protected: true
      require_pr: true
      require_reviews: 1
      require_status_checks: true
      
Security:
  - Enable Dependabot alerts
  - Enable Dependabot security updates
  - Enable code scanning (GitHub Advanced Security)
  
Collaborators & teams:
  - @TekupDK/owners: Admin
  - @TekupDK/core-team: Write
```

---

## 💻 **2-COMPUTER WORKFLOW**

### **Scenario:**
- **PC 1** (Hovedcomputer): c:\Users\empir\Tekup\
- **PC 2** (Anden computer): Clone fra GitHub

---

### **PC 1: Push Eksisterende Projekter til GitHub**

#### **Setup Git Authentication:**
```bash
# Install GitHub CLI
winget install --id GitHub.cli

# Login
gh auth login
# Choose: GitHub.com → HTTPS → Login with browser
```

#### **For hvert projekt (eksempel: tekup-database):**

```powershell
# Navigate til projekt
cd c:\Users\empir\Tekup\apps\production\tekup-database

# Initialize git (hvis ikke allerede)
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: tekup-database v1.4.0"

# Create repo on GitHub & push
gh repo create TekupDK/tekup-database --private --source=. --push

# Or if repo already exists on GitHub:
git remote add origin https://github.com/TekupDK/tekup-database.git
git branch -M main
git push -u origin main
```

#### **Batch script til alle projekter:**

```powershell
# Save as: push-all-to-github.ps1

$projects = @(
    "apps\production\tekup-database",
    "apps\production\tekup-vault",
    "apps\production\tekup-billy",
    "apps\web\rendetalje-os",
    "services\tekup-ai",
    "services\tekup-cloud",
    "services\tekup-gmail-services",
    "services\tekup-ai-assistant"
)

foreach ($project in $projects) {
    $projectPath = "c:\Users\empir\Tekup\$project"
    $repoName = Split-Path $project -Leaf
    
    Write-Host "Processing: $repoName" -ForegroundColor Green
    
    cd $projectPath
    
    # Initialize if needed
    if (!(Test-Path ".git")) {
        git init
        git add .
        git commit -m "Initial commit: $repoName"
    }
    
    # Create repo and push
    gh repo create "TekupDK/$repoName" --private --source=. --push
    
    Write-Host "✅ $repoName pushed to GitHub" -ForegroundColor Green
}
```

---

### **PC 2: Clone & Setup Workspace**

#### **Step 1: Setup Git**
```bash
# Install Git
winget install --id Git.Git

# Install GitHub CLI
winget install --id GitHub.cli

# Login
gh auth login
```

#### **Step 2: Clone All Repos**

```powershell
# Create workspace
mkdir c:\Users\[username]\Tekup
cd c:\Users\[username]\Tekup

# Clone organization-level structure docs (if exists)
gh repo clone TekupDK/tekup-workspace-docs

# Create folder structure
mkdir apps\production, apps\web, services

# Clone production repos
cd apps\production
gh repo clone TekupDK/tekup-database
gh repo clone TekupDK/tekup-vault tekup-vault
gh repo clone TekupDK/tekup-billy tekup-billy

# Clone web apps
cd ..\web
gh repo clone TekupDK/rendetalje-os
gh repo clone TekupDK/tekup-cloud-dashboard

# Clone services
cd ..\..\services
gh repo clone TekupDK/tekup-ai
gh repo clone TekupDK/tekup-cloud
gh repo clone TekupDK/tekup-gmail-services
```

#### **Step 3: Batch Clone Script**

```powershell
# Save as: clone-all-repos.ps1

$repos = @(
    "tekup-database:apps\production",
    "tekup-vault:apps\production",
    "tekup-billy:apps\production",
    "rendetalje-os:apps\web",
    "tekup-cloud-dashboard:apps\web",
    "tekup-ai:services",
    "tekup-cloud:services",
    "tekup-gmail-services:services"
)

foreach ($repo in $repos) {
    $repoName, $folder = $repo -split ":"
    
    Write-Host "Cloning: $repoName to $folder\" -ForegroundColor Green
    
    cd "c:\Users\[username]\Tekup\$folder"
    gh repo clone "TekupDK/$repoName"
}

Write-Host "✅ All repos cloned!" -ForegroundColor Green
```

---

## 🔄 **DAGLIG WORKFLOW (BEGGE COMPUTERE)**

### **Før du starter arbejde:**
```bash
cd c:\Users\empir\Tekup\apps\production\tekup-vault

# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/add-new-search
```

### **Under arbejde:**
```bash
# Make changes...

# Stage changes
git add .

# Commit often
git commit -m "feat: add semantic search filter"
```

### **Efter arbejde:**
```bash
# Push to GitHub
git push origin feature/add-new-search

# Create PR på GitHub
gh pr create --title "Add semantic search filter" --body "Description..."

# Merge når klar
gh pr merge
```

### **Skift mellem computere:**
```bash
# PC 1: Push changes
git push

# PC 2: Pull changes
git pull

# Work continues seamlessly!
```

---

## 📋 **.gitignore TEMPLATE**

Create in each repo:

```gitignore
# Dependencies
node_modules/
.pnp/
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
build/
dist/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db
desktop.ini

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log
npm-debug.log*

# Database
*.db
*.sqlite

# Misc
.turbo/
.cache/
```

---

## 🔐 **SECRETS MANAGEMENT**

### **VIGTIG: ALDRIG commit .env filer!**

**For hver repo:**
```bash
# PC 1: Create .env.example (without secrets)
cp .env .env.example

# Edit .env.example (remove actual values)
# Add to git
git add .env.example
git commit -m "docs: add env example"

# .env stays local (in .gitignore)
```

**PC 2: Setup secrets**
```bash
# Clone repo
git clone https://github.com/TekupDK/tekup-database

# Copy .env.example
cp .env.example .env

# Manually add secrets to .env
# (Share secrets securely via password manager)
```

**GitHub Secrets (for CI/CD):**
1. Go to repo → Settings → Secrets and variables → Actions
2. Add secrets: DATABASE_URL, API_KEYS, etc.
3. Use in GitHub Actions workflows

---

## 📚 **WORKSPACE DOKUMENTATION**

### **Option 1: Separate Repo (Anbefalet)**

```bash
# Create workspace docs repo
gh repo create TekupDK/tekup-workspace-docs --public

cd c:\Users\empir\Tekup\docs
git init
git add .
git commit -m "Initial commit: workspace documentation"
git remote add origin https://github.com/TekupDK/tekup-workspace-docs
git push -u origin main
```

Contains:
- README.md (workspace overview)
- WORKSPACE_STRUCTURE_IMPROVED.md
- GITHUB_ORGANIZATION_SETUP_GUIDE.md
- CONTRIBUTING.md
- Architecture docs

### **Option 2: Wiki per Repo**

Enable Wiki for each major repo:
- tekup-database → Technical docs
- tekup-vault → API docs
- rendetalje-os → User guide

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **GitHub Setup (30 min):**
- [ ] Organization created (TekupDK) ✅
- [ ] 2FA enabled
- [ ] Teams created
- [ ] Base permissions set
- [ ] Repositories created (9 repos)
- [ ] Branch protection enabled

### **PC 1 - Push til GitHub (1 time):**
- [ ] Git installed & authenticated
- [ ] Each project pushed to GitHub
- [ ] .gitignore added
- [ ] README.md updated
- [ ] Secrets removed from commits

### **PC 2 - Clone workspace (30 min):**
- [ ] Git installed & authenticated
- [ ] Folder structure created
- [ ] All repos cloned
- [ ] .env files configured
- [ ] Dependencies installed
- [ ] Test each project works

---

## 🚀 **QUICK START COMMANDS**

### **PC 1: Push Everything**
```powershell
cd c:\Users\empir\Tekup\scripts
.\push-all-to-github.ps1
```

### **PC 2: Clone Everything**
```powershell
cd c:\Users\[username]
mkdir Tekup
cd Tekup
.\clone-all-repos.ps1
```

### **Daily Sync**
```bash
# Pull updates across all repos
cd c:\Users\empir\Tekup
Get-ChildItem -Recurse -Depth 2 -Directory -Filter ".git" | ForEach-Object {
    cd $_.Parent.FullName
    Write-Host "Pulling: $($_.Parent.Name)" -ForegroundColor Green
    git pull
}
```

---

## 📞 **SUPPORT**

**GitHub Docs:**
- Organizations: https://docs.github.com/en/organizations
- Teams: https://docs.github.com/en/organizations/organizing-members-into-teams
- Branch protection: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches

**Questions?**
- Check this guide first
- GitHub Community: https://github.community
- GitHub Support: https://support.github.com

---

## 🎯 **NÆSTE SKRIDT**

Hvad vil du gøre først?

1. **Push alle projekter til GitHub?** (1 time)
2. **Setup PC 2 workspace?** (30 min)
3. **Test sync mellem begge computere?** (15 min)

**Jeg kan hjælpe med scripts!** 🚀
