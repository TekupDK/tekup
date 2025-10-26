# TekUp AI Migration - Old Repositories Analysis

**Date:** October 23, 2025 (Last updated)  
**Original Date:** October 22, 2025  
**Purpose:** Determine which old repositories should be archived, deleted, or kept after tekup-ai consolidation

## 📊 Repository Status Overview

| Repository | Status | Action Recommended | Reason |
|------------|--------|-------------------|---------|
| **tekup-chat** | ✅ **COMPLETED** (Oct 23) | 🗄️ **READY TO ARCHIVE** | Build successful, zero TypeScript errors |
| **TekupVault** | ✅ Migrated | 🗄️ ARCHIVE | Code migrated to `apps/ai-vault` + `apps/ai-vault-worker` |
| **Tekup Google AI** | ⚠️ Partial | ⏸️ KEEP (for now) | Only LLM code migrated, agents/workflows pending |
| **tekup-ai-assistant** | ✅ Migrated | 🗄️ ARCHIVE | MCP docs migrated to `docs/guides/mcp/` |
| **renos-calendar-mcp** | ✅ Migrated | ⏸️ KEEP | Standalone deployment needed, but docs copied |
| **RendetaljeOS** | ❌ Not migrated | ✅ KEEP ACTIVE | Production monorepo, AI features extracted only |
| **Tekup-org** | ❌ Not migrated | ✅ KEEP ACTIVE | Production monorepo, separate from AI services |

## 🎯 Detailed Analysis

### 1. tekup-chat
**Location:** `c:\Users\empir\tekup-chat`

**Migration Status:** ✅ **COMPLETED** (October 23, 2025)

**What was migrated:**
- ✅ Next.js 15 chat interface → `apps/ai-chat/`
- ✅ All React components → `apps/ai-chat/src/components/`
- ✅ API routes → `apps/ai-chat/app/api/` and `apps/ai-chat/src/app/api/`
- ✅ TypeScript types unified (`Message`, `ChatSession`)
- ✅ TekupVault integration → `apps/ai-chat/src/lib/tekupvault.ts`
- ✅ Supabase integration → `apps/ai-chat/src/lib/supabase.ts`
- ✅ Custom hooks → `apps/ai-chat/src/hooks/useChat.ts`
- ✅ Tailwind CSS configuration (v3 syntax)
- ✅ PostCSS configuration
- ✅ Build verified: `pnpm build` succeeds with zero TypeScript errors

**What remains:**
- Source code still in original location (ready for archival)

**Recommendation:** 🗄️ **READY TO ARCHIVE NOW**
```bash
# Archive command (safe to run now):
cd c:\Users\empir
Rename-Item "tekup-chat" -NewName "tekup-chat-ARCHIVED-2025-10-23"
```

**Migration Fixes Applied:**
1. Fixed `next.config.ts` → `next.config.js` (Next.js 14.0.4 compatibility)
2. Updated `postcss.config.mjs` to use Tailwind v3 plugins
3. Converted `@import "tailwindcss"` → `@tailwind base/components/utilities`
4. Fixed TypeScript path aliases: `@/* → ./src/*`
5. Unified type system: `DBMessage` (Supabase) → `Message` (@/types)
6. Added missing `enrichPromptWithContext()` function
7. Fixed all React component props and interfaces

---

### 2. TekupVault
**Location:** `c:\Users\empir\TekupVault`

**What was migrated:**
- ✅ All documentation (`.md` files) → `docs/migration/`
- ✅ `.env.example` → Consolidated into tekup-ai root
- ✅ Architecture patterns documented

**What remains:**
- `apps/vault-api/` (Express REST API + GitHub sync)
- `apps/vault-worker/` (Background ingestion worker)
- `packages/vault-core/`, `packages/vault-ingest/`, `packages/vault-search/`
- `supabase/migrations/` (PostgreSQL + pgvector schema)

**Recommendation:** 🗄️ **ARCHIVE after code migration**

**Migration TODO:**
1. Copy `apps/vault-api/src/` → `tekup-ai/apps/ai-vault/src/`
2. Copy `apps/vault-worker/src/` → `tekup-ai/apps/ai-vault-worker/src/`
3. Merge package code into `@tekup-ai/rag` package
4. Copy Supabase migrations to `tekup-ai/supabase/migrations/vault/`

---

### 3. Tekup Google AI (RenOS)
**Location:** `c:\Users\empir\Tekup Google AI`

**What was migrated:**
- ✅ LLM providers (`src/llm/*.ts`) → `packages/ai-llm/src/providers/`
- ✅ Documentation → `docs/guides/`
- ✅ `.env.example` → Consolidated

**What remains (CRITICAL - still in active use):**
- 🔴 **Production backend API** (`src/api/`, `src/controllers/`, `src/services/`)
- 🔴 **Production frontend** (`client/src/`)
- 🔴 **Agent system** (`src/agents/`) - needs migration to `apps/ai-agents`
- 🔴 **Database schema** (`prisma/schema.prisma`)
- 🔴 **Workflows** (`src/workflows/`)
- 🔴 **Live deployment** (Render.com production services)

