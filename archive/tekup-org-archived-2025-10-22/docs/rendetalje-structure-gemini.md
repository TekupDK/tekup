# Rendetalje Tenant – Structural Reference (For Gemini Ingestion)

Purpose: Give a model (Gemini) a precise, compact map of how the `rendetalje` tenant fits into the TekUp monorepo architecture so it can answer questions, generate code, or craft prompts without hallucinating new concepts.

---
## 1. Monorepo Overview
Root uses PNPM workspaces. Key app packages:
| Path | Description |
|------|-------------|
| `apps/flow-api` | NestJS multi‑tenant API (leads, settings, metrics). |
| `apps/flow-web` | Next.js dashboard for lead management (tenant scoped). |
| `apps/site` | Public marketing / lead capture landing (submits form leads). |
| `apps/inbox-ai` | Electron desktop (email / compliance tooling). |
| `apps/secure-platform` | Future incidents/compliance API (scaffold). |
| `packages/config` | Central environment schema + masking. |
| `packages/shared` | (Types/utilities placeholder). |

All tenant‑scoped DB rows include `tenantId` (UUID). Tenant slug (human readable) examples: `rendetalje`, `foodtruck`, `tekup`.

---
## 2. Tenant Concept
`Tenant` table (Prisma) minimal fields (representative):
```json
{
  "id": "<uuid>",
  "slug": "rendetalje",
  "name": "Rendetalje"
}
```
API authentication: header `x-tenant-key: <apiKey>` maps to a row in `ApiKey` referencing `tenantId`. Middleware resolves and injects `req.tenantId` (used implicitly via services + RLS policies in Postgres).

---
## 3. Lead Domain (Core for Rendetalje)
`Lead` (simplified logical shape – actual Prisma may include more audit/compliance fields):
```json
{
  "id": "<uuid>",
  "tenantId": "<uuid>",
  "source": "form | imap | website | manual",
  "status": "NEW | CONTACTED",
  "payload": {"name": "Jane", "email": "jane@example.com"},
  "createdAt": "2025-08-27T12:34:56Z",
  "updatedAt": "2025-08-27T12:34:56Z"
}
```

Allowed status transition (MVP): `NEW -> CONTACTED`. Invalid transitions return `422 {"error":"invalid_status_transition"}`.

### Lead Events
`LeadEvent` captures transitions / actions:
```json
{
  "id": "<uuid>",
  "leadId": "<uuid>",
  "fromStatus": "NEW",
  "toStatus": "CONTACTED",
  "actor": "system|user|automation",
  "createdAt": "..."
}
```

---
## 4. Settings (Branding / SLA)
Rendetalje may have entries in `TenantSetting` table. Example shape retrieved via `/settings`:
```json
{
  "settings": {
    "brand_display_name": "Rendetalje Retail",
    "theme_primary_color": "#2563eb",
    "sla_response_minutes": 60,
    "duplicate_window_minutes": 30,
    "enable_advanced_parser": true
  }
}
```

Used by `flow-web` page `app/t/[tenant]/layout.tsx` to theme UI.

---
## 5. Ingestion Paths
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/ingest/form` | POST | Create a lead (website / marketing form). | `x-tenant-key` |
| `/leads` | GET | List tenant leads (latest first). | `x-tenant-key` |
| `/leads/:id/status` | PATCH | Transition lead status. | `x-tenant-key` |
| `/leads/:id/events` | GET | Lead audit trail. | `x-tenant-key` |

Example form submission (Rendetalje website):
```http
POST /ingest/form
Content-Type: application/json
x-tenant-key: <RENTALJE_API_KEY>

