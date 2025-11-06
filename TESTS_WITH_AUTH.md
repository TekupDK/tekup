# Tests med Authentication - Guide

## Oversigt

Alle integration tests i `tekup-ai-v2` bruger nu **real authentication** gennem dev-login endpointet.

## Test Setup

### 1. Authentication Helper

`client/src/__tests__/auth-helper.ts` indeholder:

- `loginTestUser()` - Logger automatisk ind via `/api/auth/login`
- `verifyAuthentication()` - Verificerer at bruger er autentificeret

### 2. Test Files

Alle test filer har nu:

```typescript
import { loginTestUser, verifyAuthentication } from "@/__tests__/auth-helper";

beforeAll(async () => {
  // Backend check...

  // Login test user
  await loginTestUser();
  await verifyAuthentication();
});
```

## Krav

1. **Backend skal køre**: `pnpm dev` på port 3000
2. **Database**: Supabase PostgreSQL med `friday_ai` schema
3. **Dev Login Endpoint**: `/api/auth/login` (auto-login som OWNER user)

## Dev Login Endpoint

`/api/auth/login` endpointet:

- Opretter/henter OWNER user (openId: `OWNER_OPEN_ID` env var)
- Opretter session cookie
- Redirecter til `/`

## Tests Status

✅ **2 tests passerer:**

- CalendarTab.test.tsx (2 tests)
- TasksTab.test.tsx (2 tests)

⚠️ **3 tests fejler pga. CSS import:**

- EmailTab.test.tsx
- InvoicesTab.test.tsx
- LeadsTab.test.tsx

**Problem**: `katex.min.css` fra `streamdown` pakken kan ikke transformeres.

## Kørsel

```bash
# Start backend
pnpm dev

# I anden terminal - kør tests
pnpm test
```

## Næste Steps

1. Fix CSS import problem (katex)
2. Verify alle 5 tests passerer
3. Opret test guide dokumentation
