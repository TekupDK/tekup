# Database & Migrations – Plan

Context: see `MIGRATION_GUIDE.md`, `scripts/migration-check.mjs`, and `run-pipeline-migration.mjs`.

## Goals

- Verified, reproducible schema changes with pre/post checks.
- Safe rollback path and backups.

## Acceptance criteria

- [ ] Pre/post snapshots (row counts, indexes) stored in repo or artifacts.
- [ ] `migrate:check` (dry-run) green in CI canary.
- [ ] `migrate:apply` logs success with idempotent behavior.

## Steps (suggested)

- [ ] Keep drizzle schema in sync and push before SQL migrations.
- [ ] Run `scripts/migration-check.mjs` with `--dry-run` on PR.
- [ ] Manual `--apply` with backup and rollback workflow ready.
