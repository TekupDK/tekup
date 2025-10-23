# 🔐 PC2 Setup Instructions

**Status**: Waiting for PC1 to complete git-crypt setup  
**Last Updated**: 23. Oktober 2025

---

## ✅ What PC1 has done

1. Created tekup-secrets management system (13 files)
2. PowerShell sync scripts for automatic distribution
3. TypeScript API for programmatic access
4. Git-crypt setup guide created

---

## 📋 What PC2 needs to do

### **Step 1: Pull latest changes**
```powershell
cd C:\Users\empir\Tekup
git pull origin master
```

### **Step 2: Install git-crypt**
```powershell
# Option A: Via Chocolatey (recommended)
choco install git-crypt

# Option B: Manual download
# https://github.com/AGWA/git-crypt/releases
# Extract to: C:\Program Files\Git\usr\bin\
```

### **Step 3: Get encryption key from PC1**

**PC1 will create key file at:**
```
C:\Users\empir\Desktop\tekup-secrets.key
```

**Transfer to PC2 via:**
- USB stick (most secure)
- OneDrive Personal Vault
- Encrypted email

**Copy to PC2:**
```
C:\Users\empir\Desktop\tekup-secrets.key
```

### **Step 4: Unlock secrets**
```powershell
cd C:\Users\empir\Tekup

# Pull latest (encrypted secrets)
git pull

# Unlock with key from PC1
git-crypt unlock C:\Users\empir\Desktop\tekup-secrets.key

# Verify secrets are decrypted
Get-Content tekup-secrets\.env.development
```

### **Step 5: Verify setup**
```powershell
# Check git-crypt status
git-crypt status

# Should show encrypted files:
# encrypted: tekup-secrets/.env.development
# encrypted: tekup-secrets/.env.shared
# encrypted: tekup-secrets/config/*.env

# Check file contents are readable
Get-Content tekup-secrets\.env.development | head -10
```

---

## 🔄 Daily Workflow (After Setup)

### Receive updates from PC1:
```powershell
cd C:\Users\empir\Tekup
git pull

# Secrets are automatically decrypted!
# No manual copying needed ✅
```

### Make changes on PC2:
```powershell
# 1. Edit secret
notepad tekup-secrets\.env.development

# 2. Commit (auto-encrypted)
git add tekup-secrets\.env.development
git commit -m "Update secret from PC2"

# 3. Push
git push

# PC1 will auto-decrypt when pulling ✅
```

---

## 🚨 Troubleshooting

### Problem: "git-crypt: not found"
```powershell
# Add to PATH
$env:PATH += ";C:\Program Files\Git\usr\bin"

# Or reinstall
choco install git-crypt --force
```

### Problem: "File not encrypted in repository"
```powershell
# PC1 hasn't pushed encrypted secrets yet
# Wait for PC1 to complete setup
```

### Problem: "Unlock failed"
```powershell
# Check key file exists
Test-Path C:\Users\empir\Desktop\tekup-secrets.key

# Verify you're in correct repo
git remote -v
# Should show: TekupDK/tekup
```

---

## 📊 What You'll Get

After setup, PC2 will have access to:

### Secrets (auto-synced from PC1):
- `.env.development` - Real development secrets
- `.env.shared` - Non-sensitive defaults
- `.env.production` - Production template
- `config/ai-services.env` - OpenAI, Gemini keys
- `config/databases.env` - Supabase, PostgreSQL
- `config/google-workspace.env` - Google credentials
- `config/apis.env` - Billy, GitHub tokens
- `config/monitoring.env` - Sentry DSN

### Scripts & Docs (already available):
- ✅ `scripts/sync-to-project.ps1`
- ✅ `scripts/sync-all.ps1`
- ✅ `README.md`
- ✅ `SYSTEM_OVERVIEW.md`
- ✅ `SETUP_GIT_CRYPT.md` (this guide)

---

## ⏱️ Timeline

1. **PC1 (now)**: Initialize git-crypt, export key, push encrypted secrets
2. **Transfer**: Copy key file PC1 → PC2
3. **PC2**: Install git-crypt, unlock with key
4. **Done**: Auto-sync working! ✅

---

## 🔒 Security Notes

- **Key file** is as sensitive as the secrets themselves
- Store backup in password manager or safe
- Never commit key file to git
- If key is lost, secrets cannot be decrypted

---

**Ready to start?** Wait for PC1 notification that setup is complete!
