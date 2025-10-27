API Validation (Runtime) with Zod

Overview

- Adds lightweight runtime validation for API responses returned from Supabase in `src/lib/api.ts`.
- Prevents malformed data from propagating into UI; falls back gracefully when validation fails.

Validated Endpoints

- Leads: parses array using `LeadSchema` and returns `Lead[]` or `[]`.
- Activities: parses with `ActivitySchema` in både `getActivities` and `getRecentActivities`.
- Agents: parses with `AgentSchema` and falder tilbage til lokal mock data ved fejl.
- Invoices: parses med `InvoiceSchema` og returnerer `[]` ved fejl.
- System Health / KPI helpers: short-circuit når `isSupabaseMock` er sand for at undgå netværkskald.
- Analytics overview: bruger `AnalyticsMetric` fallback dataset når Supabase ikke er konfigureret.

Behavior

- Uses `z.array(Schema).safeParse(data)` to avoid throwing.
- Logs a concise warning on validation errors and returns safe defaults.
- Detects mock client via `isSupabaseMock` and short-circuits to fallback data without hitting network code.

Why

- TypeScript types are erased at runtime. Zod schemas provide runtime guarantees for external data.
- Keeps UI resilient while still surfacing issues via console.

Next

- Add schema for analytics once the endpoint is implemented.
- Consider centralizing schemas in `src/schemas/` if they grow.
