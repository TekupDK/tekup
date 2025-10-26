---
id: getting-started
title: Kom godt i gang
---

Denne dokumentation dækker TekUp monorepoet med apps (NestJS, Next.js) og fælles pakker. Fortællende tekster er på dansk; kode og docstrings er på engelsk.

Forudsætninger:
- Node.js 20, pnpm 9
- Docker (valgfrit til lokale services)

Kommandoer:
```bash
pnpm install
pnpm -w build
pnpm docs:all
```

Lokalt preview af docs:
```bash
pnpm docs:dev
```

OpenAPI og TypeDoc genereres til `docs/build`.
