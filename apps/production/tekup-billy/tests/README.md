# Tekup-Billy MCP Server - Tests

Denne mappe indeholder alle test scripts til validering af Tekup-Billy MCP Server funktionalitet.

## 📋 Test Oversigt

### Test Scripts

#### `test-integration.ts`

**Lokal Integration Tests**

Tester Supabase integration og core funktionalitet:

- ✅ Supabase connection
- ✅ Organization creation med encrypted API key
- ✅ API key decryption
- ✅ Audit logging
- ✅ Usage metrics recording
- ✅ Cache statistics

**Kør:**

```bash
# Via PowerShell script (anbefalet)
.\tests\run-tests.ps1

# Eller direkte:
npx tsx tests/test-integration.ts

# Via npm:
npm run test:integration
```

**Forudsætninger:**

- Supabase credentials i .env
- Encryption keys genereret
- Alle environment variables sat

#### `test-production.ts`

**Production Health Checks**

Validerer production deployment:

- ✅ Health endpoint (200 OK)
- ✅ Billy.dk connection
- ✅ Server uptime
- ✅ Environment variables loaded

**Kør:**

```bash
npx tsx tests/test-production.ts

# Eller:
npm run test:production
```

**Forudsætninger:**

- Production server kørende på <https://tekup-billy.onrender.com>
- MCP_API_KEY sat

#### `test-production-operations.ts`

**Production Operations Tests**

Tester alle Billy.dk operations via HTTP API:

- ✅ List Invoices
- ✅ List Customers
- ✅ List Products
- ✅ Get Revenue

**Kør:**

```bash
npx tsx tests/test-production-operations.ts

# Eller:
npm run test:operations
```

**Forudsætninger:**

- Production server live
- MCP_API_KEY konfigureret
- Billy.dk credentials korrekte

#### `test-billy-api.ts`

**Direct Billy.dk API Tests**

Direkte test af Billy.dk API connectivity:

- ✅ Invoices endpoint
- ✅ Contacts endpoint
- ✅ Products endpoint

**Kør:**

```bash
npx tsx tests/test-billy-api.ts

# Eller:
npm run test:billy
```

**Forudsætninger:**

- BILLY_API_KEY i .env
- BILLY_ORGANIZATION_ID i .env

### `run-tests.ps1`

**PowerShell Test Runner**

Workaround script for lokal testing når .env ikke loader korrekt. Sætter environment variables direkte i PowerShell før test execution.

**Kør:**

```bash
.\tests\run-tests.ps1
```

## 🚀 Kør Alle Tests

```bash
# Alle tests i sekvens
npm run test:all

# Eller manuelt:
npm run test:integration
npm run test:production
npm run test:operations
npm run test:billy
```

## 📊 Test Results

### Seneste Test Run (October 11, 2025)

**✅ Alle tests passing (10/10)**

```
Local Integration Tests:     6/6 ✅
Production Health Checks:    4/4 ✅
Production Operations:       4/4 ✅
Billy.dk API Direct:         3/3 ✅
```

## 🔧 Test Setup

### 1. Environment Variables

Kopier `.env.example` til `.env` og udfyld:

```env
# Billy.dk
BILLY_API_KEY=your_api_key
BILLY_ORGANIZATION_ID=your_org_id
BILLY_TEST_MODE=false
BILLY_DRY_RUN=false

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Encryption
ENCRYPTION_KEY=your_32_byte_hex_key
ENCRYPTION_SALT=your_16_byte_hex_salt

# MCP
MCP_API_KEY=your_mcp_api_key
```

### 2. Generate Encryption Keys

```bash
# ENCRYPTION_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ENCRYPTION_SALT (16 bytes)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# MCP_API_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Database Setup

Kør Supabase migrations (se `docs/DEPLOYMENT_COMPLETE.md`):

- organizations table
- cached_invoices table
- cached_customers table
- cached_products table
- cached_revenue table
- audit_logs table
- usage_metrics table
- cache_stats table

## 🐛 Troubleshooting

### Test Failures

#### Environment Variables Not Loading

**Problem:** Tests fail med "Environment variable not set" errors

**Løsning:** Brug `run-tests.ps1` script:

```bash
.\tests\run-tests.ps1
```

#### Supabase Connection Errors

**Problem:** 401 Unauthorized fra Supabase

**Løsning:**

1. Verificer SUPABASE_SERVICE_KEY er korrekt
2. Check at key ikke er expired
3. Hent ny key fra Supabase Dashboard → Project Settings → API

#### Billy.dk API Errors

**Problem:** 401 eller 403 fra Billy.dk API

**Løsning:**

1. Verificer BILLY_API_KEY er korrekt
2. Check BILLY_ORGANIZATION_ID matcher
3. Test direkte via `test-billy-api.ts`

#### Production Tests Fail

**Problem:** Production tests fail med connection errors

**Løsning:**

1. Verificer server er live: <https://tekup-billy.onrender.com/health>
2. Check MCP_API_KEY er sat korrekt
3. Se Render logs for errors

### Common Issues

**Issue:** "Cannot find module 'tsx'"

```bash
npm install -g tsx
```

**Issue:** "Module not found" errors

```bash
npm install
npm run build
```

**Issue:** PowerShell script ikke kører

```bash
# Tillad script execution
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## 📈 Test Coverage

### Integration Tests (6 tests)

- Database operations
- Encryption/decryption
- Audit logging
- Usage tracking
- Cache management

### Production Tests (4 tests)

- Server health
- Billy.dk connectivity
- Environment validation
- Uptime verification

### Operations Tests (4 tests)

- Invoice operations
- Customer operations
- Product operations
- Revenue calculations

### API Tests (3 tests)

- Direct Billy.dk access
- Endpoint validation
- Data retrieval

**Total:** 17 tests covering alle kritiske funktioner

## 🔄 Continuous Testing

### Pre-commit Tests

Kør før hver commit:

```bash
npm run test:integration
```

### Pre-deployment Tests

Kør før deployment:

```bash
npm run test:all
```

### Post-deployment Tests

Kør efter deployment:

```bash
npm run test:production
npm run test:operations
```

## 📚 Test Documentation

For mere detaljeret information om test resultater og validation:

- [PRODUCTION_VALIDATION_COMPLETE.md](../docs/PRODUCTION_VALIDATION_COMPLETE.md) - Komplet validation report
- [DEPLOYMENT_COMPLETE.md](../docs/DEPLOYMENT_COMPLETE.md) - Testing procedures section

## 🎯 Test Best Practices

1. **Kør tests lokalt** før push til GitHub
2. **Verificer production** efter hver deployment
3. **Monitor logs** for unexpected errors
4. **Update tests** når ny funktionalitet tilføjes
5. **Document issues** i GitHub Issues

---

**Test Framework:** TypeScript med tsx  
**Assertions:** Native Node.js  
**Last Updated:** October 11, 2025  
**Status:** ✅ All tests passing
