# Database – Status (2025-11-05)

## Done

- Added `tasks.orderIndex` column to Drizzle schema (default 0, not null)
- Pushed schema to DB (drizzle push): success
- Updated server logic to use the new column:
  - `createTask`: assigns next `orderIndex` if not provided
  - `getUserTasks`: orders by `asc(orderIndex), desc(createdAt)`
  - `updateTaskOrder` and `bulkUpdateTaskOrder`: persist index and update `updatedAt`
- Fixed related type/schema mismatches:
  - Analytics date filters use ISO strings for string-mode timestamps
  - `user_preferences`: removed `language`, renamed `pushNotifications` → `desktopNotifications`
  - Pipeline transitions: `transitionedBy` used in inserts
- TypeScript check, build, and tests: all green
- Created backfill script (`scripts/backfill-task-order.ts`):
  - Sets `orderIndex` based on `createdAt` per user
  - Handles schema param extraction (postgres.js compatibility)
  - Ran on dev DB: 0 tasks found (no existing tasks to migrate)

## Impact

- Existing tasks created before this change have `orderIndex = 0` and will sort by `createdAt` within the same index. Dragging/reordering will assign explicit indices.
- Routers already expose `updateOrder` and `bulkUpdateOrder`—no API shape changes.
- Backfill script ready for production run if needed (when tasks exist)

## Scripts

- `scripts/backfill-task-order.ts` - One-off migration to set orderIndex based on createdAt
  - Usage: `pnpm tsx scripts/backfill-task-order.ts` (with DATABASE_URL in env)