{"source":"website","payload":{"name":"Kunde","email":"kunde@rendetalje.dk","message":"Vil høre mere"}}
```
Response 200 sample:
```json
{"id":"<uuid>","status":"new","source":"website","tenantId":"<uuid>","payload":{"name":"Kunde","email":"kunde@rendetalje.dk","message":"Vil høre mere"},"createdAt":"2025-08-28T09:10:00Z"}
```

---
## 6. Metrics (Relevant to Rendetalje)
Custom in‑memory exporter (not prom-client). Key counters (by label `tenant="rendetalje"`):
| Name | Meaning |
|------|---------|
| `lead_created_total` | Count of leads ingested (labels: tenant, source) |
| `lead_status_transition_total` | Status changes (labels: tenant, from, to) |
| (Future) SLA histograms | e.g. `sla_processing_duration_seconds` |

Consumption: `GET /metrics` (public, no API key) but includes per-tenant lines. RLS not required since metrics are aggregate only.

---
## 7. Environment & Config (Central Schema)
`packages/config` exports validated env. Fields relevant for Rendetalje ingestion flows:
| Variable | Use |
|----------|-----|
| `FLOW_API_URL` | Base URL for API calls from web/landing. |
| `WEBSITE_TENANT_KEY` | API key used by public landing form (maps to Rendetalje if that key generated for it). |
| `FLOW_WS_URL` | (Optional) WebSocket endpoint for real-time updates. |

Client build exposes a safe subset (e.g. `NEXT_PUBLIC_API_URL` in web apps; tenant key only if intentionally included for dev/marketing form).

---
## 8. Security / Isolation
1. API key required for all non-metrics endpoints.
2. Postgres Row Level Security enforces `tenantId` match (policies defined in migrations).
3. Services never allow cross-tenant status transitions or listing.
4. Metrics intentionally label by tenant but carry no PII (only slug via key mapping internally to id; exposed label is slug or anonymized id depending on implementation — keep minimal).

---
## 9. Frontend Usage (flow-web)
Path pattern: `/t/[tenant]/...` – runtime param must be one of allowed slugs (e.g. `rendetalje`). A dev API key fallback may inject header automatically.
Settings fetch logic (simplified):
```ts
fetch(`${API_URL}/settings`, { headers: { 'x-tenant-key': TENANT_API_KEY }})
```
Lead listing logic uses `GET /leads` same header.

---
## 10. Typical Lifecycle (Rendetalje Lead)
1. Visitor submits website form (`source=website`).
2. Flow API validates API key → assigns `tenantId` for Rendetalje.
3. Lead row inserted (`status=NEW`).
4. (Optional automation) Notifies dashboard via WebSocket (future).
5. User marks contacted → `PATCH /leads/:id/status {status:CONTACTED}`.
6. Event stored; `lead_status_transition_total` incremented.
7. Dashboard reflects updated status; SLA metrics can be derived from timestamps.

---
## 11. Error Model (Subset)
| Error Code | Scenario |
|------------|----------|
| `invalid_api_key` | Missing / wrong key |
| `invalid_status_transition` | Attempt NEW->NEW or CONTACTED->NEW |
| `validation_error` | Payload/body invalid |

HTTP JSON format: `{ "error": "<code>" }`.

---
## 12. Extensibility Notes
Future expansions for Rendetalje can add:
* Additional lead statuses (update validation + metrics).
* Duplicate detection windows (leveraging `duplicate_window_minutes`).
* SLA histograms (register new metric, label `tenant`).
* Real-time push (subscribe to lead events per tenant).

Guiding Principles: Reuse existing metric names; extend label sets judiciously; keep all tenant-sensitive operations behind API key + RLS.

---
## 13. Minimal Prompt Snippet for Gemini
```
Context: Multi-tenant lead system. Tenant slug "rendetalje" maps via API key header x-tenant-key to a tenantId. Use endpoints /leads, /ingest/form, /leads/:id/status. Only status transition allowed NEW->CONTACTED. Return JSON with lowercase status in web dashboard. Avoid inventing new metrics; use lead_created_total & lead_status_transition_total with label tenant="rendetalje".
```

---
## 14. Quick Validation Checklist
- API key present? Yes → proceed.
- Status change valid? Only NEW->CONTACTED.
- Metrics incremented? `lead_created_total` on ingestion, `lead_status_transition_total` on status change.
- Tenant leakage? No cross-tenant queries.

---
End of document.