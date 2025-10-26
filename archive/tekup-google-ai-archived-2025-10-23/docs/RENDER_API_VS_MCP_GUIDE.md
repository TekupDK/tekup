# Render API vs MCP Server - When to Use What

## 🎯 Overview

RenOS can interact with Render infrastructure in **two complementary ways**:

1. **MCP Server** - Natural language commands in your IDE
2. **REST API** - Programmatic access via HTTP requests

Both use the **same API key** but serve different purposes. This guide helps you choose the right tool for each task.

---

## 🔄 Quick Comparison

| Feature | MCP Server | REST API |
|---------|-----------|----------|
| **Interface** | Natural language in IDE | HTTP endpoints |
| **Use Case** | Interactive development | Automation & scripting |
| **Authentication** | API key in IDE config | Bearer token in headers |
| **Best For** | Ad-hoc queries, debugging | CI/CD, monitoring, bulk ops |
| **Learning Curve** | Minimal (just ask) | Requires API knowledge |
| **Documentation** | AI-assisted | OpenAPI spec |
| **Response Format** | Natural language | JSON |
| **Automation** | Manual prompts | Fully scriptable |

---

## 🤖 MCP Server - Use When

### ✅ Perfect For

**Interactive Development**
```
"Show me the status of tekup-renos"
"Pull error logs from the last hour"
"What's causing the high memory usage?"
```

**Ad-hoc Debugging**
```
"Why isn't my service responding?"
"Show me recent deploy history"
"Are there any health check failures?"
```

**Quick Queries**
```
"Query database for customers created today"
"What's the current response time?"
"How many 5xx errors occurred?"
```

**Learning & Exploration**
```
"What environment variables are set?"
"Show me available metrics"
"Explain the current service configuration"
```

### ❌ Not Ideal For

- Automated CI/CD pipelines
- Scheduled monitoring scripts
- Bulk operations on multiple services
- Integration with external tools
- Programmatic service creation
- Webhook-based workflows

---

## 🔌 REST API - Use When

### ✅ Perfect For

**CI/CD Automation**
```bash
# Trigger deploy after tests pass
curl -X POST "https://api.render.com/v1/services/${SERVICE_ID}/deploys" \
  -H "Authorization: Bearer ${RENDER_API_KEY}"
```

**Monitoring Scripts**
```bash
# Check service health every 5 minutes
curl "https://api.render.com/v1/services/${SERVICE_ID}" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | jq '.service.status'
```

**Infrastructure as Code**
```bash
# Create service from script
curl -X POST "https://api.render.com/v1/services" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @service-config.json
```

**Bulk Operations**
```bash
# Update environment variables for multiple services
for service in "${SERVICES[@]}"; do
  curl -X PUT "https://api.render.com/v1/services/${service}/env-vars" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -d @env-config.json
done
```

**External Integrations**
```bash
# Integrate with Datadog, PagerDuty, etc.
curl "https://api.render.com/v1/services/${SERVICE_ID}/metrics" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  send_to_datadog
```

### ❌ Not Ideal For

- Quick one-off queries during development
- Exploring unfamiliar API endpoints
- Non-technical team members
- Tasks requiring human judgment

---

## 🎨 Use Cases & Recommendations

### Scenario 1: Post-Deployment Verification

**MCP Approach** (Quick & Interactive)
```
User: "Verify the latest deploy of tekup-renos succeeded"
MCP: "✅ Deploy completed successfully at 2025-10-07 14:32 UTC
      - Status: live
      - No errors in last 10 minutes
      - Health checks passing"
```

**REST API Approach** (Automated)
```bash
#!/bin/bash
# post-deploy-check.sh

SERVICE_ID="srv-xxxxx"
RESPONSE=$(curl -s "https://api.render.com/v1/services/${SERVICE_ID}/deploys" \
  -H "Authorization: Bearer ${RENDER_API_KEY}")

STATUS=$(echo $RESPONSE | jq -r '.deploys[0].status')

if [ "$STATUS" != "live" ]; then
  echo "❌ Deploy failed!"
  exit 1
fi

echo "✅ Deploy successful"
```

**Recommendation**: Use MCP for manual verification, REST API for automated CI/CD checks.

---

### Scenario 2: Database Queries

**MCP Approach** (Natural Language)
```
"Query the database for customers created this week"
"Show me the top 5 customers by lead count"
"What's the average booking value?"
```

