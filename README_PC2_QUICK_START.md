# ⚠️ DEPRECATED - See README_PC2_SETUP.md instead

**This file is outdated. Please use:**
- **README_PC2_SETUP.md** (updated for monorepo)

---

# 🚀 TEKUP WORKSPACE - PC 2 QUICK START GUIDE (OLD)

**Dato:** 23. Oktober 2025  
**Status:** DEPRECATED - Based on old multi-repo structure  
**Formål:** Setup anden computer med komplet Tekup workspace  
**Estimeret tid:** 45 minutter

---

## 🎯 **HVAD ER DETTE?**

Dette er **TekupDK's udviklingsworkspace** - et professionelt multi-repo setup med 9+ projekter organiseret efter industry standards.

**Workspace owner:** Jonas Abde (@JonasAbde)  
**GitHub Organization:** https://github.com/TekupDK  
**Workspace struktur:** Multi-repo (hver service = separat repository)

---

## 📊 **WORKSPACE OVERVIEW**

### **Hvad findes der?**

```
Tekup/
├── apps/                      → Applications (production, web, desktop)
│   ├── production/            → Live services (KRITISKE)
│   │   ├── tekup-database    → Central PostgreSQL database
│   │   ├── tekup-vault       → Knowledge layer (semantic search)
│   │   └── tekup-billy       → Billy.dk MCP server
│   │
│   └── web/                   → Web applications
│       ├── rendetalje-os     → Cleaning management platform
│       └── tekup-cloud-dashboard → Unified dashboard
│
├── services/                  → Backend services & APIs
│   ├── tekup-ai              → AI infrastructure monorepo
│   ├── tekup-cloud           → RenOS tools + calendar MCP
│   ├── tekup-gmail-services  → Email automation
│   └── tekup-ai-assistant    → AI docs & configs
│
├── packages/                  → Shared libraries (future)
├── tools/                     → Development tools (future)
├── scripts/                   → Automation scripts
├── docs/                      → Documentation hub
└── archive/                   → Legacy projects (read-only)
```

### **Tech Stack:**
- **Languages:** TypeScript, JavaScript, Python
- **Frameworks:** Next.js, React, Express, Prisma
- **Databases:** PostgreSQL (central)
- **Package Manager:** pnpm
- **Build System:** Turborepo (monorepos)
- **Deployment:** Render.com, Docker
- **Version Control:** Git + GitHub

---

## ✅ **QUICK START - STEP BY STEP**

### **STEP 1: Install Prerequisites** (10 min)

```powershell
# 1. Git
winget install --id Git.Git

# 2. Node.js 18+ (LTS)
winget install --id OpenJS.NodeJS.LTS

# 3. pnpm
npm install -g pnpm

# 4. GitHub CLI
winget install --id GitHub.cli

# 5. Docker Desktop (optional, for database)
winget install --id Docker.DockerDesktop
```

**Restart terminal after installation!**

---

### **STEP 2: GitHub Authentication** (5 min)

```powershell
# Login til GitHub
gh auth login

# Vælg:
# - GitHub.com
# - HTTPS
# - Login with a web browser
# - Authorize når browser åbner
```

**Verify:**
```powershell
gh auth status
# Should show: Logged in to github.com as [username]
```

---

### **STEP 3: Clone Workspace** (15 min)

**Option A: Automatic (anbefalet)**

```powershell
# Create workspace directory
cd c:\Users\$env:USERNAME
mkdir Tekup
cd Tekup

# Download clone script fra GitHub
gh repo clone TekupDK/tekup
cd tekup\scripts

# Run automatic clone script
.\clone-all-repos.ps1
```

**Option B: Manual**

```powershell
# Create folder structure
cd c:\Users\$env:USERNAME
mkdir Tekup
cd Tekup
mkdir apps\production, apps\web, services, docs

# Clone repos one by one
cd apps\production
gh repo clone TekupDK/tekup-database
gh repo clone TekupDK/tekup-vault
gh repo clone TekupDK/tekup-billy

cd ..\web
gh repo clone TekupDK/rendetalje-os
gh repo clone TekupDK/tekup-cloud-dashboard

cd ..\..\services
gh repo clone TekupDK/tekup-ai
gh repo clone TekupDK/tekup-cloud
gh repo clone TekupDK/tekup-gmail-services
gh repo clone TekupDK/tekup-ai-assistant

cd ..
```

