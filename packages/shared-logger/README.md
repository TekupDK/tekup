# @tekup/shared-logger

Central Winston-based logging package for Tekup Portfolio monorepo.

## Features

- 🎯 **Environment-aware**: Different formats for dev (colorized) vs production (JSON)
- 🔒 **Sensitive data masking**: Automatically masks passwords, JWT tokens, API keys
- 📁 **File rotation**: Production logs rotate daily with configurable retention
- 🏷️ **Child loggers**: Create service-specific loggers with default metadata
- 🌐 **HTTP middleware**: Express middleware for request logging
- 📊 **Structured logging**: JSON output in production for log aggregation

## Installation

```bash
pnpm add @tekup/shared-logger --filter=your-package
```

## Usage

### Basic Logging

```typescript
import logger from "@tekup/shared-logger";

logger.info("Application started", { port: 3000 });
logger.error("Database connection failed", { error: err.message });
logger.debug("Processing request", { requestId: "abc-123" });
logger.warn("Rate limit approaching", { usage: "90%" });
```

### Child Logger (Service-Specific)

```typescript
import { createChildLogger } from "@tekup/shared-logger";

const authLogger = createChildLogger({ service: "auth-service" });
authLogger.info("User logged in", { userId: 123 });
// Output includes: { service: 'auth-service', userId: 123 }
```

### Express HTTP Logging

```typescript
import express from "express";
import { httpLogger } from "@tekup/shared-logger";

const app = express();
app.use(httpLogger);
// Logs: method, url, statusCode, duration, userAgent, ip
```

## Configuration

### Environment Variables

- `LOG_LEVEL`: Override log level (debug, info, warn, error). Default: `debug` in dev, `info` in production
- `NODE_ENV`: Set to `production` for JSON format and file rotation

### Log Levels

- `error`: Error messages (always logged)
- `warn`: Warning messages
- `info`: Informational messages (default in production)
- `debug`: Debug messages (default in development)

## File Output

### Development

- `logs/dev.log`: All logs (max 5MB, 2 files)

### Production

- `logs/app-YYYY-MM-DD.log`: Info and above (max 20MB per file, 14 days retention)
- `logs/error-YYYY-MM-DD.log`: Error logs only (max 20MB per file, 30 days retention)

## Security

Sensitive data is automatically masked in logs:

- Passwords: `password=***MASKED***`
- JWT tokens: `jwt=***MASKED***`
- API keys: `apiKey=***MASKED***`
- Authorization headers: `Authorization: Bearer ***MASKED***`

## Migration from console.log

### Before

```typescript
console.log("User created", userId);
console.error("Failed to connect:", error);
```

### After

```typescript
import logger from "@tekup/shared-logger";

logger.info("User created", { userId });
logger.error("Failed to connect", { error: error.message, stack: error.stack });
```

## Best Practices

1. **Use structured logging**: Pass objects, not strings

   ```typescript
   // ❌ Bad
   logger.info(`User ${userId} logged in at ${timestamp}`);

   // ✅ Good
   logger.info("User logged in", { userId, timestamp });
   ```

2. **Include context**: Add relevant metadata

   ```typescript
   logger.error("Database query failed", {
     query: "SELECT * FROM users",
     error: err.message,
     duration: 1234,
   });
   ```

3. **Use appropriate levels**:
   - `error`: Exceptions, failures, things requiring immediate attention
   - `warn`: Deprecations, recoverable errors, unusual behavior
   - `info`: Business events, successful operations
   - `debug`: Detailed diagnostic information

4. **Never log sensitive data directly**: The logger masks common patterns, but be careful with custom fields

## Docker Integration

Mount log directory in `docker-compose.yml`:

```yaml
services:
  backend:
    volumes:
      - ./logs:/app/logs
```

## CI/CD Integration

Ensure log directory exists in deployment:

```bash
mkdir -p logs
NODE_ENV=production node dist/index.js
```

## License

MIT
