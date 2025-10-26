# Render REST API - Practical Examples for RenOS

## 🎯 Quick Reference Scripts

This document contains ready-to-use REST API scripts for common RenOS operations.

**Prerequisites:**
- API key created: [https://dashboard.render.com/account/api-keys](https://dashboard.render.com/account/api-keys)
- `jq` installed for JSON parsing: `choco install jq` (Windows) or `brew install jq` (Mac)

---

## 🔐 Setup

### Set Your API Key

```powershell
# PowerShell (Windows)
$env:RENDER_API_KEY = "your_api_key_here"

# Verify it's set
$env:RENDER_API_KEY
```

```bash
# Bash (Mac/Linux)
export RENDER_API_KEY="your_api_key_here"

# Verify it's set
echo $RENDER_API_KEY
```

### Find Your Service IDs

```powershell
# PowerShell
curl.exe -s "https://api.render.com/v1/services?limit=50" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty services | `
  Select-Object id, name, type | `
  Format-Table
```

```bash
# Bash
curl -s "https://api.render.com/v1/services?limit=50" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq -r '.services[] | "\(.id) - \(.name) (\(.type))"'
```

**Save these IDs:**
- Backend: `tekup-renos` → `srv-xxxxx`
- Frontend: `tekup-renos-frontend` → `srv-yyyyy`
- Database: `rendetalje-db` → `dpg-zzzzz`

---

## 📊 Service Management

### 1. Get Service Status

```powershell
# PowerShell
$SERVICE_ID = "srv-xxxxx"
curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty service | `
  Select-Object name, type, serviceDetails
```

```bash
# Bash
SERVICE_ID="srv-xxxxx"
curl -s "https://api.render.com/v1/services/${SERVICE_ID}" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.service | {name, type, serviceDetails}'
```

### 2. List All Services

```powershell
# PowerShell - Show all RenOS services
curl.exe -s "https://api.render.com/v1/services?limit=50" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty services | `
  Where-Object { $_.name -like "*tekup*" -or $_.name -like "*rendetalje*" } | `
  Format-Table id, name, type, serviceDetails
```

```bash
# Bash - Show all RenOS services
curl -s "https://api.render.com/v1/services?limit=50" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.services[] | select(.name | test("tekup|rendetalje")) | {id, name, type, serviceDetails}'
```

### 3. Check Service Health

```powershell
# PowerShell
$SERVICE_ID = "srv-xxxxx"
curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty service | `
  Select-Object -ExpandProperty serviceDetails | `
  Select-Object healthCheckPath, healthCheckStatus
```

```bash
# Bash
SERVICE_ID="srv-xxxxx"
curl -s "https://api.render.com/v1/services/${SERVICE_ID}" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.service.serviceDetails | {healthCheckPath, healthCheckStatus}'
```

---

## 🚀 Deploy Management

### 4. List Recent Deploys

```powershell
# PowerShell - Last 5 deploys
$SERVICE_ID = "srv-xxxxx"
curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID/deploys?limit=5" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty deploys | `
  Format-Table id, status, createdAt, finishedAt
```

```bash
# Bash - Last 5 deploys
SERVICE_ID="srv-xxxxx"
curl -s "https://api.render.com/v1/services/${SERVICE_ID}/deploys?limit=5" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.deploys[] | {id, status, createdAt, finishedAt}'
```

### 5. Get Deploy Details

```powershell
# PowerShell
$SERVICE_ID = "srv-xxxxx"
$DEPLOY_ID = "dep-xxxxx"
curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty deploy
```

```bash
# Bash
SERVICE_ID="srv-xxxxx"
DEPLOY_ID="dep-xxxxx"
curl -s "https://api.render.com/v1/services/${SERVICE_ID}/deploys/${DEPLOY_ID}" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.deploy'
```

### 6. Trigger Manual Deploy

```powershell
# PowerShell
$SERVICE_ID = "srv-xxxxx"
curl.exe -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{"clearCache": "do_not_clear"}'
```

```bash
# Bash
SERVICE_ID="srv-xxxxx"
curl -X POST "https://api.render.com/v1/services/${SERVICE_ID}/deploys" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"clearCache": "do_not_clear"}'
```

---

## 📝 Environment Variables

### 7. List Environment Variables

```powershell
# PowerShell
$SERVICE_ID = "srv-xxxxx"
curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID/env-vars" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty envVars | `
  Format-Table key, value
