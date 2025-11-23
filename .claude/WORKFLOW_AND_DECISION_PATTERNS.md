# Tekup Workflow & Decision Patterns

**Generated:** 2025-11-23
**Purpose:** Capture team workflow, decision-making patterns, and project management style
**Based on:** Git history analysis, commit patterns, and repository structure

---

## Table of Contents

1. [Development Workflow](#development-workflow)
2. [Decision-Making Patterns](#decision-making-patterns)
3. [Bot-Assisted Development](#bot-assisted-development)
4. [Issue Resolution Workflow](#issue-resolution-workflow)
5. [Deployment Strategy](#deployment-strategy)
6. [Documentation Philosophy](#documentation-philosophy)
7. [Refactoring Approach](#refactoring-approach)
8. [Technical Debt Management](#technical-debt-management)

---

## Development Workflow

### Feature Development Cycle

**Based on commit patterns, the typical workflow is:**

1. **Initial Planning (Bot-Initiated)**
   ```
   Commit: "Initial plan"
   - Bot creates initial assessment
   - Identifies scope and dependencies
   - Lists subtasks
   ```

2. **Investigation Phase**
   ```
   Commit: "Initial assessment of [feature] issues"
   Commit: "Add comprehensive [feature] investigation report"
   - Deep dive into existing code
   - Identify blockers
   - Document current state
   ```

3. **Implementation Phase**
   ```
   Commit: "Fix all TypeScript compilation errors"
   Commit: "Remove monorepo dependency to avoid Railway conflicts"
   Commit: "Update Railway deployment config and add deployment guide"
   - Fix blocking issues
   - Implement core functionality
   - Add configuration
   ```

4. **Documentation & Testing**
   ```
   Commit: "Add deployment guide and best practices"
   Commit: "Update documentation to reflect changes"
   - Document implementation
   - Add usage examples
   - Update related docs
   ```

5. **Completion & PR**
   ```
   Commit: "Address PR review feedback: simplify stub, improve watchPaths, fix version"
   Commit: "Complete [feature] v2.0.0 development continuation"
   - Address review comments
   - Final polish
   - Merge to master
   ```

### Branching Strategy

**Pattern extracted from git history:**

```
master                           # Main development branch
  ├── claude/*                   # Claude-created feature branches
  │   └── claude/gor-som-han-feature-01KfZn1dW8xUoKoFgvum7jyT
  └── copilot/*                  # Copilot-created feature branches
      ├── copilot/create-railway-json-configuration
      ├── copilot/consolidate-database-in-supabase
      └── copilot/analyze-tekupdk-repo-issues
```

**Key observations:**
- Feature branches merged via Pull Request
- Branch names are descriptive and context-specific
- Bot-generated branches have unique identifiers
- Small fixes committed directly to master
- Documentation updates typically direct to master

### Commit Frequency Pattern

**From recent history:**

- **High-velocity periods:** 10-20 commits per day during feature development
- **Bot commits:** Often in rapid succession (5-10 commits in sequence)
- **Human commits:** More spaced out, typically batch-related changes
- **Submodule updates:** Regular, often daily during active development

**Example: Billy-mcp v2.0.0 development (Nov 1, 2025):**
```
17:50 - 🎊 MISSION ACCOMPLISHED: Billy-mcp By Tekup v2.0.0 Production Ready!
17:34 - fix(railpack): Force Dockerfile usage and fix start command detection
17:31 - railway: FORCE DEPLOYMENT - Billy-mcp By Tekup v2.0.0
17:29 - trigger: Force Railway deployment of Billy-mcp By Tekup v2.0.0
17:28 - feat: Add tRPC integration for FridayOS mobile app
17:27 - docs: Complete Friday AI migration - Ready for Cursor development
17:25 - fix(railway): Enhanced startup debugging for deployment troubleshooting
```
*Note: 7 commits in 25 minutes during critical deployment*

---

## Decision-Making Patterns

### Technology Selection

**Observed pattern: Modern, stable, well-documented tech:**

1. **NestJS over Express**
   - Decision: Use NestJS 10.x for backend
   - Rationale: Built-in DI, modularity, TypeScript-first
   - Evidence: Consistent NestJS patterns across all services

2. **Next.js 15 App Router over Pages Router**
   - Decision: Migrate to App Router
   - Rationale: Future-proof, better performance, server components
   - Evidence: All new pages use app/ directory structure

3. **Zustand over Redux**
   - Decision: Use Zustand for state management
   - Rationale: Simpler API, less boilerplate, better DX
   - Evidence: No Redux files in codebase

4. **Supabase over self-hosted PostgreSQL**
   - Decision: Use Supabase for database + auth + real-time
   - Rationale: Managed service, built-in features, cost-effective
   - Evidence:
     ```
     Commit: "Merge pull request #15 from TekupDK/copilot/consolidate-database-in-supabase"
     Commit: "Update all .env files to use consolidated Supabase database"
     ```

5. **Railway over Heroku/Render**
   - Decision: Deploy to Railway
   - Rationale: Better DX, simpler config, modern platform
   - Evidence: Multiple Railway configuration commits
     ```
     Commit: "Add railway.json configuration for tekup-billy deployment"
     Commit: "fix: Add Railway configuration files - force Dockerfile usage"
     ```

### Architectural Decisions

**Pattern: Pragmatic over perfect**

1. **Monorepo with submodules (hybrid approach)**
   - Not pure monorepo, not multi-repo
   - Keeps related code together, isolates complex subsystems
   - Evidence: 4 active submodules for tekup-ai, secrets, dashboard

2. **Multiple database schemas over microservices databases**
   - Single Supabase instance with multiple schemas
   - Easier management, lower cost, simpler deployment
   - Evidence:
     ```
     schemas: billy, crm, flow, renos, vault
     ```

3. **MCP servers for AI integration**
   - Standardized protocol for AI agent interactions
   - Modularity and reusability
   - Evidence: 7 MCP server packages

4. **Accept @ts-ignore temporarily for schema mismatches**
   - Decision: Use workarounds while planning proper fix
   - Rationale: Ship features, fix tech debt later
   - Evidence: "fix: Add type casts for circuit breaker stats to resolve TypeScript errors"

### When to Bot-Assist vs Manual Development

**Pattern extracted from commit authors:**

**Bot (copilot-swe-agent) handles:**
- Investigation and assessment
- Documentation generation
- Systematic refactoring
- Configuration updates
- Security fixes
- Repository analysis

**Humans (Rendetalje Team) handle:**
- Final deployment decisions
- Critical bug fixes during production
- Submodule updates
- Feature integration
- Business logic implementation
- Manual deployment triggers

**Example workflow:**
```
Bot:   "Initial plan"
Bot:   "Initial assessment of Billy-mcp issues"
Bot:   "Fix all TypeScript compilation errors"
Bot:   "Update Railway deployment config and add deployment guide"
Human: "Gør Billy-mcp klar til Railway: TypeScript fixes, monorepo ud, bedre deploy config"
Bot:   "Address PR review feedback: simplify stub, improve watchPaths, fix version"
Human: "🎊 MISSION ACCOMPLISHED: Billy-mcp By Tekup v2.0.0 Production Ready!"
```

---

## Bot-Assisted Development

### Copilot SWE Agent Workflow

**Consistent 5-phase pattern:**

#### Phase 1: Planning
```
Commit: "Initial plan"
```
- Creates high-level plan
- Identifies tasks
- No code changes yet

#### Phase 2: Investigation
```
Commit: "Initial investigation: comprehensive repository analysis plan"
Commit: "Initial assessment of [feature] issues"
```
- Analyzes codebase
- Identifies issues
- Documents findings

#### Phase 3: Implementation
```
Commit: "Fix all TypeScript compilation errors"
Commit: "Remove monorepo dependency to avoid Railway conflicts"
Commit: "Fix ESLint configuration and critical linting errors in google-mcp"
```
- Systematic fixes
- Multiple focused commits
- Clear commit messages

#### Phase 4: Documentation
```
Commit: "Add comprehensive database investigation report"
Commit: "Add deployment guide and best practices"
Commit: "Update documentation to reflect changes"
```
- Comprehensive documentation
- Usage examples
- Configuration guides

#### Phase 5: Completion
```
Commit: "Complete Billy-mcp v2.0.0 development continuation"
Commit: "Add investigation summary and complete repository analysis"
```
- Summary commit
- Final polish
- Ready for PR

### Bot Commit Message Patterns

**Highly consistent structure:**

```
# Always imperative mood, starts with action verb
Add comprehensive repository investigation report
Fix all TypeScript compilation errors
Update Railway deployment config and add deployment guide
Remove monorepo dependency to avoid Railway conflicts
Address PR review feedback: simplify stub, improve watchPaths, fix version

# Often includes detailed context in commit body (not shown in --oneline)
```

### Human Override Pattern

**When bot gets stuck, humans step in:**

**Example: Railway deployment (Nov 1, 2025)**

Bot attempted multiple times:
```
Bot: "fix: Add Railway configuration files - force Dockerfile usage"
Bot: "fix: Force Railway startup - check PORT env var"
Bot: "fix: Always start server when run via tsx"
Bot: "fix: ALWAYS start server - remove all startup conditions"
```

Human forced deployment:
```
Human: "railway: FORCE DEPLOYMENT - Billy-mcp By Tekup v2.0.0"
Human: "trigger: Force Railway deployment of Billy-mcp By Tekup v2.0.0"
Human: "🎊 MISSION ACCOMPLISHED: Billy-mcp By Tekup v2.0.0 Production Ready!"
```

**Pattern: Bot explores solutions, human makes final call**

---

## Issue Resolution Workflow

### Critical Bug Fix Pattern

**Based on Billy-mcp bug fixes (Nov 1, 2025):**

1. **Discovery & Documentation**
   ```
   Issue: ChatGPT search returns all customers instead of filtered results
   ```

2. **Root Cause Analysis**
   ```
   Commit: "Initial assessment of Billy-mcp issues"
   Finding: Billy API returns all customers; need client-side filtering
   ```

3. **Immediate Fix**
   ```
   Commit: "fix: Add client-side filtering fallback for customer search - fixes ChatGPT search issue"
   ```

4. **Pattern Application**
   ```
   Commit: "fix: Add client-side filtering for list_products and search parameter for list_invoices"
   Applied same fix to similar endpoints
   ```

5. **Verification & Documentation**
   ```
   Commit: "fix: Correct getCachedData parameter order + document Jørgen Pagh search issue"
   Documented specific reproduction case
   ```

### TypeScript Error Resolution Strategy

**Current approach (46 errors remaining):**

**Phase 1: Triage (Done)**
- Identified all 46 errors
- Categorized by severity
- Documented in `TYPESCRIPT_FIX_STATUS.md`

**Phase 2: Workarounds (Current)**
```
Commit: "fix: Add type casts for circuit breaker stats to resolve TypeScript errors"
Commit: "fix: Tilføj resterende TypeScript fixes"
```
- Apply @ts-ignore with justification
- Use type assertions where safe
- Enable feature development to continue

**Phase 3: Proper Fixes (Planned)**
- Update Prisma schemas
- Migrate to Supabase direct (bypass Prisma)
- Remove all @ts-ignore annotations

**Philosophy: Ship with workarounds, fix properly later**

### Security Issue Handling

**Immediate action on discovered secrets:**

```
Commit: "Fix security issues: replace service role keys with placeholders, update Tekup-AI schema"
```

**Pattern:**
1. Immediate replacement with placeholders
2. Add to git-crypt encrypted files
3. Update documentation
4. Audit for similar issues

---

## Deployment Strategy

### Railway Deployment Pattern

**Learned pattern from Billy-mcp deployment:**

1. **Force Dockerfile usage (avoid Railpack)**
   ```
   Commit: "fix: Add Railway configuration files - force Dockerfile usage"

   # railway.json
   {
     "build": {
       "builder": "DOCKERFILE",
       "dockerfilePath": "apps/production/tekup-billy/Dockerfile"
     }
   }
   ```

2. **Explicit healthcheck configuration**
   ```
   Commit: "fix: Improve Railway healthcheck and startup detection"

   # Always return 200, minimal logic
   app.use("/health", (req, res) => {
     res.status(200).json({ status: "ok" });
   });
   ```

3. **Environment-based startup detection**
   ```
   Commit: "fix: Force Railway startup - check PORT env var (Railway always sets it)"

   # Railway always sets PORT
   if (process.env.PORT) {
     // Railway environment detected
   }
   ```

4. **Simplified start commands**
   ```
   Commit: "fix: Add start script for Railway - works with both Dockerfile and Railpack"

   # package.json
   "start": "node dist/server.js"
   ```

5. **Enhanced logging for debugging**
   ```
   Commit: "fix(railway): Enhanced startup debugging for deployment troubleshooting"

   console.log('Environment:', process.env.NODE_ENV);
   console.log('Port:', process.env.PORT);
   console.log('Railway detected:', !!process.env.RAILWAY_ENVIRONMENT);
   ```

### Version Bump Strategy

**Semantic versioning strictly followed:**

```
v2.0.0 - Major version (Billy-mcp production release)
v2.0.1 - Patch (Bug fixes: response parsing, cache-manager)
v1.4.4 - Patch (Token optimization, TestSprite integration)
```

**Version bump commit pattern:**
```
chore: bump version to [version] - [brief feature summary]
```

### Production Deployment Checklist

**Extracted from Billy-mcp v2.0.0 release:**

1. ✅ All TypeScript errors resolved (or @ts-ignore with justification)
2. ✅ Railway configuration tested
3. ✅ Environment variables documented
4. ✅ Healthcheck endpoint working
5. ✅ Monitoring configured (Sentry)
6. ✅ Documentation updated
7. ✅ Deployment guide written
8. ✅ Version bumped
9. ✅ Celebratory commit 🎊

---

## Documentation Philosophy

### Documentation-First Approach

**Pattern: Document as you go, not after**

**During Billy-mcp development:**
```
Commit: "Add database security issues remediation guide"
Commit: "Update Railway deployment config and add deployment guide"
Commit: "Add comprehensive database investigation report"
Commit: "docs: Add DEPLOYMENT_READY.md - final deployment status"
```

**Result:** 100+ markdown files in the repository

### Documentation Types Created

1. **Investigation Reports**
   - `COMPREHENSIVE_REPOSITORY_ANALYSIS.md`
   - `DATABASE_INVESTIGATION_REPORT.md`
   - `BILLY_MCP_ISSUES_ASSESSMENT.md`

2. **Status Documents**
   - `TYPESCRIPT_FIX_STATUS.md`
   - `DEPLOYMENT_READY.md`
   - `SETUP_COMPLETE.md`

3. **Guides**
   - `DEPLOYMENT_GUIDE.md`
   - `QUICKSTART_DA.md` (Danish quickstart)
   - `SECURITY_REMEDIATION.md`

4. **Summaries**
   - `EXECUTIVE_SUMMARY.md`
   - `IMPLEMENTATION_SUMMARY.md`
   - `INTEGRATION_SUMMARY.md`

### Documentation Standards

**Observed patterns:**

1. **Comprehensive but scannable**
   - Executive summaries at top
   - Table of contents for long docs
   - Clear section headers
   - Code examples inline

2. **Multilingual support**
   - Primary: English
   - Secondary: Danish (`QUICKSTART_DA.md`)
   - Internal commits: Mixed

3. **Versioned with code**
   - Documentation commits alongside feature commits
   - No separate docs repo
   - Updates in same PR as code changes

4. **Markdown-first**
   - All documentation in Markdown
   - No separate wiki
   - Searchable with grep/Glob

---

## Refactoring Approach

### "DRY Principle" Refactoring

**Pattern from Billy-mcp v2.0.1:**

**Before:**
```typescript
// Duplicated response parsing in 3 places
const customer = await response.json();
const product = await response.json();
const invoice = await response.json();
```

**Commits:**
```
Commit: "Fix 3 critical Billy MCP bugs: createInvoice, updateCustomer, createProduct response parsing"
Commit: "Refactor response parsing into reusable helper function following DRY principles"
Commit: "Improve type safety and null checks in parseResponse helper"
```

**After:**
```typescript
// Shared helper function
function parseResponse<T>(response: Response): T {
  // Type-safe parsing with null checks
}
```

### Refactoring Triggers

**When do they refactor?**

1. **During bug fixes** (opportunistic)
   - Found 3 similar bugs → Extract common logic
   - Evidence: Billy-mcp response parsing refactor

2. **During migrations** (planned)
   - Friday AI V1 → V2 migration
   - Manus → Cursor IDE migration

3. **During cleanup** (systematic)
   - Archive old projects
   - Remove monorepo dependencies

4. **Never purely for style** (pragmatic)
   - No "make it pretty" commits
   - Refactoring always tied to functional improvement

---

## Technical Debt Management

### Debt Tracking

**Active tracking mechanisms:**

1. **TODO Comments: 252 instances**
   ```typescript
   // TODO: Add retry logic for failed payments (JIRA-123)
   // TODO: Update job status, send notifications, etc.
   // TODO: Implement customer segmentation by LTV
   ```

2. **Documentation files:**
   - `TYPESCRIPT_FIX_STATUS.md` - 46 errors tracked
   - `REMAINING_TYPESCRIPT_ERRORS.json` - Priority 1 errors
   - `KNOWN_ISSUES.md` - Project-wide issues

3. **@ts-ignore annotations:**
   - 8 instances documented
   - Each has comment explaining why

### Debt Payment Strategy

**Pattern: Batch cleanup during slow periods**

**Evidence:**
```
Commit: "Fix all TypeScript compilation errors"
Commit: "Fix ESLint configuration and critical linting errors in google-mcp"
```

**Not continuous refactoring, but periodic cleanup**

### Archive Strategy

**Major cleanup (October 2025):**

```
archive/
├── tekup-org-archived-2025-10-22/
├── tekup-google-ai-archived-2025-10-23/
├── tekup-gmail-automation-archived-2025-10-22/
└── ... (117 packages total)
```

**Pattern:**
- Move entire old projects to archive/
- Keep in repo for historical reference
- Don't delete, don't maintain
- Date-stamped for clarity

---

## Velocity & Productivity Patterns

### High-Velocity Indicators

**When development is rapid:**

1. **Bot commits in quick succession**
   - 5-10 commits in under an hour
   - Systematic problem-solving

2. **Direct master commits**
   - Small fixes go straight to master
   - Documentation updates direct

3. **Submodule updates**
   - Daily updates during active development
   - Sign of integration work

### Slow-Down Indicators

**When development slows:**

1. **PR-based workflow**
   - Feature branches live for days
   - Multiple review rounds

2. **Investigation commits**
   - "Initial assessment" commits
   - "Comprehensive analysis" documents

3. **Multiple retry commits**
   - Railway deployment attempts
   - Configuration tweaking

### Productivity Tools Used

**Extracted from codebase:**

1. **GitHub Copilot** (heavy usage)
   - copilot-swe-agent[bot]: 36 commits (38% of total)
   - Systematic, thorough approach

2. **Claude Code** (this tool!)
   - Custom commands: 17 slash commands
   - MCP integration
   - Knowledge base tracking

3. **Cursor IDE** (recent migration)
   - Friday AI integration
   - Evidence: "docs: Complete Friday AI migration - Ready for Cursor development"

4. **Multiple AI assistants** (pragmatic)
   - Not dogmatic about single tool
   - Use best tool for each task

---

## Communication Patterns

### Commit Message Communication

**Team communicates through commit messages:**

**Celebration:**
```
🎊 MISSION ACCOMPLISHED: Billy-mcp By Tekup v2.0.0 Production Ready!
```

**Urgency:**
```
railway: FORCE DEPLOYMENT - Billy-mcp By Tekup v2.0.0
trigger: Force Railway deployment of Billy-mcp By Tekup v2.0.0
```

**Explanation:**
```
"Gør Billy-mcp klar til Railway: TypeScript fixes, monorepo ud, bedre deploy config"
(Danish: "Make Billy-mcp ready for Railway: TypeScript fixes, monorepo out, better deploy config")
```

**Context:**
```
fix: Add client-side filtering fallback for customer search - fixes ChatGPT search issue where Billy API returns all customers instead of filtering
```

### Danish vs English

**Pattern:**

- **English:** Public-facing, documentation, bot commits
- **Danish:** Internal commits, quick fixes, team communication

**Examples:**
```
Danish: "Gør Billy-mcp klar til Railway..."
Danish: "Tilføj resterende TypeScript fixes"
English: "Add comprehensive repository investigation report"
English: "Fix all TypeScript compilation errors"
```

---

## Key Insights for Claude

### What This Team Values

1. **Shipping over perfection**
   - Use @ts-ignore if needed to ship
   - Fix properly later
   - Document workarounds

2. **Documentation as first-class**
   - 100+ markdown files
   - Document as you go
   - Investigation reports before implementation

3. **Bot-assisted development**
   - Trust bot for systematic work
   - Human oversight for critical decisions
   - Iterative approach

4. **Pragmatic architecture**
   - Hybrid monorepo
   - Managed services over self-hosted
   - Accept complexity where it adds value

5. **Rapid iteration**
   - Multiple commits per day during active dev
   - Direct master commits for small changes
   - PR workflow for major features

### How to Work With This Codebase

**DO:**
- Use conventional commits religiously
- Document investigation before implementation
- Apply bot-like systematic approach
- Ship with workarounds, document tech debt
- Celebrate completions with emoji commits (sparingly)

**DON'T:**
- Wait for perfection before shipping
- Refactor without functional improvement
- Skip documentation
- Ignore existing patterns
- Over-engineer solutions

---

## Conclusion

This team operates with:
- **High velocity** through bot assistance
- **Pragmatic decisions** over architectural purity
- **Documentation-first** approach
- **Ship-and-iterate** philosophy
- **Systematic problem-solving**

The workflow is characterized by rapid iteration, comprehensive documentation, and a pragmatic approach to technical debt. Bot assistance is heavily leveraged for systematic work, while humans make critical decisions and force through blockers.

---

*This document captures the living workflow of the Tekup team. It should evolve as the team's practices evolve.*

**Last Updated:** 2025-11-23
**Next Review:** After next major feature release
**Maintained by:** Claude Code analysis
