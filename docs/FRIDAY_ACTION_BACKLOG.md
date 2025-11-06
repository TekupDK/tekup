# Friday Action Following – Backlog (Epics/Stories)

## Epics

- E1: SuggestionsBar i højre panel (Email/Leads/Calendar)
- E2: Approvals (risikomodel, dry‑run, idempotency, audit)
- E3: ActionCatalog (server allowlist + zod + roller)
- E4: Første triggers (åbnet tråd, reply, stage=done, monday login, overdue faktura)
- E5: Metrics & dashboards (CTR, completion, fejlrate)

## Stories (udvalg)

- S1 (E1): SuggestionsBar – EmailTab
  - AC: viser 0–3 chips <300 ms; klik → modal; CTA‑telemetri
- S2 (E1): ChatPanel – Assistant suggestions som kort
  - AC: samme model; vis over beskeder; klik → modal
- S3 (E2): Approvals modal – low/medium
  - AC: badge, param‑resume, dry‑run, audit events
- S4 (E2): IdempotencyKey & rate‑limit på executeAction
  - AC: dobbeltklik/netværksretry returnerer samme resultat
- S5 (E3): ActionCatalog v1 (8 handlinger)
  - AC: zod‑schemas, minRole, defaultRisk
- S6 (E4): Trigger – Reply clicked → reply_with_quote
  - AC: chip + modal; CTR logges
- S7 (E4): Trigger – Stage=Gennemført → invoice/create + confirmation mail
- S8 (E4): Trigger – Monday login → follow_up_reminder (3 ældre)
- S9 (E4): Trigger – Overdue invoice → anbefalet kanal + reminder
- S10 (E5): Metrics – events + SQL/BI view

## Estimater (grove)

- E1: 2–3 dage, E2: 2–3 dage, E3: 2 dage, E4: 2–3 dage, E5: 1 dag
