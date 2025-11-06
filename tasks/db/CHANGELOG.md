# Database Task Ordering - Changelog

## 2025-11-05 - Initial Implementation

### Added

- **Schema**: `tasks.orderIndex` column (integer, default 0, not null)
  - File: `drizzle/schema.ts`
  - Allows manual task reordering via drag-and-drop

- **Server Logic**: Auto-assign and ordering
  - File: `server/db.ts`
  - `createTask`: Automatically assigns next `orderIndex` if not provided
  - `getUserTasks`: Orders by `asc(orderIndex), desc(createdAt)`
  - `updateTaskOrder`: Updates `orderIndex` column
  - `bulkUpdateTaskOrder`: Batch updates for drag-and-drop reorder

- **Migration Script**: `scripts/backfill-task-order.ts`
  - One-off script to set `orderIndex` based on `createdAt` per user
  - Handles Supabase schema parameter extraction
  - Ran on dev DB: 0 tasks found (no migration needed yet)

### Fixed

- **Type/Schema Mismatches** (discovered during orderIndex work):
  - Analytics date filters: Convert Date to ISO strings for string-mode timestamps
  - `user_preferences`: Removed non-existent `language` field
  - `user_preferences`: Renamed `pushNotifications` → `desktopNotifications`
  - Pipeline transitions: Use `transitionedBy` instead of `triggeredBy`
  - Import: Added `asc` from drizzle-orm

### Validated

- ✅ TypeScript check: PASS
- ✅ Build production: PASS
- ✅ Run tests: PASS
- ✅ Database push: SUCCESS (column added)
- ✅ Backfill script: Runs successfully

### Documentation

- Updated `tasks/db/PLAN.md` with acceptance criteria
- Created `tasks/db/STATUS.md` with current state
- Updated `tasks/README.md` task index

## Impact

- Existing tasks have `orderIndex = 0` and sort by `createdAt`
- Drag-and-drop reorder will assign explicit indices
- No API shape changes (routers already had `updateOrder` endpoints)
- Backfill script ready for production when tasks exist
