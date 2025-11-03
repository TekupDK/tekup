# Security – Plan

Context: httpOnly cookies enabled; secure in production; rate limits present.

## Goals

- Protect sessions and APIs; keep secrets safe.

## Acceptance criteria

- [ ] Cookies: `httpOnly`, `secure` in prod, proper SameSite.
- [ ] Rate limits on sensitive endpoints.

## Steps (suggested)

- [ ] Review oauth/session config periodically.
- [ ] Audit dependencies for CVEs occasionally.
