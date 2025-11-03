# Email Pipeline – Plan

Context: Gmail → DB migration; userId scoping; thread linking.

## Goals

- Deterministic migrations with verifiable pre/post state.

## Acceptance criteria

- [ ] Timestamps normalized to ISO; indexes present.
- [ ] Thread and message linkage consistent by userId.

## Steps (suggested)

- [ ] Keep schema and SQL migration aligned; push first, then migrate.
- [ ] Use `migrate:check` snapshots for verification.
