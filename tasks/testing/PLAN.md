# Testing – Plan

Context: Vitest + Playwright; CSS import stubbing for `streamdown`/`katex` fixed in `vitest.config.ts`.

## Goals

- Stable unit/integration tests (Vitest) and optional UI screenshots (Playwright).

## Acceptance criteria

- [ ] Vitest runs green locally and in CI.
- [ ] Playwright `test:screens` runs against dev with dev-login, produces PNGs.

## Steps (suggested)

- [ ] Maintain CSS stubs and deps inline in `vitest.config.ts`.
- [ ] Keep chat tests skipped until Chat feature is ready.
- [ ] Add a minimal health/spec for API smoke tests.
