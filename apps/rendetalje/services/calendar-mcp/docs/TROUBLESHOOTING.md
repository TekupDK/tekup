# RenOS Calendar MCP - Troubleshooting Guide

## Oversigt

Denne guide hjælper med at løse almindelige problemer og fejl i RenOS Calendar MCP.

## Almindelige Fejl og Løsninger

### 1. Build Fejl

#### TypeScript Compilation Errors

```bash
# Problem: TypeScript compilation fejl
error TS2339: Property 'x' does not exist on type 'y'

# Løsning: Check type definitions
npm run build
# Ret type definitions i src/types.ts
```

#### Jest Test Failures

```bash
# Problem: Tests fejler
FAIL tests/integration.test.ts

# Løsning: Check test configuration
npm test -- --verbose
# Ret test imports og mocks
```

### 2. Environment Variable Fejl

#### Missing Environment Variables

```bash
# Problem: Environment variables ikke fundet
Error: GOOGLE_PRIVATE_KEY is not defined

# Løsning: Check .env file
cat .env
# Sørg for alle nødvendige variabler er sat
```

#### Invalid Environment Variables

```bash
# Problem: Ugyldige credentials
Error: Invalid Google service account key

# Løsning: Verify credentials
# Check Google Cloud Console
# Verify service account permissions
```

### 3. Database Connection Fejl

#### Supabase Connection Issues

```bash
# Problem: Kan ikke forbinde til Supabase
Error: Failed to connect to Supabase

# Løsning: Check connection details
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY
# Verify URL og keys er korrekte
```

#### Database Schema Issues

```bash
# Problem: Tables ikke fundet
Error: Table 'customer_intelligence' does not exist

# Løsning: Run migrations
./scripts/deploy-supabase.ps1
# Check SUPABASE_SCHEMA.sql
```

### 4. API Integration Fejl

#### Google Calendar API Errors

```bash
# Problem: Google Calendar API fejl
Error: 403 Forbidden

# Løsning: Check permissions
# 1. Verify service account has Calendar API access
# 2. Check calendar sharing permissions
# 3. Verify impersonation setup
```

#### Billy.dk API Errors

```bash
# Problem: Billy.dk API fejl
Error: 401 Unauthorized

# Løsning: Check API credentials
# 1. Verify BILLY_API_KEY
# 2. Check BILLY_ORGANIZATION_ID
# 3. Ensure API key has correct permissions
```

#### Twilio Voice Errors

```bash
# Problem: Twilio voice fejl
Error: 401 Unauthorized

# Løsning: Check Twilio credentials
# 1. Verify TWILIO_ACCOUNT_SID
# 2. Check TWILIO_AUTH_TOKEN
# 3. Ensure phone number is verified
```

### 5. Deployment Fejl

#### Render.com Deployment Issues

```bash
# Problem: Build fejler på Render
Error: Build failed

# Løsning: Check build logs
render logs --service renos-calendar-mcp
# Check Dockerfile og build commands
```

#### Environment Variables på Render

```bash
# Problem: Environment variables ikke sat på Render
Error: NODE_ENV is not defined

# Løsning: Set environment variables
render env set renos-calendar-mcp NODE_ENV production
# Check Render Environment Groups
```

### 6. Performance Issues

#### Slow API Responses

```bash
# Problem: API er langsom
Response time > 5 seconds

# Løsning: Check caching
# 1. Verify Redis connection
# 2. Check database queries
# 3. Monitor resource usage
```

#### Memory Issues

```bash
# Problem: Out of memory
Error: JavaScript heap out of memory

# Løsning: Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### 7. Mobile PWA Issues

#### PWA Not Installing

```bash
# Problem: PWA kan ikke installeres
Error: Service worker not found

# Løsning: Check PWA manifest
# 1. Verify manifest.json
# 2. Check service worker registration
# 3. Ensure HTTPS
```

#### Dashboard Not Loading

```bash
# Problem: Dashboard loader ikke
Error: Failed to load dashboard

# Løsning: Check API connection
# 1. Verify VITE_API_URL
# 2. Check CORS settings
# 3. Test API endpoints
```

## Debug Commands

### 1. Health Check

```bash
# Check system health
curl https://renos-calendar-mcp.onrender.com/health

