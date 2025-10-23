# Workspace Changelog

All notable workspace-level changes will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Extract shared code to `/packages`
- Setup workspace-level CI/CD
- Add integration tests in `/tests`
- Implement pnpm workspaces (if full monorepo)

---

## [1.0.0] - 2025-10-23

### Added - Workspace Restructure
- **Industry standard structure** based on research (Luca Pette, Aviator, GitHub conventions)
- Created `/apps` folder organized by runtime (production, web, desktop)
- Created `/services` folder for backend services & APIs
- Created `/packages` folder for shared libraries
- Created `/tools`, `/scripts`, `/configs` folders for utilities
- Created `/docs` hub with architecture, guides, api subfolders
- Created `/tests` folder for workspace-level tests
- Added workspace root files:
  - `README.md` - Main workspace documentation
  - `CODEOWNERS` - Code ownership assignments
  - `CONTRIBUTING.md` - Development guidelines
  - `CHANGELOG.md` - This file
  - `WORKSPACE_STRUCTURE_IMPROVED.md` - Detailed structure explanation

### Changed
- Reorganized projects from flat structure to runtime-based categories
- Moved `production/` → `apps/production/`
- Moved `development/` → Split into `apps/web/` and `services/`
- Improved documentation organization in `/docs`

---

## [0.2.0] - 2025-10-22 (Evening)

### Added - Phase 1 Setup
- Created initial `Tekup/` folder structure
- Created subfolders: production, development, services, archive, docs
- Moved 5 workspace documents to `/docs`
- Archived legacy projects to `/archive`:
  - tekup-gmail-automation
  - Tekup-org (3,228 items)
  - Tekup Google AI (1,531 items)

### Removed
- Deleted 13+ empty folders from workspace root
- Cleaned up backup folders

---

## [0.1.0] - 2025-10-22 (Morning)

### Added - Database Consolidation
- **tekup-database** (v1.4.0) established as central database
- Migrated 3 projects to use central database:
  - TekupVault → `vault` schema
  - Tekup-Billy → `billy` schema
  - tekup-ai → `renos` schema
- All `.env` files updated with new database connections
- Migration documentation consolidated

### Changed
- **tekup-gmail-services** (v1.0.0) - Consolidated 4 repos into 1 monorepo
- **Tekup-Billy** (v1.4.3) - Repository restructured (87% cleaner)
- **TekupVault** - Expanded from 4 to 14 synced repos
- **RendetaljeOS** - Monorepo migration completed (backend + frontend)

### Documented
- Created comprehensive vision analysis
- Created folder structure plans
- Created "What's New" documentation
- Created complete restructure plan

---

## Initial State - Pre-2025-10-22

### Existing Projects (Scattered)
- 14 active projects in workspace root
- 2 legacy projects (Tekup-org, Tekup Google AI)
- 14+ empty folders
- No clear organizational structure
- Mixed production, development, and legacy code

---

## Legend

- **Added** - New features or files
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features or files
- **Fixed** - Bug fixes
- **Security** - Security fixes

---

## Project-Specific Changelogs

For detailed changelogs of individual projects, see:
- `apps/production/tekup-database/CHANGELOG.md`
- `apps/production/tekup-vault/CHANGELOG.md`
- `apps/production/tekup-billy/CHANGELOG.md`
- `apps/web/rendetalje-os/CHANGELOG.md`
- `services/tekup-ai/CHANGELOG.md`
- (etc.)

---

**Last Updated:** 23. Oktober 2025, 08:45 CET
