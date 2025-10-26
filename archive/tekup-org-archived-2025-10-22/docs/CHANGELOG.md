# Changelog

All notable changes to this repository will be documented in this file.

## [2025-08-30] Docs tooling and CI integration

### Added
- TypeDoc configuration (`/typedoc.json`) and initial Docusaurus site (`/docs/docusaurus.config.ts`, `/docs/content/*`).
- GitHub Actions for docs build and deploy (`.github/workflows/docs.yml`) and PR guard (`.github/workflows/pr-guard.yml`).
- OpenAPI export paths for `flow-api`, `tekup-lead-platform`, and `tekup-crm-api` (controlled by `EXPORT_OPENAPI=1`).
- Root scripts: `docs:typedoc`, `docs:openapi`, `docs:site`, `docs:dev`, `docs:all`.

### Changed
- Updated root `README.md` with docs quickstart, scripts table, og PR-krav.

### Security
- Ensured no secrets are printed; docs reference env var names only.

### Task Summary
- Established repeatable docs generation and CI publishing pipeline across monorepo.

## [2025-08-27] Expanded system documentation

### Added
- Detailed module overview for all applications and packages in `docs/README.md`.
- Comprehensive API listing for every controller in `docs/API_REFERENCE.md`.

### Changed
- Linked new API reference from ecosystem documentation.

### Removed
- None.

### Task Summary
- Documented modules, calls, and APIs across the Tekup ecosystem.

## [2025-08-27] Documentation baseline

### Added
- Introduced repository overview and changelog templates in `docs/`.

### Changed
- None.

### Removed
- None.

### Task Summary
- Established foundational documentation explaining applications, Tekup Org, and the broader ecosystem.
