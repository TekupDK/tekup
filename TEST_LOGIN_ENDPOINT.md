# Test Login Endpoint - Opdateringer

## Oversigt

Login endpointet `/api/auth/login` er nu opdateret til at understøtte **både browser og test mode**.

## Ændringer

### 1. Test Mode Detection

Endpointet detekterer automatisk test mode via:

- Query parameter: `?mode=test` eller `?test=true`
- Header: `X-Test-Mode: true`
- User-Agent: `vitest` eller `jsdom`

### 2. Response Format

**Browser Mode (default):**

- Redirecter til `/` (302)
- Sætter session cookie

**Test Mode:**

- Returnerer JSON (200)
- Inkluderer cookie værdi i response body
- Lettere for tests at hente cookie

### 3. Cookie Options

I test mode:

- `sameSite: "none"` (mest permissiv)
- `httpOnly: false` (kan læses i tests)
- `secure: false` (virker over HTTP)

## Test Mode Response

```json
{
  "success": true,
  "message": "Login successful",
  "cookieName": "app_session_id",
  "cookieValue": "eyJhbGci...",
  "user": {
    "id": 1,
    "openId": "owner-friday-ai-dev",
    "name": "Jonas",
    "email": "jonas@rendetalje.dk"
  }
}
```

## Krav for Tests

⚠️ **Backend skal køre!**

Tests kan ikke køre uden en kørende backend server:

```bash
# Terminal 1: Start backend
cd C:\Users\empir\Tekup\services\tekup-ai-v2
pnpm dev

# Terminal 2: Kør tests
pnpm test
```

## Brug i Tests

`auth-helper.ts` bruger automatisk test mode:

```typescript
const response = await fetch(`${BACKEND_URL}/api/auth/login?mode=test`, {
  headers: {
    "X-Test-Mode": "true",
    "User-Agent": "vitest/jsdom",
  },
});
```

## Fejlfinding

Hvis login fejler med 500:

1. Check at backend kører (`pnpm dev`)
2. Check at DATABASE_URL er sat korrekt
3. Check at JWT_SECRET er sat
4. Check server logs for specifik fejl
