# Environment & Config – Plan

Context: `.env.dev/.env.prod` templates; docker-compose uses `.env.prod`.

## Goals

- Keep env clean, safe, and documented with templates.

## Acceptance criteria

- [ ] Templates up to date; no secrets in repo.
- [ ] `check-env.js` passes for both dev and prod.

## Steps (suggested)

- [ ] Periodic audit of template keys and usage.
- [ ] Keep README and QUICK_ENV_REFERENCE current.