**REST API Approach** (Programmatic)
```bash
# Execute SQL query
curl -X POST "https://api.render.com/v1/postgres/databases/${DB_ID}/query" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM customers WHERE created_at > NOW() - INTERVAL '\''7 days'\''"
  }'
```

**Recommendation**: Use MCP for ad-hoc analytics, REST API for scheduled reports.

---

### Scenario 3: Environment Variable Management

**MCP Approach** (Quick Updates)
```
"Add FEATURE_FLAG_NEW_UI=true to tekup-renos"
"What's the current DATABASE_URL?"
"List all environment variables"
```

**REST API Approach** (Bulk Updates)
```bash
# Update multiple env vars at once
curl -X PUT "https://api.render.com/v1/services/${SERVICE_ID}/env-vars" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '[
    {"key": "FEATURE_FLAG_NEW_UI", "value": "true"},
    {"key": "LOG_LEVEL", "value": "debug"},
    {"key": "RATE_LIMIT", "value": "1000"}
  ]'
```

**Recommendation**: Use MCP for single var changes, REST API for bulk operations.

---

### Scenario 4: Log Analysis

**MCP Approach** (Interactive Exploration)
```
"Show me error logs from the last hour"
"What's the most common error message?"
"Filter logs for customer ID 12345"
```

**REST API Approach** (Automated Monitoring)
```bash
# Monitor for critical errors
while true; do
  ERRORS=$(curl -s "https://api.render.com/v1/services/${SERVICE_ID}/logs?level=error&limit=100" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" | jq '.logs | length')
  
  if [ "$ERRORS" -gt 10 ]; then
    echo "⚠️ High error rate: $ERRORS errors detected"
    # Send alert to Slack, PagerDuty, etc.
  fi
  
  sleep 300  # Check every 5 minutes
done
```

**Recommendation**: Use MCP for debugging, REST API for monitoring alerts.

---

## 🛠️ RenOS-Specific Recommendations

### For Developers

**Daily Workflow** - Use MCP
```
Morning:
- "Show status of all RenOS services"
- "Any errors overnight?"
- "What's the current customer count?"

During Development:
- "What's the response time after my deploy?"
- "Show me logs for the last 10 minutes"
- "Query database for test customers"

Before Going Home:
- "Any health check failures?"
- "What's the deploy status?"
```

### For DevOps/CI/CD - Use REST API

**Automated Deployment Pipeline**
```bash
# .github/workflows/deploy.yml
- name: Trigger Render Deploy
  run: |
    curl -X POST "https://api.render.com/v1/services/${{ secrets.SERVICE_ID }}/deploys" \
      -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"

- name: Wait for Deploy
  run: ./scripts/wait-for-deploy.sh

- name: Run Smoke Tests
  run: ./scripts/smoke-test.sh
```

**Monitoring Script (Cron Job)**
```bash
# /etc/cron.d/render-monitor
*/5 * * * * /opt/scripts/check-render-health.sh
```

### For Data Analysis - Use Both

**Interactive Exploration** (MCP)
```
"What were our top performing services last month?"
"Show me customer growth trends"
"Which services had the most errors?"
```

**Scheduled Reports** (REST API)
```bash
# Daily report generation
#!/bin/bash
# daily-report.sh

# Fetch metrics
METRICS=$(curl "https://api.render.com/v1/services/${SERVICE_ID}/metrics" \
  -H "Authorization: Bearer ${RENDER_API_KEY}")

# Generate report
echo "$METRICS" | jq -r '...' > daily-report-$(date +%Y-%m-%d).json

# Email to team
mail -s "Daily RenOS Metrics" team@rendetalje.dk < report.html
```

---

## 🔐 Authentication Setup

Both MCP and REST API use the **same API key**:

### 1. Create API Key (Once)

