# ☁️ Cloud Agent Setup for tekup-ai-v2

**Dato:** 2025-01-28
**Status:** ✅ Single-root workspace oprettet

---

## 🎯 Problem

Cloud agents er **disabled i multi-root workspaces**. Når du har flere projekter åbne i samme workspace (multi-root), kan Cursor ikke aktivere cloud functionality.

**Løsning:** Opret en dedikeret single-root workspace kun for `tekup-ai-v2`.

---

## 📁 Workspace Fil

**Navn:** `tekup-ai-v2.code-workspace`
**Lokation:** `C:\Users\empir\Tekup\services\tekup-ai-v2\`

Denne workspace fil inkluderer kun `tekup-ai-v2` projektet, hvilket gør det muligt at aktivere cloud agents.

---

## 🚀 Sådan Aktivérer Du Cloud Agents

### 1. Åbn Single-Root Workspace

**Option A: Fra Cursor/VS Code**

- `File` → `Open Workspace from File...`
- Naviger til: `C:\Users\empir\Tekup\services\tekup-ai-v2\`
- Vælg: `tekup-ai-v2.code-workspace`

**Option B: Direkte fra File Explorer**

- Dobbeltklik på `tekup-ai-v2.code-workspace`
- Workspace åbnes automatisk i Cursor/VS Code

### 2. Aktivér Cloud Agent

1. **Tjek Agent Status:**
   - I Cursor, se status feltet nederst i chat panelet
   - Du skal se "Agent Auto" uden "Disabled in multi-root workspaces" beskeden

2. **Skift til Cloud (hvis nødvendigt):**
   - Klik på dropdown ved siden af agent status
   - Skift fra "Local" til "Cloud" hvis tilgængelig

3. **Verificer i Settings:**
   - `Ctrl+,` for at åbne Settings
   - Naviger til: `Rules, Memories, Commands` → `Cloud Agents...`
   - Verificer at cloud functionality er aktiveret

---

## 🔄 Skift Mellem Workspaces

### Multi-Root Workspace (Helt Portfolio)

**Når du skal arbejde på:**

- Flere projekter samtidigt
- Cross-project integrationer
- Portfolio overview

**Åbn:**

- `Tekup-Portfolio.code-workspace` (eller din primære multi-root workspace)

**Limitation:** Cloud agents er **disabled** i denne workspace type.

### Single-Root Workspace (kun tekup-ai-v2)

**Når du skal:**

- Arbejde specifikt på `tekup-ai-v2`
- Aktivere cloud agents for bedre AI performance
- Køre intensive AI-assisted tasks

**Åbn:**

- `C:\Users\empir\Tekup\services\tekup-ai-v2\tekup-ai-v2.code-workspace`

**Fordel:** Cloud agents er **aktiveret** ✅

---

## 📋 Workspace Indhold

### Inkluderede Filer

- ✅ `client/` - Frontend React applikation
- ✅ `server/` - Backend Express server
- ✅ `shared/` - Shared types og utilities
- ✅ `drizzle/` - Database migrations og schema

### Ekskluderede Mapper

- ❌ `node_modules/` - Automa

tisk skjult

- ❌ `dist/` - Build output
- ❌ `.git/` - Git metadata

---

## ⚙️ Workspace Settings

Workspace filen inkluderer optimerede settings for:

- **TypeScript:** Bruger workspace TypeScript version
- **Formatting:** Prettier med format on save
- **Extensions:** Anbefalede extensions for projektet
- **File Exclusions:** Optimerede search og file explorer

---

## 🔍 Troubleshooting

### Problem: Cloud agents stadig disabled

**Løsning:**

1. Verificer at du har åbnet `.code-workspace` filen (ikke bare mappen)
2. Tjek at workspace kun har én folder (single-root)
3. Genstart Cursor/VS Code
4. Verificer din Cursor Pro+ subscription status

### Problem: TypeScript errors

**Løsning:**

1. Kør `pnpm install` i projektet
2. Genstart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Problem: Manglende dependencies

**Løsning:**

1. Naviger til projektet: `cd C:\Users\empir\Tekup\services\tekup-ai-v2`
2. Installer: `pnpm install`

---

## 📚 Relateret Dokumentation

### Core Documentation

- **Project README:** `README.md` - Project overview og features
- **Start Guide:** `START_GUIDE.md` - Quick start instruktioner
- **Login Debug:** `LOGIN_DEBUG_GUIDE.md` - Authentication troubleshooting

### AI Development Context (Vigtigt for Cursor AI)

- **`.cursorrules`** - ✅ Cursor AI rules og coding guidelines (læses automatisk)
- **`docs/CURSOR_RULES.md`** - Detaljerede Cursor AI development rules
- **`docs/ARCHITECTURE.md`** - System arkitektur og struktur
- **`docs/DEVELOPMENT_GUIDE.md`** - Komplet development workflow guide
- **`docs/API_REFERENCE.md`** - API dokumentation

### Feature Documentation (i `docs/` mappen)

- **Email Features:** `docs/EMAIL_TAB_*.md` - Email tab implementation
- **API Optimization:** `docs/API_OPTIMIZATION_*.md` - Performance optimering
- **Shortwave:** `docs/SHORTWAVE_*.md` - Shortwave workflow integration
- **Phase 0:** `docs/PHASE_0_*.md` - SMTP og inbound email setup
- **Database:** `docs/DATABASE_MIGRATION_SUPABASE.md` - Database migration guides

### VS Code Configuration

- **`.vscode/tasks.json`** - Development tasks (Ctrl+Shift+B for build)
- **`.vscode/launch.json`** - Debug configurations (F5 for debugging)
- **`.vscode/settings.json`** - Workspace-specifikke settings

**Vigtigt:** Cursor AI læser automatisk `.cursorrules` filen og alle dokumentation filer når du udvikler. Sørg for at alle relevante docs er opdateret!

---

## ✅ Quick Start Commands

```powershell
# Åbn workspace
code "C:\Users\empir\Tekup\services\tekup-ai-v2\tekup-ai-v2.code-workspace"

# Eller fra projekt mappen
cd C:\Users\empir\Tekup\services\tekup-ai-v2
code tekup-ai-v2.code-workspace
```

---

**Status:** ✅ Ready for cloud agents
**Næste skridt:** Åbn workspace og verificer cloud agent activation
