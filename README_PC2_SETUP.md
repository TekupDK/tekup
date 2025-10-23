# 🚀 PC 2 SETUP GUIDE - Tekup Monorepo

**Updated:** 23. Oktober 2025, 16:00 CET  
**Type:** MONOREPO (all projects in one repository)  
**Setup tid:** 15 minutter

---

## 🎯 **HVAD ER TEKUP WORKSPACE?**

**ÉT GitHub repository med ALLE Tekup projekter indeni.**

- ✅ **Monorepo** - Alt i én repo
- ✅ **ÉT clone** - Få alle projekter på én gang
- ✅ **ÉT workspace** - Tekup-Portfolio.code-workspace åbner alt
- ✅ **Fuld sync** - Git pull/push synkroniserer alt

---

## 📦 **HVAD INDEHOLDER DET?**

### **Komplet struktur:**
```
Tekup/ (MONOREPO)
├── apps/
│   ├── production/
│   │   ├── tekup-database/      (97 files)
│   │   ├── tekup-vault/         (117 files)
│   │   └── tekup-billy/         (224 files)
│   ├── web/
│   │   ├── rendetalje/          (528 files)
│   │   └── tekup-cloud-dashboard/ (47 files)
│   └── README.md
├── services/
│   ├── tekup-ai/                (406 files)
│   ├── tekup-gmail-services/    (82 files)
│   └── README.md
├── tekup-secrets/               (7 files - git-crypt encrypted)
├── archive/                     (3,445+ legacy files)
├── docs/                        (10 documentation files)
├── scripts/                     (automation scripts)
├── Tekup-Portfolio.code-workspace ← ÅBEN DENNE! ✨
├── README.md
└── ... (workspace files)
```

**Total:** ~5,000+ files, alle projekter inkluderet

---

## ✅ **PC 2 SETUP - 3 STEPS**

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

# 5. Docker Desktop (optional)
winget install --id Docker.DockerDesktop
```

**Restart terminal efter installation!**

---

### **STEP 2: GitHub Authentication** (2 min)

```powershell
# Login til GitHub
gh auth login

# Vælg:
# - GitHub.com
# - HTTPS
# - Login with a web browser
```

**Verify:**
```powershell
gh auth status
# Should show: Logged in to github.com
```

---

### **STEP 3: Clone HELE Workspace** (3 min)

```powershell
# Navigate til ønsket lokation
cd c:\Users\$env:USERNAME

# Clone MONOREPO (ALT på én gang!)
gh repo clone TekupDK/tekup-workspace-docs Tekup

# Gå ind i workspace
cd Tekup

# Åbn VS Code workspace
code Tekup-Portfolio.code-workspace
```

**DET ER DET!** ✨

VS Code åbner med ALLE projekter:
- ✅ tekup-database
- ✅ tekup-vault
- ✅ tekup-billy
- ✅ rendetalje
- ✅ tekup-ai
- ✅ tekup-gmail-services
- ✅ tekup-cloud-dashboard
- ✅ Dokumentation
- ✅ Scripts
- ✅ Archive

---

## ⚙️ **POST-SETUP: Configure Projects**

### **1. Setup Secrets (Git-Crypt)**

```powershell
cd tekup-secrets
# Follow instructions in tekup-secrets/PC2_SETUP.md
```

### **2. Install Dependencies**

```powershell
# For each project you want to work on:
cd apps/production/tekup-database
pnpm install

cd ../tekup-vault
pnpm install

# Etc...
```

### **3. Configure .env Files**

```powershell
# Each project has .env.example
cd apps/production/tekup-database
cp .env.example .env

# Edit .env with your values
notepad .env
```

**Get .env values from:**
- Password manager
- PC 1 (original computer)
- Team lead (Jonas)

---

## 🔄 **DAGLIG WORKFLOW**

### **Start of Day:**

```powershell
# Pull latest changes (synkroniserer ALT)
cd c:\Users\$env:USERNAME\Tekup
git pull
```

### **Under Arbejde:**

```powershell
# Work on specific project
cd apps/production/tekup-vault

# Make changes...

# Commit often
git add .
git commit -m "feat: add new feature"
```

### **End of Day:**

```powershell
# Push changes (synkroniserer tilbage)
git push origin master
```

**PC 1 pull næste dag → får alle dine ændringer!**

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

## 📚 **DOKUMENTATION**

### **Workspace-Level:**
- `README.md` - Main workspace overview
- `AI_CONTEXT_SUMMARY.md` - For AI assistants
- `CONTRIBUTING.md` - Development guidelines
- `CODEOWNERS` - Code ownership

### **Project-Specific:**
- `apps/production/tekup-database/README.md`
- `apps/production/tekup-vault/README.md`
- `apps/rendetalje/README.md`
- `services/tekup-ai/README.md`

### **Docs Folder:**
- `docs/GITHUB_ORGANIZATION_SETUP_GUIDE.md`
- `docs/DAILY_WORK_LOG_2025-10-23.md`
- `docs/TEKUP_COMPLETE_RESTRUCTURE_PLAN.md`

---

## ✅ **SUCCESS CRITERIA**

Du har sat PC 2 op korrekt når:

- [ ] GitHub CLI authenticated
- [ ] Hele Tekup repo cloned
- [ ] Tekup-Portfolio.code-workspace åbnet i VS Code
- [ ] Kan se alle projekter i VS Code sidebar
- [ ] .env files configured (mindst 1 projekt)
- [ ] Dependencies installed (mindst 1 projekt)
- [ ] Mindst 1 projekt kan køre (fx `pnpm dev`)
- [ ] Kan git pull/push uden fejl

---

## 🎯 **FORSKELLEN FRA FØR**

### **Før (Multi-Repo):**
```powershell
# Clone 9 separate repos
gh repo clone TekupDK/tekup-database
gh repo clone TekupDK/tekup-vault
gh repo clone TekupDK/tekup-billy
# ... 6 more repos
```
❌ 9 clone commands  
❌ 9 separate folders  
❌ 9 git pull/push

### **Nu (Monorepo):**
```powershell
# Clone ÉT repo (med ALT indeni)
gh repo clone TekupDK/tekup-workspace-docs Tekup
```
✅ 1 clone command  
✅ 1 folder  
✅ 1 git pull/push synkroniserer ALT

---

## 💡 **FORDELE VED MONOREPO**

1. **Nemmere setup** - 1 command vs 9 commands
2. **Hurtigere sync** - 1 pull vs 9 pulls
3. **Atomic commits** - Ændringer på tværs af projekter i 1 commit
4. **Nemmere code sharing** - Alle projekter i samme repo
5. **Konsistent versionering** - Én git history
6. **Nemmere onboarding** - Ny udvikler clone én gang

---

## 📞 **SUPPORT**

**Questions?**
- Check this guide first
- Check project README
- Check docs/ folder
- Create GitHub issue
- Contact @JonasAbde

---

## 🚀 **READY TO START!**

Denne computer er nu klar til at arbejde på TekupDK projekter!

**Key points:**
- 💻 Same workspace som PC 1 (via monorepo)
- 🔄 Always `git pull` før arbejde starter
- 📝 Commit ofte, push regelmæssigt
- 📚 Check docs når stuck
- 🤝 Ask team hvis uklart

**Happy coding!** 🎉

---

**Last updated:** 23. Oktober 2025, 16:00 CET  
**Version:** 2.0.0 (Monorepo)  
**For:** PC 2 Setup
