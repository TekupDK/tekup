# GitHub Repository Configuration Guide

Dette dokument beskriver de anbefalede GitHub repository settings for Tekup-Billy MCP som følger SaaS best practices for sikkerhed, kvalitet og compliance.

## 🔐 Branch Protection Rules

### Main Branch Protection

Gå til: **Settings → Branches → Add branch protection rule**

**Branch name pattern:** `main`

#### Anbefalede indstillinger

✅ **Require a pull request before merging**
- ✅ Require approvals: **1**
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners (hvis CODEOWNERS fil er oprettet)

✅ **Require status checks to pass before merging**
- ✅ Require branches to be up to date before merging
- **Required status checks:**
  - `Test & Build (18.x)`
  - `Test & Build (20.x)`
  - `Code Quality`
  - `Security Audit`
  - `CodeQL / Analyze Code`

✅ **Require conversation resolution before merging**
- Sikrer at alle PR-kommentarer er behandlet

✅ **Require signed commits** (optional, men anbefalet)
- Øger sikkerhed ved at kræve GPG-signerede commits

✅ **Require linear history** (optional)
- Holder git history clean ved at forbyde merge commits

✅ **Do not allow bypassing the above settings**
- Gælder også for administrators

❌ **Allow force pushes:** Disabled
- Beskytter mod utilsigtet overskrivning af history

❌ **Allow deletions:** Disabled
- Forhindrer utilsigtet sletning af main branch

### Develop Branch Protection (hvis applicable)

**Branch name pattern:** `develop`

Samme indstillinger som main, men kan have:
- Færre required approvals (0 eller 1)
- Mere flexible force push settings for feature development

## 🤖 Dependabot Configuration

**Allerede konfigureret** via `.github/dependabot.yml`

### Ekstra settings i GitHub UI

Gå til: **Settings → Code security and analysis**

✅ **Dependency graph:** Enabled (standard)
✅ **Dependabot alerts:** Enabled
✅ **Dependabot security updates:** Enabled
- Automatisk opretter PRs for security vulnerabilities

### Dependabot konfiguration

- **npm packages:** Ugentlig check (mandag kl. 09:00 CET)
- **GitHub Actions:** Ugentlig check
- **Docker:** Ugentlig check
- **Auto-merge:** Kan aktiveres for patch/minor updates via Dependabot rules

## 🔍 Code Scanning

### CodeQL Analysis

**Allerede konfigureret** via `.github/workflows/codeql.yml`

Gå til: **Settings → Code security and analysis → Code scanning**

✅ **CodeQL analysis:** Enabled via GitHub Actions
- Kører ved push til main/develop
- Kører ved PR til main
- Scheduled weekly scan (mandag kl. 02:00 UTC)

**Sprog:** JavaScript/TypeScript

**Queries:** Standard security-and-quality query suite

### Aktivering i UI

1. Gå til **Settings → Code security and analysis**
2. Under **Code scanning**, klik **Set up** → **Advanced**
3. GitHub vil automatisk bruge eksisterende CodeQL workflow

## 🔑 Secret Scanning

Gå til: **Settings → Code security and analysis**

✅ **Secret scanning:** Enabled
- GitHub scanner automatisk for leaked credentials
- Push protection (anbefalet): Blokerer commits med secrets

✅ **Push protection:** Enabled
- Forhindrer at secrets pushes til repository

### Secrets der scannes

- Billy.dk API keys
- Supabase keys
- MCP API keys
- Generic API tokens
- Private keys
- Database credentials

## 👥 Collaborators & Teams

Gå til: **Settings → Collaborators and teams**

### Anbefalet team struktur

**Admin:**
- @JonasAbde (Owner)
- Kan merge til main, ændre settings

**Maintainers:**
- Kan approve PRs
- Kan merge til develop
- Læse/skrive adgang

**Contributors:**
- Kan oprette PRs
- Kan ikke merge direkte
- Read + fork access

## 📊 Required Status Checks