---

### **STEP 4: Configure Environment** (15 min)

**For hver projekt:**

```powershell
cd apps\production\tekup-database

# Copy environment template
cp .env.example .env

# Edit .env med dine credentials
notepad .env

# Install dependencies
pnpm install
```

**VIGTIG:** Få .env værdier fra:
1. Password manager
2. PC 1 (original computer)
3. Team lead (Jonas)

**Projekter der SKAL konfigureres:**
- ✅ tekup-database (DATABASE_URL)
- ✅ tekup-vault (DATABASE_URL, OPENAI_API_KEY)
- ✅ tekup-billy (DATABASE_URL, BILLY_API_KEY)
- ✅ rendetalje-os (SUPABASE_URL, API keys)
- ✅ tekup-ai (DATABASE_URL, LLM keys)

---

### **STEP 5: Verify Setup** (5 min)

**Test each major project:**

```powershell
# Test tekup-database
cd c:\Users\$env:USERNAME\Tekup\apps\production\tekup-database
docker-compose up -d
pnpm prisma migrate deploy

# Test tekup-vault
cd ..\tekup-vault
pnpm install
pnpm dev
# Should start on http://localhost:3000

# Test rendetalje-os
cd ..\..\web\rendetalje-os
pnpm install
pnpm dev
# Should start frontend on http://localhost:5173
```

---

## 📚 **KEY DOCUMENTATION FILES**

### **Workspace-Level Docs** (Læs disse!)

1. **README.md** (Main workspace overview)
   - Workspace structure
   - Quick start guide
   - Project links

2. **WORKSPACE_STRUCTURE_IMPROVED.md** (Industry standards)
   - Hvorfor denne struktur?
   - Best practices
   - Mapping til andre workspaces

3. **GITHUB_ORGANIZATION_SETUP_GUIDE.md** (GitHub setup)
   - Multi-repo approach
   - 2-computer workflow
   - Sync mellem computere

4. **CONTRIBUTING.md** (Development guidelines)
   - Coding standards
   - Git workflow
   - Testing requirements

5. **CODEOWNERS** (Code ownership)
   - Hvem ejer hvad
   - PR review assignments

---

### **Project-Specific Docs**

Hver projekt har sin egen README:
- `apps/production/tekup-database/README.md`
- `apps/production/tekup-vault/README.md`
- `apps/production/tekup-billy/README.md`
- `services/tekup-ai/README.md`

---

## 🤖 **FOR AI ASSISTANTS (CLAUDE, GPT, etc.)**

### **Workspace Context:**

```yaml
Workspace Name: TekupDK Development Environment
Structure: Multi-repo (9+ separate repositories)
Organization: GitHub @TekupDK
Primary Language: TypeScript
Package Manager: pnpm
Monorepo Tool: Turborepo (where applicable)

Active Projects: 9
- Production services: 3 (tekup-database, tekup-vault, tekup-billy)
- Web applications: 2 (rendetalje-os, tekup-cloud-dashboard)
- Backend services: 4 (tekup-ai, tekup-cloud, tekup-gmail-services, tekup-ai-assistant)

Key Facts:
- All projects use central tekup-database
- Code ownership defined in CODEOWNERS
- Multi-computer development (sync via GitHub)
- Industry standard structure (inspired by OpenAI, Anthropic)
```

### **Common AI Tasks:**

1. **"Read workspace structure"**
   → Check `Tekup/README.md` and `WORKSPACE_STRUCTURE_IMPROVED.md`

2. **"How to setup project X"**
   → Check `Tekup/apps/[category]/[project]/README.md`

3. **"Sync changes from PC 1"**
   → `git pull` in each repo

4. **"What's the database schema"**
   → Check `tekup-database/prisma/schema.prisma`

5. **"How to deploy X"**
   → Check `docs/deployment/` folder

---

## 🔄 **DAILY WORKFLOW**

### **Start of Day:**

