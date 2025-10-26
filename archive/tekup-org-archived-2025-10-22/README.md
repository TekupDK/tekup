# TekUp.org Monorepo

This is the monorepo for TekUp.dk, a multi-tenant SaaS platform for SMB IT support, security, and digital advisory services.

## Current Status

For latest project status and next steps, see docs/PROJECT_STATUS.md.
For a prioritized gap analysis (Hvad mangler vi?), see docs/WHAT_IS_MISSING.md.

## Applications

- `flow-api`: Core backend API with lead management and ingestion pipelines
- `flow-web`: Main web application for tenant-specific workflows
- `inbox-ai`: Desktop application for AI-powered inbox management
- `secure-platform`: Security and compliance backend
- `tekup-crm-api`: CRM backend service (NEW)
- `tekup-crm-web`: CRM web application (NEW)
- `tekup-lead-platform`: Advanced lead qualification and nurturing
- `tekup-mobile`: Mobile application for field teams
- `website`: **Official public website**

## Packages

- `@tekup/api-client`: Shared API client library
- `@tekup/auth`: Authentication utilities
- `@tekup/config`: Configuration management
- `@tekup/shared`: Common utilities
- `@tekup/ui`: Shared UI components

## Golden Path (Quick Start)

### Prerequisites

1. Install Node.js 22.x (use `.nvmrc`):

   ```bash
   nvm use
   ```

2. Enable Corepack and install pnpm:

   ```bash
   corepack enable
   corepack prepare pnpm@9.9.0 --activate
   ```

3. For Windows users:
   - Enable Developer Mode
   - Exclude repository from Windows Defender
   - Avoid OneDrive paths
   - Close VS Code and node processes before `pnpm install`

### Bootstrap

```bash
pnpm bootstrap
# auto-generates .env/.env.local across apps
pnpm run env:auto
```

### Docs

Build og preview dokumentation lokalt:

```bash
pnpm -w build && pnpm docs:typedoc && pnpm docs:openapi && pnpm docs:dev
```

Scripts:

| Script | Beskrivelse |
|---|---|
| `docs:typedoc` | Generér TypeDoc til `docs/build/typedoc` |
| `docs:openapi` | Eksportér OpenAPI JSON til `docs/build/openapi` |
| `docs:site` | Byg Docusaurus til `docs/build` |
| `docs:dev` | Start lokal Docusaurus server |
| `docs:all` | Byg alt ovenstående i rækkefølge |


### Database Setup

For CRM development:

```bash
pnpm --filter tekup-crm-api exec prisma generate
pnpm --filter tekup-crm-api exec prisma migrate dev -n init
```

### Run Services

Run all services:

```bash
pnpm dev
```

Run CRM API only:

```bash
pnpm run crm:dev
```

Run CRM Web only:

```bash
pnpm run crm:web:dev
```

### Testing

Run CRM API tests:

```bash
pnpm run crm:test
```

## Windows Notes

1. Prefer Dev Container/WSL2 for development
2. If using native Windows:
   - Enable Developer Mode
   - Exclude repo from Defender
   - Avoid OneDrive paths
   - Close VS Code and node before `pnpm install`
3. Use pnpm configuration to avoid symlink issues:

   ```bash
   node-linker=hoisted
   package-import-method=copy
   ```

## Development Commands

- `pnpm dev` - Run all dev servers in parallel
- `pnpm build` - Build all packages and apps
- `pnpm test` - Run tests for all packages and apps
- `pnpm lint` - Lint all code
- `pnpm ci` - CI pipeline (install, lint, typecheck, test, build)
- `pnpm health:scan` - Kør hurtig tvær-service health scan (til verificering af /health endpoints)

### Health Scan

Det nye script `pnpm health:scan` kan bruges til hurtigt at se status på lokale services. Under motorhjelmen foretages simple GET requests mod registrerede endpoints (`/health` eller root) og valgfrit TCP socket checks.

#### TCP Scanning

TCP checks forsøger kun at etablere en socket (ingen protokol handshake). Brug `--include-tcp` for at medtage TCP services (databaser, caches) eller `--tcp-only` for kun at scanne disse. Skippede services tælles i JSON feltet `skipped` og påvirker ikke strict mode.

Eksempler:

```bash
pnpm health:scan                              # Farvet output
pnpm health:scan -- --json                    # JSON output
pnpm health:scan -- --services flow-api,tekup-crm-api
pnpm health:scan -- --timeout 3000 --concurrency 4
pnpm health:scan -- --repeat 15               # Live overvågning hvert 15s
pnpm health:scan -- --strict                  # Exit code 2 hvis nogen fejler (CI)
pnpm health:scan -- --registry config/ports/registry.yaml --services flow-api,voice-agent
pnpm health:scan -- --env staging --strict --json
pnpm health:scan -- --include-tcp             # Medtag TCP (fx Postgres, Redis)
pnpm health:scan -- --tcp-only                # Kun TCP services
```

| Flag | Description |
|------|-------------|
| `--json` | Output JSON summary only |
| `--detailed` | Include per-request timing & headers (HTTP) + show skipped TCP entries |
| `--raw` | Disable colors |
| `--services a,b` | Limit to specific services |
| `--url <url>` | Ad-hoc single URL scan (HTTP only) |
| `--timeout <ms>` | Request / socket timeout (default 5000) |
| `--concurrency <n>` | Parallel limit (default 6) |
| `--repeat <s>` | Repeat every N seconds (0 = once) |
| `--strict` | Exit non-zero if any unhealthy (exits 2) |
| `--registry <file>` | Alternate registry file path |
| `--no-registry` | Disable registry auto-discovery |
| `--env <name>` | Environment key in registry (default development) |
| `--include-tcp` | Include TCP services (e.g. Postgres, Redis) in addition to HTTP |
| `--tcp-only` | Only scan TCP services (ignore HTTP) |

Exit codes:

| Code | Meaning |
|------|---------|
| 0 | All scanned services healthy OR only skipped services |
| 2 | Strict mode enabled and at least one non-skipped service unhealthy |


## Package Management

This monorepo uses pnpm workspaces. To add dependencies:

- For a specific app: `pnpm --filter <app-name> add <package>`
- For a shared package: `pnpm --filter @tekup/<package-name> add <package>`
- For all packages: `pnpm add <package> -w`

## Environment Variables

Living automation:

- A root script `scripts/env-auto.mjs` ensures required env keys across all `apps/*`.
- API apps (NestJS): ensures `DATABASE_URL`, `JWT_SECRET` (generated if missing), `JWT_EXPIRES_IN`.
- Web apps (Next.js): ensures `NEXT_PUBLIC_API_URL` inferred from sibling `-api` port.
- Runs automatically on `postinstall` and can be invoked manually via `pnpm run env:auto`.

New feature flags:

- `NEXT_PUBLIC_VOICE_AGENT_JARVIS_MODE`: `real` | `mock` | `off` (default: `mock`).
  - Voice-Agent uses dynamic import when `real`; `off` uses mock but disables screen analysis.
- `JARVIS_ENABLED`: `true` | `false` (default: `false`).
  - Flow-API minimal Jarvis module returns stub responses only when enabled (module wiring is opt-in).

Documenter kun navne på nøgler (ikke værdier). Eksempler: `PX_API_PORT`, `CORS_ORIGIN`, `DATABASE_URL`.

## Docker

Docker Compose is available for local development:
 
```bash
docker-compose up
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

PR-krav:

- Opdater relevante dokumenter (README, docs/*, CHANGELOG)
- Åbn OpenAPI/TypeDoc ved API-ændringer

## License

Proprietary - TekUp.dk
