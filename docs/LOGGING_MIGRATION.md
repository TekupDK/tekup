# Logging Migration Guide

## Overview

This document describes the migration from `console.log` to structured logging using Winston across the Tekup Portfolio monorepo.

**Status:** 🚀 Infrastructure Complete - Ready for Migration  
**Package:** `@tekup/shared-logger` v1.0.0  
**Impact:** 5521 console.log statements → Structured Winston logging

---

## Why Migrate?

### Current Issues with console.log

- ❌ No log levels (info/warn/error all look the same)
- ❌ No structured data for log aggregation
- ❌ Sensitive data (passwords, tokens) logged in plaintext
- ❌ No file persistence in production
- ❌ Can't filter or search logs effectively
- ❌ Performance impact in high-throughput services

### Benefits of Winston Logger

- ✅ Structured JSON logging for production
- ✅ Automatic sensitive data masking
- ✅ Log levels (debug, info, warn, error)
- ✅ File rotation with retention policies
- ✅ Environment-aware formatting
- ✅ Performance optimized
- ✅ Child loggers for service-specific context

---

## Quick Start

### 1. Install the Package

```bash
pnpm add @tekup/shared-logger --filter=your-service
```

### 2. Replace console.log

**Before:**

```typescript
console.log("User created", userId, email);
console.error("Database error:", error);
```

**After:**

```typescript
import logger from "@tekup/shared-logger";

logger.info("User created", { userId, email });
logger.error("Database error", { error: error.message, stack: error.stack });
```

### 3. Create Service-Specific Logger (Recommended)

```typescript
import { createChildLogger } from "@tekup/shared-logger";

// Create once at service initialization
const logger = createChildLogger({ service: "auth-service" });

// All logs will include { service: 'auth-service' }
logger.info("User authenticated", { userId: 123 });
```

---

## Migration Checklist

### Phase 1: Infrastructure (✅ COMPLETE)

- [x] Create `@tekup/shared-logger` package
- [x] Install Winston and dependencies
- [x] Configure development and production formats
- [x] Implement sensitive data masking
- [x] Add file rotation for production
- [x] Create Express HTTP middleware
- [x] Write comprehensive README
- [x] Build and test package

### Phase 2: ESLint Enforcement (✅ COMPLETE)

- [x] Create root `.eslintrc.js` with `no-console` rule
- [x] Install ESLint plugins for TypeScript and React
- [x] Create `.eslintignore` for build artifacts
- [x] Allow `console.warn` and `console.error` only
- [x] Exempt test files from console.log restrictions

### Phase 3: Service Migration (⏳ TODO)

**Priority 1: Backend Services (NestJS)**

- [ ] `apps/rendetalje/services/backend-nestjs` (~500 instances)
- [ ] `services/tekup-ai` (~200 instances)
- [ ] `tekup-mcp-servers` (~150 instances)

**Priority 2: Frontend API Routes (Next.js)**

- [ ] `apps/tekup-ai/frontend` (server-side only)
- [ ] `apps/web/tekup-cloud-dashboard` (API routes)

**Priority 3: Archived Code (LOW PRIORITY)**

- [ ] Archive folder can be ignored - old/unmaintained code

### Migration Strategy Per Service

For each service:

1. **Install logger:**

   ```bash
   pnpm add @tekup/shared-logger --filter=service-name
   ```

2. **Create service logger:**

   ```typescript
   // src/utils/logger.ts or src/logger.ts
   import { createChildLogger } from "@tekup/shared-logger";
   export const logger = createChildLogger({ service: "your-service-name" });
   ```

3. **Find all console.log:**

   ```bash
   grep -rn "console\\.log" src/
   ```

4. **Replace systematically:**
   - Start with critical paths (auth, database, API endpoints)
   - Replace one file at a time
   - Test thoroughly

5. **Run ESLint:**

   ```bash
   pnpm lint
   ```

6. **Fix any remaining issues**

---

## Log Level Guidelines

### `logger.error()` - Critical failures requiring immediate attention

```typescript
logger.error("Database connection failed", {
  error: err.message,
  stack: err.stack,
  host: dbHost,
  port: dbPort,
});

logger.error("Payment processing failed", {
  userId,
  amount,
  error: err.message,
  transactionId,
});
```

### `logger.warn()` - Potential issues, deprecations, recoverable errors

```typescript
logger.warn("API rate limit approaching", {
  current: 950,
  limit: 1000,
  service: "openai",
});

logger.warn("Deprecated function called", {
  function: "oldMethod",
  replacement: "newMethod",
  caller: req.path,
});
```

### `logger.info()` - Business events, successful operations

```typescript
logger.info("User logged in", { userId, email, ip: req.ip });

logger.info("Invoice created", {
  invoiceId,
  customerId,
  amount,
  currency: "DKK",
});

logger.info("Email sent", {
  to: recipient,
  subject,
  templateId,
});
```

### `logger.debug()` - Detailed diagnostic information (development only)

```typescript
logger.debug("Cache lookup", { key, hit: true, ttl: 3600 });

logger.debug("Processing request", {
  method: req.method,
  path: req.path,
  query: req.query,
  headers: req.headers,
});
```

---

## Best Practices

### ✅ DO: Use Structured Logging

```typescript
// ✅ Good - structured data
logger.info("Order completed", {
  orderId: 12345,
  userId: 789,
  total: 1250.5,
  items: 5,
  duration: 1234,
});
```

```typescript
// ❌ Bad - string concatenation
logger.info(`Order 12345 completed by user 789 with total 1250.50 DKK`);
```

### ✅ DO: Include Error Context