**Recommendation:** ⏸️ **KEEP ACTIVE - Gradual migration**

**Migration Plan:**
1. **Phase 2A** (Week 1): Copy agent code to `apps/ai-agents/`
2. **Phase 2B** (Week 2): Extract workflows to `packages/ai-agents/`
3. **Phase 3** (Week 3-4): Test new structure in tekup-ai
4. **Phase 4** (Week 5+): Migrate production traffic gradually

**DO NOT archive until:**
- [ ] All agent code tested in tekup-ai
- [ ] Production endpoints verified
- [ ] Database migrated to unified schema
- [ ] Zero downtime migration completed

---

### 4. tekup-ai-assistant
**Location:** `c:\Users\empir\tekup-ai-assistant`

**What was migrated:**
- ✅ MCP server documentation → `docs/guides/mcp/`
- ✅ Setup guides, architecture docs

**What remains:**
- MCP server implementations (4 servers: Billy, RenOS, System, Vault)
- Python source code
- Tool definitions

**Recommendation:** 🗄️ **ARCHIVE - but extract MCP servers first**

**Migration TODO:**
1. Copy MCP server code to `tekup-ai/apps/ai-mcp-hub/servers/`
2. Document server configurations
3. Archive original repo

---

### 5. renos-calendar-mcp
**Location:** `c:\Users\empir\Tekup-Cloud\renos-calendar-mcp`

**What was migrated:**
- ✅ Documentation → `docs/guides/calendar/`
- ✅ `.env.template` → Consolidated

**What remains:**
- **Standalone MCP server** (5 calendar intelligence tools)
- **Production deployment** (separate from main RenOS)
- Integration with Billy.dk, Twilio, Google Calendar

**Recommendation:** ⏸️ **KEEP as standalone service**

**Reason:** Calendar MCP server should remain independent for:
- Microservice architecture (single responsibility)
- Separate deployment lifecycle
- Can be called from tekup-ai via MCP protocol

**Action:** Reference in tekup-ai, but don't migrate code

---

### 6. RendetaljeOS
**Location:** `c:\Users\empir\RendetaljeOS`

**What was migrated:**
- ✅ `.env.example` patterns → Consolidated
- ✅ Architecture insights

**What remains:**
- **ENTIRE PRODUCTION MONOREPO** (30+ apps, 18+ packages)
- Active development
- Production deployments

**Recommendation:** ✅ **KEEP ACTIVE - No migration**

**Reason:** RendetaljeOS is a separate product. Only AI utilities were extracted to tekup-ai.

---

### 7. Tekup-org
**Location:** `c:\Users\empir\Tekup-org`

**What was migrated:**
- ✅ Architecture patterns documented

**What remains:**
- **ENTIRE TEKUP PORTFOLIO MONOREPO**
- Production services
- Shared packages

**Recommendation:** ✅ **KEEP ACTIVE - No migration**

---

## 📋 Action Plan

### Immediate (This Week)
- [ ] **Copy TekupVault source code** to `apps/ai-vault` and `apps/ai-vault-worker`
- [ ] **Copy tekup-chat source code** to `apps/ai-chat`
- [ ] **Extract MCP servers** from tekup-ai-assistant to `apps/ai-mcp-hub`

### Week 2
- [ ] **Archive tekup-chat** (rename folder with -ARCHIVED suffix)
- [ ] **Archive TekupVault** (after verifying new code works)
- [ ] **Archive tekup-ai-assistant** (after MCP servers migrated)

### Week 3-4
- [ ] **Gradual migration** of Tekup Google AI agents
- [ ] **Test new structure** in tekup-ai
- [ ] **Document migration path** for future reference

### Never Archive
- ✅ **RendetaljeOS** - Production monorepo
- ✅ **Tekup-org** - Portfolio monorepo
- ⏸️ **renos-calendar-mcp** - Standalone microservice

## 🔐 Safety Checklist

Before archiving ANY repo:
- [ ] All code copied to tekup-ai
- [ ] Documentation migrated
- [ ] Tests passing in new location
- [ ] No active production deployments
- [ ] Git history preserved (use `git archive` or rename, don't delete)
- [ ] Team notified of change

## 📝 Archive Script Template

```bash
# Safe archiving (preserves Git history)
cd c:\Users\empir
$REPO="tekup-chat"  # Change per repo
$DATE="2025-10-22"

# Rename with archived suffix
mv $REPO "${REPO}-ARCHIVED-${DATE}"

# Or create archive
cd $REPO
git archive --format=zip --output="../${REPO}-archive-${DATE}.zip" HEAD

# Update README with archive notice
echo "# ARCHIVED - Migrated to tekup-ai monorepo\n\nDate: ${DATE}\nNew location: tekup-ai/apps/ai-chat" > ARCHIVED.md
```

---

**Last Updated:** October 22, 2025  
**Status:** Documentation complete, code migration in progress
