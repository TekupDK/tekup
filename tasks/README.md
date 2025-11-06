![alt text](image.png)# Tasks Workspace

This folder groups scoped workstreams into small, trackable plans that don’t interfere with ongoing feature work (e.g., Codex Chat).

- Purpose: keep focus, reduce Problems noise, and make ownership/next steps explicit.
- Scope: docs only; no code changes are required to write/update plans.

## Areas

- **🔴 Ops - Code Quality:** `tasks/ops/code-quality/PLAN.md` **CRITICAL** - 32 TypeScript errors blocking type safety
- Chat: `tasks/chat/PLAN.md` ✅ **Phase 3 Complete** - All UI polish features implemented (icons, loading, collapse, keyboard shortcuts). Ready for Phase 4 rollout.
- Docs lint (markdown): `tasks/docs-lint/PLAN.md`
- Database & migrations: `tasks/db/PLAN.md`
- Testing (Vitest/Playwright): `tasks/testing/PLAN.md`
- Environment & config: `tasks/env/PLAN.md`
- Logging & observability: `tasks/logging/PLAN.md`
- CI/CD & policy gates: `tasks/ci-cd/PLAN.md`
- Security (auth/cookies/ratelimits): `tasks/security/PLAN.md`
- Email pipeline & migrations: `tasks/email-pipeline/PLAN.md`
- Ops (backup/rollback/runbooks): `tasks/ops/PLAN.md`

## Conventions

- Keep plans short (1–2 pages max).
- Use checkboxes for acceptance criteria and status.
- Link to existing docs/code rather than duplicating.
- Prefer "safe-by-default" rollouts (feature flags, canaries).
- Each task folder should contain:
  - PLAN.md — the plan and rationale
  - STATUS.md — current status and actionable checklist
  - CHANGELOG.md — log of changes/decisions for the task
  - **IMPACT.md** — detailed file-by-file impact analysis (NY!)

## 📚 Additional Guides

- **[IMPACT_SUMMARY.md](./IMPACT_SUMMARY.md)** — Quick reference for alle tasks' påvirkninger
- **[PRE_IMPLEMENTATION_CHECKLIST.md](./PRE_IMPLEMENTATION_CHECKLIST.md)** — Checklist før du starter en task
- **[EXPOSE_LOCALHOST.md](./EXPOSE_LOCALHOST.md)** — Guide til at eksponere localhost via public URL (ngrok/localtunnel)
- **[AI_REVIEW_SESSION.md](./AI_REVIEW_SESSION.md)** — Checklist til AI-review sessions med ChatGPT/Claude
- Use these guides to understand scope, dependencies, og affected files!

## Status legend

- [ ] Not started
- [~] In progress![alt text](image-1.png)
- [x] Done

## Task index

- Chat — Approval flow and AI-powered suggestions (🔄 In Progress)
  - Plan: chat/PLAN.md
  - Status: chat/STATUS.md
  - Changelog: chat/CHANGELOG.md

- Invoices UI — Dialogs, modals, and UX polish (⏳ Ready to Start)
  - Plan: invoices-ui/PLAN.md
  - Status: invoices-ui/STATUS.md
  - Changelog: invoices-ui/CHANGELOG.md

- **AI Metrics — Token tracking and cost monitoring (⏳ Ready to Start)**
  - Plan: ai-metrics/PLAN.md
  - Status: ai-metrics/STATUS.md
  - Changelog: ai-metrics/CHANGELOG.md
  - **Impact: ai-metrics/IMPACT.md** ← Detaljeret fil-påvirknings analyse

- **Admin Dashboard — AI metrics visualization (🔒 Blocked on ai-metrics)**
  - Plan: admin-dashboard/PLAN.md
  - Status: admin-dashboard/STATUS.md
  - Changelog: admin-dashboard/CHANGELOG.md
  - **Impact: admin-dashboard/IMPACT.md** ← Detaljeret fil-påvirknings analyse

- **Security — Auto-approve migration & Google audit (⏳ Ready to Start)**
  - Plan: security/PLAN.md (updated with new tasks)
  - Status: security/STATUS.md
  - Changelog: security/CHANGELOG.md
  - **Impact: security/IMPACT.md** ← Detaljeret fil-påvirknings analyse

- **Testing — Action approval test coverage (⏳ Ready to Start)**
  - Plan: testing/PLAN.md (updated with new tasks)
  - Status: testing/STATUS.md
  - Changelog: testing/CHANGELOG.md
  - **Impact: testing/IMPACT.md** ← Detaljeret fil-påvirknings analyse

- **Email Pipeline — Inbox caching optimization (⏳ Ready to Start)**
  - Plan: email-pipeline/PLAN.md (updated with new tasks)
  - Status: email-pipeline/STATUS.md
  - Changelog: email-pipeline/CHANGELOG.md
  - **Impact: email-pipeline/IMPACT.md** ← Detaljeret fil-påvirknings analyse

- Ops - Docker live edit (HMR) and container optimization
  - Plan: ops/docker-live-edit/PLAN.md
  - Status: ops/docker-live-edit/STATUS.md
  - Changelog: ops/docker-live-edit/CHANGELOG.md

- **Ops - Code Quality & Type Safety (🔴 CRITICAL - 32 TypeScript errors)**
  - Plan: ops/code-quality/PLAN.md
  - Status: ops/code-quality/STATUS.md
  - Changelog: ops/code-quality/CHANGELOG.md

- **Ops - TypeScript Performance Optimization (⏳ Ready to Start)**
  - Plan: ops/typescript-performance/PLAN.md
  - Status: ops/typescript-performance/STATUS.md
  - Changelog: ops/typescript-performance/CHANGELOG.md

- **Ops - Public Tunnel (✅ Complete)**
  - Plan: ops/public-tunnel/PLAN.md
  - Status: ops/public-tunnel/STATUS.md
  - Changelog: ops/public-tunnel/CHANGELOG.md
  - Impact: ops/public-tunnel/IMPACT.md
  - HMR Analysis: ops/public-tunnel/HMR_ANALYSIS.md
  - Auto Startup: ops/public-tunnel/AUTO_STARTUP.md
  - Workflow Comparison: ops/public-tunnel/WORKFLOW_COMPARISON.md

- Database - MySQL legacy cleanup (Supabase only)
  - Plan: db/mysql-removal/PLAN.md
  - Status: db/mysql-removal/STATUS.md
  - Changelog: db/mysql-removal/CHANGELOG.md

- Database – Task ordering column (✅ Done)
  - Plan: db/PLAN.md
  - Status: db/STATUS.md
