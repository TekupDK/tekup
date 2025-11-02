# Friday AI Testing Guide

## 🎯 Overview

This guide explains how to test Friday AI's functionality, including prompt engineering, chat scenarios, and tool integration.

## 📋 Prerequisites

- Node.js 18+
- npm or pnpm
- Google MCP service running (for Gmail/Calendar integration)
- Environment variables configured

## 🚀 Quick Start

### 1. Start the Service

```bash
cd services/tekup-ai/packages/inbox-orchestrator
npm install
npm run dev
```

The service will start on `http://localhost:3011`

### 2. Run Automated Tests

```bash
# Run unit tests
npm test

# Run chat integration tests
./test-friday-chat.sh
```

### 3. Manual Testing

Use curl or Postman to test endpoints:

```bash
# Health check
curl http://localhost:3011/health

# Send a chat message
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hvad har vi fået af nye leads i dag?"}'

# Get metrics
curl http://localhost:3011/metrics

# Export metrics
curl -O http://localhost:3011/metrics/export
```

## 🧪 Test Scenarios

### Scenario 1: Lead Processing
Tests intent detection and lead retrieval from Gmail.

```bash
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hvad har vi fået af nye leads i dag?"}'
```

**Expected:**
- Intent: `lead_processing`
- Gmail search executed
- Leads parsed and formatted
- Response includes lead summary

### Scenario 2: Booking Management
Tests calendar integration and booking creation.

```bash
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Jeg vil gerne booke en rengøring på fredag"}'
```

**Expected:**
- Intent: `booking`
- Calendar checked for availability
- Available time slots suggested
- Booking creation guidance

### Scenario 3: Quote Generation
Tests quote template and pricing logic.

```bash
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Lav et tilbud til en kunde med 120m² lejlighed"}'
```

**Expected:**
- Intent: `quote_generation`
- Quote template applied (MEMORY_11)
- Pricing calculated (349kr/time/person)
- Calendar checked for available dates

### Scenario 4: Conflict Resolution
Tests customer complaint handling.

```bash
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Kunden klager over prisen og vil have rabat"}'
```

**Expected:**
- Intent: `conflict_resolution`
- MEMORY_9 applied (acknowledge, compensate, resolve)
- Professional response with solution

### Scenario 5: Calendar Queries
Tests calendar integration for task overview.

```bash
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hvad er vores opgaver i dag?"}'
```

**Expected:**
- Intent: `calendar_query`
- Calendar events retrieved
- Tasks formatted and listed
- Time-sensitive items highlighted

### Scenario 6: Follow-up Management
Tests lead follow-up logic.

```bash
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Følg op på de tilbud vi sendte sidste uge"}'
```

**Expected:**
- Intent: `follow_up`
- MEMORY_10 applied
- Leads with status "Venter på svar" identified
- Follow-up templates suggested

### Scenario 7: Complex Multi-Intent
Tests multiple intents in one message.

```bash
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Jeg vil gerne tjekke vores nye leads fra Rengøring.nu i dag og lave tilbud til dem"}'
```

**Expected:**
- Primary intent detected
- Multiple actions executed
- Lead search + quote generation
- Coordinated response

## 🔧 Tool Integration Testing

### Gmail MCP Tool

```bash
# Test Gmail search
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Søg efter emails med ordet \"tilbud\" fra i går"}'
```

**Verifies:**
- Gmail MCP connection
- Search functionality
- Thread parsing
- Lead extraction

### Calendar MCP Tool

```bash
# Test calendar lookup
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hvad er der planlagt i morgen?"}'
```

**Verifies:**
- Calendar MCP connection
- Event retrieval
- Time zone handling
- Conflict detection

### Billy Integration (Future)

Currently stubbed, but will test:
- Invoice creation
- Payment tracking
- Customer billing

## 📊 Metrics and Monitoring

### View Real-time Metrics

```bash
curl http://localhost:3011/metrics
```

Returns:
- Total requests
- Average tokens used
- Average latency
- Total cost (DKK)
- Success rate
- Requests by intent

### Export Metrics for Analysis

```bash
curl -O http://localhost:3011/metrics/export
```

Downloads: `friday-ai-metrics-{timestamp}.json`

### Monitor Live

```bash
watch -n 5 'curl -s http://localhost:3011/metrics | jq .'
```

## 🎓 Prompt Engineering

### System Prompt Structure

Located in `src/promptTraining.ts`:

```typescript
export const SYSTEM_PROMPT = `Du er Friday - en intelligent assistent...`
```

**Key Components:**
1. **Identity & Role**: Who Friday is
2. **24 Critical Memories**: Business rules and logic
3. **Output Format**: Response structure
4. **Examples**: Training cases

### Intent Detection

Located in `src/utils/intentDetector.ts`:

**Supported Intents:**
- `lead_processing`: New lead management
- `booking`: Calendar and scheduling
- `quote_generation`: Price quotes and estimates
- `conflict_resolution`: Customer complaints
- `follow_up`: Lead follow-ups
- `calendar_query`: Task and event queries
- `general`: General help
- `unknown`: Fallback

**Testing Intent Detection:**

```bash
# Should detect as lead_processing
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "nye leads"}'

# Should detect as conflict_resolution
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "kunden klager"}'
```

