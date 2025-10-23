# 🧪 Tekup-Billy Testing Workflow & Automation

**Dato:** 20. Oktober 2025  
**Version:** 1.4.1  
**Platforms:** ChatGPT, Shortwave.ai, Claude Desktop, Generic MCP clients

---

## 📋 Overview

Dette dokument beskriver:
1. **Manual Testing Workflow** - Step-by-step test guide
2. **Automated Testing** - GitHub Actions CI/CD
3. **Platform-Specific Tests** - ChatGPT, Shortwave, Claude
4. **Performance Benchmarks** - Response time, cache hit rate
5. **Monitoring & Alerts** - Production health checks

---

## 🎯 Test Plan Overview

### Test Levels

```
┌─────────────────────────────────────────┐
│  1. Unit Tests (src/**/*.test.ts)      │  ← Not implemented yet
├─────────────────────────────────────────┤
│  2. Integration Tests (tests/)          │  ✅ ACTIVE
│     - test-integration.ts               │
│     - test-production.ts                │
│     - test-billy-api.ts                 │
├─────────────────────────────────────────┤
│  3. Platform Tests (Manual)             │  ← This document
│     - ChatGPT Custom Actions            │
│     - Shortwave AI Agent                │
│     - Claude Desktop MCP                │
├─────────────────────────────────────────┤
│  4. E2E Tests (Automated)               │  🚧 Planned
│     - Playwright browser automation     │
├─────────────────────────────────────────┤
│  5. Load Tests (Automated)              │  🚧 Planned
│     - k6 or Artillery                   │
└─────────────────────────────────────────┘
```

---

## 🔧 Setup: Manual Testing

### Prerequisites

1. **Environment Variables** (`.env` file)

   ```bash
   BILLY_API_KEY=your_key
   BILLY_ORGANIZATION_ID=your_org_id
   MCP_API_KEY=bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b
   SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   ```

2. **Platform Accounts**
   - ✅ ChatGPT Plus/Team ($20/month minimum)
   - ✅ Shortwave Max plan
   - ✅ Claude Desktop (free)

3. **Tools**
   - PowerShell 7+ (Windows)
   - curl or Invoke-RestMethod
   - Git
   - Node.js 18+

---

## 📝 Manual Testing Workflow

### Phase 1: Pre-Deployment Testing (Local)

#### Test 1.1: Build & Start

```powershell
# Navigate to project
cd C:\Users\empir\Tekup-Billy

# Install dependencies (if needed)
npm install

# Build TypeScript
npm run build

# Start HTTP server locally
npm start:http
```

**Expected Output:**

```
Tekup-Billy MCP HTTP Server started on port 3000
✅ Supabase enabled - caching and analytics active
✅ Health monitor initialized
✅ Rate limiter active
```

**❌ If errors:** Check `.env` file has all required vars

---

#### Test 1.2: Health Check (Local)

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Expected Response:**

```json
{
  "status": "healthy",
  "version": "1.4.1",
  "uptime": 45,
  "dependencies": {
    "billy": {
      "status": "healthy",
      "lastCheck": "2025-10-20T12:34:56Z"
    },
    "supabase": {
      "enabled": true,
      "connected": true
    }
  }
}
```

---

#### Test 1.3: API Authentication

```powershell
# Test WITH correct API key
$headers = @{ "X-API-Key" = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b" }
Invoke-RestMethod -Uri "http://localhost:3000/tools/list" -Headers $headers

# Test WITHOUT API key (should fail)
Invoke-RestMethod -Uri "http://localhost:3000/tools/list"
```

**Expected:**
- ✅ With key: Returns 32 tools
- ❌ Without key: 401 Unauthorized

---

#### Test 1.4: Tool Call (List Invoices)

```powershell
$headers = @{
  "X-API-Key" = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b"
  "Content-Type" = "application/json"
}

$body = @{
  name = "list_invoices"
  arguments = @{
    organizationId = "IQgm5fsl5rJ3Ub33EfAEow"
    pageSize = 5
  }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/tools/call" -Method Post -Headers $headers -Body $body
```

**Expected:**
- Status: 200 OK
- Response: List of 5 invoices
- Response time: <100ms (with cache)

---

### Phase 2: Production Testing (Render.com)

#### Test 2.1: Production Health

```powershell
Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/health"
```

**Expected:**
- `"status": "healthy"`
- `"supabase": { "enabled": true, "connected": true }`
- `"version": "1.4.1"`

