# Quick Product Usage Analysis from Shortwave/MCP Usage
$API_KEY = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b"
$ORG_ID = "IQgm5fsl5rJ3Ub33EfAEow"
$BASE_URL = "https://tekup-billy.onrender.com/api/v1/tools"

Write-Host "🔍 Product Usage Analysis - Real Billy.dk Data" -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host ""

# Get product catalog
Write-Host "Loading product catalog..." -ForegroundColor Yellow
$prodResponse = Invoke-RestMethod -Uri "$BASE_URL/list_products" -Method Post `
    -Headers @{"X-API-Key"=$API_KEY;"Content-Type"="application/json"} `
    -Body (@{organizationId=$ORG_ID} | ConvertTo-Json)

$products = $prodResponse.data.structuredContent.products
$prodMap = @{}
foreach($p in $products) { $prodMap[$p.id] = $p.name }
Write-Host "✅ Loaded $($products.Count) products" -ForegroundColor Green
Write-Host ""

# Get invoices
Write-Host "Loading invoices..." -ForegroundColor Yellow
$invResponse = Invoke-RestMethod -Uri "$BASE_URL/list_invoices" -Method Post `
    -Headers @{"X-API-Key"=$API_KEY;"Content-Type"="application/json"} `
    -Body (@{organizationId=$ORG_ID} | ConvertTo-Json)

$invoices = $invResponse.data.structuredContent.invoices
$approvedInvoices = $invoices | Where-Object {$_.state -eq 'approved'}
Write-Host "Total invoices: $($invoices.Count) - Approved: $($approvedInvoices.Count)" -ForegroundColor Green
Write-Host ""

# Analyze - sample 20 approved invoices
Write-Host "Analyzing invoice product usage (sampling 20 invoices)..." -ForegroundColor Yellow
$productUsage = @{}
$sampleSize = [Math]::Min(20, $approvedInvoices.Count)
$counter = 0

foreach ($inv in ($approvedInvoices | Select-Object -First $sampleSize)) {
    $counter++
    Write-Host "." -NoNewline
    
    try {
        $detailResp = Invoke-RestMethod -Uri "$BASE_URL/get_invoice" -Method Post `
            -Headers @{"X-API-Key"=$API_KEY;"Content-Type"="application/json"} `
            -Body (@{organizationId=$ORG_ID;invoiceId=$inv.id} | ConvertTo-Json)
        
        $invoiceDetail = $detailResp.data.structuredContent.invoice
        
        if ($invoiceDetail.lines) {
            foreach ($line in $invoiceDetail.lines) {
                if ($line.productId) {
                    $prodId = $line.productId
                    if (-not $productUsage.ContainsKey($prodId)) {
                        $productUsage[$prodId] = @{
                            Name = if($prodMap.ContainsKey($prodId)){$prodMap[$prodId]}else{$line.description}
                            Count = 0
                            Revenue = 0
                        }
                    }
                    $productUsage[$prodId].Count++
                    $productUsage[$prodId].Revenue += [decimal]$line.amount
                }
            }
        }
        Start-Sleep -Milliseconds 200
    }
    catch {
        Write-Host "E" -NoNewline -ForegroundColor Red
    }
}

Write-Host "" # New line
Write-Host ""

# Results
if ($productUsage.Count -gt 0) {
    Write-Host "📊 RESULTS - Products Used in Invoices:" -ForegroundColor Green
    Write-Host "=" * 80
    Write-Host ""
    
    $sorted = $productUsage.GetEnumerator() | Sort-Object {$_.Value.Count} -Descending
    
    Write-Host "Top 20 Most Used Products:" -ForegroundColor Cyan
    $sorted | Select-Object -First 20 | ForEach-Object {
        [PSCustomObject]@{
            Product = $_.Value.Name
            Usage = $_.Value.Count
            Revenue = "{0:N0} DKK" -f $_.Value.Revenue
        }
    } | Format-Table -AutoSize
    
    Write-Host ""
    Write-Host "📈 Summary:" -ForegroundColor Yellow
    Write-Host "   Products USED: $($productUsage.Count)" -ForegroundColor Green
    Write-Host "   Products in catalog: 68" -ForegroundColor Cyan
    Write-Host "   Products NEVER used: $(68 - $productUsage.Count)" -ForegroundColor Red
    Write-Host "   Invoices sampled: $counter" -ForegroundColor Cyan
    Write-Host ""
    
    # Export
    $sorted | ForEach-Object {
        [PSCustomObject]@{
            ProductName = $_.Value.Name
            UsageCount = $_.Value.Count
            TotalRevenue = $_.Value.Revenue
        }
    } | Export-Csv -Path "product-usage-results.csv" -NoTypeInformation -Encoding UTF8
    
    Write-Host "Results saved to: product-usage-results.csv" -ForegroundColor Green
}
