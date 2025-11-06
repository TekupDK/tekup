# Friday Action Following – Implementeringsplan

## Fase 0 – Målsætning & KPI

- Definér succeskriterier (CTR, one-click completion, median tid, fejlrate).
- Udvælg første bølge af handlinger (email-tilbud, follow-up, stage-skift, kalender-event, faktura).

## Fase 1 – Analyse & Rapport (færdig)

- Markedssammenligning, gap-analyse, anbefalinger.
- Levere: `FRIDAY_ACTION_FOLLOWING_REPORT.md`.

## Fase 2 – Design & Dokumentation (færdig)

- ActionCatalog allowlist + zod-schemas.
- Suggestions Service (triggers, prioritering, API).
- Chat Approvals (risikomodel, modalflow, guardrails).
- Backlog + metrics + rollout.
- Levere: `ACTION_CATALOG.md`, `SUGGESTIONS_SERVICE_DESIGN.md`, `CHAT_APPROVALS_SPEC.md`, `FRIDAY_ACTION_BACKLOG.md`, `FRIDAY_ACTION_METRICS.md`, `FRIDAY_ACTION_ROLLOUT.md`.

## Fase 3 – UI MVP (næste)

- Implementer `<SuggestionsBar />` i EmailTab og ChatPanel bag feature flag `FRIDAY_ACTION_SUGGESTIONS`.
- Udvid `ActionApprovalModal` til low/medium risk med audit events.
- Generér Playwright screenshots (`pnpm test:screens`) til dokumentation.

## Fase 4 – Backend Lite

- Implementer ActionCatalog server-side (allowlist, zod-validering, roller, idempotency).
- Tilføj `executeAction`/`dryRunAction` TRPC-kontrakter.
- Auto-approve (low) i `userPreferences`.

## Fase 5 – Triggers (runde 1)

- Reply clicked → `email.reply_with_quote`.
- Stage=Gennemført → faktura/bekræftelse.
- Monday login → follow-up kø.
- Overdue faktura → reminder via anbefalet kanal.
- Åbnet thread → stage/label forslag.

## Fase 6 – Metrics & Rollout

- Registrér analytics events (suggested/approved/executed/failed).
- Dashboard for KPI.
- Gradvis udrulning (10% → 50% → 100%) med fallback.

## Fase 7 – Udvidelser (fase 2)

- High risk (bekræftelsesfrase, udvidet diff).
- Flere datasignaler (team overtime, SMS, bookingsystem).
- LLM-baseret prioritering og narratives.

## Afhængigheder

- Stabil dev-login for E2E-tests.
- Data-testid på nøgleelementer (valgfrit, men øger robusthed).
