# TekUp Monorepo Architecture

> High-level map of domains, apps, shared packages, and cross-cutting concerns. Keep concise and updated when adding or removing an app or domain capability.

## Core Domain Principles
- **Multi-tenant**: Every tenant-scoped entity includes `tenantId`; enforced via Postgres RLS (see `apps/flow-api/prisma/migrations/*rls*`).
- **Single Source of Truth**: `flow-api` owns persistent lead + compliance data. Other apps consume via API / future event stream.
- **Shared Types**: Co-located in `packages/shared` (lead domain, voice domain). Avoid duplicating DTOs in app folders.
- **Metrics First**: Instrument hot paths with canonical metric names (snake_case, counters end `_total`).

## Apps Overview
| App | Path | Type | Primary Domain | Depends On | Notes |
|-----|------|------|----------------|-----------|-------|
| flow-api | apps/flow-api | NestJS API | Leads, compliance, metrics, websocket | shared, auth, api-client | RLS, metrics exporter, status transitions |
| voice-agent | apps/voice-agent | Next.js (App Router) | Real-time voice, multi-tenant assistant | shared, ui | Uses Gemini Live API; function calling gateway (planned) |
| inbox-ai | apps/inbox-ai | Electron + React | Email ingestion, parsing | shared | Adds parsing metrics & lead creation via API |
| website | apps/website | Next.js | Public / dashboard (replacement) | shared, ui | Successor to `nexus-dashboard` |
| nexus-dashboard | apps/nexus-dashboard | Next.js | (Legacy) dashboard | shared | DEPRECATED – pending removal |
| site / landing-web | apps/site, apps/landing-web | Next.js | Marketing / legacy | shared | Candidates for consolidation |
| secure-platform | apps/secure-platform | NestJS | Compliance workflows | shared | To integrate voice commands |
| tekup-crm-api | apps/tekup-crm-api | TBD | CRM API (early) | shared | Experimental |
| tekup-crm-web | apps/tekup-crm-web | Next.js | CRM UI (early) | shared | Experimental |
| tekup-lead-platform / -web | apps/tekup-lead-platform* | TBD | Extended lead mgmt | shared | Overlaps `flow-api` – evaluate scope |

## Shared Packages
- `shared`: Domain DTOs (`lead`, `voice`), utility exports.
- `api-client`: Typed client wrappers (future: generate from OpenAPI / tRPC?).
- `auth`: Authentication helpers (API key, future JWT / session).
- `ui`: Reusable design system components (expand instead of duplicating in apps).
- `config`: Centralized runtime/build config constants.

## Voice Agent Architecture (New)
```
Browser (Mic/Input) → GeminiLiveService (WS) → Google Gemini Live
         │                                    │
         └── TenantAwareVoiceService ──────────┘
                │
        Function Invocation (planned) → flow-api endpoints
```
- **State**: Stored in Zustand `VoiceStore` with derived selectors (session, tenant, conversation turns).
- **Commands**: Danish natural language mapped to internal function intents.
- **Extensibility**: Add new voice functions by (a) defining intent + schema, (b) implementing handler in API, (c) exporting types in `shared`.

## Tenancy Flow
1. Incoming API request → API key middleware resolves tenant → attaches `tenantId`.
2. Voice agent supplies `tenant` context (explicit selection or persisted choice).
3. All metrics & DB queries include `tenant` label / filter.

## Metrics Strategy
- Registered centrally in `flow-api` `MetricsService`.
- Reuse existing names where semantics overlap (avoid near-duplicates like `voice_commands_total` vs `voice_command_total`).
- Proposed voice metrics (to add):
  - `voice_session_started_total {tenant}`
  - `voice_command_executed_total {tenant, intent}`
  - `voice_command_failed_total {tenant, intent, reason}`
  - `voice_function_latency_seconds {tenant, intent}` (histogram)

## Deprecations
- `nexus-dashboard` superseded by `website`.
- `site`, `landing-web` pending consolidation into `website` (decide: marketing vs dashboard separation).

## Testing Strategy
| Layer | Focus | Example |
|-------|-------|---------|
| Unit | Command parsing, service logic | Voice command → intent mapping |
| Integration | API endpoints under RLS | Lead status transition, duplicate detection |
| E2E | Cross-app workflows | Voice command creating a lead visible in dashboard |

## Planned Enhancements
- Central tenant capabilities registry in `shared` (which features enabled per tenant).
- OpenTelemetry instrumentation layer (trace voice → API pipeline).
- Event-driven architecture (emit lead + voice events to message bus for async processing).
- Consolidate redundant Next.js apps.

## Contribution Rules (Delta From README)
- Add new metrics via `MetricsService.registerMetric` – do not inline counters.
- Always export new shared domain types through `packages/shared/src/index.ts`.
- Mark experimental features clearly in commit message (`feat(experimental): ...`).

---
Update this document when: adding/removing an app, introducing a new domain package, or adding voice metrics.