```typescript
try {
  await processPayment(amount);
} catch (err) {
  logger.error("Payment processing failed", {
    error: err.message,
    stack: err.stack,
    userId,
    amount,
    currency,
  });
  throw err;
}
```

### ✅ DO: Use Child Loggers for Services

```typescript
// Create once per service/module
const authLogger = createChildLogger({ service: "auth", module: "jwt" });
const dbLogger = createChildLogger({ service: "database", pool: "main" });

// All logs include context automatically
authLogger.info("Token validated", { userId });
// Output: { service: 'auth', module: 'jwt', message: 'Token validated', userId: 123 }
```

### ❌ DON'T: Log Sensitive Data

```typescript
// ❌ Bad - passwords logged
logger.info("Login attempt", { email, password });

// ✅ Good - password omitted
logger.info("Login attempt", { email });

// Note: Masking is automatic for common patterns:
// - password=xxx
// - jwt=xxx
// - token=xxx
// - Authorization: Bearer xxx
```

### ❌ DON'T: Log in Tight Loops

```typescript
// ❌ Bad - logs 10,000 times
for (const item of items) {
  logger.debug("Processing item", { item });
  processItem(item);
}

// ✅ Good - log summary
logger.info("Processing batch", { count: items.length });
const results = items.map(processItem);
logger.info("Batch complete", { processed: results.length });
```

---

## Express HTTP Logging

For Express/NestJS HTTP servers, use the built-in middleware:

```typescript
import express from "express";
import { httpLogger } from "@tekup/shared-logger";

const app = express();

// Add early in middleware chain
app.use(httpLogger);
// Logs: method, url, statusCode, duration, userAgent, ip
```

**Example Output:**

```json
{
  "level": "info",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/users",
  "statusCode": 201,
  "duration": "45ms",
  "userAgent": "Mozilla/5.0...",
  "ip": "10.0.3.102",
  "timestamp": "2025-10-29T10:15:30.123Z"
}
```

---

## Environment Configuration

### Development (Default)

- **Format:** Colorized console output with pretty-printing
- **Level:** `debug` (all logs)
- **Files:** `logs/dev.log` (max 5MB, 2 files)

### Production

- **Format:** JSON (for log aggregation tools)
- **Level:** `info` (omit debug logs)
- **Files:**
  - `logs/app-YYYY-MM-DD.log` (14 days retention)
  - `logs/error-YYYY-MM-DD.log` (30 days retention, errors only)

### Override Log Level

```bash
# Set via environment variable
LOG_LEVEL=debug NODE_ENV=production node dist/server.js

# Or in .env file
LOG_LEVEL=warn
```

---

## Docker Integration

Ensure log directory is mounted in `docker-compose.yml`:

```yaml
services:
  backend:
    image: tekup/backend:latest
    volumes:
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
```

---

## Migration Progress Tracking

### Current Status (2025-10-29)

| Area                  | console.log Count | Status          |
| --------------------- | ----------------- | --------------- |
| **Active Code**       | ~5,521 total      | 🟡 Not Started  |
| Backend (NestJS)      | ~500              | ⏳ TODO         |
| TekupAI Services      | ~200              | ⏳ TODO         |
| MCP Servers           | ~150              | ⏳ TODO         |
| Frontend (API Routes) | ~50               | ⏳ TODO         |
| Archive Folder        | ~4,621            | 🔵 Low Priority |
| **Infrastructure**    | N/A               | ✅ Complete     |
| **ESLint Config**     | N/A               | ✅ Complete     |

### Estimated Timeline

- **Week 1:** Backend services migration (500 instances)
- **Week 2:** TekupAI + MCP servers (350 instances)
- **Week 3:** Frontend API routes (50 instances)
- **Week 4:** Testing, validation, documentation updates

**Total Effort:** ~3-4 weeks for active codebase  
_Note: Archive folder can be ignored or migrated separately_

---

## Testing Your Migration

After migrating a service:

1. **Run ESLint:**

   ```bash
   pnpm lint --fix
   ```

2. **Check logs in development:**

   ```bash
   pnpm dev
   # Verify colorized output in console
   # Check logs/dev.log for file output
   ```

3. **Test in production mode:**

   ```bash
   NODE_ENV=production pnpm start
   # Verify JSON format
   # Check logs/app-YYYY-MM-DD.log
   ```

4. **Verify no sensitive data leaked:**
   ```bash
   grep -i "password\|token\|jwt\|secret" logs/*.log
   # Should only show ***MASKED*** values
   ```

---

## Troubleshooting

### Issue: "Cannot find module '@tekup/shared-logger'"

**Solution:**

```bash
# Ensure package is installed in service
cd apps/your-service
pnpm add @tekup/shared-logger

# If using workspace reference, ensure it's built
cd ../../packages/shared-logger
pnpm build
```

### Issue: Logs not appearing in file

**Solution:**

- Ensure `logs/` directory exists: `mkdir -p logs`
- Check file permissions
- Verify `NODE_ENV` is set correctly

### Issue: ESLint still showing console.log errors

**Solution:**

- Run `pnpm lint --fix` to auto-fix
- For intentional usage, add comment: `// eslint-disable-next-line no-console`
- Test files are exempt automatically

---

## Support & Questions

- **Package Location:** `packages/shared-logger/`
- **Documentation:** `packages/shared-logger/README.md`
- **ESLint Config:** `.eslintrc.js`
- **Issues:** Track in GitHub with label `technical-debt`

---

**Last Updated:** 2025-10-29  
**Status:** Infrastructure Complete, Ready for Service Migration
