# Product Usage Analysis Script
# Analyzes which products are actually used in invoices

$API_KEY = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b"
$ORG_ID = "IQgm5fsl5rJ3Ub33EfAEow"
$API_URL = "https://tekup-billy.onrender.com/api/v1/tools/list_invoices"

Write-Host "Fetching all invoices..." -ForegroundColor Cyan

$response = Invoke-RestMethod -Uri $API_URL -Method Post `
    -Headers @{
        "X-API-Key" = $API_KEY
        "Content-Type" = "application/json"
    } `
    -Body (@{organizationId = $ORG_ID} | ConvertTo-Json)

$invoices = $response.data.structuredContent.invoices
Write-Host "Total invoices: $($invoices.Count)" -ForegroundColor Green

# Analyze product usage
$productUsage = @{}

foreach ($invoice in $invoices) {
    if ($invoice.lines -and $invoice.lines.Count -gt 0) {
        foreach ($line in $invoice.lines) {
            if ($line.productId) {
                $prodId = $line.productId
                $prodName = $line.description
                
                if (-not $productUsage.ContainsKey($prodId)) {
                    $productUsage[$prodId] = @{
                        Name = $prodName
                        Count = 0
                        TotalRevenue = 0
                    }
                }
                
                $productUsage[$prodId].Count++
                $productUsage[$prodId].TotalRevenue += [decimal]$line.amount
            }
        }
    }
}

Write-Host "`nProduct Usage Analysis:" -ForegroundColor Yellow
Write-Host "=" * 80

$results = $productUsage.GetEnumerator() | Sort-Object {$_.Value.Count} -Descending

Write-Host "`nTop 20 Most Used Products:" -ForegroundColor Cyan
$results | Select-Object -First 20 | ForEach-Object {
    [PSCustomObject]@{
        ProductName = $_.Value.Name
        UsageCount = $_.Value.Count
        TotalRevenue = "{0:N2} DKK" -f $_.Value.TotalRevenue
    }
} | Format-Table -AutoSize

Write-Host "`nTotal unique products used: $($productUsage.Count)" -ForegroundColor Green
Write-Host "Total products in catalog: 68" -ForegroundColor Yellow
Write-Host "Unused products: $(68 - $productUsage.Count)" -ForegroundColor Red

# Export to file
$results | ForEach-Object {
    [PSCustomObject]@{
        ProductID = $_.Key
        ProductName = $_.Value.Name
        UsageCount = $_.Value.Count
        TotalRevenue = $_.Value.TotalRevenue
    }
} | Export-Csv -Path "product-usage-analysis.csv" -NoTypeInformation -Encoding UTF8

Write-Host "`nResults exported to: product-usage-analysis.csv" -ForegroundColor Green
