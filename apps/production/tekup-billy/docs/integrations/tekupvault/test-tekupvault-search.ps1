# Test TekupVault Search API
Write-Host "Testing TekupVault Search API..." -ForegroundColor Cyan
Write-Host ""

$apiUrl = "https://tekupvault-api.onrender.com"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 10
    Write-Host "✅ Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Sync Status
Write-Host "Test 2: Sync Status" -ForegroundColor Yellow
try {
    $syncStatus = Invoke-RestMethod -Uri "$apiUrl/api/sync-status" -Method Get -TimeoutSec 10
    Write-Host "✅ Sync Status Retrieved" -ForegroundColor Green
    Write-Host "   Repositories: $($syncStatus.repositories.Count)" -ForegroundColor Cyan
    foreach ($repo in $syncStatus.repositories) {
        Write-Host "   - $($repo.name): $($repo.fileCount) files" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Sync status failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Search Invoice Documentation
Write-Host "Test 3: Search for Invoice Documentation" -ForegroundColor Yellow
try {
    $searchBody = @{
        query = "How to create and approve an invoice in Billy.dk?"
        limit = 5
    } | ConvertTo-Json

    $searchResults = Invoke-RestMethod -Uri "$apiUrl/api/search" -Method Post -Body $searchBody -ContentType "application/json" -TimeoutSec 15
    Write-Host "✅ Search completed successfully" -ForegroundColor Green
    Write-Host "   Results: $($searchResults.results.Count)" -ForegroundColor Cyan
    foreach ($result in $searchResults.results) {
        Write-Host "   - $($result.path) (score: $($result.score))" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Search failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Search MCP Tools
Write-Host "Test 4: Search for MCP Tool Implementations" -ForegroundColor Yellow
try {
    $searchBody = @{
        query = "customer management MCP tools"
        limit = 3
    } | ConvertTo-Json

    $searchResults = Invoke-RestMethod -Uri "$apiUrl/api/search" -Method Post -Body $searchBody -ContentType "application/json" -TimeoutSec 15
    Write-Host "✅ Search completed successfully" -ForegroundColor Green
    Write-Host "   Results: $($searchResults.results.Count)" -ForegroundColor Cyan
    foreach ($result in $searchResults.results) {
        Write-Host "   - $($result.path)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Search failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "✅ All tests completed!" -ForegroundColor Green
