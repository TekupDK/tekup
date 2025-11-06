# 🔴 CRITICAL: TypeScript Compilation Errors

**Status:** FAILING  
**Date:** 2025-11-05  
**Priority:** HIGHEST

## Quick Summary

`pnpm check` is **FAILING** with **32+ TypeScript errors** across 8 files.

## Impact

- ❌ Type safety compromised
- ❌ Development workflow blocked
- ❌ Risk of runtime errors
- ❌ Can't enable strict mode
- ❌ No CI type checking

## Errors by File

| File                                        | Errors | Type                              |
| ------------------------------------------- | ------ | --------------------------------- |
| `server/routers.ts`                         | 11     | Schema mismatches, null handling  |
| `server/_core/dataApi.ts`                   | 6      | Missing env config                |
| `server/_core/imageGeneration.ts`           | 3      | Missing env config                |
| `client/src/components/CustomerProfile.tsx` | 6      | Schema mismatches, null handling  |
| `client/src/components/inbox/LeadsTab.tsx`  | 3      | Type compatibility, null handling |
| `client/src/components/inbox/EmailTab.tsx`  | 1      | Ref type                          |
| `client/src/components/SettingsDialog.tsx`  | 2      | Deprecated API, implicit any      |

## Quick Fix Priority

1. **Environment config** (fixes 9 errors immediately)
   - Add `forgeApiUrl` and `forgeApiKey` to env config

2. **Schema alignment** (fixes 15+ errors)
   - Use `invoiceNumber` not `invoiceNo`
   - Remove `entryDate`, `paidAmount` references
   - Add proper null checks

3. **Deprecated APIs** (fixes 2 errors)
   - Migrate React Query `onSuccess` to useEffect

## Full Documentation

- **Plan:** `tasks/ops/code-quality/PLAN.md`
- **Status:** `tasks/ops/code-quality/STATUS.md`
- **Changelog:** `tasks/ops/code-quality/CHANGELOG.md`

## Why This Wasn't Caught

1. No CI type checking
2. No code quality task
3. Feature-driven development prioritized over maintenance
4. No pre-commit hooks
5. Gap in task system

## Next Steps

See `tasks/ops/code-quality/STATUS.md` for detailed implementation checklist.

**Estimated fix time:** 3-4 hours
