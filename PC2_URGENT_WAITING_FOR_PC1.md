# 🚨 URGENT: PC2 BLOCKED - Venter på PC1

**Dato:** 23. Oktober 2025, 20:25 CET  
**Fra:** PC2 (Jonas-dev)  
**Til:** PC1 (empir)  
**Status:** 🔴 BLOCKED - Kan ikke fortsætte

---

## ⏸️ PC2 ER STOPPET

PC2 kan **IKKE arbejde videre** uden følgende fra PC1:

### 🔴 KRITISK #1: Git-crypt Key

```
Status: ❌ IKKE MODTAGET
Location Expected: C:\Users\Jonas-dev\Desktop\tekup-git-crypt.key
```

**Hvorfor kritisk:**

- Alle secrets i `tekup-secrets/` er encrypted
- Kan ikke læse API keys
- Kan ikke konfigurere MCP servere
- Kan ikke bygge projekter med secrets

**PC1 Action Required:**

```powershell
# På PC1 (empir):
cd C:\Users\empir\Tekup

# 1. Export key (hvis ikke gjort)
git-crypt export-key C:\Users\empir\Desktop\tekup-git-crypt.key

# 2. Transfer til PC2 via:
# - USB stick (anbefales)
# - OneDrive Personal Vault
# - Encrypted email til Jonas
```

---

### 🔴 KRITISK #2: Tekup-Billy Kode

```
Status: ❌ EMPTY FOLDER
Location: apps/production/tekup-billy/
Current: 0 files
```

**Hvorfor kritisk:**

- MCP server kan ikke bygges
- GitHub Copilot kan ikke bruge Billy MCP lokalt
- PC2 har kun production URL (https://tekup-billy.onrender.com)

**PC1 Action Required:**

```powershell
# Option A: Kopiér filer ind i monorepo (ANBEFALET)
$source = "C:\Users\empir\Tekup-Billy"  # Original projekt
$dest = "C:\Users\empir\Tekup\apps\production\tekup-billy"

# Kopiér ALT undtagen node_modules, .git, dist
Get-ChildItem $source -Exclude node_modules,.git,dist |
  Copy-Item -Destination $dest -Recurse -Force

# Commit
cd C:\Users\empir\Tekup
git add apps/production/tekup-billy
git commit -m "feat: add Tekup-Billy MCP server source code"
git push origin master

# Option B: Fix .gitmodules
# (Ikke anbefalet - submodules er komplekse)
```

---

### 🔴 KRITISK #3: TekupVault Kode

```
Status: ❌ EMPTY FOLDER
Location: apps/production/tekup-vault/
Current: 0 files
```

**Hvorfor kritisk:**

- Knowledge base MCP server kan ikke bygges
- GitHub Copilot kan ikke søge i Tekup dokumentation
- PC2 har kun production URL (https://tekupvault.onrender.com)

**PC1 Action Required:**

```powershell
# Kopiér TekupVault ind i monorepo
$source = "C:\Users\empir\TekupVault"  # Original projekt
$dest = "C:\Users\empir\Tekup\apps\production\tekup-vault"

Get-ChildItem $source -Exclude node_modules,.git,dist |
  Copy-Item -Destination $dest -Recurse -Force

# Commit
git add apps/production/tekup-vault
git commit -m "feat: add TekupVault knowledge base source code"
git push origin master
```

---

## 📊 HVAD PC2 ALLEREDE HAR

### ✅ Fungerer:

- RenOS Calendar MCP (lokal kode tilgængelig)
- RenOS Backend NestJS
- RenOS Frontend Next.js
- Alle dokumentation
- Workspace struktur

### ⏳ Venter på PC1:

- Git-crypt key (til secrets unlock)
- Tekup-Billy kode
- TekupVault kode

---

## 🎯 HVAD SKAL SKE DEREFTER

**Når PC2 modtager ovenstående:**

### Step 1: Git-crypt unlock (2 min)

```powershell
# PC2 vil køre:
cd C:\Users\Jonas-dev\Tekup-Monorepo

# Install git-crypt (manuel download fra GitHub)
# Download: https://github.com/AGWA/git-crypt/releases

# Unlock secrets
git-crypt unlock C:\Users\Jonas-dev\Desktop\tekup-git-crypt.key

# Verify
cat tekup-secrets\.env.development  # Should show readable text
```

### Step 2: Pull projektkode (1 min)

```powershell
# PC2 vil køre:
git pull origin master

# Verify
ls apps\production\tekup-billy\*.ts
ls apps\production\tekup-vault\*.ts
```

### Step 3: Byg MCP servere (10 min)

```powershell
# Tekup-Billy
cd apps\production\tekup-billy
npm install
npm run build

# TekupVault
cd apps\production\tekup-vault
npm install
npm run build

# RenOS Calendar MCP
cd apps\rendetalje\services\calendar-mcp
npm install
npm run build
```

### Step 4: Konfigurer GitHub Copilot (5 min)

```powershell
# PC2 vil oprette .vscode\settings.json med MCP config
# Alle 3 MCP servere klar til brug i Copilot
```

### Step 5: Test MCP servere (5 min)

```powershell
# Verificer at GitHub Copilot kan bruge alle tools
```

**Total tid efter PC1 leverer:** ~25 minutter

---

## 📞 PC1 - GØR DIT ARBEJDE NU

### Hurtig checklist for PC1:

```powershell
# 1. Export git-crypt key
cd C:\Users\empir\Tekup
git-crypt export-key C:\Users\empir\Desktop\tekup-git-crypt.key
# → Transfer til PC2 (USB/OneDrive)

# 2. Kopiér Tekup-Billy
Copy-Item "C:\Users\empir\Tekup-Billy\*" `
          "C:\Users\empir\Tekup\apps\production\tekup-billy\" `
          -Recurse -Exclude node_modules,.git,dist

# 3. Kopiér TekupVault
Copy-Item "C:\Users\empir\TekupVault\*" `
          "C:\Users\empir\Tekup\apps\production\tekup-vault\" `
          -Recurse -Exclude node_modules,.git,dist

# 4. Commit og push
git add apps/production/
git commit -m "feat: add Billy and Vault MCP servers source code"
git push origin master

# 5. Notificer PC2 at key er klar til transfer
```

**Estimeret tid for PC1:** 10-15 minutter

---

## 🔴 PRIORITET: HØYEST

Dette blokerer **ALT** PC2 arbejde:

- ❌ MCP konfiguration
- ❌ GitHub Copilot setup
- ❌ Projekter med secrets
- ❌ API testing
- ❌ Development work

**PC1: Se denne fil NU og udfør actions! 🚨**

---

**Sidst opdateret:** 23. Oktober 2025, 20:25 CET  
**Status:** Venter akut på PC1 response
