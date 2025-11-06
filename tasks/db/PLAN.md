# Database & Migrations – Plan

Context: see `MIGRATION_GUIDE.md`, `scripts/migration-check.mjs`, and `run-pipeline-migration.mjs`.

## Goals

- Verified, reproducible schema changes with pre/post checks.
- Safe rollback path and backups.

## Acceptance criteria

- [ ] Pre/post snapshots (row counts, indexes) stored in repo or artifacts.
- [ ] `migrate:check` (dry-run) green in CI canary.
- [ ] `migrate:apply` logs success with idempotent behavior.
- [ ] Supabase `friday_ai` schema matcher Drizzle (pipeline transitions kolonnenavn + customer_invoices kolonner på plads).
- [x] Tasks ordering kolonne tilføjet (`tasks.orderIndex`) og anvendes i API.

## Steps (suggested)

- [ ] Keep drizzle schema in sync and push before SQL migrations.
- [ ] Run `scripts/migration-check.mjs` with `--dry-run` on PR.
- [ ] Manual `--apply` with backup and rollback workflow ready.
- [ ] Kør migrations for: `transitionedBy → triggeredBy` og nye `customer_invoices` felter (`invoiceNo`, `paidAmount`, `entryDate`, `paidDate`) mod Supabase.
- [x] Tilføj `tasks.orderIndex` (int default 0) og reordre endpoints til at bruge kolonnen.
- [ ] Verificér med `check-*.mjs` scripts at Supabase matcher schema (ingen manglende kolonner/indekser) efter deploy.
