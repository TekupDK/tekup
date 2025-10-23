# 🚨 PC2 - Manglende Filer & Setup (TIL PC1)

**PC:** PC2 (Jonas-dev)  
**Dato:** 23. Oktober 2025  
**Status:** ⏳ Venter på PC1 (empir)

---

## 🎯 PROBLEM: PC2 kan ikke bruge MCP servere i GitHub Copilot

### Årsag:
1. ❌ `tekup-secrets` er git-crypt encrypted (kan ikke læse API keys)
2. ❌ `apps/production/tekup-billy/` er TOM (mangler kode)
3. ❌ `apps/production/tekup-vault/` er TOM (mangler kode)
4. ❌ GitHub Copilot MCP konfiguration mangler

---

## 📋 HVAD PC1 SKAL GØRE

### ✅ Step 1: Git-Crypt Setup (PRIORITET 1)

#### 1.1 Eksporter encryption key
```powershell
# På PC1 (empir)
cd C:\Users\empir\Tekup

# Initialize git-crypt (hvis ikke gjort)
git-crypt init

# Eksporter key til USB/OneDrive
git-crypt export-key C:\Users\empir\Desktop\tekup-git-crypt.key

# ⚠️ VIGTIGT: Overføer denne fil til PC2 via:
# - USB stick (sikrest)
# - OneDrive Personal Vault
# - Encrypted email
```

#### 1.2 Verificer .gitattributes er korrekt
```powershell
# Tjek at denne fil indeholder:
cat .gitattributes | Select-String "tekup-secrets"

# Skal vise:
# tekup-secrets/.env.development filter=git-crypt diff=git-crypt
# tekup-secrets/.env.production filter=git-crypt diff=git-crypt
# tekup-secrets/.env.shared filter=git-crypt diff=git-crypt
# tekup-secrets/config/*.env filter=git-crypt diff=git-crypt
```

#### 1.3 Commit og push encrypted secrets
```powershell
# Tilføj secrets (bliver auto-encrypted)
git add tekup-secrets/.env.development
git add tekup-secrets/.env.shared
git add tekup-secrets/config/*.env

# Commit
git commit -m "feat: Add encrypted secrets with git-crypt"

# Push (GitHub får ENCRYPTED data)
git push origin master
```

---

### ✅ Step 2: Kopiér Tekup-Billy & TekupVault kode (PRIORITET 2)

**Problem:** PC2 har tomme mapper fordi projekterne ikke er committet til monorepo endnu.

#### 2.1 Tekup-Billy
```powershell
# På PC1 - Find original Tekup-Billy projekt
cd C:\Users\empir\Tekup-Billy

# Kopiér alt (undtagen node_modules og .git) til monorepo
$source = "C:\Users\empir\Tekup-Billy"
$dest = "C:\Users\empir\Tekup\apps\production\tekup-billy"

# Ekskluder node_modules, .git, dist
Get-ChildItem $source -Exclude node_modules,.git,dist | 
  Copy-Item -Destination $dest -Recurse -Force

# Commit til monorepo
cd C:\Users\empir\Tekup
git add apps/production/tekup-billy
git commit -m "feat: Add Tekup-Billy MCP server to monorepo"
git push origin master
```

#### 2.2 TekupVault
```powershell
# På PC1 - Find original TekupVault projekt
cd C:\Users\empir\TekupVault

# Kopiér til monorepo
$source = "C:\Users\empir\TekupVault"
$dest = "C:\Users\empir\Tekup\apps\production\tekup-vault"

Get-ChildItem $source -Exclude node_modules,.git,dist | 
  Copy-Item -Destination $dest -Recurse -Force

# Commit til monorepo
cd C:\Users\empir\Tekup
git add apps/production/tekup-vault
git commit -m "feat: Add TekupVault knowledge layer to monorepo"
git push origin master
```

---

### ✅ Step 3: Opret MCP Konfiguration Template (PRIORITET 3)

PC1 skal oprette en template som PC2 kan bruge:

```powershell
# På PC1
cd C:\Users\empir\Tekup
New-Item -ItemType Directory -Force -Path ".vscode"
```

Opret `.vscode/settings.json.template`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "tekup-billy": {
      "command": "node",
      "args": [
        "${workspaceFolder}/apps/production/tekup-billy/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "development",
        "BILLY_API_KEY": "${MCP_BILLY_API_KEY}",
        "BILLY_ORGANIZATION_ID": "${MCP_BILLY_ORG_ID}",
        "MCP_API_KEY": "${MCP_HTTP_API_KEY}",
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      }
    },
    "tekupvault": {
      "command": "node",
      "args": [
        "${workspaceFolder}/apps/production/tekup-vault/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "development",
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}",
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "renos-calendar-mcp": {
      "command": "node",
      "args": [
        "${workspaceFolder}/apps/rendetalje/services/calendar-mcp/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "development",
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}",
        "GOOGLE_CALENDAR_CREDENTIALS": "${GOOGLE_CALENDAR_CREDENTIALS}",
        "BILLY_MCP_URL": "https://tekup-billy.onrender.com",
        "MCP_API_KEY": "${MCP_HTTP_API_KEY}"
      }
    }
  }
}
```

Commit template:
```powershell
git add .vscode/settings.json.template
git commit -m "docs: Add MCP configuration template for GitHub Copilot"
git push origin master
```

---

### ✅ Step 4: Opdater PC2_SETUP.md med nye instruktioner

Tilføj til eksisterende `tekup-secrets/PC2_SETUP.md`:

```markdown
## Step 6: Byg MCP Servere (Efter git-crypt unlock)

