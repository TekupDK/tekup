# ActionCatalog – Friday‑AI‑V2 (Server Allowlist)

Formål: Én sandhedskilde for hvilke handlinger Friday må foreslå/udføre, inkl. roller, risiko, schema‑validering og dry‑run/execute kontrakter.

## Struktur (TypeScript‑skitse)

```ts
type RiskLevel = "low" | "medium" | "high";

interface ActionDef<P extends z.ZodTypeAny, R = unknown> {
  id: string;
  type: string;
  title: string;
  summary?: string;
  minRole: "user" | "admin";
  risk: RiskLevel;
  paramsSchema: P;
  dryRun?: (
    params: z.infer<P>,
    ctx: Ctx
  ) => Promise<
    | {
        ok: true;
        diff?: string;
        affectedCount?: number;
        recipients?: string[];
        estimate?: number;
      }
    | { ok: false; reason: string }
  >;
  execute: (
    params: z.infer<P>,
    ctx: Ctx & { idempotencyKey: string }
  ) => Promise<R>;
}
```

## Startkatalog (MVP)

1. `email.reply_with_quote` (risk: medium)

- Params: `threadId: string`, `hours: number`, `teamSize?: number`, `price: number`, `slots?: string[]`
- Dry‑run: generér email‑preview; beregn pris/slots
- Execute: opret draft/send via `inbox.email.reply`/`mcpSendGmailMessage`

2. `email.follow_up_reminder` (low)

- Params: `threadId: string`, `delayDays: number`, `templateId?: string`
- Execute: opret draft med skabelon

3. `pipeline.move_stage` (low)

- Params: `threadId: string`, `toStage: 'needs_action'|'venter_pa_svar'|'i_kalender'|'finance'|'afsluttet'`
- Execute: `updatePipelineStage`

4. `calendar.create_confirmation_event` (medium)

- Params: `threadId: string`, `date: string`, `durationMinutes: number`
- Dry‑run: preview af event (start/end)
- Execute: `mcpCreateCalendarEvent`

5. `billing.create_invoice` (high)

- Params: `leadId?: number`, `customerEmail?: string`, `amount: number`, `lines: { description: string; quantity: number; unitPrice: number }[]`
- Dry‑run: total/afrunding
- Execute: `createBillyInvoice`

6. `email.set_label` (low) / `email.archive` (low) / `email.mark_read` (low)

- Execute: `addLabelToThread` / `archiveThread` / `googleMarkAsRead`

## Politikker

- Auto‑approve kun for `risk='low'` og kun hvis brugeren har slået det til (server tjekker `userPreferences`).
- IdempotencyKey på alle `execute`.
- Zod‑validering server‑side (ingen uforsikrede parametre).
- Rollekrav håndhæves (f.eks. `billing.create_invoice` → admin).
