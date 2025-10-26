# 🧪 RenOS Deployment Test Script
# Tester alle AI features efter deployment

$API_BASE = "https://api.renos.dk"
$FRONTEND_URL = "https://api.renos.dk"

Write-Host "🚀 RenOS Deployment Test Suite" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Backend Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_BASE/api/health" -Method Get -TimeoutSec 10
    Write-Host "✅ Backend is alive!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Uptime: $($health.uptime)s" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Dashboard Stats
Write-Host "Test 2: Dashboard API..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$API_BASE/api/dashboard/stats" -Method Get -TimeoutSec 10
    Write-Host "✅ Dashboard API working!" -ForegroundColor Green
    Write-Host "   Customers: $($stats.customers)" -ForegroundColor Gray
    Write-Host "   Leads: $($stats.leads)" -ForegroundColor Gray
    Write-Host "   Bookings: $($stats.bookings)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Dashboard API failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Frontend Availability
Write-Host "Test 3: Frontend Loading..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $FRONTEND_URL -Method Get -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is loading!" -ForegroundColor Green
        Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Frontend check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Leads API
Write-Host "Test 4: Leads API..." -ForegroundColor Yellow
try {
    $leads = Invoke-RestMethod -Uri "$API_BASE/api/leads" -Method Get -TimeoutSec 10
    Write-Host "✅ Leads API working!" -ForegroundColor Green
    Write-Host "   Total Leads: $($leads.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Leads API failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Test Lead Processing (Dry Run Check)
Write-Host "Test 5: AI Process Endpoint..." -ForegroundColor Yellow
Write-Host "   ⚠️  Manual test required - create test lead in UI" -ForegroundColor Yellow
Write-Host "   Steps:" -ForegroundColor Gray
Write-Host "   1. Go to $FRONTEND_URL" -ForegroundColor Gray
Write-Host "   2. Navigate to Leads" -ForegroundColor Gray
Write-Host "   3. Create test lead" -ForegroundColor Gray
Write-Host "   4. Click AI Process (⚡ button)" -ForegroundColor Gray
Write-Host "   5. Verify modal shows parsed data" -ForegroundColor Gray
Write-Host "   6. Click Send and check Gmail" -ForegroundColor Gray

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ Automated tests completed!" -ForegroundColor Green
Write-Host "📝 Manual UI testing required for full verification" -ForegroundColor Yellow
Write-Host ""