### 6.1 Tekup-Billy
```powershell
cd C:\Users\empir\Tekup\apps\production\tekup-billy
npm install
npm run build
```

### 6.2 TekupVault
```powershell
cd C:\Users\empir\Tekup\apps\production\tekup-vault
npm install
npm run build
```

### 6.3 RenOS Calendar MCP
```powershell
cd C:\Users\empir\Tekup\apps\rendetalje\services\calendar-mcp
npm install
npm run build
```

## Step 7: Konfigurer GitHub Copilot MCP

```powershell
# Kopiér template til aktiv config
Copy-Item ".vscode\settings.json.template" ".vscode\settings.json"

# Secrets er nu tilgængelige fra .env filer!
# GitHub Copilot vil auto-loade dem når MCP servere starter
```
```

---

## 📊 HVAD PC2 HAR NU

### ✅ Tilgængelige Projekter:
- `apps/rendetalje/services/calendar-mcp/` ✅ KOMPLET
- `apps/rendetalje/services/backend-nestjs/` ✅ KOMPLET
- `apps/rendetalje/services/frontend-nextjs/` ✅ KOMPLET
- `docs/` ✅ KOMPLET
- `tekup-secrets/` 🔒 ENCRYPTED (venter på unlock)
- `.gitattributes` ✅ KONFIGURERET (git-crypt encryption rules)

### ❌ Manglende:
- `apps/production/tekup-billy/` ❌ TOM (git submodule uden .gitmodules)
- `apps/production/tekup-vault/` ❌ TOM (git submodule uden .gitmodules)
- `.gitmodules` ❌ MANGLER (submodules kan ikke initialiseres)
- `.vscode/settings.json` ❌ MANGLER MCP CONFIG
- Git-crypt key ❌ IKKE MODTAGET

### ⚠️ VIGTIGT: Submodule Problem Opdaget
PC2 kan se at `tekup-billy` og `tekup-vault` er tilføjet som git submodules, men `.gitmodules` fil mangler.
Dette betyder at submodules ikke kan initialiseres.

**PC1 skal vælge:**
- **Option A (Anbefalet):** Kopiér filer direkte ind (ikke submodules) - Se Step 2
- **Option B:** Opret korrekt `.gitmodules` fil med repository URLs

---

## 🔑 VIGTIGE API KEYS (Fra encrypted secrets)

PC2 kan IKKE læse disse før git-crypt unlock:

### Fra `tekup-secrets/config/apis.env`:
```bash
# Billy.dk
BILLY_API_KEY=43e7439bccb58a8a96dd57dd06dae10add009111
BILLY_ORGANIZATION_ID=pmf9tU56RoyZdcX3k69z1g

# MCP HTTP Authentication
MCP_HTTP_API_KEY=d674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b

# TekupVault
TEKUPVAULT_API_KEY=tekup_vault_api_key_2025_secure
TEKUPVAULT_API_URL=https://tekupvault-api.onrender.com
```

### Fra `tekup-secrets/config/ai-services.env`:
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-WCwMYK5Nm1_1UhzOKsb6z... (truncated)
```

### Fra `tekup-secrets/config/databases.env`:
```bash
# Supabase
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⏱️ TIMELINE

1. ✅ **PC2 (nu)**: Dokumentation oprettet → commit & push
2. ⏳ **PC1**: Læs denne fil → udfør Step 1-4
3. ⏳ **Transfer**: Git-crypt key PC1 → PC2 (USB/OneDrive)
4. ⏳ **PC2**: Unlock secrets → build MCP servers → konfigurer Copilot
5. ✅ **Done**: GitHub Copilot kan bruge alle 3 MCP servere!

---

## 📞 NOTIFIKATION TIL PC2

PC1, når du er færdig:

1. **Push alle changes** til GitHub
2. **Gem git-crypt key** til: `C:\Users\empir\Desktop\tekup-git-crypt.key`
3. **Notificer PC2** at key er klar til transfer
4. PC2 vil derefter:
   - Pull seneste changes
   - Unlock med key
   - Build MCP servers
   - Test GitHub Copilot integration

---

## 🔒 SIKKERHED

- ✅ Git-crypt key er LIGE SÅ SENSITIV som secrets
- ✅ Brug USB stick eller OneDrive Personal Vault til transfer
- ✅ Slet IKKE key fra backup efter transfer
- ✅ Key skal gemmes i password manager (1Password, Bitwarden, etc.)

---

**Status:** 📝 Dokumentation klar til PC1  
**Next Action:** PC1 udfører Step 1-4  
**ETA:** ~30 minutter (afhænger af filstørrelse)