1. Go to [Render Account Settings](https://dashboard.render.com/account/api-keys)
2. Click "Create API Key"
3. Name: `RenOS Integration - [Your Name]`
4. Copy and save securely

### 2. Configure MCP (For IDE)

```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

### 3. Configure REST API (For Scripts)

```bash
# In .env (DON'T COMMIT!)
RENDER_API_KEY=your_api_key_here

# Or use GitHub Secrets for CI/CD
# Settings > Secrets > Actions > New repository secret
```

---

## 📊 Feature Comparison Matrix

| Operation | MCP | REST API | Best Choice |
|-----------|-----|----------|-------------|
| List services | ✅ | ✅ | MCP (simpler) |
| Create service | ✅ | ✅ | REST (automation) |
| Deploy trigger | ❌ | ✅ | REST (only option) |
| View logs | ✅ | ✅ | MCP (better filtering) |
| Query database | ✅ | ✅ | MCP (natural language) |
| Update env vars | ✅ | ✅ | REST (bulk ops) |
| Metrics analysis | ✅ | ✅ | MCP (ad-hoc), REST (scheduled) |
| Service status | ✅ | ✅ | MCP (during dev) |
| Webhooks | ❌ | ✅* | REST (requires Pro) |
| Rollback | ❌ | ✅ | REST (only option) |

*Webhooks require Render Pro plan

---

## 🚀 Getting Started

### Option 1: Start with MCP (Easiest)

1. Follow [RENDER_MCP_QUICK_SETUP.md](./RENDER_MCP_QUICK_SETUP.md)
2. Practice with example commands
3. Graduate to REST API when needed

### Option 2: Start with REST API (For Automation)

1. Create API key
2. Test with curl: `curl "https://api.render.com/v1/services" -H "Authorization: Bearer $KEY"`
3. Read API docs: <https://api-docs.render.com/>
4. Build your scripts

### Option 3: Use Both (Recommended)

1. Set up MCP for daily development
2. Use REST API for CI/CD and monitoring
3. Leverage strengths of each approach

---

## 📚 Additional Resources

### MCP Server
- [RENDER_MCP_INTEGRATION.md](./RENDER_MCP_INTEGRATION.md) - Full MCP guide
- [RENDER_MCP_QUICK_SETUP.md](./RENDER_MCP_QUICK_SETUP.md) - 5-minute setup
- [Render MCP Docs](https://docs.render.com/mcp)

### REST API
- [Render API Reference](https://api-docs.render.com/)
- [OpenAPI Spec](https://api-docs.render.com/openapi/6140fb3daeae351056086186)
- [API Authentication](https://docs.render.com/api)

### RenOS-Specific
- [.github/copilot-instructions.md](../.github/copilot-instructions.md) - Development guide
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment procedures

---

## 💡 Pro Tips

### Tip 1: Share API Key Carefully
- Use same key for both MCP and REST API
- Store in password manager
- Rotate every 90 days
- Never commit to Git

### Tip 2: Start Interactive, Automate Later
1. Use MCP to explore and understand
2. Once you know what you need, script it with REST API
3. Best of both worlds!

### Tip 3: Combine Both in Workflows
```bash
# Use REST API for automation
DEPLOY_ID=$(curl -X POST "..." | jq -r '.deploy.id')

# Then check with MCP
echo "Check status with: 'Show deploy status for ${DEPLOY_ID}'"
```

### Tip 4: Use REST API for Webhooks
- Webhooks require REST API (no MCP equivalent)
- Requires Render Pro plan
- Great for Slack notifications, CI/CD triggers

### Tip 5: Document Your Scripts
```bash
#!/bin/bash
# deploy-and-verify.sh
# 
# This script:
# 1. Triggers deploy via REST API
# 2. Waits for completion
# 3. Runs smoke tests
# 4. Notifies team
#
# For interactive debugging, use MCP:
# "Show deploy status for tekup-renos"
```

---

## 🔍 Decision Tree

```
Need to interact with Render?
│
├─ Is it during active development?
│  ├─ YES → Use MCP Server (natural language in IDE)
│  └─ NO → Continue below
│
├─ Is it a one-time query or check?
│  ├─ YES → Use MCP Server (quick and easy)
│  └─ NO → Continue below
│
├─ Does it need to be automated?
│  ├─ YES → Use REST API (scriptable)
│  └─ NO → Use MCP Server
│
├─ Is it part of CI/CD pipeline?
│  └─ YES → Use REST API (required)
│
├─ Is it triggered by external events?
│  └─ YES → Use REST API + Webhooks (Pro plan)
│
└─ Still unsure?
   └─ Default to MCP Server, script with REST API if repeated often
```

---

**Last Updated**: October 7, 2025  
**Status**: ✅ Production ready  
**Maintainer**: RenOS DevOps Team