# Expected output:
{
  "status": "ok",
  "timestamp": "2025-01-20T10:00:00Z",
  "services": {
    "supabase": true,
    "google": true,
    "twilio": true,
    "billy": true
  }
}
```

### 2. Log Analysis

```bash
# Check application logs
render logs --service renos-calendar-mcp --tail

# Check specific errors
render logs --service renos-calendar-mcp | grep ERROR
```

### 3. Database Debug

```bash
# Test Supabase connection
supabase db execute --sql "SELECT NOW();"

# Check table structure
supabase db execute --sql "SELECT * FROM information_schema.tables WHERE table_name = 'customer_intelligence';"
```

### 4. API Testing

```bash
# Test Google Calendar API
curl -H "Authorization: Bearer $GOOGLE_ACCESS_TOKEN" \
  "https://www.googleapis.com/calendar/v3/calendars/primary/events"

# Test Billy.dk API
curl -H "X-Access-Token: $BILLY_API_KEY" \
  "https://api.billy.dk/v2/organizations"
```

## Performance Monitoring

### 1. Response Time Monitoring

```typescript
// Add timing to API calls
const startTime = Date.now();
const result = await validateBookingDate(input);
const duration = Date.now() - startTime;

if (duration > 5000) {
  logger.warn('Slow API response', { duration, endpoint: 'validateBookingDate' });
}
```

### 2. Memory Usage Monitoring

```typescript
// Monitor memory usage
const memoryUsage = process.memoryUsage();
logger.info('Memory usage', {
  rss: memoryUsage.rss,
  heapUsed: memoryUsage.heapUsed,
  heapTotal: memoryUsage.heapTotal
});
```

### 3. Database Query Performance

```typescript
// Monitor database queries
const startTime = Date.now();
const result = await supabase.from('customer_intelligence').select('*');
const queryTime = Date.now() - startTime;

if (queryTime > 1000) {
  logger.warn('Slow database query', { queryTime, table: 'customer_intelligence' });
}
```

## Error Recovery

### 1. Automatic Retry

```typescript
// Retry failed API calls
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 2. Fallback Mechanisms

```typescript
// Fallback for failed services
async function validateBookingWithFallback(input) {
  try {
    return await validateBookingDate(input);
  } catch (error) {
    logger.error('Primary validation failed', error);
    return await validateBookingDateFallback(input);
  }
}
```

### 3. Circuit Breaker

```typescript
// Circuit breaker for external services
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

## Monitoring Setup

### 1. Health Check Endpoints

```typescript
// Comprehensive health check
app.get('/health/detailed', async (req, res) => {
  const checks = await Promise.allSettled([
    checkSupabaseConnection(),
    checkGoogleCalendarConnection(),
    checkTwilioConnection(),
    checkBillyConnection(),
    checkRedisConnection()
  ]);

  const results = checks.map((check, index) => ({
    service: ['supabase', 'google', 'twilio', 'billy', 'redis'][index],
    status: check.status === 'fulfilled' ? 'ok' : 'error',
    error: check.status === 'rejected' ? check.reason.message : null
  }));

  res.json({ status: 'ok', checks: results });
});
```

### 2. Metrics Collection

```typescript
// Collect performance metrics
const metrics = {
  apiCalls: 0,
  averageResponseTime: 0,
  errorRate: 0,
  uptime: process.uptime()
};

// Update metrics on each request
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.apiCalls++;
    metrics.averageResponseTime = (metrics.averageResponseTime + duration) / 2;
    
    if (res.statusCode >= 400) {
      metrics.errorRate = (metrics.errorRate + 1) / metrics.apiCalls;
    }
  });
  
  next();
});
```

## Support og Kontakt

### 1. Log Collection

```bash
# Collect logs for support
render logs --service renos-calendar-mcp > logs.txt
npm run build > build.log 2>&1
npm test > test.log 2>&1
```

### 2. System Information

```bash
# Collect system info
node --version
npm --version
render --version
supabase --version
```

### 3. Environment Check

```bash
# Check environment
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "SUPABASE_URL: $SUPABASE_URL"
echo "GOOGLE_PROJECT_ID: $GOOGLE_PROJECT_ID"
```

---

*Denne guide dækker de mest almindelige problemer og løsninger for RenOS Calendar MCP.*
