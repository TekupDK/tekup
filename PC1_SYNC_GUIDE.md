# 🖥️ PC1 Sync Guide - Lenovo Yoga 9 Pro

**Target PC:** Lenovo Yoga 9 Pro
**Specs:** 64GB RAM, NVIDIA RTX 5070, Intel i9 Ultra
**Date:** 26. Oktober 2025
**From:** PC2 (Jonas-dev)

---

## 📊 Current State on PC2

**Active Worktrees:**
```
C:/Users/Jonas-dev/tekup/               → release/stabilize-2025-10-26 ⭐ CURRENT
C:/Users/Jonas-dev/tekup/tekup-feature/ → claude/implement-momentary-feature-011CUSDGPgNNv8NS6psNVgfx
C:/Users/Jonas-dev/tekup-master/        → master
```

**Latest Commits (Pushed to GitHub):**
- `e179430` - **release/stabilize-2025-10-26** - fix(mobile): resolve all TypeScript errors ✅
- `40778a8` - **feature branch** - chore: add Kilocode configuration ✅
- `master` - Branch: `8f0ba12`

**Stashed Changes:**
- `stash@{0}` - WIP: mcp.json fixes and mobile compatibility updates

---

## 🎯 Step-by-Step PC1 Setup

### Step 1: Pull Latest from GitHub

```powershell
# På PC1 - åbn terminal i tekup repo
cd C:\path\to\your\tekup-repo  # Find din PC1 path

# Hent alt fra GitHub
git fetch --all --prune

# Tjek hvad der er nyt
git branch -r
```

### Step 2: Setup Worktrees (Anbefalet)

```powershell
# Hvis du IKKE allerede har worktrees på PC1:

# 1. Opret master worktree
git worktree add ..\tekup-master master

# 2. Opret feature worktree
git worktree add tekup-feature claude/implement-momentary-feature-011CUSDGPgNNv8NS6psNVgfx

# 3. Opret release worktree
git worktree add tekup-release release/stabilize-2025-10-26

# Verificer setup
git worktree list
```

**Resultat:**
```
C:/path/to/tekup/          → (din valgte main branch)
C:/path/to/tekup-master/   → master
C:/path/to/tekup-feature/  → claude/implement-momentary-feature-011CUSDGPgNNv8NS6psNVgfx
C:/path/to/tekup-release/  → release/stabilize-2025-10-26
```

### Step 3: Checkout Release Branch (Recommended Start)

```powershell
# Hvis du IKKE bruger worktrees:
git checkout release/stabilize-2025-10-26
git pull

# Eller hvis du bruger worktrees:
cd tekup-release
```

---

## 📦 What's on Each Branch

### 1️⃣ **release/stabilize-2025-10-26** (LATEST WORK)

**Status:** ✅ TypeScript errors fixed, Expo stabilized
**Latest Commit:** `e179430`

**Key Features:**
- All mobile TypeScript errors resolved
- Expo startup stabilized
- Merged from master

**Start Here:**
```powershell
cd C:/path/to/tekup-release  # hvis worktree
# ELLER
git checkout release/stabilize-2025-10-26

npm install
cd apps/rendetalje/services/mobile
npm install
npm start
```

---

### 2️⃣ **claude/implement-momentary-feature-011CUSDGPgNNv8NS6psNVgfx** (FEATURE BRANCH)

**Status:** 🟡 Has 34 TS errors (documented), includes Kilocode config
**Latest Commit:** `40778a8`

**Key Files:**
- `.kilocodemodes` - Custom Kilocode modes (code-reviewer, test-engineer, etc.)
- `kilo-code-settings.json` - Shared settings
- `SESSION_SNAPSHOT_2025-10-26.md` - Full status report
- Complete mobile app implementation (5 screens)
- Docker setup

**Use For:**
- Testing Kilocode custom modes
- Reviewing mobile implementation
- Prisma migration work

```powershell
cd C:/path/to/tekup-feature
npm install
```

---

### 3️⃣ **master** (STABLE BASE)

**Latest Commit:** `8f0ba12`

**Use For:**
- Clean slate testing
- PR base branch
- Production reference

---

## 🔧 Kilocode Configuration

**On Feature Branch:** `.kilocodemodes` file included!

**Available Custom Modes:**
1. **code-reviewer** - Senior engineer code reviews
2. **frontend-specialist** - React/TypeScript/CSS expert
3. **test-engineer** - QA and testing focus
4. **code-skeptic** - Quality gatekeeper (skeptical reviewer)
5. **docs-specialist** - Technical writing expert

**Kilocode will auto-load these on PC1** when you open the repo! 🎉

---

