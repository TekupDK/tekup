# Friday‑AI‑V2: Action Following – Samlet Analyse (2025)

Formål: Friday følger brugerens kontekst og handlinger, foreslår næste skridt med ét klik (godkendelse), udfører sikkert, og logger alt (audit/KPI).

## Markedsoverblik (kort)

- Intercom/Front: AI‑inbox, forslag i kontekst, hurtige handlinger, godkendelser for risikofyldte operationer.
- ChatGPT/Claude: stærk markdown, modelstyring per samtale, regenerér/feedback.
- HubSpot ChatSpot/Notion: “kontekst chips”, datasøgning og strukturerede tools med confirmation.
- Shortwave.ai: “Action Following” – email‑kontekst → næste skridt automatisk.

## Gaps vs. Friday (nu)

- UI: Mangler tidsstempler/feedback/regenerér i chat; liste uden ulæst/snippet; ingen slash‑kommandoer.
- Godkendelser: Modal findes, men mangler risikomodel, dry‑run/diff, idempotency, auto‑approve (server‑håndhævet).
- Observationssignal: EmailTab har `EmailContext`, men Leads/Calendar/Invoices mangler ensartede events.

## Hvad vi kan udnytte i repoet

- TRPC endpoints i `server/routers.ts` dækker Email/Pipeline/Calendar/Billy – kan bruges som “executeAction”.
- `analyticsEvents` i schema til audit/telemetri.
- `EmailContext` i `client/src/contexts/EmailContext.tsx` – god base for Shortwave‑stil tracking.

## Forslag – Første bølge af handlinger (MVP)

1. Email

- “Svar med tilbud” (draft m. timer/pris/ledige tider)
- “Følg op om X dage” (skabelon)
- “Sæt label” (Needs Reply/Finance) / “Markér som læst” / “Arkivér”

2. Pipeline/Leads

- “Flyt stage” (needs_action → venter_pa_svar → i_kalender → finance → afsluttet)
- “Opret lead fra mail”

3. Kalender/Økonomi

- “Opret bekræftelses‑event i kalender”
- “Opret faktura i Billy” (ved Gennemført)

## Triggers (Shortwave‑stil)

- Åbner mail‑tråd/lead/job → vis kundehistorik og 1–3 forslag (chips)
- Trykker Svar → auto‑draft med tider/pris (godkend før send)
- Stage=Gennemført → faktura/bekræftelse/review/genbooking
- Login mandag → “3 leads mangler opfølgning”
- Faktura over forfald → anbefalet kontaktkanal
- Overtid fra team → A/B‑forslag (ring + rabat / mail / læring)

## Godkendelser (UX + sikkerhed)

- Risk: low (kan auto‑approve), medium (modal m. preview), high (bekræftelsesfrase + tydelig diff)
- Guardrails: ActionCatalog (allowlist), zod‑validering, rolle/ejerskab, idempotencyKey, rate‑limit, audit events

## KPI

- CTR på forslag, andel “one‑click completion”, tid fra observation→udført, fejlrate

## Næste skridt

- Se `docs/ACTION_CATALOG.md`, `docs/SUGGESTIONS_SERVICE_DESIGN.md`, `docs/CHAT_APPROVALS_SPEC.md` for detaljeret design.
