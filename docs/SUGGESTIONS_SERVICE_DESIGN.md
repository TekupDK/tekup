# Suggestions Service – Design (Friday‑AI‑V2)

Mål: Lever 1–3 relevante forslag i kontekst (chips/kort) inden for 100–300 ms fra observeret handling.

## Inputs (observations)

- Frontend contexts: `EmailContext` (åben tråd, labels, søgning). Udvid til Leads/Calendar/Invoices.
- Event hooks: view/open/reply/stage_update/invoice_due/overtime.
- Server signaler: seneste pipelineState, overdue fakturaer, ulæste emails, follow‑up kø.

## Regler (første 5)

1. Åbner mail‑tråd → `email.reply_with_quote` + `pipeline.move_stage(needs_action)`
2. Klikker “Svar” → `email.reply_with_quote` (draft)
3. Stage=Gennemført → `billing.create_invoice`, `email.reply_with_quote(template=confirmation)`, `calendar.create_confirmation_event`
4. Login mandag → `email.follow_up_reminder` for 3 ældre leads
5. Overdue faktura → anbefalet kanal + `email.follow_up_reminder`

## Prioritering

- Score = (impact × confidence × freshness) − friction
- Impact: sandsynlig tidsbesparelse/omsætning
- Confidence: signal‑styrke (regler + model)
- Freshness: hvor nylig handlingen er
- Friction: antal felter, risikoniveau

## API (klient)

```ts
type Suggestion = {
  id: string
  actionId: string
  title: string
  summary?: string
  risk: 'low'|'medium'|'high'
  params: Record<string, unknown>
}

// UI prop
<SuggestionsBar suggestions={Suggestion[]} onApprove={(s) => openApprovalModal(s)} />
```

## Performance/UX

- Cache suggestions pr. kontekst i 60–120s (in‑memory).
- Debounce event‑strøm (fx 250 ms).
- Maks 3 chips – altid én “mest sandsynlig”.

## Telemetri

- `action_suggested` (visning), `action_chip_clicked`, `action_approved`, `action_executed`, `action_failed`.
