# 🤖 TEKUP WORKSPACE - AI ASSISTANT CONTEXT

**For:** Claude, GPT, Cascade, og andre AI assistants  
**Purpose:** Quick context når AI skal hjælpe med Tekup projekter  
**Updated:** 23. Oktober 2025

---

## 📊 **WORKSPACE SNAPSHOT**

### **Basic Info:**

```yaml
Organization: TekupDK
GitHub: https://github.com/TekupDK/tekup
Structure: Monorepo (all projects in one repository)
Setup Date: Oktober 2025
Purpose: Complete development monorepo for Tekup ecosystem
```

### **Tech Stack:**

```yaml
Languages: TypeScript (primary), JavaScript, Python
Frameworks: Next.js 15, React 19, Express
Database: PostgreSQL (central: tekup-database)
ORM: Prisma
Package Manager: pnpm
Build Tools: Turborepo, Vite
Deployment: Render.com, Docker
CI/CD: GitHub Actions (planned)
Testing: Vitest, Playwright, Jest
```

---

## 📁 **PROJECTS OVERVIEW**

### **Production Services (CRITICAL):**

#### 1. **tekup-database** (v1.4.0)

```yaml
Location: apps/production/tekup-database
Status: ✅ LIVE - Central database
Tech: PostgreSQL, Prisma, Docker
Schemas: vault, billy, renos, crm, flow, shared
Dependencies: ALL other projects depend on this
Health: 10/10 - CRITICAL
```

#### 2. **tekup-vault** (v0.1.0)

```yaml
Location: apps/production/tekup-vault
Status: ✅ LIVE - https://tekupvault.onrender.com
Tech: TypeScript, Turborepo, OpenAI, pgvector
Purpose: Knowledge layer with semantic search
Features: 14 repos indexed, MCP server, 31 tests
Health: 8.5/10
```

#### 3. **tekup-billy** (v1.4.3)

```yaml
Location: apps/production/tekup-billy
Status: ✅ LIVE - https://tekup-billy.onrender.com
Tech: TypeScript, MCP SDK, Redis, Supabase
Purpose: Billy.dk MCP server for AI agents
Features: 32 MCP tools, Redis scaling, circuit breaker
Health: 9.2/10
```

---

### **Web Applications:**

#### 4. **rendetalje-os** (Monorepo)

```yaml
Location: apps/web/rendetalje-os
Status: 🟡 Active development
Tech: React 19, Node.js, Express, Prisma, Supabase
Purpose: Cleaning company management platform
Structure: Monorepo (backend + frontend)
Health: 8/10
Note: Database connection pending
```

#### 5. **tekup-cloud-dashboard**

```yaml
Location: apps/web/tekup-cloud-dashboard
Status: 🟡 Production-ready (unreleased)
Tech: React, Supabase
Purpose: Unified dashboard for all Tekup services
Features: Real-time data, auth, KPIs, multi-tenant
Health: 6/10
```

---

### **Backend Services:**

#### 6. **tekup-ai** (Phase 1)

```yaml
Location: services/tekup-ai
Status: 🟡 Under development - AI infrastructure monorepo
Tech: TypeScript, pnpm workspaces, Turborepo
Purpose: Central AI services (LLM, agents, MCP, RAG)
Structure:
  - apps/: ai-chat, ai-orchestrator, rendetalje-chat, ai-vault
  - packages/: ai-llm, ai-agents, ai-mcp, ai-rag
Health: 6/10 (structure ready, implementation ongoing)
```

#### 7. **tekup-cloud**

```yaml
Location: services/tekup-cloud
Status: ✅ Documentation hub + MCP server
Tech: Node.js, TypeScript, Express
Purpose: RenOS tools + renos-calendar-mcp
Features: 51 documentation files, calendar MCP (5 AI tools)
Health: 8.5/10
```

#### 8. **tekup-gmail-services** (v1.0.0)