```

```bash
# Bash
SERVICE_ID="srv-xxxxx"
curl -s "https://api.render.com/v1/services/${SERVICE_ID}/env-vars" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.envVars[] | {key, value}'
```

### 8. Update Single Environment Variable

```powershell
# PowerShell
$SERVICE_ID = "srv-xxxxx"
$ENV_KEY = "RUN_MODE"
$ENV_VALUE = "live"

curl.exe -X PUT "https://api.render.com/v1/services/$SERVICE_ID/env-vars/$ENV_KEY" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" `
  -H "Content-Type: application/json" `
  -d "{`"value`": `"$ENV_VALUE`"}"
```

```bash
# Bash
SERVICE_ID="srv-xxxxx"
ENV_KEY="RUN_MODE"
ENV_VALUE="live"

curl -X PUT "https://api.render.com/v1/services/${SERVICE_ID}/env-vars/${ENV_KEY}" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"value\": \"${ENV_VALUE}\"}"
```

### 9. Bulk Update Environment Variables

```powershell
# PowerShell
$SERVICE_ID = "srv-xxxxx"
$ENV_VARS = @'
[
  {"key": "FEATURE_FLAG_NEW_UI", "value": "true"},
  {"key": "LOG_LEVEL", "value": "info"},
  {"key": "MAX_CONNECTIONS", "value": "100"}
]
'@

curl.exe -X PUT "https://api.render.com/v1/services/$SERVICE_ID/env-vars" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" `
  -H "Content-Type: application/json" `
  -d $ENV_VARS
```

```bash
# Bash
SERVICE_ID="srv-xxxxx"
curl -X PUT "https://api.render.com/v1/services/${SERVICE_ID}/env-vars" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '[
    {"key": "FEATURE_FLAG_NEW_UI", "value": "true"},
    {"key": "LOG_LEVEL", "value": "info"},
    {"key": "MAX_CONNECTIONS", "value": "100"}
  ]'
```

---

## 📊 Logs & Monitoring

### 10. Get Recent Logs

```powershell
# PowerShell - Last 100 log entries
$SERVICE_ID = "srv-xxxxx"
curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID/logs?limit=100" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty logs | `
  Format-Table timestamp, message
```

```bash
# Bash - Last 100 log entries
SERVICE_ID="srv-xxxxx"
curl -s "https://api.render.com/v1/services/${SERVICE_ID}/logs?limit=100" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.logs[] | {timestamp, message}'
```

### 11. Filter Error Logs

```powershell
# PowerShell - Only error level logs
$SERVICE_ID = "srv-xxxxx"
curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID/logs?level=error&limit=50" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty logs | `
  Format-Table timestamp, message
```

```bash
# Bash - Only error level logs
SERVICE_ID="srv-xxxxx"
curl -s "https://api.render.com/v1/services/${SERVICE_ID}/logs?level=error&limit=50" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.logs[] | {timestamp, message}'
```

### 12. Search Logs by Text

```powershell
# PowerShell - Search for specific text
$SERVICE_ID = "srv-xxxxx"
$SEARCH_TERM = "database connection"
curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID/logs?text=$SEARCH_TERM&limit=50" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty logs | `
  Format-Table timestamp, message
```

```bash
# Bash - Search for specific text
SERVICE_ID="srv-xxxxx"
SEARCH_TERM="database connection"
curl -s "https://api.render.com/v1/services/${SERVICE_ID}/logs?text=${SEARCH_TERM}&limit=50" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.logs[] | {timestamp, message}'
```

---

## 💾 Database Operations

### 13. List Databases

```powershell
# PowerShell
curl.exe -s "https://api.render.com/v1/postgres" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty databases | `
  Format-Table id, name, status
```

