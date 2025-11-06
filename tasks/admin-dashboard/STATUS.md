# Admin Dashboard - Status

## Current Phase: Blocked (waiting for ai-metrics)

**Last Updated**: 2025-11-05

## Progress

### Backend Routes ⏳ Not Started

- [ ] Create `server/adminRouter.ts` with RBAC
- [ ] Implement `admin.getMetricsOverview`
- [ ] Implement `admin.getUsageTimeseries`
- [ ] Implement `admin.getModelDistribution`
- [ ] Implement `admin.getTopConversations`
- [ ] Implement `admin.getActionStats`
- [ ] Implement `admin.exportMetrics` (CSV)

### Frontend Page ⏳ Not Started

- [ ] Create `client/src/pages/AdminMetrics.tsx`
- [ ] Build metric card components
- [ ] Integrate charts (Recharts)
- [ ] Add date range picker
- [ ] Style with Tailwind + shadcn/ui

### Authorization ⏳ Not Started

- [ ] Protect `/admin/*` routes with middleware
- [ ] Add admin nav link (conditional render)
- [ ] Test RBAC for owner/admin/user roles

### Performance ⏳ Not Started

- [ ] Add DB indexes for aggregation queries
- [ ] Implement query caching (5 min)
- [ ] Test with large datasets

## Blockers

- **BLOCKED**: Waiting for `tasks/ai-metrics/` to complete (data source not available)

## Next Steps

1. Wait for `ai_usage_logs` table to be created
2. Design admin route structure
3. Build sample queries against mock data
4. Choose chart library (likely Recharts)

## Notes

- Consider adding export functionality later if CSV proves insufficient
- May want alerts/notifications in future phase
- Keep mobile view simple (cards only, no charts)