For at aktivere status checks i branch protection:

1. Vent på at GitHub Actions workflows kører første gang
2. Gå til **Settings → Branches → Edit protection rule for main**
3. Under **Require status checks**, søg efter:
   - `Test & Build (18.x)`
   - `Test & Build (20.x)`
   - `Code Quality`
   - `Security Audit`
   - `CodeQL / Analyze Code`
4. Vælg alle og gem

## 🏷️ GitHub Environments (for deployment)

Gå til: **Settings → Environments**

### Production Environment

**Name:** `production`

**Protection rules:**
- ✅ Required reviewers: 1 (admin/maintainer)
- ✅ Wait timer: 0 minutes (eller 5-10 min for ekstra sikkerhed)
- ✅ Deployment branches: Only protected branches (main)

**Environment secrets:**

```
BILLY_API_KEY
BILLY_ORGANIZATION_ID
MCP_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SENTRY_DSN
```

### Staging Environment

**Name:** `staging`

**Protection rules:**
- Deployment branches: develop eller main

**Environment secrets:** Samme som production (men med staging credentials)

## 🔔 Notifications & Integrations

### Email Notifications

Gå til: **Settings → Notifications**

Anbefalet at aktivere:
- ✅ Dependabot alerts
- ✅ Security alerts
- ✅ Failed workflow runs
- ✅ Deployment reviews

### Sentry Integration (Optional)

1. Installer Sentry GitHub App: <https://github.com/apps/sentry-io>
2. Connect repository til Sentry project
3. Automatisk linking af commits til Sentry releases

### Render.com Integration

- Auto-deploy fra main branch er allerede konfigureret i `render.yaml`

## 📝 Repository Settings

Gå til: **Settings → General**

### Recommendations

**Features:**
- ✅ Issues: Enabled (for bug tracking)
- ✅ Projects: Enabled (optional, for kanban boards)
- ✅ Discussions: Optional (for community support)
- ❌ Wiki: Disabled (brug README/docs folder i stedet)

**Pull Requests:**
- ✅ Allow merge commits: Enabled
- ✅ Allow squash merging: Enabled (anbefalet standard)
- ✅ Allow rebase merging: Enabled
- ✅ Always suggest updating pull request branches: Enabled
- ✅ Automatically delete head branches: Enabled

**Archives:**
- ❌ Include Git LFS objects in archives: Disabled (vi bruger ikke LFS)

**Danger Zone:**
- Template repository: Disabled
- Transfer ownership: Kun efter omhyggelig overvejelse

## 🚀 Quick Setup Checklist

For at aktivere alle anbefalinger i ét træk:

```bash
# 1. Clone repository (hvis ikke allerede gjort)
git clone https://github.com/JonasAbde/Tekup-Billy.git
cd Tekup-Billy

# 2. Commit og push de nye workflows (hvis ikke allerede pushed)
git add .github/
git commit -m "ci: Add CI/CD, Dependabot, and CodeQL workflows"
git push origin main

# 3. Vent på første workflow run

# 4. Gå til GitHub repository settings
```

### Settings UI steps

1. ✅ **Settings → Branches** → Add protection for `main` (se detaljer ovenfor)
2. ✅ **Settings → Code security** → Enable:
   - Dependabot alerts
   - Dependabot security updates  
   - Secret scanning
   - Push protection
3. ✅ **Settings → Environments** → Create `production` og `staging`
4. ✅ **Settings → Notifications** → Configure email alerts

## 📚 Additional Resources

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [GitHub Secrets Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Sentry GitHub Integration](https://docs.sentry.io/product/integrations/source-code-mgmt/github/)

## 🆘 Support

Ved spørgsmål eller problemer med GitHub settings:
- Kontakt repository owner: @JonasAbde
- Opret issue: <https://github.com/JonasAbde/Tekup-Billy/issues>

---

**Version:** 1.0  
**Sidst opdateret:** Oktober 2025  
**Maintained by:** Tekup Team
