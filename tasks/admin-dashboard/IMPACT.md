# Admin Dashboard - Impact Analysis

## Oversigt

Når denne task implementeres, vil følgende dele af systemet blive påvirket:

---

## 🗄️ Database & Migrations

**Ingen database ændringer** - bruger eksisterende data fra `ai_usage_logs` (kræver ai-metrics task først)

---

## 🖥️ Backend / Server

### Nye filer

- `server/adminRouter.ts` - Ny tRPC router med admin-only routes

### Ændrede filer

#### `server/routers.ts`

**Ændringer:**

- Import adminRouter
- Tilføj adminRouter til appRouter

```typescript
import { adminRouter } from "./adminRouter";

export const appRouter = router({
  system: systemRouter,
  customer: customerRouter,
  auth: authRouter,
  chat: chatRouter,
  inbox: inboxRouter,
  admin: adminRouter, // ← NY
});
```

**Estimeret LOC:** ~5 linjer ændret

#### `server/adminRouter.ts` (NY FIL)

**Indhold:**

```typescript
// Admin-only tRPC routes med RBAC
export const adminRouter = router({
  getMetricsOverview: adminProcedure.query(async () => { ... }),
  getUsageTimeseries: adminProcedure.input(z.object({ ... })).query(async ({ input }) => { ... }),
  getModelDistribution: adminProcedure.input(z.object({ ... })).query(async ({ input }) => { ... }),
  getTopConversations: adminProcedure.input(z.object({ ... })).query(async ({ input }) => { ... }),
  getActionStats: adminProcedure.input(z.object({ ... })).query(async ({ input }) => { ... }),
  exportMetrics: adminProcedure.input(z.object({ ... })).mutation(async ({ input }) => { ... }),
});
```

**Estimeret LOC:** ~250-300 linjer ny kode

#### `server/_core/trpc.ts`

**Ændringer:**

- Tilføj `adminProcedure` middleware (RBAC check)

```typescript
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});
```

**Estimeret LOC:** ~10 linjer tilføjet

---

## 🎨 Frontend / Client

### Nye filer

- `client/src/pages/AdminMetrics.tsx` - Admin metrics dashboard page
- `client/src/components/admin/MetricCard.tsx` - Reusable metric card component
- `client/src/components/admin/UsageChart.tsx` - Line chart for usage over time
- `client/src/components/admin/ModelDistributionChart.tsx` - Pie chart for model usage
- `client/src/components/admin/ConversationsTable.tsx` - Table of top conversations
- `client/src/components/admin/DateRangePicker.tsx` - Date range selector (eller brug shadcn/ui)

### Ændrede filer

#### `client/src/main.tsx` eller `client/src/App.tsx`

**Ændringer:**

- Tilføj route til `/admin/metrics`

```typescript
<Route path="/admin/metrics" component={AdminMetrics} />
```

**Estimeret LOC:** ~2 linjer tilføjet

#### `client/src/components/UserMenu.tsx` (eller lignende)

**Ændringer:**

- Tilføj "Admin Dashboard" link (conditional for admin/owner)

```typescript
{(user.role === 'admin' || user.role === 'owner') && (
  <DropdownMenuItem asChild>
    <Link href="/admin/metrics">Admin Dashboard</Link>
  </DropdownMenuItem>
)}
```

**Estimeret LOC:** ~5-10 linjer tilføjet

#### `client/src/pages/AdminMetrics.tsx` (NY FIL)

**Struktur:**

```typescript
export default function AdminMetrics() {
  const [dateRange, setDateRange] = useState({ start, end });

  const { data: overview } = trpc.admin.getMetricsOverview.useQuery();
  const { data: timeseries } = trpc.admin.getUsageTimeseries.useQuery({ ...dateRange });
  const { data: distribution } = trpc.admin.getModelDistribution.useQuery({ ...dateRange });
  const { data: topConversations } = trpc.admin.getTopConversations.useQuery({ limit: 10 });

  return (
    <div className="container py-8">
      <h1>AI Metrics Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total Tokens" value={overview.totalTokens} />
        <MetricCard title="Total Cost" value={overview.totalCost} />
        <MetricCard title="Avg Cost/Conv" value={overview.avgCost} />
        <MetricCard title="Most Used Model" value={overview.topModel} />
      </div>

      <UsageChart data={timeseries} />
      <ModelDistributionChart data={distribution} />
      <ConversationsTable data={topConversations} />
    </div>
  );
}
```

