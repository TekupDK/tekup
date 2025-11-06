# Admin Dashboard for AI Metrics

## Rationale

Nu hvor vi logger AI token usage (via `tasks/ai-metrics/`), skal vi have en admin-side hvor vi kan visualisere og analysere forbruget. Dette giver ledelse og tech team mulighed for at:

- Overvåge daglige/ugentlige omkostninger
- Identificere dyre samtaler eller anomalier
- Sammenligne model performance (Gemini vs OpenAI)
- Se action approval rates og user adoption
- Budgettere fremtidig AI brug

## Current State

- Ingen admin interface eksisterer
- Auth system har RBAC (owner/admin roller)
- Ingen aggregerings-queries for AI metrics endnu

## Goals

- [ ] Opret admin-only route `/admin/metrics`
- [ ] Build dashboard med key metrics og grafer
- [ ] Implementer tRPC routes til at hente aggregeret data
- [ ] Vis real-time og historiske trends
- [ ] Export til CSV for videre analyse

## UI Components

```
/admin/metrics
├── Overview Cards
│   ├── Total Tokens (today/week/month)
│   ├── Total Cost (USD)
│   ├── Avg Cost per Conversation
│   └── Most Used Model
├── Charts
│   ├── Token Usage Over Time (line chart)
│   ├── Cost by Model (pie chart)
│   ├── Top Conversations by Cost (bar chart)
│   └── Action Approval Rate (donut chart)
└── Tables
    ├── Recent High-Cost Conversations
    ├── Model Distribution
    └── Daily Cost Breakdown
```

## tRPC Routes

```typescript
admin.getMetricsOverview.useQuery(); // Cards data
admin.getUsageTimeseries.useQuery({ start, end, granularity }); // Line chart
admin.getModelDistribution.useQuery({ start, end }); // Pie chart
admin.getTopConversations.useQuery({ limit, start, end }); // Table
admin.getActionStats.useQuery({ start, end }); // Approval rates
admin.exportMetrics.mutation({ start, end }); // CSV download
```

## Implementation Steps

1. **Backend Routes**
   - [ ] Create `server/adminRouter.ts` (RBAC protected)
   - [ ] Implement aggregation queries using `ai_usage_logs`
   - [ ] Add date range filters and pagination
   - [ ] Calculate derived metrics (avg cost, approval rate)

2. **Frontend Page**
   - [ ] Create `client/src/pages/AdminMetrics.tsx`
   - [ ] Build reusable metric card components
   - [ ] Integrate charts library (Recharts eller shadcn/ui charts)
   - [ ] Add date range picker

3. **Authorization**
   - [ ] Protect `/admin/*` routes with admin middleware
   - [ ] Show 403 for non-admin users
   - [ ] Add admin nav link in user menu (conditional)

4. **Performance**
   - [ ] Use DB indexes for fast aggregations
   - [ ] Cache overview metrics (5 min stale time)
   - [ ] Lazy load charts on scroll

## Acceptance Criteria

- [ ] Only users with `role = 'admin'` or `role = 'owner'` can access
- [ ] Overview cards load in < 500ms
- [ ] Charts render correctly with real data
- [ ] Date range filter works (last 7d, 30d, 90d, custom)
- [ ] Export CSV includes all relevant columns
- [ ] Mobile responsive (basic table view, no charts)

## Risks & Mitigations

| Risk                                | Mitigation                           |
| ----------------------------------- | ------------------------------------ |
| Slow aggregations on large datasets | Pre-computed daily rollups (future)  |
| Chart library bundle size           | Use lightweight library or lazy load |
| Exposing sensitive data             | Don't show message content, only IDs |
| Admin route discovery               | No links for non-admins, auth checks |

## Dependencies

- `tasks/ai-metrics/` must be complete (data source)
- Recharts or shadcn/ui chart components
- Date range picker component (shadcn/ui)

## Rollout Plan

1. **Dev**: Build and test with sample data
2. **Staging**: Validate RBAC and performance
3. **Prod**: Deploy behind feature flag for owners first
4. **Expand**: Roll out to admin users after validation

## Success Metrics

- Admins can view metrics within 1 week of deployment
- Dashboard used at least weekly by stakeholders
- Zero unauthorized access attempts succeed
- Page load time < 2s p95

## Links

- Related: `tasks/ai-metrics/` for data source
- Code: `server/adminRouter.ts`, `client/src/pages/AdminMetrics.tsx`
- UI: shadcn/ui components
