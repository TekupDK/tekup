# Docker + Live Edit (HMR) for Components — Plan

Dato: 4. november 2025  
Status: Klar til implementering (dev override) + optimeret prod build

## Mål

- Live edit (HMR) for `client/src/components/**` når appen kører i containere.
- Stabil HMR på Windows/WSL (fil-watching via polling).
- Hurtigere, mindre og mere sikker container via multi-stage build.
- Enkel dev/ops-opsætning og bedre håndtering af miljøvariabler i Compose.

## Beslutninger (opsummeret)

- Dev i containere: Brug `docker-compose.override.yml` med bind mounts og `pnpm dev` (Vite HMR + tsx watch).
- Vite i container: Aktivér `watch.usePolling` + HMR host/clientPort for Windows.
- Prod image: Multi-stage Dockerfile, prune til production deps, kør som non-root, og start med `node dist/index.js` (ingen dotenv i runtime; miljøet kommer fra Compose/env files).
- Build context: Tilføj `.dockerignore` for hurtigere builds og mindre context.
- Compose-struktur: Behold prod-compose som er; læg dev-override ved siden af. Brug `profiles` til legacy-services (MySQL/Adminer). Flyt følsomme defaults ud i env-filer/secrets.
- Valgfrit:
  - Full browser reload på `tasks/**` via `vite-plugin-restart` (uden server-restart).
  - TDD-loop med `vitest` i watch-mode.
  - Storybook til isoleret komponent-udvikling.

---

## Implementation outline (ingen ændringer køres endnu)

Nedenfor er den konkrete plan for filer/opsætning. Dette er dokumentation – selve patches/ændringerne udføres først, når vi beslutter at eksekvere.

### 1) Vite HMR robusthed i container (Windows/WSL)

- I `vite.config.ts`: Tilføj
  - `server.watch.usePolling = true`
  - `server.watch.interval = 100`
  - `server.hmr.host = "localhost"` (evt. `"host.docker.internal"` hvis nødvendigt)
  - `server.hmr.clientPort = 3000`

Effekt: HMR bliver stabil med bind mounts i Docker på Windows/WSL.

### 2) Dev override til Docker (bind mounts + HMR)

- Opret `docker-compose.override.yml` ved siden af eksisterende compose-filer.
- Kør `pnpm dev` i stedet for `pnpm start`.
- Mount repo'et ind i containeren og behold `/app/node_modules` som volumen.
- Sæt `CHOKIDAR_USEPOLLING` og `WATCHPACK_POLLING` for robust file-watching.

Effekt: Ændringer i `client/src/components/**` opdaterer browseren live via Vite HMR, også inde i containers.

### 3) Multi-stage Dockerfile (prod)

- Builder-stage: `pnpm fetch` + cache for PNPM store, `pnpm install`, `pnpm build`, `pnpm prune --prod`.
- Runner-stage: Kun `dist/`, `node_modules/` (prod), `package.json`. Kør som ikke-root (`USER node`). Start: `node dist/index.js`.

Effekt: Mindre, sikrere og hurtigere runtime-image.

### 4) .dockerignore

- Ekskludér `node_modules`, `dist`, `client/.vite`, `coverage`, `playwright-report`, `.env*`, `google-service-account.json`, m.m.

Effekt: Mindre build context og hurtigere builds.

### 5) Compose-struktur og sikkerhed

- Brug `env_file` (fx `.env.prod`, `.env.supabase`) i stedet for at definere følsomme defaults direkte i compose.
- Supabase connection strings må kun komme fra sikre env-filer/secrets (ingen fallback-defaults i compose).
- Tilføj `profiles: ["legacy-mysql"]` på MySQL/Adminer, så de ikke starter pr. default.
- Overvej Docker secrets til særskilt håndtering af nøgler (valgfrit – kræver filbaseret tilgang).

Effekt: Renere, sikrere og mere fleksibelt compose-setup.

### 6) Valgfrit – bedre udvikleroplevelse

- `vite-plugin-restart` for full reload på ikke-kode-filer (fx `tasks/**`).
- `vitest` i watch-mode (`pnpm test:watch`) og evt. `vitest --ui`.
- Storybook (`pnpm dlx storybook@latest init`) til isoleret komponentudvikling med HMR.

---

## Acceptance Criteria

- Ændringer i `client/src/components/**` giver live HMR i browseren i Docker dev-mode.
- Serverændringer genstartes automatisk via `tsx watch` i `pnpm dev`.
- Prod image bygger uden fejl og er væsentligt mindre end før (kun prod deps, non-root runtime).
- Compose bruger env-filer (ikke hårdkodede hemmelige defaults) og legacy services starter ikke uden profil.

## Validering (når vi implementerer)

- Lokal HMR uden Docker: `pnpm dev`.
- Dev i Docker (lokal DB): `docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build`.
- Dev i Docker (Supabase): `docker-compose -f docker-compose.supabase.yml -f docker-compose.override.yml up --build`.
- Prod-lignende build: `docker-compose up -d --build` og se logs.
- Kvalitetsporte: `pnpm check` og `pnpm test` bør være PASS.

## Risici og mitigering

- HMR fejler i container på Windows: brug polling + justér `hmr.host` til `host.docker.internal` ved behov.
- Bind mounts overskriver `node_modules`: hold `/app/node_modules` som volumen for stabil drift i container.
- Hemmeligheder i repo: flyt til env-filer/secrets.

## Rollback

- Fjern dev override og kør almindelig `docker-compose up --build`.
- Gendan gammel Dockerfile hvis nødvendigt (prod-flow forbliver intakt).

## Estimat

- Dev override + Vite justering: 30–45 min
- Multi-stage Dockerfile + .dockerignore: 30–45 min
- Compose profiles + env oprydning: 20–30 min
- Verificering (Windows): 20–30 min

Total: ~2–2.5 timer inkl. test.
