# Logging & Observability – Plan

Context: Pino structured logging added to server; consider request logs.

## Goals

- Consistent structured logs with redaction for PII.

## Acceptance criteria

- [ ] Startup, auth, and key workflows log with `level`, `msg`, `context` fields.
- [ ] Request logs include correlationId.

## Steps (suggested)

- [ ] Centralize logger and child loggers per module.
- [ ] Add request middleware with correlationId and timing.
