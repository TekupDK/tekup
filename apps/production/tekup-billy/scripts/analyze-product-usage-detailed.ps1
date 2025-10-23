# Comprehensive Product Usage Analysis
# Fetches full invoice details to analyze product usage

$API_KEY = "bd674eb2e69973fa399888fa3d5a84f414dd7d89bd86ff6140bdcb363aeede4b"
$ORG_ID = "IQgm5fsl5rJ3Ub33EfAEow"
$BASE_URL = "https://tekup-billy.onrender.com/api/v1/tools"

Write-Host "Step 1: Fetching all invoices..." -ForegroundColor Cyan

$response = Invoke-RestMethod -Uri "$BASE_URL/list_invoices" -Method Post `
    -Headers @{
        "X-API-Key" = $API_KEY
        "Content-Type" = "application/json"
    } `
    -Body (@{organizationId = $ORG_ID} | ConvertTo-Json)

$invoices = $response.data.structuredContent.invoices
Write-Host "Total invoices: $($invoices.Count)" -ForegroundColor Green

# Filter approved invoices only (real invoices, not drafts/voided)
$approvedInvoices = $invoices | Where-Object {$_.state -eq 'approved' -or $_.state -eq 'paid'}
Write-Host "Approved invoices: $($approvedInvoices.Count)" -ForegroundColor Green

Write-Host "`nStep 2: Fetching detailed invoice data (this may take a minute)..." -ForegroundColor Cyan

$productUsage = @{}
$invoicesProcessed = 0

foreach ($invoice in $approvedInvoices | Select-Object -First 30) {  # Limit to 30 for speed
    $invoicesProcessed++
    Write-Progress -Activity "Analyzing invoices" -Status "Invoice $invoicesProcessed of $($approvedInvoices.Count)" -PercentComplete (($invoicesProcessed / [Math]::Min(30, $approvedInvoices.Count)) * 100)
    
    try {
        $detailResponse = Invoke-RestMethod -Uri "$BASE_URL/get_invoice" -Method Post `
            -Headers @{
                "X-API-Key" = $API_KEY
                "Content-Type" = "application/json"
            } `
            -Body (@{
                organizationId = $ORG_ID
                invoiceId = $invoice.id
            } | ConvertTo-Json)
        
        $invoiceDetail = $detailResponse.data.structuredContent.invoice
        
        if ($invoiceDetail.lines) {
            foreach ($line in $invoiceDetail.lines) {
                if ($line.productId) {
                    $prodId = $line.productId
                    $prodName = $line.description
                    
                    if (-not $productUsage.ContainsKey($prodId)) {
                        $productUsage[$prodId] = @{
                            Name = $prodName
                            Count = 0
                            TotalRevenue = 0
                            InvoiceNumbers = @()
                        }
                    }
                    
                    $productUsage[$prodId].Count++
                    $productUsage[$prodId].TotalRevenue += [decimal]$line.amount
                    if ($invoice.invoiceNo) {
                        $productUsage[$prodId].InvoiceNumbers += $invoice.invoiceNo
                    }
                }
            }
        }
        
        Start-Sleep -Milliseconds 100  # Rate limiting
    }
    catch {
        Write-Host "Error processing invoice $($invoice.id): $_" -ForegroundColor Red
    }
}

Write-Progress -Activity "Analyzing invoices" -Completed

Write-Host "`nProduct Usage Analysis Results:" -ForegroundColor Yellow
Write-Host "=" * 100

if ($productUsage.Count -gt 0) {
    $results = $productUsage.GetEnumerator() | Sort-Object {$_.Value.Count} -Descending
    
    Write-Host "`n🏆 Top 20 Most Used Products:" -ForegroundColor Cyan
    $results | Select-Object -First 20 | ForEach-Object {
        [PSCustomObject]@{
            ProductName = $_.Value.Name
            UsageCount = $_.Value.Count
            TotalRevenue = "{0:N2} DKK" -f $_.Value.TotalRevenue
            LastUsedInvoice = ($_.Value.InvoiceNumbers | Select-Object -Last 1)
        }
    } | Format-Table -AutoSize
    
    Write-Host "`n📊 Summary:" -ForegroundColor Yellow
    Write-Host "Total unique products used: $($productUsage.Count)" -ForegroundColor Green
    Write-Host "Total products in catalog: 68" -ForegroundColor Yellow
    Write-Host "Unused products: $(68 - $productUsage.Count)" -ForegroundColor Red
    Write-Host "Invoices analyzed: $invoicesProcessed" -ForegroundColor Cyan
    
    # Export detailed results
    $results | ForEach-Object {
        [PSCustomObject]@{
            ProductID = $_.Key
            ProductName = $_.Value.Name
            UsageCount = $_.Value.Count
            TotalRevenue = $_.Value.TotalRevenue
            InvoiceNumbers = ($_.Value.InvoiceNumbers -join ", ")
        }
    } | Export-Csv -Path "product-usage-detailed.csv" -NoTypeInformation -Encoding UTF8
    
    Write-Host "`n✅ Detailed results exported to: product-usage-detailed.csv" -ForegroundColor Green
}
else {
    Write-Host "`n⚠️  No product usage data found in invoices" -ForegroundColor Red
    Write-Host "This might mean:" -ForegroundColor Yellow
    Write-Host "  1. Invoices use custom line items without productId" -ForegroundColor Yellow
    Write-Host "  2. Products are not linked to invoice lines" -ForegroundColor Yellow
    Write-Host "  3. Need to check Billy.dk UI directly" -ForegroundColor Yellow
}
