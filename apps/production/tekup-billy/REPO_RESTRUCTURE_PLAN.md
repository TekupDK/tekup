# 🗂️ REPOSITORY STRUKTUR OPRYDNING - 22. Oktober 2025

## 📊 Analyse af Nuværende Rod-Filer

**Total antal filer i rod:** 80+

**Kategorisering:**

### ✅ SKAL BLIVE I ROD (Kritiske)

- `package.json`, `package-lock.json`
- `tsconfig.json`
- `Dockerfile`
- `render.yaml`
- `.env`, `.env.example`
- `.gitignore`
- `README.md`
- `LICENSE`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `.cspell.json`
- `.markdownlint.json`
- `.cursorrules`

**Total:** 14 filer

---

### 📁 SKAL FLYTTES TIL `docs/`

#### Planning & Reports (→ `docs/planning/`)

- `ACTION_PLAN_OCT21.md`
- `AUDIT_SUMMARY_OCT21.md`
- `IMPLEMENTATION_COMPLETE_OCT21.md`
- `MCP_USAGE_OCT21_STATUS.md`
- `MCP_USAGE_REPORT_OCT21.md`
- `QUICK_SUMMARY_OCT21.md`
- `REPOSITORY_AUDIT_OCT21_2025.md`
- `VALGFRIE_OPGAVER_COMPLETE.md`

#### Operations (→ `docs/operations/`)

- `DAILY_OPERATIONS_GUIDE.md`
- `DEPLOYMENT_STATUS.md`
- `LINTING_FIX_SUMMARY.md`
- `QUICK_TEST_REFERENCE.md`
- `REPO_HEALTH_CHECK_2025-10-20.md`
- `SETUP_NOW.md`

#### Billy/Invoice Docs (→ `docs/billy/`)

- `FAKTURA_RAPPORT_2025-10-20.md`
- `HOTFIX_INVOICE_STATES.md`
- `INVOICE_STATUS_2025-10-20.md`
- `invoice-sample.json`

#### Product Analysis (→ `docs/analysis/`)

- `PRODUCT_CLEANUP_EXECUTION.md`
- `PRODUCT_CLEANUP_PLAN.md`
- `product-usage-analysis.csv`

#### Claude/AI Integration (→ `docs/ai-integration/`)

- `AI_ASSISTANT_PLAYBOOK.md`
- `CLAUDE_AUTHENTICATION_FIX.md`
- `CLAUDE_PHASE1_FINAL_REPORT.md`
- `CLAUDE_PHASE1_LIVE_RESULTS.md`
- `CLAUDE_PHASE1_PROMPT.md`
- `CLAUDE_PHASE1_RESUME.md`
- `CLAUDE_QUICK_FIX.md`
- `claude-desktop-config.json` (→ `docs/examples/`)

#### Terminal/PowerShell (→ `docs/troubleshooting/`)

- `KIRO_TERMINAL_EXPLANATION.md`
- `POWERSHELL7_SETUP_GUIDE.md`
- `TERMINAL_DIAGNOSTIC_REPORT.md`
- `TERMINAL_FIX_GUIDE.md`

#### Cleanup Complete Markers (→ `docs/completed/`)

- `MD022_SETUP_COMPLETE.md`
- `MCP_STANDARD_CLEANUP_COMPLETE.md`

#### Getting Started (→ `docs/` direkte)

- `MASTER_INDEX.md`
- `NEXT_STEPS_FOR_JONAS.md`
- `START_HERE.md`
- `ROADMAP.md`

#### Release Notes (→ `docs/releases/`)

- `RELEASE_NOTES_v1.4.1.md`

#### TekupVault Integration (→ `docs/integrations/tekupvault/`)

- `tekupvault/TEKUPVAULT_INTEGRATION.md`
- `tekupvault/TEKUPVAULT_REQUIREMENTS_FROM_BILLY.md`
- `tekupvault/test-tekupvault-search.ps1`

---

### 🔧 SKAL FLYTTES TIL `scripts/`

