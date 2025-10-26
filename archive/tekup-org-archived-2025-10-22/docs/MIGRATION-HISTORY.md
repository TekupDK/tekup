# MIGRATION-HISTORY

- 2025-08-26: Init monorepo skeleton (`tekup-org`). Created `apps/`, `packages/`, `libs/`, `docs/`, `scripts/`, `.github/`. Scaffoled Secure Platform (NestJS) with `/health`. Added root configs and `.env.example` templates.
-
- 2025-08-26: Dockerfiles, branding, and path cleanups
  - Updated `apps/flow-api/Dockerfile` and `apps/flow-web/Dockerfile` to use `@tekup/*` scopes, correct `apps/flow-*` paths, and copy `pnpm-workspace.yaml` for workspace context.
  - Updated `apps/flow-api/Dockerfile.production` branding from "Project X" to "TekUp Flow" and switched container user from `projectx` to `tekup` (including chown and ENTRYPOINT context).
  - Aligned `docker-compose.yml` service commands and ports (API 4000, Web 3000, Secure Platform 4010). Note: `inbox-ai` lacks a Dockerfile; compose entry may fail until added.
  - Branding replacements in `apps/flow-web` UI and configs (metadata titles, layout, Tailwind header comment) from "Project X" to "TekUp Flow".
  - Script references fixed: `apps/flow-api/scripts/rotate-tekup-key.ts` usage now `pnpm --filter @tekup/flow-api ...`. `apps/flow-api/test-jest-config.js` cwd updated to `apps/flow-api`.
  - Flow Web Dockerfile copies `next.config.js` explicitly to match project files.
  
  - Metrics and build artifact renames
    - Prometheus metric renamed from `projectx_build_info` to `tekup_build_info` and docs updated (`apps/flow-api/METRICS.md`).
    - Windows binary output renamed in Flow API: `dist/projectx-api.exe` -> `dist/tekup-api.exe`.
  
  Remaining follow-ups
  - Add Dockerfile for `apps/inbox-ai` or remove service from `docker-compose.yml` until ready.
  - Replace lingering "Project X" references in `apps/inbox-ai/**` (notably in `src/main/services/ProjectXService.ts` and typed config files) with TekUp nomenclature.
  - Audit environment variables and defaults (e.g., database names in `apps/flow-api/.env.example`) for TekUp-aligned naming.

- 2025-08-26: Introduced canonical Flow Ingestion service in `apps/inbox-ai`.
  - Added `FlowIngestionService` parallel to legacy `ProjectXService` (no breaking removal yet).
  - Updated `AppServiceManager` to initialize and track `flowIngestionService` with status key.
  - Added new IPC handlers under `flow:*` namespace (`forwardLead`, `forwardComplianceFinding`, `configureTenantMapping`, `testConnection`, `convertComplianceFindings`) while retaining legacy `projectx:*` handlers for backward compatibility.
  - Migration Strategy: Dual-run period until consumers/UI migrate to `flow:*` channels. After test coverage and UI update, deprecate & remove `ProjectXService` + handlers.
  - Next Steps: Refactor renderer/preload to call `flow:*` handlers; remove nested duplicated `apps/inbox-ai/tekup-org` directory; add unit tests for FlowIngestion retry & mapping logic; update package naming and Docker support.