### Memory System

24 critical memories control Friday's behavior:

- **MEMORY_1**: Time validation
- **MEMORY_2**: Lead system workflow
- **MEMORY_3**: Customer service approach
- **MEMORY_4**: Lead system communication
- **MEMORY_5**: Calendar check rules
- **MEMORY_6**: Calendar systematization
- **MEMORY_7**: Email search first
- **MEMORY_8**: Overtime communication
- **MEMORY_9**: Conflict resolution
- **MEMORY_10**: Lead follow-up
- **MEMORY_11**: Quote format
- **MEMORY_12-24**: Business intelligence, tech stack

**Testing Specific Memories:**

```bash
# Test MEMORY_7 (search before send)
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Send tilbud til ny kunde"}'
# Should search existing emails first

# Test MEMORY_11 (quote format)
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Lav tilbud 120m²"}'
# Should include: bolig, medarbejdere, tid, pris, ledige tider
```

## 🐛 Error Handling Tests

### Test Validation

```bash
# Empty message (should return 400)
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'

# Too long message (should return 400)
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "'$(printf 'a%.0s' {1..5001})'"}'

# Invalid JSON (should return 400)
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

### Test Timeout Protection

```bash
# Simulate slow Gmail response (requires MCP service to be slow)
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Søg efter alle emails fra sidste måned"}'
# Should timeout after 30s with proper error
```

### Test Error Recovery

```bash
# Gmail service down
# Stop Gmail MCP service, then:
curl -X POST http://localhost:3011/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hvad har vi fået af nye leads i dag?"}'
# Should return graceful error message
```

## 📈 Performance Testing

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Create artillery config
cat > artillery-config.yml << EOF
config:
  target: 'http://localhost:3011'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - flow:
      - post:
          url: "/chat"
          json:
            message: "Hvad har vi fået af nye leads i dag?"
EOF

# Run load test
artillery run artillery-config.yml
```

### Token Usage Analysis

```bash
# Run multiple tests and export metrics
for i in {1..100}; do
  curl -s -X POST http://localhost:3011/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "test message '$i'"}' > /dev/null
done

# Export and analyze
curl http://localhost:3011/metrics/export -o metrics.json
jq '.[] | {tokens: .totalTokens, latency: .latency, cost: .cost}' metrics.json
```

## 🔍 Debugging

### Enable Debug Mode

```bash
DEBUG=true npm run dev
```

Shows intent detection details:
```
[Friday AI] Intent: lead_processing, Memories: MEMORY_1, MEMORY_2, MEMORY_7
```

### Check Logs

```bash
# View service logs
npm run dev 2>&1 | tee friday-ai.log

# Search for errors
grep "error" friday-ai.log

# Search for specific intent
grep "intent: conflict_resolution" friday-ai.log
```

### Inspect Metrics Storage

```bash
# Get current metrics
curl http://localhost:3011/metrics | jq '.requestsByIntent'

# See average performance
curl http://localhost:3011/metrics | jq '{
  avgTokens: .averageTokens,
  avgLatency: .averageLatency,
  successRate: .successRate
}'
```

## ✅ Test Checklist

Before deploying to production, verify:

- [ ] All intents detected correctly
- [ ] Gmail MCP integration working
- [ ] Calendar MCP integration working
- [ ] Request validation working (empty, too long)
- [ ] Timeout protection working (30s)
- [ ] Error handling graceful
- [ ] Metrics endpoints accessible
- [ ] Health check returning OK
- [ ] Quote format follows MEMORY_11
- [ ] Conflict resolution follows MEMORY_9
- [ ] Email search happens before send (MEMORY_7)
- [ ] Time validation working (MEMORY_1)
- [ ] Calendar check before suggestions (MEMORY_5)
- [ ] Response format is Danish
- [ ] Tokens within budget (<300 per request)
- [ ] Latency under 5 seconds
- [ ] No sensitive data in logs

## 📚 Additional Resources

- **Prompt Engineering**: `FRIDAY_AI_PROMPT_ENGINEERING.md`
- **Deployment Guide**: `RAILWAY_DEPLOYMENT_SUCCESS.md`
- **API Documentation**: `README.md`
- **Test Scenarios**: `test-scenarios.json`
- **Memory Rules**: `src/memoryRules.ts`

## 🆘 Troubleshooting

### Issue: "Gmail MCP not responding"
**Solution**: 
1. Check if MCP service is running
2. Verify GOOGLE_MCP_URL env var
3. Check network connectivity

### Issue: "Intent not detected correctly"
**Solution**:
1. Review intent keywords in `src/utils/intentDetector.ts`
2. Add more keywords if needed
3. Test with different phrasings

### Issue: "Response too slow"
**Solution**:
1. Check metrics: `curl http://localhost:3011/metrics`
2. Look for high latency in specific operations
3. Consider caching frequently accessed data

### Issue: "Tests failing"
**Solution**:
1. Run: `npm test -- --verbose`
2. Check specific test output
3. Verify test expectations align with current behavior

## 🚀 Next Steps

1. Run automated test suite: `./test-friday-chat.sh`
2. Review test results and metrics
3. Test each scenario manually
4. Monitor performance in production
5. Iterate on prompt based on real usage