**PowerShell Scripts:**
- `analyze-product-usage-detailed.ps1`
- `analyze-product-usage.ps1`
- `analyze-render-logs.ps1`
- `commit-v1.4.0.ps1`
- `diagnose-terminal-stackoverflow.ps1`
- `find-profile-crash.ps1`
- `fix-all-ai-editors-terminal.ps1`
- `fix-terminal-crash.ps1`
- `get-todays-mcp-usage.ps1`
- `quick-product-analysis.ps1`

**Total:** 10 scripts

---

### 🗑️ SKAL SLETTES (Midlertidige/Output filer)

**Log Files:**
- `out.log`
- `render-logs-full.json`
- `render-logs-sample.json`
- `render-logs-today-full.txt`
- `render-logs-today.txt`
- `render-api-logs.json`

**Temp Folders:**
- `render-cli/` (installeret globalt nu)
- `render-cli.zip`

**Total:** 8 filer/folders

---

## 📋 Oprydningsplan

### Fase 1: Opret Mapper

```bash
mkdir -p docs/planning
mkdir -p docs/billy
mkdir -p docs/analysis
mkdir -p docs/ai-integration
mkdir -p docs/troubleshooting
mkdir -p docs/completed
mkdir -p docs/releases
mkdir -p docs/examples
mkdir -p docs/integrations/tekupvault
```

### Fase 2: Flyt Dokumentation

```powershell
# Planning docs
Move-Item ACTION_PLAN_OCT21.md docs/planning/
Move-Item AUDIT_SUMMARY_OCT21.md docs/planning/
Move-Item IMPLEMENTATION_COMPLETE_OCT21.md docs/planning/
Move-Item MCP_USAGE_OCT21_STATUS.md docs/planning/
Move-Item MCP_USAGE_REPORT_OCT21.md docs/planning/
Move-Item QUICK_SUMMARY_OCT21.md docs/planning/
Move-Item REPOSITORY_AUDIT_OCT21_2025.md docs/planning/
Move-Item VALGFRIE_OPGAVER_COMPLETE.md docs/planning/

# Operations docs
Move-Item DAILY_OPERATIONS_GUIDE.md docs/operations/
Move-Item DEPLOYMENT_STATUS.md docs/operations/
Move-Item LINTING_FIX_SUMMARY.md docs/operations/
Move-Item QUICK_TEST_REFERENCE.md docs/operations/
Move-Item REPO_HEALTH_CHECK_2025-10-20.md docs/operations/
Move-Item SETUP_NOW.md docs/operations/

# Billy docs
Move-Item FAKTURA_RAPPORT_2025-10-20.md docs/billy/
Move-Item HOTFIX_INVOICE_STATES.md docs/billy/
Move-Item INVOICE_STATUS_2025-10-20.md docs/billy/
Move-Item invoice-sample.json docs/billy/

# Product analysis
Move-Item PRODUCT_CLEANUP_EXECUTION.md docs/analysis/
Move-Item PRODUCT_CLEANUP_PLAN.md docs/analysis/
Move-Item product-usage-analysis.csv docs/analysis/

# AI Integration
Move-Item AI_ASSISTANT_PLAYBOOK.md docs/ai-integration/
Move-Item CLAUDE_AUTHENTICATION_FIX.md docs/ai-integration/
Move-Item CLAUDE_PHASE1_FINAL_REPORT.md docs/ai-integration/
Move-Item CLAUDE_PHASE1_LIVE_RESULTS.md docs/ai-integration/
Move-Item CLAUDE_PHASE1_PROMPT.md docs/ai-integration/
Move-Item CLAUDE_PHASE1_RESUME.md docs/ai-integration/
Move-Item CLAUDE_QUICK_FIX.md docs/ai-integration/
Move-Item claude-desktop-config.json docs/examples/

# Troubleshooting
Move-Item KIRO_TERMINAL_EXPLANATION.md docs/troubleshooting/
Move-Item POWERSHELL7_SETUP_GUIDE.md docs/troubleshooting/
Move-Item TERMINAL_DIAGNOSTIC_REPORT.md docs/troubleshooting/
Move-Item TERMINAL_FIX_GUIDE.md docs/troubleshooting/

# Completed markers
Move-Item MD022_SETUP_COMPLETE.md docs/completed/
Move-Item MCP_STANDARD_CLEANUP_COMPLETE.md docs/completed/

# Root docs
Move-Item MASTER_INDEX.md docs/
Move-Item NEXT_STEPS_FOR_JONAS.md docs/
Move-Item START_HERE.md docs/
Move-Item ROADMAP.md docs/

# Releases
Move-Item RELEASE_NOTES_v1.4.1.md docs/releases/

# TekupVault Integration
Move-Item tekupvault/TEKUPVAULT_INTEGRATION.md docs/integrations/tekupvault/
Move-Item tekupvault/TEKUPVAULT_REQUIREMENTS_FROM_BILLY.md docs/integrations/tekupvault/
Move-Item tekupvault/test-tekupvault-search.ps1 docs/integrations/tekupvault/
Remove-Item tekupvault/ -Force
```