---

#### Test 2.2: Cache Performance

**First Request (Cache Miss):**

```powershell
$headers = @{ "X-API-Key" = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b" }
$start = Get-Date
Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/tools/call" -Method Post -Headers $headers -Body '{"name":"list_customers","arguments":{"organizationId":"IQgm5fsl5rJ3Ub33EfAEow"}}'
$elapsed = (Get-Date) - $start
Write-Host "Cache MISS time: $($elapsed.TotalMilliseconds)ms"
```

**Second Request (Cache Hit):**

```powershell
$start = Get-Date
Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/tools/call" -Method Post -Headers $headers -Body '{"name":"list_customers","arguments":{"organizationId":"IQgm5fsl5rJ3Ub33EfAEow"}}'
$elapsed = (Get-Date) - $start
Write-Host "Cache HIT time: $($elapsed.TotalMilliseconds)ms"
```

**Expected:**
- Cache MISS: 250-500ms
- Cache HIT: 50-100ms (5x faster!)

---

#### Test 2.3: Health Metrics

```powershell
Invoke-RestMethod -Uri "https://tekup-billy.onrender.com/health/metrics"
```

**Expected Metrics:**

```json
{
  "totalRequests": 125,
  "successfulRequests": 124,
  "failedRequests": 1,
  "errorRate": 0.008,
  "avgResponseTime": 87,
  "cacheHitRate": 0.72,
  "billyApiCallsToday": 35,
  "billyApiCallsThisMonth": 342,
  "health": {
    "errorRate": "healthy",
    "responseTime": "healthy",
    "billyApiUsage": "healthy",
    "cachePerformance": "healthy"
  }
}
```

**Validation:**
- ✅ errorRate < 0.05 (5%)
- ✅ avgResponseTime < 500ms
- ✅ cacheHitRate > 0.40 (40%)
- ✅ billyApiCallsThisMonth < 8000

---

### Phase 3: Platform Integration Testing

#### Test 3.1: ChatGPT Custom Actions

**Setup:** See `docs/integration/CHATGPT_INTEGRATION_GUIDE.md`

**Test Script:**

1. **Basic Query**

   ```
   Prompt: "Show me my last 3 invoices"
   Expected: Table with 3 invoices, formatted nicely
   Time: <5 seconds (including ChatGPT thinking)
   ```

2. **Complex Query**

   ```
   Prompt: "Create a new Danish B2B customer named 'Test Corp ApS' with email test@test.dk"
   Expected: 
   - ChatGPT asks to confirm template usage
   - Creates customer with Danish settings
   - Returns customer ID and confirmation
   ```

3. **Multi-Step Workflow**

   ```
   Prompt: "Compare my revenue from September vs October 2025"
   Expected:
   - Fetches Sep invoices
   - Fetches Oct invoices
   - Shows comparison table
   - Calculates growth %
   ```

4. **Error Handling**

   ```
   Prompt: "Get invoice with ID 'invalid123'"
   Expected:
   - Clear error message
   - Suggestions for next steps
   - No ChatGPT confusion
   ```

**Pass Criteria:**
- ✅ All 4 tests work correctly
- ✅ Response time <10 seconds per query
- ✅ Natural language understanding works
- ✅ Errors handled gracefully

---

#### Test 3.2: Shortwave AI Agent

**Setup:** See `docs/SHORTWAVE_INTEGRATION_GUIDE.md`

**Test Script:**

1. **Email Context Query**

   ```
   Context: Email from customer "Acme Corp"
   Prompt: "Show me all invoices for this customer"
   Expected: 
   - Extracts customer name from email
   - Searches Billy for "Acme Corp"
   - Returns relevant invoices
   ```

2. **Quick Invoice Creation**

   ```
   Context: Email asking for invoice
   Prompt: "Create invoice for this customer, 5000 DKK for consulting"
   Expected:
   - Identifies customer from email
   - Creates product "Consulting"
   - Creates invoice
   - Asks if user wants to send
   ```

3. **Revenue Summary**

   ```
   Prompt: "@billy What's my revenue this month?"
   Expected:
   - Shortwave calls Tekup-Billy via MCP
   - Returns formatted revenue summary
   - Shows in email thread
   ```

**Pass Criteria:**
- ✅ Email context extraction works
- ✅ @billy mentions trigger correctly
- ✅ Responses formatted for email
- ✅ No authentication errors

---

