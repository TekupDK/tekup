# Chat Approvals – Spec (Friday‑AI‑V2)

## Risikomodel

- Low: ingen data/økonomi‑risiko → kan auto‑approve pr. actionType (server tjekker `userPreferences`).
- Medium: tydelig modal + kort dry‑run/preview (diff/antal/recipients/estimat).
- High: bekræftelsesfrase ("SKRIV GODKEND"), uddybet diff/konsekvens, idempotencyKey på execute.

## Modal – indhold

- Header: ikon + titel + risikobadge.
- Body: summary, param‑resume (maskér PII), dry‑run resultater, link til relevant entitet (email/thread/lead).
- Footer: Godkend / Redigér / Annullér + checkbox “Altid godkend (low)”

## Kontrakter (TRPC)

- `chat.sendMessage` → kan returnere `pendingAction` `{ id, type, title, summary, risk, params, dryRun? }`.
- `chat.dryRunAction(input)` (valgfri) → `{ ok, diff?, affectedCount?, recipients?, estimate? }`.
- `chat.executeAction(input)` med `idempotencyKey`, valideret via ActionCatalog.

## Guardrails (server)

- Allowlist (ActionCatalog), zod‑validering, rolle/ejerskab, rate‑limit, idempotency, audit events.

## Fejltilstande (UI)

- Validation/permission → venlig fejl + ret guidance.
- Netværk → “Vi kørte ikke handlingen – prøv igen” (retry‑knap).
- Dry‑run fejl → disable “Godkend” til succesfuld dry‑run.

## Audit/Analytics

- Log: suggested/dry_run/approved/executed/failed med `conversationId`/`correlationId`.