```yaml
Location: services/tekup-gmail-services
Status: ✅ Consolidated monorepo
Tech: Python + Node.js + TypeScript
Purpose: Email automation for Tekup ecosystem
Services: 3 (gmail-automation, gmail-mcp-server, renos-gmail-services)
Health: 9/10
```

#### 9. **tekup-ai-assistant** (v1.5.0)

```yaml
Location: services/tekup-ai-assistant
Status: ✅ Documentation & configs
Tech: Markdown, configs
Purpose: AI assistant integration docs
Health: 7/10
```

---

## 🗂️ **WORKSPACE STRUCTURE LOGIC**

### **Why this structure?**

Based on research fra:

- Luca Pette (monorepo expert)
- Aviator (monorepo guide)
- GitHub conventions
- OpenAI/Anthropic approaches

### **Key Principles:**

1. **Organize by runtime, not technology**
   - `apps/production/` - Live services
   - `apps/web/` - Web applications
   - `apps/desktop/` - Desktop applications
   - `services/` - Backend services

2. **Loosely reflect team structure**
   - Not 1:1 mapping, but logical grouping
   - Clear ownership via CODEOWNERS

3. **Shared code in packages/**
   - `packages/ai-llm/` - LLM abstraction
   - `packages/ai-agents/` - Agent logic
   - `packages/shared-types/` - TypeScript types

4. **Clear separation of concerns**
   - Production vs development clear
   - Runtime types clear (web vs desktop vs API)
   - Documentation centralized in docs/

---

## 🔄 **COMMON PATTERNS**

### **Database Connection:**

ALL projects connect to central `tekup-database`:
```typescript
// Standard pattern across all projects
DATABASE_URL=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=[project_schema]

Schemas:
- vault: TekupVault
- billy: Tekup-Billy
- renos: RendetaljeOS, tekup-ai
- crm: Future CRM
- flow: Future workflow
- shared: Cross-project data
```

### **Environment Variables:**

```bash
# Never commit .env files!
# Always use .env.example as template
# Store secrets in:
- PC 1: Local .env file
- PC 2: Local .env file (copy values securely)
- GitHub: Secrets for CI/CD
- Production: Environment variables on Render
```

### **Package Manager:**

```bash
# ALWAYS use pnpm (not npm or yarn)
pnpm install
pnpm dev
pnpm build
pnpm test

# Workspaces (for monorepos)
pnpm install  # Root installs for all workspaces
pnpm --filter [package-name] dev  # Run script in specific package
```

### **Git Workflow:**

```bash
# Standard workflow
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature
gh pr create

# Commits follow Conventional Commits:
feat: New feature
fix: Bug fix
docs: Documentation
refactor: Code refactoring
test: Add tests
chore: Maintenance
```

---

## 🚨 **CRITICAL INFORMATION**

### **DO NOT:**

- ❌ Delete or modify `apps/production/tekup-database` without extreme caution
- ❌ Commit .env files with secrets
- ❌ Push directly to main branch (use PRs)
- ❌ Delete files in `archive/` (read-only reference)
- ❌ Use npm or yarn (only pnpm)

### **ALWAYS:**

- ✅ Pull before starting work (`git pull`)
- ✅ Use conventional commit messages
- ✅ Add tests for new features
- ✅ Update README when adding features
- ✅ Check CODEOWNERS for reviewers
- ✅ Run `pnpm lint` before committing

### **IF UNSURE:**

- 📚 Check project README first
- 📚 Check workspace docs in `Tekup/docs/`
- 📚 Check CONTRIBUTING.md for guidelines
- 💬 Ask in GitHub Discussions
- 💬 Create issue in relevant repo

---

## 📋 **QUICK REFERENCE**

### **Find Documentation:**

```bash
Workspace docs:     Tekup/docs/
Project docs:       Tekup/apps/[category]/[project]/README.md
API docs:           Tekup/docs/api/
Architecture:       Tekup/docs/architecture/
Deployment:         Tekup/docs/deployment/
```

### **Common Locations:**

```bash
Database schema:    tekup-database/prisma/schema.prisma
Migrations:         tekup-database/prisma/migrations/
Scripts:            Tekup/scripts/
Configs:            Tekup/configs/
Tests:              [project]/tests/
```

### **Important Files:**

```bash
README.md               - Workspace overview
CONTRIBUTING.md         - Development guidelines
CODEOWNERS             - Code ownership
CHANGELOG.md           - Workspace changes
AI_CONTEXT_SUMMARY.md  - This file (for AI context)
README_PC2_QUICK_START.md - PC 2 setup guide
```

---

## 🎯 **TYPICAL AI TASKS**

### **1. "Understand workspace structure"**

```
Read:
- Tekup/README.md
- Tekup/WORKSPACE_STRUCTURE_IMPROVED.md
- This file (AI_CONTEXT_SUMMARY.md)
```

### **2. "Work on project X"**

```
1. Navigate: cd Tekup/apps/[category]/[project]
2. Read: README.md in that project
3. Check: .env.example for required variables
4. Install: pnpm install
5. Run: pnpm dev
```

### **3. "Understand database schema"**

```
Read: tekup-database/prisma/schema.prisma
Schemas: vault, billy, renos, crm, flow, shared
```

### **4. "Add new feature to project"**

```
1. Create branch: git checkout -b feature/my-feature
2. Make changes in project
3. Add tests
4. Update README if needed
5. Commit: git commit -m "feat: description"
6. Push: git push origin feature/my-feature
7. Create PR: gh pr create
```

### **5. "Deploy changes"**

```
Check: docs/deployment/[project]-deployment.md
Most projects: Auto-deploy on push to main (Render.com)
```

### **6. "Sync between computers"**

```
PC 1 → GitHub: git push
PC 2 ← GitHub: git pull
All changes synced automatically via GitHub
```

---

## 🤝 **COLLABORATION CONTEXT**

### **Team:**

- Organization: TekupDK
- Current: Solo developer with AI assistants
- Future: Expandable to team (structure ready)

### **Communication:**

- Issues: GitHub Issues per repo
- Discussions: GitHub Discussions
- Docs: Markdown files in repos

### **Review Process:**

- All changes via Pull Requests
- Reviewers auto-assigned via CODEOWNERS
- Require 1 approval (currently owner)
- CI checks must pass (when setup)

---

## 📚 **LEARNING PATH FOR NEW AI**

### **Day 1:**

1. Read this file completely
2. Read Tekup/README.md
3. Understand workspace structure
4. Know where to find docs

### **Week 1:**

1. Familiarize with 3 main projects
2. Understand database schema
3. Know git workflow
4. Understand deployment process

### **Ongoing:**

1. Read project-specific docs as needed
2. Check CONTRIBUTING.md for standards
3. Reference CODEOWNERS for ownership
4. Stay updated with CHANGELOG.md

---

## ✅ **AI SELF-CHECK**

Before helping with Tekup projects, verify you understand:

- [ ] Workspace structure (apps, services, packages, docs)
- [ ] 9 main projects and their purposes
- [ ] Central database (tekup-database)
- [ ] Multi-repo approach (not monorepo)
- [ ] Git workflow (branch → commit → PR)
- [ ] Where to find documentation
- [ ] pnpm (not npm/yarn)
- [ ] Never commit .env files
- [ ] Conventional commits
- [ ] CODEOWNERS for reviews

If unclear on any, read relevant docs before proceeding.

---

## 🔄 **KEEP UPDATED**

This context file is updated when:

- New projects added
- Major structure changes
- Important patterns established
- Common issues identified

**Check last updated date** at top of file.

---

**Last updated:** 29. Oktober 2025
**Version:** 1.1.0
**Maintained by:** TekupDK