#### Test 3.3: Claude Desktop MCP

**Setup:** See `CLAUDE_DESKTOP_SETUP.md`

**Test Script:**

1. **Local Stdio Connection**

   ```
   Prompt: "List my Billy invoices"
   Expected:
   - Claude uses stdio MCP connection
   - Calls list_invoices tool
   - Returns formatted response
   ```

2. **Tool Discovery**

   ```
   Prompt: "What Billy tools are available?"
   Expected:
   - Lists all 32 tools
   - Explains each tool's purpose
   - Suggests common workflows
   ```

3. **Complex Workflow**

   ```
   Prompt: "Create a customer, then create an invoice for them"
   Expected:
   - Step 1: Create customer
   - Step 2: Get customer ID from response
   - Step 3: Create invoice with that ID
   - Shows progress for each step
   ```

**Pass Criteria:**
- ✅ Stdio connection stable
- ✅ All 32 tools accessible
- ✅ Multi-step workflows work
- ✅ No connection drops

---

## 🤖 Automated Testing

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml` (to be created)

```yaml
name: Test Tekup-Billy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # Daily at midnight

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          BILLY_API_KEY: ${{ secrets.BILLY_API_KEY }}
          BILLY_ORGANIZATION_ID: ${{ secrets.BILLY_ORGANIZATION_ID }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
      
      - name: Test production endpoint
        run: npm run test:production
        env:
          MCP_API_KEY: ${{ secrets.MCP_API_KEY }}
      
      - name: Health check
        run: |
          curl -f https://tekup-billy.onrender.com/health || exit 1
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: logs/
```

---

### Continuous Deployment Checks

**Render Auto-Deploy Hooks:**

1. **Pre-Deploy Health Check**

   ```bash
   curl -f https://tekup-billy.onrender.com/health
   ```

2. **Post-Deploy Validation**

   ```bash
   # Wait 30s for warmup
   sleep 30
   
   # Check health
   curl -f https://tekup-billy.onrender.com/health
   
   # Check Supabase
   curl -s https://tekup-billy.onrender.com/health | jq '.dependencies.supabase.enabled'
   # Expected: true
   ```

3. **Rollback Trigger**

   ```bash
   # If health check fails 3 times in 5 min → Rollback
   for i in {1..3}; do
     curl -f https://tekup-billy.onrender.com/health || ((failures++))
     sleep 100
   done
   
   if [ $failures -ge 2 ]; then
     echo "Health check failed, triggering rollback"
     exit 1
   fi
   ```

---

## 📊 Performance Benchmarking

### Benchmark Suite

**File:** `scripts/benchmark.ps1` (to be created)

```powershell
# Benchmark script
$endpoint = "https://tekup-billy.onrender.com"
$apiKey = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b"
$headers = @{ "X-API-Key" = $apiKey }

Write-Host "=== Tekup-Billy Performance Benchmark ==="

# Test 1: Health check
$start = Get-Date
Invoke-RestMethod -Uri "$endpoint/health" | Out-Null
$elapsed = ((Get-Date) - $start).TotalMilliseconds
Write-Host "Health check: ${elapsed}ms"

# Test 2: List tools
$start = Get-Date
$tools = Invoke-RestMethod -Uri "$endpoint/tools/list" -Headers $headers
$elapsed = ((Get-Date) - $start).TotalMilliseconds
Write-Host "List tools (32 items): ${elapsed}ms"

# Test 3: Cold start (clear cache first)
Write-Host "`nTesting cache performance..."
$body = '{"name":"list_customers","arguments":{"organizationId":"IQgm5fsl5rJ3Ub33EfAEow"}}'

# First call (cache miss)
$start = Get-Date
Invoke-RestMethod -Uri "$endpoint/tools/call" -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null
$coldStart = ((Get-Date) - $start).TotalMilliseconds
Write-Host "Cold start (cache miss): ${coldStart}ms"

# Second call (cache hit)
$start = Get-Date
Invoke-RestMethod -Uri "$endpoint/tools/call" -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null
$warmStart = ((Get-Date) - $start).TotalMilliseconds
Write-Host "Warm start (cache hit): ${warmStart}ms"

# Calculate speedup
$speedup = [math]::Round($coldStart / $warmStart, 2)
Write-Host "`nCache speedup: ${speedup}x faster"

# Test 4: Load test (10 concurrent requests)
Write-Host "`nLoad test (10 concurrent requests)..."
$jobs = 1..10 | ForEach-Object {
  Start-Job -ScriptBlock {
    param($url, $headers, $body)
    $start = Get-Date
    Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -ContentType "application/json" | Out-Null
    ((Get-Date) - $start).TotalMilliseconds
  } -ArgumentList "$endpoint/tools/call", $headers, $body
}

$results = $jobs | Wait-Job | Receive-Job
$avgLatency = ($results | Measure-Object -Average).Average
$maxLatency = ($results | Measure-Object -Maximum).Maximum
Write-Host "Average latency: ${avgLatency}ms"
Write-Host "Max latency: ${maxLatency}ms"

# Cleanup
$jobs | Remove-Job

Write-Host "`n=== Benchmark Complete ==="
```

**Run:**

```powershell
.\scripts\benchmark.ps1
```

**Expected Output:**

```
=== Tekup-Billy Performance Benchmark ===
Health check: 45ms
List tools (32 items): 123ms

Testing cache performance...
Cold start (cache miss): 487ms
Warm start (cache hit): 78ms

Cache speedup: 6.24x faster

Load test (10 concurrent requests)...
Average latency: 156ms
Max latency: 234ms

=== Benchmark Complete ===
```

---

## 📈 Monitoring & Alerts

### Daily Health Checks

**Script:** `scripts/daily-health-check.ps1`

```powershell
$endpoint = "https://tekup-billy.onrender.com"

# Fetch metrics
$metrics = Invoke-RestMethod -Uri "$endpoint/health/metrics"

# Check thresholds
$alerts = @()

if ($metrics.errorRate -gt 0.05) {
  $alerts += "⚠️ Error rate high: $($metrics.errorRate * 100)%"
}

if ($metrics.avgResponseTime -gt 500) {
  $alerts += "⚠️ Slow response time: $($metrics.avgResponseTime)ms"
}

if ($metrics.cacheHitRate -lt 0.40) {
  $alerts += "⚠️ Low cache hit rate: $($metrics.cacheHitRate * 100)%"
}

if ($metrics.billyApiCallsThisMonth -gt 8000) {
  $alerts += "⚠️ High API usage: $($metrics.billyApiCallsThisMonth) calls"
}

# Send alerts
if ($alerts.Count -gt 0) {
  Write-Host "=== ALERTS ==="
  $alerts | ForEach-Object { Write-Host $_ }
  
  # TODO: Send email/Slack notification
} else {
  Write-Host "✅ All systems healthy"
}

# Log metrics
$logEntry = @{
  timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  metrics = $metrics
  alerts = $alerts
} | ConvertTo-Json

Add-Content -Path "logs/health-check-$(Get-Date -Format 'yyyy-MM-dd').json" -Value $logEntry
```

**Schedule:** Windows Task Scheduler (daily at 9 AM)

---

### Render.com Native Monitoring

**Alerts to Configure:**

1. **High CPU Usage**
   - Threshold: >80% for 5 minutes
   - Action: Email notification

2. **High Memory Usage**
   - Threshold: >500MB for 5 minutes
   - Action: Email notification

3. **Failed Deployment**
   - Trigger: Build fails
   - Action: Email + rollback

4. **Health Check Failed**
   - Endpoint: `/health`
   - Threshold: 3 failures in 5 min
   - Action: Email + auto-restart

---

## 🔗 Integration with Development Workflow

### Pre-Commit Hooks

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run type check
npm run build || exit 1

# Run tests
npm run test:integration || exit 1

echo "✅ Pre-commit checks passed"
```

---

### Pull Request Checks

**Required Status Checks:**

- ✅ Build succeeds (`npm run build`)
- ✅ Integration tests pass (`npm run test:integration`)
- ✅ Production endpoint healthy
- ✅ No TypeScript errors
- ✅ Code coverage >80% (future)

---

## 📚 Resources

**Guides:**
- `docs/integration/CHATGPT_INTEGRATION_GUIDE.md`
- `docs/SHORTWAVE_INTEGRATION_GUIDE.md`
- `CLAUDE_DESKTOP_SETUP.md`

**Testing:**
- `tests/test-integration.ts` (existing)
- `tests/test-production.ts` (existing)
- `tests/test-billy-api.ts` (existing)

**Monitoring:**
- `docs/operations/SUPABASE_CACHING_SETUP.md`
- `docs/operations/USAGE_PATTERNS_REPORT.md`

---

**🎉 Happy Testing! 🧪**
