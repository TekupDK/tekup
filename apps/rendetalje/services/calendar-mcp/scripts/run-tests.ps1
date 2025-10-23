# ==========================================
# RenOS Calendar MCP - Test Runner
# ==========================================
# Runs all tests with proper setup

Write-Host "`n🧪 RENOS CALENDAR MCP - TEST RUNNER" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Navigate to project root
Set-Location -Path "C:\Users\empir\Tekup-Cloud\renos-calendar-mcp"

# Check if MCP server is running
Write-Host "📡 Checking MCP Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ MCP Server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ MCP Server is NOT running!" -ForegroundColor Red
    Write-Host "   Starting Docker containers..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 10
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5 -UseBasicParsing
        Write-Host "✅ MCP Server started successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start MCP Server" -ForegroundColor Red
        Write-Host "   Please start it manually: docker-compose up -d" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`n🧪 Running Tests..." -ForegroundColor Cyan

# Run Jest tests
Write-Host "`n1️⃣  Unit & Integration Tests (Jest)" -ForegroundColor Yellow
npm test

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some tests failed!" -ForegroundColor Red
}

Write-Host "`n📊 Test Summary" -ForegroundColor Cyan
Write-Host "================`n" -ForegroundColor Cyan

# Display test results location
Write-Host "Test results saved to: ./coverage/" -ForegroundColor Gray
Write-Host "`n✅ Test run complete!" -ForegroundColor Green

# Optional: Open coverage report
$openCoverage = Read-Host "`nOpen coverage report? (y/n)"
if ($openCoverage -eq 'y') {
    if (Test-Path "./coverage/lcov-report/index.html") {
        Start-Process "./coverage/lcov-report/index.html"
    } else {
        Write-Host "No coverage report found. Run tests with --coverage flag." -ForegroundColor Yellow
    }
}

