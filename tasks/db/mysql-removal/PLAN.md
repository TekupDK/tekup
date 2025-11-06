# MySQL Legacy Cleanup – Plan

Context: Supabase PostgreSQL is vores eneste drift-database, men repo'et indeholder stadig MySQL/TiDB artefakter (docker-services, dokumentation, snapshots, lockfile-referencer). De forvirrer nye udviklere og kan trigge forkerte opsætninger.

## Mål

- Fjerne eller tydeligt markere alle rester af MySQL i kodebase, config og dokumentation.
- Sikre at guider og Compose-filer kun beskriver Supabase-setuppet.
- Opdatere værktøjer/snapshots så Drizzle m.m. ikke længere viser `dialect: "mysql"`.

## Nuværende fund

- `docker-compose.yml` + `DOCKER_*` guider beskriver MySQL-container som standard (selvom kommenteret “deprecated”).
- Dokumentation (`START_GUIDE.md`, `DATABASE_SETUP.md`, `LOGIN_DEBUG_GUIDE.md`, `docs/ARCHITECTURE.md`, m.fl.) refererer til MySQL connection strings og flows.
- Drizzle snapshots (`drizzle/meta/000*.json`) står stadig med `dialect: "mysql"`.
- Script `test-migration.ps1` og andre analyser omtaler “0 MySQL referencer” men guider tilbage til MySQL fallback.
- `.cursorrules` + `docs/CURSOR_RULES.md` bruger `mysqlTable` eksempler.
- `pnpm-lock.yaml` holder `mysql2` dependency pga. forældet snapshot.

## Acceptance criteria

- [ ] Docker-compose og relaterede guider beskriver kun Supabase; MySQL services er fjernet eller flyttet til “legacy appendix”.
- [ ] Alle officielle guides/arkitektur-dokumenter nævner Supabase som eneste db og viser korrekt connection string format.
- [ ] Drizzle snapshots regenerated ⇒ `dialect: "postgresql"`.
- [ ] Ingen aktive scripts kræver MySQL (fx `START_GUIDE` / `LOGIN_DEBUG_GUIDE`).
- [ ] `pnpm-lock.yaml` indeholder ikke længere `mysql2`.
- [ ] Legacy referencer (fx `.cursorrules`, `docs/CURSOR_RULES.md`) opdateret til `pgTable` eller markeret som historiske.

## Arbejdspakker

1. **Compose & Ops**
   - [ ] Fjern `db` (mysql) + `adminer` services eller flyt dem til separat legacy compose.
   - [ ] Opdater `DOCKER_SETUP.md`, `DOCKER_COMPLETE.md`, `START_GUIDE.md` med Supabase workflow.

2. **Dokumentation**
   - [ ] Revider arkitektur/analysedokumenter: `docs/ARCHITECTURE.md`, `TEKUP_*` rapporter, `DATABASE_SETUP.md`, `LOGIN_DEBUG_GUIDE.md`, `MIGRATION_GUIDE.md` m.fl.
   - [ ] Tilføj evt. nyt “Legacy MySQL” appendix med kort note og henvisning til Supabase guide.

3. **Drizzle & Scripts**
   - [ ] Regenerer `drizzle/meta/*` (kør `drizzle-kit` efter cleanup).
   - [ ] Opdater `test-migration.ps1` og andre scripts så de ikke refererer til MySQL fallback.
   - [ ] Sørg for `.cursorrules` og `docs/CURSOR_RULES.md` viser Postgres eksempler.

4. **Dependencies**
   - [ ] Kør `pnpm install --lockfile-only` efter fjernelse af mysql-artefakter, verificer at `mysql2` ikke længere fremgår i lockfile.

5. **Verifikation**
   - [ ] `rg -n "mysql"` returnerer kun i historik/appendix (ingen aktive instruktioner).
   - [ ] CI “migration-check” passerer med opdateret snapshots.
