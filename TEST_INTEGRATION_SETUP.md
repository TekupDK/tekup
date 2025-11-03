# Integration Test Setup - Real Data Tests ✅

## Status: Tests opdateret til at bruge RIGTIGE data

Alle tests er nu opdateret til at bruge **REAL tRPC calls** til **REAL backend** med **REAL data** - **INGEN MOCKS**.

---

## 🎯 Test Filosofi

**Principper:**

- ✅ **Rigtige tRPC calls** - Ingen mocks
- ✅ **Rigtig backend** - Server skal køre
- ✅ **Rigtig database** - Real Supabase PostgreSQL
- ✅ **Rigtige data** - Faktiske emails, leads, tasks, etc.

---

## 📋 Test Filer

Alle test filer bruger nu rigtige integration tests:

1. **EmailTab.test.tsx** - Real email data
2. **LeadsTab.test.tsx** - Real leads data
3. **TasksTab.test.tsx** - Real tasks data
4. **InvoicesTab.test.tsx** - Real invoices data
5. **CalendarTab.test.tsx** - Real calendar events

---

## 🚀 Sådan Kører Tests

### Forudsætninger

1. **Backend server skal køre:**

   ```bash
   cd C:\Users\empir\Tekup\services\tekup-ai-v2
   pnpm dev
   ```

   Serveren skal være tilgængelig på `http://localhost:3000`

2. **Database skal være tilgængelig:**
   - Supabase PostgreSQL (som konfigureret i `.env.supabase`)
   - Rigtig data skal eksistere i databasen

### Kør Tests

```bash
# I en separat terminal (mens backend kører)
cd C:\Users\empir\Tekup\services\tekup-ai-v2
pnpm test

# Eller watch mode
pnpm test --watch
```

### Test Miljø Variabler

Hvis backend kører på anden URL:

```bash
VITE_API_URL=http://localhost:3001 pnpm test
```

---

## 📊 Test Struktur

Hver test fil:

1. **beforeAll()** - Tjekker at backend er tilgængelig
2. **Real render()** - Bruger rigtig tRPC client
3. **Real data loading** - Vent på rigtig API calls
4. **Real assertions** - Tjek rigtig UI med rigtig data

### Eksempel Test Flow

```typescript
describe("EmailTab - Integration Tests (Real Data)", () => {
  beforeAll(async () => {
    // Verify backend is running
    const response = await fetch("http://localhost:3000/api/trpc");
    if (!response.ok) throw new Error("Backend not running!");
  });

  it("should load real data", async () => {
    render(<EmailTab />); // Uses REAL tRPC client

    await waitFor(() => {
      // Wait for REAL data from backend
      expect(screen.queryByText(/email/i)).toBeTruthy();
    }, { timeout: 10000 });
  });
});
```

---

## 🔧 Test Utilities

**`test-utils.tsx`** er opdateret til at:

- ✅ Bruge **rigtig tRPC client** (ikke mocked)
- ✅ Peke til **rigtig backend URL**
- ✅ Supporte **real API calls**

---

## ⚠️ Vigtige Noter

1. **Backend må køre** - Tests fejler hvis backend ikke er tilgængelig
2. **Database skal have data** - Tests forventer rigtig data struktur
3. **Timeout 10 sekunder** - Giver tid til rigtige API calls
4. **Ingen mocks** - Alt er rigtigt!

---

## ✅ Resultat

**Ingen mocks - kun rigtige integration tests med rigtige data!**

Alle tests kører nu mod:

- ✅ Rigtig backend server
- ✅ Rigtig database
- ✅ Rigtige tRPC endpoints
- ✅ Rigtige data

---

**Test Setup: ✅ COMPLETE**
**Mocks: ❌ FJERNET**
**Real Data: ✅ AKTIVERET**
