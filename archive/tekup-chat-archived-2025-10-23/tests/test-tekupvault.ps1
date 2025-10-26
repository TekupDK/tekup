# Test TekupVault API connectivity and auth

Write-Host "[TEST] Testing TekupVault Integration`n" -ForegroundColor Cyan

# Load env vars from .env.local
$envFile = Get-Content ".env.local"
$API_URL = ($envFile | Where-Object { $_ -match "^TEKUPVAULT_API_URL=" }) -replace "^TEKUPVAULT_API_URL=", ""
$API_KEY = ($envFile | Where-Object { $_ -match "^TEKUPVAULT_API_KEY=" }) -replace "^TEKUPVAULT_API_KEY=", ""

Write-Host "API URL: $API_URL"
Write-Host "API KEY: $($API_KEY.Substring(0, 20))...`n"

# Test 1: Health check
Write-Host "[1/3] Testing health endpoint..."
try {
    $response = Invoke-WebRequest -Uri "$API_URL/../health" -Method GET
    Write-Host "   [PASS] Health check: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Search without auth
Write-Host "`n[2/3] Testing search without auth..."
try {
    $body = @{
        query = "test"
        limit = 5
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_URL/search" -Method Post -Body $body -ContentType "application/json"
    Write-Host "   [FAIL] Should have failed without auth!" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Message -match "401|Unauthorized") {
        Write-Host "   [PASS] Correctly requires auth" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Search with auth
Write-Host "`n[3/3] Testing search WITH auth..."
try {
    $headers = @{
        "Content-Type" = "application/json"
        "X-API-Key" = $API_KEY
    }
    
    $body = @{
        query = "Billy faktura"
        limit = 5
        threshold = 0.7
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_URL/search" -Method Post -Headers $headers -Body $body
    
    if ($response.results) {
        Write-Host "   [PASS] Search successful!" -ForegroundColor Green
        Write-Host "      Found: $($response.results.Count) documents"
        if ($response.results.Count -gt 0) {
            Write-Host "      Top result: $($response.results[0].document.repository)/$($response.results[0].document.path)"
        }
    } else {
        Write-Host "   [FAIL] No results in response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [FAIL] Search failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "      Error body: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`n[DONE] TekupVault tests completed`n"