```bash
# Bash
curl -s "https://api.render.com/v1/postgres" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.databases[] | {id, name, status}'
```

### 14. Get Database Details

```powershell
# PowerShell
$DB_ID = "dpg-xxxxx"
curl.exe -s "https://api.render.com/v1/postgres/$DB_ID" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty database
```

```bash
# Bash
DB_ID="dpg-xxxxx"
curl -s "https://api.render.com/v1/postgres/${DB_ID}" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.database'
```

### 15. Get Database Connection Info

```powershell
# PowerShell
$DB_ID = "dpg-xxxxx"
curl.exe -s "https://api.render.com/v1/postgres/$DB_ID" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json | `
  Select-Object -ExpandProperty database | `
  Select-Object connectionInfo
```

```bash
# Bash
DB_ID="dpg-xxxxx"
curl -s "https://api.render.com/v1/postgres/${DB_ID}" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.database.connectionInfo'
```

---

## 📈 Metrics (Requires Query Parameters)

### 16. Get CPU Metrics

```powershell
# PowerShell - Last 24 hours of CPU usage
$SERVICE_ID = "srv-xxxxx"
$START_TIME = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ssZ")
$END_TIME = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")

curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID/metrics/cpu?start=$START_TIME&end=$END_TIME&step=3600" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json
```

```bash
# Bash - Last 24 hours of CPU usage
SERVICE_ID="srv-xxxxx"
START_TIME=$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%SZ)
END_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

curl -s "https://api.render.com/v1/services/${SERVICE_ID}/metrics/cpu?start=${START_TIME}&end=${END_TIME}&step=3600" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.metrics'
```

### 17. Get Memory Metrics

```powershell
# PowerShell
$SERVICE_ID = "srv-xxxxx"
$START_TIME = (Get-Date).AddHours(-6).ToString("yyyy-MM-ddTHH:mm:ssZ")
$END_TIME = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")

curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID/metrics/memory?start=$START_TIME&end=$END_TIME&step=1800" `
  -H "Authorization: Bearer $env:RENDER_API_KEY" | `
  ConvertFrom-Json
```

```bash
# Bash
SERVICE_ID="srv-xxxxx"
START_TIME=$(date -u -d '6 hours ago' +%Y-%m-%dT%H:%M:%SZ)
END_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

curl -s "https://api.render.com/v1/services/${SERVICE_ID}/metrics/memory?start=${START_TIME}&end=${END_TIME}&step=1800" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | \
  jq '.metrics'
```

---

## 🛠️ Utility Scripts

### 18. Health Check All RenOS Services

```powershell
# PowerShell - check-health.ps1
$SERVICES = @("srv-backend-id", "srv-frontend-id")

foreach ($SERVICE_ID in $SERVICES) {
    $SERVICE = curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID" `
        -H "Authorization: Bearer $env:RENDER_API_KEY" | `
        ConvertFrom-Json | Select-Object -ExpandProperty service
    
    Write-Host "$($SERVICE.name): $($SERVICE.serviceDetails.healthCheckStatus)" `
        -ForegroundColor $(if ($SERVICE.serviceDetails.healthCheckStatus -eq "healthy") { "Green" } else { "Red" })
}
```

```bash
#!/bin/bash
# check-health.sh

SERVICES=("srv-backend-id" "srv-frontend-id")

