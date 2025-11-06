# Code Quality & Type Safety – Plan

## Context

TypeScript compilation currently fails with 11+ errors across multiple files. These errors have accumulated and are blocking strict type safety. The codebase needs a systematic cleanup to achieve zero compilation errors and maintain type safety going forward.

## Problem

Current state (2025-11-05):

- ❌ `pnpm check` fails with 11+ TypeScript errors
- ❌ Type errors in `server/routers.ts` (11 errors)
- ❌ Type errors in client components (CustomerProfile, LeadsTab, EmailTab, SettingsDialog)
- ❌ Missing env config properties (`forgeApiUrl`, `forgeApiKey`)
- ❌ Schema mismatches (invoiceNo, entryDate, paidAmount not in DB schema)
- ❌ Null handling issues throughout codebase

## Goals

1. Achieve **zero TypeScript compilation errors**
2. Ensure type safety across client and server
3. Fix schema/type mismatches
4. Implement proper null handling
5. Establish CI check to prevent future type errors

## Root Causes

### 1. Schema Type Mismatches

**Files:** `server/routers.ts`, `client/src/components/CustomerProfile.tsx`

Properties used but not in schema:

- `invoice.invoiceNo` (should be `invoiceNumber`)
- `invoice.entryDate` (not in schema)
- `invoice.paidAmount` (not in schema)
- `label.displayName` (should be `name`)

### 2. Environment Config Missing

**Files:** `server/_core/dataApi.ts`, `server/_core/imageGeneration.ts`

Missing from config type:

- `forgeApiUrl`
- `forgeApiKey`

### 3. Null Handling Issues

**Files:** Multiple components

- `invoice.customerId` can be null but used without check
- `invoice.amount` is string | null but used in arithmetic
- `invoice.dueDate` is string | null but passed to Date constructor
- `lead.status` can be null but expected as string

### 4. Message Schema Mismatches

**Files:** `server/routers.ts`

Trying to add properties not in message schema:

- `attachments` (not in schema)
- `model` (not in schema)

### 5. Type Incompatibilities

**Files:** Various

- `Date | undefined` assigned where `string | null | undefined` expected
- `string | undefined` assigned where `string` required
- `number` passed where `Record<string, any>` expected

## Acceptance Criteria

### Phase 1: Fix Immediate Compilation Errors

- [ ] Fix all 11 TypeScript errors in `server/routers.ts`
- [ ] Fix CustomerProfile type errors (6 errors)
- [ ] Fix LeadsTab type errors (3 errors)
- [ ] Fix EmailTab type error (1 error)
- [ ] Fix SettingsDialog type errors (2 errors)
- [ ] Fix dataApi/imageGeneration env config errors (6 errors)
- [ ] `pnpm check` passes with zero errors

### Phase 2: Schema Alignment

- [ ] Audit database schema vs TypeScript types
- [ ] Remove or add missing fields to match reality
- [ ] Update all usages to match schema
- [ ] Document schema decisions in CHANGELOG

### Phase 3: Null Safety

- [ ] Add null checks where needed
- [ ] Use optional chaining (`?.`) appropriately
- [ ] Add default values where appropriate
- [ ] Consider stricter TypeScript settings

### Phase 4: CI Integration

- [ ] Add `pnpm check` to CI pipeline
- [ ] Ensure CI fails on type errors
- [ ] Add pre-commit hook for type checking (optional)
- [ ] Document type safety standards

## Implementation Steps

### Step 1: Environment Config Fix

**File:** `server/_core/env.ts` or equivalent

Add missing properties:

```typescript
export const config = {
  // ...existing properties...
  forgeApiUrl: process.env.FORGE_API_URL || "https://api.manusforge.com",
  forgeApiKey: process.env.FORGE_API_KEY || "",
  // ...rest...
};
```

**Files to update:**

- `server/_core/dataApi.ts`
- `server/_core/imageGeneration.ts`

### Step 2: Invoice Schema Alignment

**Option A:** Update database schema to add missing fields

- Add `entryDate` column
- Add `paidAmount` column
- Rename `invoiceNumber` to `invoiceNo` (if needed)

**Option B:** Fix TypeScript code to match current schema

- Use `invoiceNumber` instead of `invoiceNo`
- Remove references to `entryDate` and `paidAmount`
- Add proper null handling

**Recommended:** Option B (less schema churn)

**Files to update:**

- `server/routers.ts` (lines 1590-1600)
- `client/src/components/CustomerProfile.tsx` (lines 345, 360-372)

### Step 3: Message Schema Fix

**File:** `server/routers.ts`

Remove or properly handle these properties:

- Line 277: `attachments`
- Line 326, 556: `model`

**Options:**

1. Add to message schema if needed
2. Store in separate field (metadata?)
3. Remove if not used

### Step 4: Null Handling

**Pattern to apply everywhere:**

```typescript
// Before (BAD)
const date = new Date(invoice.dueDate);

// After (GOOD)
const date = invoice.dueDate ? new Date(invoice.dueDate) : null;

// Before (BAD)
const amount = parseFloat(invoice.amount);

// After (GOOD)
const amount = invoice.amount ? parseFloat(invoice.amount) : 0;

// Before (BAD)
name: input.name,

// After (GOOD)
name: input.name || '',
```

**Files to update:**

- `server/routers.ts` (multiple locations)
- `client/src/components/CustomerProfile.tsx`
- `client/src/components/inbox/LeadsTab.tsx`

### Step 5: Type Assertion Fixes

**File:** `server/routers.ts` line 809

```typescript
// Before (BAD)
someFunction(input.conversationId); // number passed where object expected

// After (GOOD)
someFunction({ conversationId: input.conversationId });
```

### Step 6: React Query API Update

**File:** `client/src/components/SettingsDialog.tsx` line 44

```typescript
// Before (deprecated)
useQuery({
  onSuccess: (data) => { ... }
})

// After (current API)
const query = useQuery();
useEffect(() => {
  if (query.data) {
    // handle data
  }
}, [query.data]);
```

## Expected Outcome

**Before:**

```bash
$ pnpm check
> tsc --noEmit

client/src/components/CustomerProfile.tsx(345,44): error TS2339...
client/src/components/CustomerProfile.tsx(360,42): error TS2339...
# ... 11+ more errors
```

**After:**

```bash
$ pnpm check
> tsc --noEmit

# No output (success!) ✅
```

## Risk Assessment

**Risk Level:** 🟡 Medium

**Why:**

- Some fixes may change runtime behavior
- Schema assumptions need verification
- Null handling changes could expose bugs

**Mitigation:**

1. Fix one file at a time
2. Test after each fix
3. Review with domain expert if unsure
4. Keep git history clean for easy rollback

## Rollback Plan

```powershell
# If issues arise
git reset --hard HEAD~1

# Or revert specific commit
git revert <commit-hash>
```

## Related Tasks

- `tasks/testing/PLAN.md` - Add type coverage tests
- `tasks/ci-cd/PLAN.md` - Integrate type checking
- `tasks/db/PLAN.md` - Schema alignment

## References

- [TypeScript Handbook: Null Safety](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Drizzle ORM Type Safety](https://orm.drizzle.team/docs/column-types/pg)
- [React Query v5 Migration](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)

## Notes

- Priority: **HIGH** - Blocking type safety
- Estimated effort: 2-3 hours
- Should be done before adding new features
- Consider enabling `strict: true` in tsconfig after fixes