```powershell
# Pull latest changes across all repos
cd c:\Users\$env:USERNAME\Tekup

# Quick sync all repos
Get-ChildItem -Recurse -Depth 3 -Directory -Filter ".git" | ForEach-Object {
    cd $_.Parent.FullName
    Write-Host "Pulling: $($_.Parent.Name)" -ForegroundColor Green
    git pull
}
```

### **During Work:**

```bash
# Work on specific project
cd apps/production/tekup-vault

# Create feature branch
git checkout -b feature/add-search-filter

# Make changes...
# Commit often
git add .
git commit -m "feat: add semantic search filter"

# Push to GitHub
git push origin feature/add-search-filter

# Create PR
gh pr create --title "Add search filter" --body "Description..."
```

### **End of Day:**

```bash
# Ensure all changes are pushed
git status  # Check for uncommitted changes
git push    # Push to GitHub

# Switch to PC 1 tomorrow
# Just git pull to continue work!
```

---

## 🆘 **TROUBLESHOOTING**

### **Problem: "gh: command not found"**
```powershell
# Solution: Install GitHub CLI
winget install --id GitHub.cli
# Restart terminal
```

### **Problem: "Authentication failed"**
```powershell
# Solution: Login again
gh auth login
```

### **Problem: "Cannot clone repo - not found"**
```
Reason: Repository hasn't been pushed to GitHub yet from PC 1
Solution: Wait for PC 1 to push, or verify repo exists at https://github.com/TekupDK
```

### **Problem: "pnpm not found"**
```powershell
# Solution: Install pnpm
npm install -g pnpm
# Restart terminal
```

### **Problem: ".env file missing"**
```
Reason: .env files are NOT in git (security)
Solution: 
1. Copy .env.example to .env
2. Get actual values from PC 1 or password manager
3. Fill in .env with correct credentials
```

### **Problem: "Database connection failed"**
```
Check:
1. Is tekup-database Docker container running?
2. Is DATABASE_URL correct in .env?
3. Are you on same network (if using local DB)?
```

---

## 📞 **GETTING HELP**

### **Documentation:**
- `Tekup/docs/` - All workspace documentation
- `Tekup/README.md` - Main guide
- Individual project READMEs

### **GitHub:**
- Organization: https://github.com/TekupDK
- Issues: Create issue in relevant repo
- Discussions: Use GitHub Discussions

### **Team:**
- Owner: @JonasAbde
- See CODEOWNERS for specific project owners

---

## ✅ **SETUP CHECKLIST**

Efter du har kørt gennem guiden:

- [ ] Git installed
- [ ] Node.js + pnpm installed
- [ ] GitHub CLI installed & authenticated
- [ ] Docker installed (optional)
- [ ] All repos cloned to correct locations
- [ ] .env files configured for each project
- [ ] Dependencies installed (`pnpm install` in each repo)
- [ ] At least 1 project tested and running
- [ ] Daily workflow understood
- [ ] Documentation reviewed

---

## 🎯 **WHAT'S NEXT?**

### **Immediate:**
1. ✅ Complete this setup
2. ✅ Test running at least 3 projects
3. ✅ Verify git sync works (pull from PC 1)

### **This Week:**
1. Familiarize with each project's structure
2. Review CONTRIBUTING.md guidelines
3. Make first commit and PR
4. Test full workflow (branch → commit → push → PR → merge)

### **Ongoing:**
1. Keep repos synced (pull daily)
2. Follow coding standards
3. Write tests for new features
4. Update documentation as you go

---

## 📊 **SUCCESS METRICS**

You've successfully setup PC 2 when:
- ✅ All repos cloned
- ✅ At least 3 projects run successfully
- ✅ Can git pull/push without errors
- ✅ .env files configured
- ✅ Understand workspace structure
- ✅ Know where to find documentation

---

## 🚀 **READY TO START!**

Denne computer er nu klar til at arbejde på TekupDK projekter!

**Key points:**
- 💻 Same workspace som PC 1 (via GitHub sync)
- 🔄 Always `git pull` before starting work
- 📝 Commit often, push regularly
- 📚 Check docs when stuck
- 🤝 Ask team if unclear

**Happy coding!** 🎉

---

**Last updated:** 23. Oktober 2025  
**Version:** 1.0.0  
**For:** PC 2 Initial Setup
