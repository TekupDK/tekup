# 🚀 Tekup AI V2 Setup Guide

**Date:** November 3, 2025  
**Status:** ✅ Complete setup guide  
**Purpose:** Guide for working with tekup-ai-v2 (Friday AI) in the tekup repository

---

## 📋 **Overview**

`tekup-ai-v2` is configured as a **git submodule** that points to the dedicated [tekup-friday](https://github.com/TekupDK/tekup-friday) repository. This allows you to work with Friday AI V2 directly in your tekup workspace, while the code lives in its own repository.

### **Benefits of this structure:**

- ✅ **Dedicated Repository:** tekup-friday has its own git history
- ✅ **Easy Integration:** Work directly from tekup workspace
- ✅ **Version Control:** Pin specific versions of Friday AI
- ✅ **Deployment:** Separate production deployment from monorepo

---

## 🎯 **Quick Start**

### **Step 1: Initialize the Submodule**

```bash
cd /path/to/tekup
git submodule update --init --remote services/tekup-ai-v2
```

### **Step 2: Verify Installation**

```bash
cd services/tekup-ai-v2
ls -la
```

You should now see the complete Friday AI V2 codebase:

```
services/tekup-ai-v2/
├── client/          # React 19 frontend
├── server/          # Express + tRPC backend
├── drizzle/         # Database migrations
├── shared/          # Shared types
├── package.json
├── README.md
└── ...
```

### **Step 3: Install Dependencies**

```bash
cd services/tekup-ai-v2
pnpm install
```

### **Step 4: Configure Environment**

```bash
# Copy example file
cp .env.example .env

# Edit .env with your credentials:
# - DATABASE_URL
# - GOOGLE_SERVICE_ACCOUNT_KEY
# - BILLY_API_KEY
# - GEMINI_API_KEY
```

### **Step 5: Setup Database**

```bash
pnpm db:push
```

### **Step 6: Start Development Server**

```bash
pnpm dev
```

Open your browser at `http://localhost:3000` 🎉

---

## 🔄 **Daily Development Workflow**

### **Start Your Workday**

```bash
# Navigate to tekup workspace
cd /path/to/tekup

# Update submodule to latest version
cd services/tekup-ai-v2
git pull origin main

# Start development server
pnpm dev
```

### **Make Changes**

```bash
# Work normally in services/tekup-ai-v2/
# Edit files, test, etc.

# Commit your changes
git add .
git commit -m "feat: add new feature"
git push origin main
```

### **Update Main Repo (tekup)**

After committing to tekup-friday, update the submodule reference in the main repo:

```bash
# Go back to main repo
cd /path/to/tekup

# Update submodule reference
git add services/tekup-ai-v2
git commit -m "chore: update tekup-ai-v2 to latest version"
git push origin main
```

---

## 🛠️ **Useful Commands**

### **Submodule Management**

```bash
# Check submodule status
git submodule status

# Update all submodules
git submodule update --remote

# Update only tekup-ai-v2
git submodule update --remote services/tekup-ai-v2

# Clone repo with all submodules
git clone --recurse-submodules https://github.com/TekupDK/tekup.git
```

### **Development Commands**

```bash
cd services/tekup-ai-v2

# Start development server (HMR enabled)
pnpm dev

# Build for production
pnpm build

# Type check
pnpm check

# Run tests
pnpm test

# Database migrations
pnpm db:push        # Push schema changes
pnpm db:studio      # Open Drizzle Studio UI
pnpm db:generate    # Generate migration files

# Format code
pnpm format

# Lint code
pnpm lint
```

---

## 🔧 **Troubleshooting**

### **Problem: Empty services/tekup-ai-v2/ directory**

**Symptom:** Directory exists but is empty

**Solution:**

```bash
cd /path/to/tekup
git submodule update --init --remote services/tekup-ai-v2
```

### **Problem: "fatal: no submodule mapping found"**

**Symptom:** Git cannot find submodule configuration

**Solution:**

```bash
# Verify that .gitmodules contains correct configuration
cat .gitmodules

# Sync submodule config
git submodule sync
git submodule update --init --remote services/tekup-ai-v2
```

### **Problem: Submodule is on wrong commit**

**Symptom:** You have an old version of Friday AI

**Solution:**

```bash
cd services/tekup-ai-v2
git checkout main
git pull origin main
cd ../..
git add services/tekup-ai-v2
git commit -m "chore: update tekup-ai-v2 to latest"
```

### **Problem: Cannot push to submodule**

**Symptom:** Permission denied or authentication error

**Solution:**

```bash
# Verify you have access to tekup-friday repo
cd services/tekup-ai-v2
git remote -v

# Verify authentication
gh auth status

# Login if necessary
gh auth login
```

---

## 📚 **Related Resources**

### **Documentation**

- **Friday AI README:** `services/tekup-ai-v2/README.md`
- **Migration Plan:** `FRIDAY_AI_V2_MIGRATION_COMPLETE.md`
- **GitHub Organization:** `GITHUB_TEKUPDK_ORGANIZATION.md`
- **Danish Guide:** `TEKUP_AI_V2_UDVIKLINGS_GUIDE.md`

### **Repositories**

- **tekup-friday (submodule):** <https://github.com/TekupDK/tekup-friday>
- **tekup (main repo):** <https://github.com/TekupDK/tekup>
- **tekup-billy:** <https://github.com/TekupDK/tekup-billy>
- **tekup-secrets:** <https://github.com/TekupDK/tekup-secrets>

### **Live Resources**

- **Friday AI Live Demo (Development Instance):** <https://3000-ijhgukurr5hhbd1h5s5sk-e0f84be7.manusvm.computer>
  - *Note: This is a temporary development environment and may not always be available*
- **GitHub TekupDK Org:** <https://github.com/TekupDK>

---

## ✅ **Checklist: Are You Ready to Develop?**

- [ ] Git submodule is initialized and updated
- [ ] Dependencies are installed (`pnpm install`)
- [ ] Environment variables are configured (`.env`)
- [ ] Database is set up and migrated (`pnpm db:push`)
- [ ] Development server starts without errors (`pnpm dev`)
- [ ] You can open `http://localhost:3000` in the browser
- [ ] You can log in via Manus OAuth
- [ ] You understand the branch and commit workflow

---

**Happy developing! 🚀**

If you have problems, see the troubleshooting section above or contact the team.
