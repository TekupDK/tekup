# Best Practice: Batch Invoice Analysis with Rate Limiting
# Prevents HTTP 429 errors by respecting 100 requests/minute limit
# Recommended delay: 600ms between requests (100 req/min = 1 req per 600ms)

$API_URL = "https://tekup-billy.onrender.com/api/v1/tools"
$API_KEY = $env:BILLY_API_KEY
$ORG_ID = $env:BILLY_ORGANIZATION_ID

Write-Host "Fetching invoices with proper rate limiting..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Get all approved invoices
$invoicesResponse = Invoke-RestMethod -Uri "$API_URL/list_invoices" -Method Post `
    -Headers @{
        "X-API-Key" = $API_KEY
        "Content-Type" = "application/json"
    } `
    -Body (@{
        organizationId = $ORG_ID
        state = "approved"
    } | ConvertTo-Json)

$invoices = $invoicesResponse.invoices
Write-Host "Found $($invoices.Count) approved invoices" -ForegroundColor Green
Write-Host ""

# Step 2: Analyze each invoice with 600ms delay
$results = @()
$successCount = 0
$errorCount = 0

Write-Host "Analyzing invoices (with 600ms delay)..." -ForegroundColor Yellow
Write-Host ""

for ($i = 0; $i -lt $invoices.Count; $i++) {
    $invoice = $invoices[$i]
    $invoiceId = $invoice.id
    
    # Progress indicator
    $progress = [math]::Round(($i / $invoices.Count) * 100)
    Write-Host ("[{0}/{1}] {2}% - Invoice {3}..." -f ($i+1), $invoices.Count, $progress, $invoiceId) -NoNewline
    
    try {
        # Fetch invoice details
        $detailResponse = Invoke-RestMethod -Uri "$API_URL/get_invoice" -Method Post `
            -Headers @{
                "X-API-Key" = $API_KEY
                "Content-Type" = "application/json"
            } `
            -Body (@{
                organizationId = $ORG_ID
                invoiceId = $invoiceId
            } | ConvertTo-Json)
        
        $results += $detailResponse
        $successCount++
        Write-Host " OK" -ForegroundColor Green
        
    } catch {
        $errorCount++
        Write-Host " ERROR" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # CRITICAL: Wait 600ms to stay under 100 req/min limit
    # This prevents HTTP 429 (Rate Limit Exceeded) errors
    if ($i -lt $invoices.Count - 1) {
        Start-Sleep -Milliseconds 600
    }
}

Write-Host ""
Write-Host "Analysis Complete!" -ForegroundColor Green
Write-Host "  Success: $successCount" -ForegroundColor Green
Write-Host "  Errors:  $errorCount" -ForegroundColor $(if($errorCount -eq 0){"Green"}else{"Yellow"})
Write-Host ""

# Export results
$results | ConvertTo-Json -Depth 10 | Out-File -Encoding UTF8 "invoice-analysis-results.json"
Write-Host "Results saved to: invoice-analysis-results.json" -ForegroundColor Cyan

# Calculate time taken
$totalTimeSeconds = ($invoices.Count * 0.6) + ($invoices.Count * 0.1) # 600ms delay + ~100ms API call
$totalTimeMinutes = [math]::Round($totalTimeSeconds / 60, 1)
Write-Host "Total time: ~$totalTimeMinutes minutes (with rate limiting)" -ForegroundColor Gray
Write-Host ""
Write-Host "TIP: Without delays, you would hit rate limits and get HTTP 429 errors!" -ForegroundColor Yellow
