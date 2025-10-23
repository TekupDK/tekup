# 🚀 Tekup Secrets - Quick Start Guide

**Duration:** 5 minutes to get started  
**Skill Level:** Beginner  
**Updated:** October 23, 2025

---

## 🎯 What You'll Learn

- How to sync secrets to all Tekup projects in one command
- How to update API keys and distribute them automatically
- How to work safely with development vs production environments

---

## ⚡ Quick Commands

### Sync All Projects (Most Common)

```powershell
cd C:\Users\empir\Tekup\tekup-secrets
.\scripts\sync-all.ps1 -Environment "development"
```

**Result:** All 5 Tekup projects get updated with latest secrets (229 lines each)

### Sync One Specific Project

```powershell
.\scripts\sync-to-project.ps1 -Project "tekup-billy" -Environment "development"
```

### Test Without Making Changes (Safe!)

```powershell
.\scripts\sync-all.ps1 -Environment "development" -DryRun
```

---

## 📋 Supported Projects

| Project Name | Location | Purpose |
|-------------|----------|---------|
| `tekup-ai` | `/services/tekup-ai` | AI/LLM coordination |
| `tekup-billy` | `/apps/production/tekup-billy` | Billy.dk MCP server |
| `tekup-vault` | `/apps/production/tekup-vault` | Knowledge indexing |
| `tekup-gmail-services` | `/services/tekup-gmail-services` | Email automation |
| `RendetaljeOS` | `/apps/rendetalje/monorepo` | Business management |

---

## 🔧 Common Tasks

### Task 1: Update OpenAI API Key

```powershell
# 1. Edit the config file
notepad C:\Users\empir\Tekup\tekup-secrets\config\ai-services.env

# 2. Update this line:
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE

# 3. Sync to all projects that use AI
.\scripts\sync-all.ps1 -Environment "development"
```

### Task 2: Add New API Key

```powershell
# 1. Choose the right config file:
# - ai-services.env → For LLM providers
# - databases.env → For database credentials  
# - apis.env → For external APIs
# - google-workspace.env → For Google services
# - monitoring.env → For logging/metrics

# 2. Add your key to the appropriate file
# 3. Sync to distribute
.\scripts\sync-all.ps1 -Environment "development"
```

### Task 3: Check What Would Change (Safe Testing)

```powershell
.\scripts\sync-to-project.ps1 -Project "tekup-ai" -Environment "development" -DryRun
```

**Output:** Shows exactly what would be written without actually changing anything

---

## 🔍 Understanding the Structure

### Config Files (Where to Add Secrets)

```
config/
├── ai-services.env      # OpenAI, Gemini, Anthropic keys
├── databases.env        # PostgreSQL, Supabase credentials  
├── google-workspace.env # Google service accounts
├── apis.env            # Billy.dk, GitHub, external APIs
└── monitoring.env      # Sentry, logging, feature flags
```

### Environment Files

```
.env.shared       # Non-sensitive defaults (PORT=3000, etc.)
.env.development  # Development secrets (safe for testing)
.env.production   # Production secrets (real keys for prod)
```

---

## 🛡️ Safety Features

### Git Protection
✅ **All secrets are automatically excluded from git commits**
- Your API keys will never accidentally get committed
- .gitignore protects all .env and config files

### DryRun Mode
✅ **Always test first with -DryRun**
- Shows exactly what would change
- Safe to run, never modifies files
- Perfect for verification

### Environment Separation
✅ **Development and production are completely separate**
- Development: Real test keys, safe for experiments
- Production: Secured production keys, for live services

---

## 🎉 Success Indicators

When sync is working correctly, you'll see:

```
✅ Successfully synced development secrets to tekup-ai
📁 Output: C:\Users\empir\Tekup\services\tekup-ai\.env
📊 Total lines: 229
```

Each project should have a `.env` file with 229 lines of configuration.

---

## 🆘 Troubleshooting

### Problem: "Project path not found"

**Solution:** Make sure you're using the correct project names:
- Use `tekup-billy` (not `Tekup-Billy`)
- Use `tekup-vault` (not `TekupVault`)
- Use `RendetaljeOS` (exact capitalization)

### Problem: PowerShell execution policy

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problem: "No such file or directory"

**Solution:** Make sure you're in the tekup-secrets directory:
```powershell
cd C:\Users\empir\Tekup\tekup-secrets
```

---

## 🎓 Next Steps

### For Developers
1. **Learn the component system** → Read `TEKUP_WORKSPACE_INTEGRATION.md`
2. **Set up TypeScript integration** → Use `@tekup-ai/config` package
3. **Understand production deployment** → Read about production environment

### For Advanced Users
1. **Review security model** → Read `SYSTEM_OVERVIEW.md`
2. **Set up git-crypt** → Read `SETUP_GIT_CRYPT.md`
3. **Customize for new projects** → Modify PowerShell scripts

---

## 📞 Need Help?

- **📚 Full documentation:** `README.md` (411 lines)
- **🔧 System overview:** `SYSTEM_OVERVIEW.md`
- **🔗 Integration guide:** `TEKUP_WORKSPACE_INTEGRATION.md`
- **📋 Change history:** `CHANGELOG.md`

---

**You're ready! Start with a safe DryRun, then sync your first project. The system is designed to be safe and forgiving.** 🚀