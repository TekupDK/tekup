# Friday Action – Metrics/KPI

## Produktmålinger

- CTR på forslag (chips/kort)
- One‑click completion rate (forslag → godkend → udført)
- Tid fra observation → udført handling (median)
- Fejlrate (execute/dry‑run/permission/validation)
- Antal handlinger pr. bruger/dag; mix pr. actionType

## Tekniske målinger

- Suggestion latency (observed → rendered)
- Idempotency hit rate
- Rate‑limit events
- Audit event coverage

## Implementering

- Brug `analyticsEvents` (drizzle/schema.ts) til logning
- BI‑view: simple SQL over events (dag/uge) for dashboard
