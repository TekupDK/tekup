# 🔐 Git-Crypt Setup for Tekup Secrets

**Dato**: 23. Oktober 2025  
**Formål**: Automatisk sync af secrets mellem PC1 og PC2 via encrypted git

---

## 🎯 Hvad er Git-Crypt?

Git-crypt gør det muligt at:
- **Commitme secrets til git** (krypteret med AES-256)
- **Auto-decrypt på PC2** når du cloner/puller
- **Zero manual transfer** - alt sker via git push/pull
- **GitHub ser kun encrypted data** - ingen security warnings

---

## 📋 Installation

### PC1 (Initial setup):
```powershell
# Install via Chocolatey
choco install git-crypt

# Eller manual download:
# https://github.com/AGWA/git-crypt/releases
# Extract to C:\Program Files\Git\usr\bin\
```

### PC2 (Efter PC1 setup):
```powershell
# Same installation
choco install git-crypt
```

---

## 🚀 Setup Guide

### Step 1: Initialize git-crypt (PC1)
```powershell
cd C:\Users\empir\Tekup

# Initialize git-crypt
git-crypt init

# Export symmetric key for PC2
git-crypt export-key C:\Users\empir\Desktop\tekup-git-crypt.key

# IMPORTANT: Kopier denne key til PC2 via:
# - USB stick (sikrest)
# - OneDrive Personal Vault
# - Encrypted email
```

### Step 2: Configure hvilke filer skal krypteres
```powershell
# Tilføj til .gitattributes
@"
# Git-crypt: Encrypt all secrets
tekup-secrets/.env.development filter=git-crypt diff=git-crypt
tekup-secrets/.env.production filter=git-crypt diff=git-crypt
tekup-secrets/.env.shared filter=git-crypt diff=git-crypt
tekup-secrets/config/*.env filter=git-crypt diff=git-crypt
"@ | Out-File -FilePath ".gitattributes" -Append -Encoding UTF8
```

### Step 3: Commit og push (PC1)
```powershell
# Tilføj .gitattributes
git add .gitattributes

# Nu kan vi tilføje secrets! (de bliver auto-encrypted)
git add tekup-secrets/.env.development
git add tekup-secrets/.env.shared
git add tekup-secrets/config/*.env

# Commit
git commit -m "feat: Add encrypted secrets with git-crypt"

# Push (GitHub vil modtage ENCRYPTED data)
git push origin master
```

### Step 4: Setup på PC2
```powershell
# 1. Kopier key fra PC1 (via USB/OneDrive)
#    Fil: tekup-git-crypt.key

# 2. Pull repo
cd C:\Users\empir\Tekup
git pull

# 3. Unlock med key
git-crypt unlock C:\Users\empir\Desktop\tekup-git-crypt.key

# ✅ Secrets er nu decrypted!
Get-Content tekup-secrets\.env.development
```

---

## 🔄 Daglig Workflow

### PC1: Opdater secret
```powershell
# 1. Edit secret
notepad C:\Users\empir\Tekup\tekup-secrets\.env.development

# 2. Commit (auto-encrypted)
git add tekup-secrets/.env.development
git commit -m "Update OpenAI API key"

# 3. Push
git push
```

### PC2: Modtag update
```powershell
# 1. Pull (auto-decrypted)
git pull

# 2. Verificer
Get-Content C:\Users\empir\Tekup\tekup-secrets\.env.development

# ✅ Secret er opdateret automatisk!
```

---

## 🔍 Verification

### Check om git-crypt virker:
```powershell
# PC1: Se encrypted version
git show HEAD:tekup-secrets/.env.development | head -10
# Output: Binary gibberish (good!)

# PC1: Se decrypted version
Get-Content tekup-secrets/.env.development
# Output: Readable secrets (good!)

# GitHub: Se raw file
# https://github.com/TekupDK/tekup/blob/master/tekup-secrets/.env.development
# Output: Binary encrypted data (good!)
```

---

## 🛡️ Security Notes

### ✅ Fordele:
- Secrets er **AES-256 encrypted** i git
- GitHub kan IKKE se secrets
- Automatisk sync mellem PC'er
- Zero risk af typos/forgotten updates

### ⚠️ Vigtige noter:
- **Key file** (`tekup-git-crypt.key`) skal beskyttes som secrets
- Hvis key går tabt, kan secrets IKKE decryptes
- Backup key til sikker location (Password manager, safe)
- Brug IKKE symmetric key med andre personer (use GPG keys i stedet)

### 🔐 Key Management:
```powershell
# Backup key til sikker location
Copy-Item "C:\Users\empir\Desktop\tekup-git-crypt.key" `
          "C:\Users\empir\OneDrive\Personal Vault\tekup-git-crypt-backup.key"

# Eller gem i password manager:
# 1Password, Bitwarden, KeePass, etc.
```

---

## 🚨 Troubleshooting

### Problem: "git-crypt not found"
```powershell
# Løsning: Add til PATH
$env:PATH += ";C:\Program Files\Git\usr\bin"
```

### Problem: "File is not encrypted"
```powershell
# Løsning: Force re-encryption
git rm --cached -r tekup-secrets/*.env
git add tekup-secrets/*.env
git commit -m "Re-encrypt secrets"
```

### Problem: "Key unlock failed"
```powershell
# Løsning: Check key file path
Test-Path "C:\Users\empir\Desktop\tekup-git-crypt.key"
# Should return: True
```

---

## 📊 Status Check

### Verificer setup:
```powershell
# Check git-crypt status
git-crypt status

# Output should show:
# encrypted: tekup-secrets/.env.development
# encrypted: tekup-secrets/.env.shared
# encrypted: tekup-secrets/config/ai-services.env
# etc.
```

---

## 🎯 Alternative: GPG Keys (Fremtid)

For team collaboration (flere personer):
```powershell
# Use GPG keys instead of symmetric key
git-crypt add-gpg-user USER_ID

# Each person uses their own GPG key
# More secure for teams
```

---

**Setup Time**: ~10 minutter  
**Maintenance**: Zero  
**Security**: ⭐⭐⭐⭐⭐ (AES-256)  
**Ease of Use**: ⭐⭐⭐⭐⭐ (Transparent efter setup)