for SERVICE_ID in "${SERVICES[@]}"; do
  HEALTH=$(curl -s "https://api.render.com/v1/services/${SERVICE_ID}" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" | \
    jq -r '.service | "\(.name): \(.serviceDetails.healthCheckStatus)"')
  
  echo "$HEALTH"
done
```

### 19. Monitor Deploy Status

```powershell
# PowerShell - wait-for-deploy.ps1
param(
    [string]$ServiceId,
    [string]$DeployId
)

do {
    $DEPLOY = curl.exe -s "https://api.render.com/v1/services/$ServiceId/deploys/$DeployId" `
        -H "Authorization: Bearer $env:RENDER_API_KEY" | `
        ConvertFrom-Json | Select-Object -ExpandProperty deploy
    
    Write-Host "Deploy status: $($DEPLOY.status)"
    
    if ($DEPLOY.status -eq "live") {
        Write-Host "✅ Deploy successful!" -ForegroundColor Green
        break
    }
    elseif ($DEPLOY.status -eq "failed") {
        Write-Host "❌ Deploy failed!" -ForegroundColor Red
        exit 1
    }
    
    Start-Sleep -Seconds 30
} while ($true)
```

```bash
#!/bin/bash
# wait-for-deploy.sh

SERVICE_ID=$1
DEPLOY_ID=$2

while true; do
  STATUS=$(curl -s "https://api.render.com/v1/services/${SERVICE_ID}/deploys/${DEPLOY_ID}" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" | \
    jq -r '.deploy.status')
  
  echo "Deploy status: ${STATUS}"
  
  if [ "$STATUS" == "live" ]; then
    echo "✅ Deploy successful!"
    exit 0
  elif [ "$STATUS" == "failed" ]; then
    echo "❌ Deploy failed!"
    exit 1
  fi
  
  sleep 30
done
```

### 20. Daily Status Report

```powershell
# PowerShell - daily-report.ps1
$REPORT_DATE = Get-Date -Format "yyyy-MM-dd"
$SERVICES = @("srv-backend-id", "srv-frontend-id")

Write-Host "`n=== RenOS Daily Status Report - $REPORT_DATE ===" -ForegroundColor Cyan

foreach ($SERVICE_ID in $SERVICES) {
    $SERVICE = curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID" `
        -H "Authorization: Bearer $env:RENDER_API_KEY" | `
        ConvertFrom-Json | Select-Object -ExpandProperty service
    
    $DEPLOYS = curl.exe -s "https://api.render.com/v1/services/$SERVICE_ID/deploys?limit=5" `
        -H "Authorization: Bearer $env:RENDER_API_KEY" | `
        ConvertFrom-Json | Select-Object -ExpandProperty deploys
    
    Write-Host "`n📦 $($SERVICE.name)" -ForegroundColor Yellow
    Write-Host "   Status: $($SERVICE.serviceDetails.healthCheckStatus)"
    Write-Host "   Recent deploys: $($DEPLOYS.Count)"
    Write-Host "   Last deploy: $($DEPLOYS[0].createdAt)"
}
```

```bash
#!/bin/bash
# daily-report.sh

REPORT_DATE=$(date +%Y-%m-%d)
SERVICES=("srv-backend-id" "srv-frontend-id")

echo -e "\n=== RenOS Daily Status Report - ${REPORT_DATE} ==="

for SERVICE_ID in "${SERVICES[@]}"; do
  SERVICE=$(curl -s "https://api.render.com/v1/services/${SERVICE_ID}" \
    -H "Authorization: Bearer ${RENDER_API_KEY}")
  
  NAME=$(echo "$SERVICE" | jq -r '.service.name')
  HEALTH=$(echo "$SERVICE" | jq -r '.service.serviceDetails.healthCheckStatus')
  
  LAST_DEPLOY=$(curl -s "https://api.render.com/v1/services/${SERVICE_ID}/deploys?limit=1" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" | \
    jq -r '.deploys[0].createdAt')
  
  echo -e "\n📦 ${NAME}"
  echo "   Status: ${HEALTH}"
  echo "   Last deploy: ${LAST_DEPLOY}"
done
```

---

## 📚 Additional Resources

- [Render API Reference](https://api-docs.render.com/)
- [OpenAPI Spec](https://api-docs.render.com/openapi/6140fb3daeae351056086186)
- [RENDER_API_VS_MCP_GUIDE.md](./RENDER_API_VS_MCP_GUIDE.md) - When to use REST API vs MCP

---

**Last Updated**: October 7, 2025  
**Status**: ✅ Ready to use  
**Maintainer**: RenOS DevOps Team
