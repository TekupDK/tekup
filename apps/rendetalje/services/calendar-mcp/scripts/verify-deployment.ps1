# RenOS Calendar MCP - Deployment Verification
# Tests all deployed endpoints and integrations

Write-Host "=== Deployment Verification ===" -ForegroundColor Magenta
Write-Host ""

$tests = @()
$backendUrl = "https://renos-calendar-mcp.onrender.com"
$dashboardUrl = "https://renos-calendar-dashboard.onrender.com"

# Test 1: Backend health
Write-Host "Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod "$backendUrl/health" -TimeoutSec 10
    $status = $health.status -eq "ok"
    $tests += @{ Name = "Backend Health"; Status = $status; Details = $health.status }
    if ($status) {
        Write-Host "✓ Backend is healthy" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend health check failed" -ForegroundColor Red
    }
} catch {
    $tests += @{ Name = "Backend Health"; Status = $false; Details = $_.Exception.Message }
    Write-Host "✗ Backend not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Tools endpoint
Write-Host "Testing tools endpoint..." -ForegroundColor Yellow
try {
    $tools = Invoke-RestMethod "$backendUrl/tools" -TimeoutSec 10
    $status = $tools.tools.Count -eq 5
    $tests += @{ Name = "Tools Endpoint"; Status = $status; Details = "$($tools.tools.Count) tools" }
    if ($status) {
        Write-Host "✓ All 5 tools available" -ForegroundColor Green
    } else {
        Write-Host "✗ Expected 5 tools, found $($tools.tools.Count)" -ForegroundColor Red
    }
} catch {
    $tests += @{ Name = "Tools Endpoint"; Status = $false; Details = $_.Exception.Message }
    Write-Host "✗ Tools endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Dashboard loads
Write-Host "Testing dashboard..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest $dashboardUrl -TimeoutSec 10 -UseBasicParsing
    $status = $response.StatusCode -eq 200
    $tests += @{ Name = "Dashboard"; Status = $status; Details = "HTTP $($response.StatusCode)" }
    if ($status) {
        Write-Host "✓ Dashboard loads successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Dashboard returned HTTP $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    $tests += @{ Name = "Dashboard"; Status = $false; Details = $_.Exception.Message }
    Write-Host "✗ Dashboard not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Supabase connection (if health/supabase endpoint exists)
Write-Host "Testing Supabase connection..." -ForegroundColor Yellow
try {
    $supabase = Invoke-RestMethod "$backendUrl/health/supabase" -TimeoutSec 10
    $status = $supabase.connected -eq $true
    $tests += @{ Name = "Supabase Connection"; Status = $status; Details = "Connected: $($supabase.connected)" }
    if ($status) {
        Write-Host "✓ Supabase connected" -ForegroundColor Green
    } else {
        Write-Host "✗ Supabase connection failed" -ForegroundColor Red
    }
} catch {
    $tests += @{ Name = "Supabase Connection"; Status = $false; Details = "Endpoint not available" }
    Write-Host "⚠ Supabase health endpoint not implemented (optional)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "  Verification Results" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta
Write-Host ""

foreach ($test in $tests) {
    $status = if ($test.Status) { "PASS" } else { "FAIL" }
    $color = if ($test.Status) { "Green" } else { "Red" }
    $name = $test.Name.PadRight(25)
    $details = $test.Details
    Write-Host "$name : $status" -ForegroundColor $color -NoNewline
    if ($details) {
        Write-Host " ($details)" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

Write-Host ""

$passedCount = ($tests | Where-Object { $_.Status }).Count
$totalCount = $tests.Count
$allPassed = $passedCount -eq $totalCount

if ($allPassed) {
    Write-Host "All tests PASSED! ($passedCount/$totalCount)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deployment successful! 🎉" -ForegroundColor Green
} else {
    Write-Host "Some tests FAILED ($passedCount/$totalCount passed)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check Render logs: render logs --service renos-calendar-mcp --tail" -ForegroundColor White
    Write-Host "  2. Verify environment variables in Render dashboard" -ForegroundColor White
    Write-Host "  3. Check Supabase connection settings" -ForegroundColor White
    Write-Host "  4. Ensure all secrets are correctly set" -ForegroundColor White
}

Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Backend:   $backendUrl" -ForegroundColor White
Write-Host "  Dashboard: $dashboardUrl" -ForegroundColor White

