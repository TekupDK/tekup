# Friday AI API Test Script
# Tests the complete integration flow

Write-Host "=== Friday AI Integration Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Inbox Orchestrator Health
Write-Host "Test 1: Inbox Orchestrator Health Check" -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:3011/health" -Method Get
if ($health.ok) {
    Write-Host "✅ Health check passed" -ForegroundColor Green
} else {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Direct Chat Request
Write-Host "Test 2: Direct Chat Request to Inbox Orchestrator" -ForegroundColor Yellow
$chatBody = @{
    message = "Hvad har vi fået af nye leads i dag?"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3011/chat" -Method Post -Body $chatBody -ContentType "application/json"
    Write-Host "✅ Chat request successful" -ForegroundColor Green
    Write-Host "Reply: $($response.reply.Substring(0, [Math]::Min(100, $response.reply.Length)))..." -ForegroundColor Gray
    Write-Host "Intent: $($response.metrics.intent)" -ForegroundColor Gray
    Write-Host "Tokens: $($response.metrics.tokens)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Chat request failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 3: Test different message types
Write-Host "Test 3: Testing Different Message Types" -ForegroundColor Yellow

$testMessages = @(
    "Hvad har vi fået af nye leads i dag?",
    "Vis mig ledige tider i morgen",
    "Hjælp mig med at finde en kunde",
    "Hvordan håndterer jeg en klage?"
)

foreach ($msg in $testMessages) {
    $body = @{ message = $msg } | ConvertTo-Json
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:3011/chat" -Method Post -Body $body -ContentType "application/json"
        Write-Host "✅ '$($msg.Substring(0, [Math]::Min(40, $msg.Length)))...' - Intent: $($resp.metrics.intent)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed: $msg" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "=== All Tests Completed ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test backend integration (requires auth token)" -ForegroundColor Gray
Write-Host "2. Test frontend chat widget (http://localhost:3002)" -ForegroundColor Gray
Write-Host "3. See TESTING_GUIDE.md for detailed scenarios" -ForegroundColor Gray