### Fase 3: Flyt Scripts

```powershell
Move-Item analyze-product-usage-detailed.ps1 scripts/
Move-Item analyze-product-usage.ps1 scripts/
Move-Item analyze-render-logs.ps1 scripts/
Move-Item commit-v1.4.0.ps1 scripts/
Move-Item diagnose-terminal-stackoverflow.ps1 scripts/
Move-Item find-profile-crash.ps1 scripts/
Move-Item fix-all-ai-editors-terminal.ps1 scripts/
Move-Item fix-terminal-crash.ps1 scripts/
Move-Item get-todays-mcp-usage.ps1 scripts/
Move-Item quick-product-analysis.ps1 scripts/
```

### Fase 4: Slet Temp Files

```powershell
Remove-Item out.log -Force
Remove-Item render-logs-*.json -Force
Remove-Item render-logs-*.txt -Force
Remove-Item render-api-logs.json -Force
Remove-Item render-cli/ -Recurse -Force
Remove-Item render-cli.zip -Force
```

---

## 🎯 Efter Oprydning - Rod Struktur

```
Tekup-Billy/
├── .cspell.json
├── .cursorrules
├── .env
├── .env.example
├── .gitignore
├── .markdownlint.json
├── CHANGELOG.md
├── CONTRIBUTING.md
├── Dockerfile
├── LICENSE
├── package.json
├── package-lock.json
├── README.md
├── render.yaml
├── tsconfig.json
├── .github/
├── .vscode/
├── archive/
├── deployment/
├── dist/
├── docs/
│   ├── MASTER_INDEX.md
│   ├── NEXT_STEPS_FOR_JONAS.md
│   ├── ROADMAP.md
│   ├── START_HERE.md
│   ├── ai-integration/
│   ├── analysis/
│   ├── billy/
│   ├── completed/
│   ├── examples/
│   ├── integrations/
│   │   └── tekupvault/
│   ├── operations/
│   ├── planning/
│   ├── releases/
│   └── troubleshooting/
├── logs/
├── mcp-clients/
├── node_modules/
├── public/
├── renos-backend-client/
├── scripts/
│   ├── analyze-product-usage.ps1
│   ├── get-todays-mcp-usage.ps1
│   └── ... (10 scripts total)
├── src/
├── tests/
└── tekupvault/  ❌ SKAL FJERNES (integration docs flyttes til docs/integrations/)

**TekupVault hovedrepository:** `C:\Users\empir\TekupVault` (separat repo udenfor Billy)

```

**Rod filer reduceret fra 80+ til 15** ✅  
**tekupvault/ folder fjernet** ✅ (docs flyttet til docs/integrations/tekupvault/)

---

## 📝 Git Commit

```bash
git add -A
git commit -m "chore: restructure repository - organize docs and scripts

- Move 40+ markdown docs to docs/ subdirectories
- Move 10 PowerShell scripts to scripts/
- Delete 8 temporary/log files
- Create organized folder structure:
  - docs/planning/ - project planning & reports
  - docs/operations/ - operational guides
  - docs/billy/ - Billy API documentation
  - docs/analysis/ - usage analysis reports
  - docs/ai-integration/ - Claude/AI setup guides
  - docs/troubleshooting/ - terminal & PowerShell fixes
  - docs/completed/ - milestone markers
  - docs/releases/ - release notes
  - docs/examples/ - config examples

Root directory now contains only 15 essential files
Improves repository navigation and maintainability"
```

---

**Skal jeg køre oprydningen nu?** (Y/N)