**Estimeret LOC:** ~200-250 linjer UI kode

---

## 📦 Dependencies

### Nye packages

```json
{
  "recharts": "^2.10.0" // eller shadcn/ui chart components
}
```

Installer med:

```bash
pnpm add recharts
```

---

## 🔐 Authorization

### RBAC Checks

**Backend:**

- `adminProcedure` middleware i tRPC
- Verificer `ctx.user.role === 'admin' || ctx.user.role === 'owner'`

**Frontend:**

- Route guard: redirect non-admin til 403 page
- Conditional rendering af admin nav link
- Hide admin routes fra non-admin users

---

## 🧪 Tests

### Nye filer

- `tests/admin-router.test.ts` - Unit tests for admin routes
- `tests/e2e/admin-dashboard.test.ts` - E2E tests for dashboard

### Test Cases

- [ ] Non-admin users får 403 når de kalder admin routes
- [ ] Admin/owner users kan hente metrics
- [ ] Date range filter virker korrekt
- [ ] Charts render med real data
- [ ] Export CSV genererer korrekt format
- [ ] Mobile view fungerer (basic)

**Estimeret LOC:** ~200-300 linjer test kode

---

## 🚀 Rollout Workflow

1. **Dev:**

   ```bash
   pnpm add recharts
   pnpm dev
   # Navigate to http://localhost:3000/admin/metrics (som admin user)
   ```

2. **Test:**
   - Test RBAC (login som non-admin, verificer 403)
   - Test queries med forskellige date ranges
   - Verificer chart rendering
   - Test export CSV

3. **Staging:**
   - Deploy backend + frontend
   - Smoke test med staging admin account
   - Verificer performance (queries < 500ms)

4. **Prod:**
   - Deploy bag feature flag: `ENABLE_ADMIN_DASHBOARD=true`
   - Kommuniker til admins/owners
   - Monitor for errors og slow queries

---

## ⚠️ Risici & Mitigations

| Risiko                    | Påvirkning        | Mitigation                                   |
| ------------------------- | ----------------- | -------------------------------------------- |
| Slow aggregation queries  | Dashboard timeout | Add DB indexes, pre-compute daily rollups    |
| Chart library bundle size | Slow page load    | Lazy load charts, code splitting             |
| Unauthorized access       | Security breach   | RBAC checks backend + frontend, audit logs   |
| Exposing sensitive data   | Privacy violation | Only show aggregate data, no message content |

---

## 🚦 Rollout Checklist

- [ ] `ai-metrics` task completed (data source exists)
- [ ] adminRouter implementeret med alle routes
- [ ] adminProcedure middleware med RBAC
- [ ] Frontend AdminMetrics page oprettet
- [ ] Chart components implementeret
- [ ] Date range picker integreret
- [ ] Admin nav link tilføjet (conditional)
- [ ] Route guard for /admin/\*
- [ ] Recharts eller chart library installeret
- [ ] Unit tests for admin routes
- [ ] E2E tests for dashboard
- [ ] RBAC tests (403 for non-admin)
- [ ] Performance tests (query speed)
- [ ] Mobile responsive check
- [ ] Feature flag konfigureret
- [ ] Docs opdateret
- [ ] Team communicated

---

## 📊 Success Metrics

- [ ] Admins kan se metrics inden for 1 uge af deployment
- [ ] Dashboard bruges mindst ugentligt af stakeholders
- [ ] Zero unauthorized access attempts succeed
- [ ] Page load time < 2s p95
- [ ] All queries < 500ms p95

---

## 🔗 Related Tasks

- **Blocked by:** `tasks/ai-metrics/` (MUST be completed first)
- **Blocks:** Ingen
- **Related:** `tasks/security/` (RBAC), `tasks/testing/` (coverage)

---

## 📝 Notes for Implementers

- Brug shadcn/ui components hvor muligt for consistency
- Implementer skeleton loaders for bedre UX under data fetch
- Cache overview metrics (staleTime: 5min) for performance
- Overvej lazy loading af charts på scroll/tab switch
- Export CSV: use streaming for large datasets
- Add tooltip explanations for metrics (what do they mean?)
- Consider dark mode support for charts