## ⚙️ Environment Setup (PC1 Specific)

### Docker Configuration

```powershell
# Set your PC1 LAN IP (find with ipconfig)
$env:HOST_IP = "YOUR_PC1_LAN_IP"  # e.g., "192.168.1.100"

# Mobile Docker
cd apps/rendetalje/services/mobile
docker-compose up --build
```

### Port Allocation (Same as PC2)

**Mobile:**
- Expo: 19000-19002, 8081

**Backend:**
- NestJS: 3001

**Frontend:**
- Next.js: 3002

**Services:**
- PostgreSQL: 5432
- Redis: 6379

---

## 🚀 Quick Start Commands (PC1)

### Option A: Release Branch (Recommended)

```powershell
# Terminal 1 - Backend
cd C:/path/to/tekup-release/apps/rendetalje/services/backend-nestjs
npm install
npm run start:dev

# Terminal 2 - Mobile
cd C:/path/to/tekup-release/apps/rendetalje/services/mobile
npm install
npm start

# Terminal 3 - Frontend (hvis nødvendigt)
cd C:/path/to/tekup-release/apps/rendetalje/services/frontend-nextjs
npm install
npm run dev
```

### Option B: Multi-Branch Development

```powershell
# Terminal 1 - Master (stable reference)
cd C:/path/to/tekup-master
npm run dev

# Terminal 2 - Release (current work)
cd C:/path/to/tekup-release
npm run dev

# Terminal 3 - Feature (testing Kilocode modes)
cd C:/path/to/tekup-feature
code .  # Opens in VS Code with Kilocode configs
```

---

## 🔄 Sync Back to PC2 (Later)

Når du har lavet changes på PC1:

```powershell
# På PC1
git add .
git commit -m "feat: PC1 work description"
git push

# På PC2 (automatisk)
# GitHub syncer alt - bare pull på PC2
```

---

## 📝 Important Notes

### ✅ Already Available on GitHub:
1. Kilocode configuration (`.kilocodemodes`)
2. Release branch with TS fixes
3. Feature branch with mobile app
4. Session snapshot documentation

### 🔴 NOT on GitHub (PC2 Only):
1. Stashed changes (`stash@{0}`) - mcp.json fixes
2. Local worktree setup (you need to recreate on PC1)
3. Local node_modules (reinstall with `npm install`)

### 💡 Pro Tips for PC1:

**Your RTX 5070 Beast Mode:**
- Docker builds will be **FAST** 🚀
- Multiple services samtidig? No problem!
- Expo Metro bundler on steroids
- TypeScript compilation instant

**Recommended IDE:**
- VS Code med Kilocode extension
- Open `tekup-feature` folder for best Kilocode experience

**Network:**
- Use LAN IP for mobile device testing
- Configure `$env:HOST_IP` in PowerShell

---

## 🎯 Recommended First Action on PC1

```powershell
# 1. Clone/Open repo
cd C:\your\preferred\location
git clone https://github.com/TekupDK/tekup.git
cd tekup

# 2. Fetch everything
git fetch --all

# 3. Checkout release branch (latest work)
git checkout release/stabilize-2025-10-26
git pull

# 4. Install dependencies
npm install
cd apps/rendetalje/services/mobile
npm install

# 5. Start mobile app
npm start

# 6. Test on your device/emulator
# QR code på http://localhost:19002
```

---

## 📱 Testing on Mobile Device

**Med PC1's NVIDIA Power:**
- Android Studio emulator vil køre smooth
- iOS Simulator (hvis macOS) - N/A på Windows
- Physical device via Expo Go - brug PC1 LAN IP

---

## 🔗 Quick Links

**GitHub Repo:** https://github.com/TekupDK/tekup.git

**Key Branches:**
- `release/stabilize-2025-10-26` - Latest work ⭐
- `claude/implement-momentary-feature-011CUSDGPgNNv8NS6psNVgfx` - Kilocode config
- `master` - Stable base

**Documentation:**
- `SESSION_SNAPSHOT_2025-10-26.md` - Full status
- `BRANCH_STATUS.md` - Feature branch details
- `PORT_ALLOCATION_MASTER.md` - Port assignments

---

## ❓ Troubleshooting

**Problem:** Worktree conflicts
**Solution:**
```powershell
git worktree prune
git worktree list
```

**Problem:** Port already in use
**Solution:**
```powershell
# Find og kill process
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Problem:** Expo won't start
**Solution:**
```powershell
npm run reset  # Clear cache
npm start
```

---

**Last Updated:** 2025-10-26 12:07 CET
**Next Action:** Start with release branch on PC1, test Kilocode modes on feature branch
