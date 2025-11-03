# CI/CD & Policy Gates – Plan

Context: migration-check and rollback workflows exist; policy gates considered.

## Goals

- Keep CI fast, reliable; fail early on risky DB changes.

## Acceptance criteria

- [ ] `migrate:check` runs on PRs when secrets available.
- [ ] Policy gate (optional) checks basic app health.

## Steps (suggested)

- [ ] Maintain canary migration workflow.
- [ ] Add optional smoke test job gated by env.
