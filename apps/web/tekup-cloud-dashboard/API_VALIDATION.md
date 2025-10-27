API Validation (Runtime) with Zod

Overview

- Adds lightweight runtime validation for API responses returned from Supabase in `src/lib/api.ts`.
- Prevents malformed data from propagating into UI; falls back gracefully when validation fails.

Validated Endpoints

- Leads: parses array using `LeadSchema` and returns `Lead[]` or `[]`.
- Activities: parses with `ActivitySchema` in both `getActivities` and `getRecentActivities`.
- Agents: parses with `AgentSchema` and falls back to local mock data on failure.
- Invoices: parses with `InvoiceSchema` and returns `[]` on failure.

Behavior

- Uses `z.array(Schema).safeParse(data)` to avoid throwing.
- Logs a concise warning on validation errors and returns safe defaults.

Why

- TypeScript types are erased at runtime. Zod schemas provide runtime guarantees for external data.
- Keeps UI resilient while still surfacing issues via console.

Next

- Add schema for analytics once the endpoint is implemented.
- Consider centralizing schemas in `src/schemas/` if they grow.

