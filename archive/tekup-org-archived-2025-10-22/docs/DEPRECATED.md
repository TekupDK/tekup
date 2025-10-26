# Deprecated Apps / Modules

This file tracks legacy apps pending removal or consolidation.

| Path | Status | Successor | Action Plan |
|------|--------|-----------|-------------|
| ~~apps/nexus-dashboard~~ | **REMOVED** | apps/website | Removed on 2025-08-31; `apps/website` is canonical |
| ~~apps/site~~ | **REMOVED** | apps/website (marketing section) | Removed on 2025-08-31; content consolidated into website |
| ~~apps/landing-web~~ | **REMOVED** | apps/website | Consolidated branding + landing pages |

## Removal Checklist
- [x] Confirm no production traffic (logs / analytics) for target app.
- [x] Migrate unique environment variables / configs.
- [x] Migrate or archive assets (images, styles).
- [x] Update `pnpm-workspace.yaml` to drop package.
- [x] Remove build/deploy references (CI, docker-compose, docs).
- [x] Final commit: `chore: remove deprecated <app>`.

Maintain this list to keep the monorepo lean and avoid confusion for new contributors.
