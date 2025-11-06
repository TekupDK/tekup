# 🔄 ENVIRONMENT MIGRATION GUIDE# PostgreSQL Migration Guide - Friday AI v2

**Fra:** Single `.env` file strategi ## ✅ Migration Status: COMPLETED

**Til:** Separate `.env.dev` og `.env.prod` files

**Dato:** November 3, 2025 Alle kode-ændringer er implementeret på branch `migration/postgresql-supabase`.

**Status:** ✅ COMPLETED

## 📋 Hvad er ændret?

---

### 1. **Dependencies**

## 📋 Hvad er Ændret?

# PostgreSQL Migration Guide - Friday AI v2

Status: ✅ COMPLETED (November 3, 2025)

This guide documents the move to PostgreSQL (Supabase), the new environment file strategy, and how to run, verify, rollback, and automate migrations.

## What changed

- Environment files standardized: keep `.env.dev` and `.env.prod` locally; templates `.env.dev.template` and `.env.prod.template` are in Git.
- Docker now uses only `.env.prod` (no more double-loading `.env`).
- Drizzle switched to PostgreSQL; config updated for Supabase SSL.
- Pipeline tables (`email_pipeline_state`, `email_pipeline_transitions`) introduced and later migrated to include `userId` with indexes.
- Added automation: migration checks, backup helper, and CI dry-run support.

## Migrate locally

1. Copy templates and fill secrets

```powershell
Copy-Item .env.dev.template .env.dev
Copy-Item .env.prod.template .env.prod
```

2. Push schema (dev or prod)

```powershell
pnpm db:push:dev   # uses .env.dev
# or
pnpm db:push:prod  # uses .env.prod
```

3. Apply pipeline migration with verification

```powershell
pnpm migrate:apply
```

This creates `migration-check/before.json` and `migration-check/after.json` with table existence, row counts, columns, and indexes for `email_threads`, `email_pipeline_state`, and `email_pipeline_transitions`.

## Rollback / Restore

Always take a backup before structural changes.

1. Backup (requires pg_dump)

```powershell
$env:DATABASE_URL = (Get-Content .env.prod | Select-String '^DATABASE_URL=' | ForEach-Object { $_.ToString().Split('=')[1] })
powershell -File scripts/backup-db.ps1 -ConnectionString $env:DATABASE_URL -OutFile backups/db_$(Get-Date -Format yyyyMMdd_HHmmss).sql
```

2. Pre/Post checks (no changes applied)

```powershell
pnpm migrate:check
```

3. Restore (if needed)

```bash
export PGPASSWORD=...; psql "postgresql://user@host:5432/db?sslmode=require" -f backups/db_YYYYMMDD_HHMMSS.sql
```

## CI migration checks (Preview DB)

If you set repository secret `PREVIEW_DATABASE_URL`, every PR runs a safe dry-run via `.github/workflows/migration-check.yml`. No secrets in Git; workflow safely skips if the secret is not defined.

Note: Slack notifications are not enabled in this repository.

## Notes

- Supabase SSL: we set `sslmode=no-verify` for tooling to avoid self-signed certificate errors.
- Cookie security: session cookies use `httpOnly: true` and `secure` in production.
- For production rollbacks, use the manual `Manual DB Rollback` workflow (`.github/workflows/db-rollback.yml`) with approved secrets and a pre-signed backup URL.
  pnpm install

`powershell`

# 1. Opret .env.dev fra template

Copy-Item .env.dev.template .env.dev### Step 2: Test Schema Generation

# 2. Udfyld dine credentials```bash

code .env.dev# Brug Supabase connection

cp .env.supabase .env

# 3. Test det virkerpnpm db:push

pnpm dev```

# 4. Besøg http://localhost:3000### Step 3: Run PostgreSQL Triggers

`````

Efter schema er pushed, kør trigger SQL:

**Det er det! 🎉**

````sql

----- Kør via Supabase SQL Editor eller psql

\i drizzle/migrations/postgresql_triggers.sql

## 🔒 Security Checklist```



- [x] `.env.dev` og `.env.prod` er i `.gitignore`### Step 4: Test Application

- [x] Templates er committed til git (safe)

- [x] JWT_SECRET genereret (64 chars)```bash

- [x] INBOUND_EMAIL_WEBHOOK_SECRET genereret (48 chars)# Test med Supabase

- [x] DATABASE_URL password URL-encodedpnpm dev

`````

---

## 🔄 Tilbage til MySQL (Fallback)

## 🐛 Troubleshooting

Hvis du skal tilbage til MySQL:

### "DATABASE_URL not defined"

`powershell`bash

Copy-Item .env.dev.template .env.dev# Opdater .env til MySQL connection string

code .env.dev # Udfyld DATABASE_URLDATABASE_URL=mysql://friday_user:friday_password@localhost:3306/friday_ai

````

# Eller brug docker-compose (original)

### Docker bruger forkerte værdierdocker-compose up

```powershell```

docker-compose down

docker-compose up --build## 📝 Noter

````

- **Enum Types:** Oprettes automatisk af Drizzle via migrations

---- **Triggers:** Skal køres manuelt efter schema migration

- **Data Migration:** Hvis produktionsdata findes, skal de migreres separat

## 📊 File Usage Table

## ✅ Success Criteria

| Command | Environment File |

|---------|------------------|- [ ] Schema pushes til Supabase uden fejl

| `pnpm dev` | `.env.dev` |- [ ] Alle enum types oprettet korrekt

| `pnpm start` | `.env.prod` |- [ ] Triggers aktiveret og virker

| `docker-compose up` | `.env.prod` |- [ ] App starter og forbinder til Supabase

| `pnpm db:push:dev` | `.env.dev` |- [ ] Alle CRUD operations virker

| `pnpm db:push:prod` | `.env.prod` |- [ ] Upsert queries virker (onConflictDoUpdate)

---

**Questions?** See [QUICK_ENV_REFERENCE.md](QUICK_ENV_REFERENCE.md) or [ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md).

## ♻️ Rollback / Restore

When running structural migrations in production, always take a backup and have a restore path:

1. Backup (requires pg_dump on your machine)

```powershell
# Writes timestamped SQL dump to backups/
$env:DATABASE_URL = (Get-Content .env.prod | Select-String '^DATABASE_URL=' | ForEach-Object { $_.ToString().Split('=')[1] })
powershell -File scripts/backup-db.ps1 -ConnectionString $env:DATABASE_URL -OutFile backups/db_$(Get-Date -Format yyyyMMdd_HHmmss).sql
```

2. Pre/Post checks (row counts, columns, indexes)

```powershell
# Dry-run (no changes)
pnpm migrate:check

# Apply migration with auto rollback on error and verify
pnpm migrate:apply
```

3. Restore (if needed)

```bash
# From a machine with psql/pg_restore available
export PGPASSWORD=...; psql "postgresql://user@host:5432/db?sslmode=require" -f backups/db_YYYYMMDD_HHMMSS.sql
```

## 🧪 CI migration checks (Preview DB)

If you set repository secret PREVIEW_DATABASE_URL, every PR runs a dry-run migration check via `.github/workflows/migration-check.yml`.
No secrets committed; workflow safely skips if the secret is not defined.
