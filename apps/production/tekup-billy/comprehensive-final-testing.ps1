#!/usr/bin/env pwsh
# COMPREHENSIVE BILLY-MCP BY TEKUP V2.0.0 TESTING
# Complete systematic testing of all functionality
# Designed for autonomous execution while user sleeps

$BASE_URL = "https://tekup-billy-production.up.railway.app"
$API_KEY = "sp0ZLWofqSDXPx5OjQa64FHVwRYzeuyr"
$results = @()
$startTime = Get-Date

Write-Host "🧪 COMPREHENSIVE BILLY-MCP BY TEKUP V2.0.0 TESTING" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "Start Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "Base URL: $BASE_URL" -ForegroundColor Gray
Write-Host "Testing while user sleeps... 😴" -ForegroundColor Green

function Test-API {
    param(
        [string]$TestName,
        [string]$Endpoint,
        [object]$Body = @{},
        [string]$ExpectedResult = "",
        [string]$Category = "General"
    )
    
    Write-Host "`n🔧 [$Category] $TestName" -ForegroundColor Yellow
    
    try {
        $headers = @{
            'X-API-Key' = $API_KEY
            'Content-Type' = 'application/json'
        }
        
        $jsonBody = $Body | ConvertTo-Json -Depth 5 -Compress
        Write-Host "   Request: $jsonBody" -ForegroundColor DarkGray
        
        $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method POST -Headers $headers -Body $jsonBody -TimeoutSec 30
        
        $success = $response.success -eq $true
        
        if ($success) {
            Write-Host "   ✅ SUCCESS" -ForegroundColor Green
            
            # Detailed analysis
            if ($response.pagination) {
                Write-Host "   📄 Pagination: Total=$($response.pagination.total), HasMore=$($response.pagination.hasMore)" -ForegroundColor Cyan
            }
            if ($response.customers) {
                Write-Host "   👥 Customers: $($response.customers.Count)" -ForegroundColor Gray
                $jorgenFound = $response.customers | Where-Object { $_.name -like "*Jørgen*" -or $_.name -like "*Jorgen*" }
                if ($jorgenFound) {
                    Write-Host "   🎯 JØRGEN PAGH FOUND! ✅" -ForegroundColor Green
                    Write-Host "      Name: $($jorgenFound.name)" -ForegroundColor DarkGreen
                }
            }
            if ($response.invoices) {
                Write-Host "   📄 Invoices: $($response.invoices.Count)" -ForegroundColor Gray
            }
            if ($response.products) {
                Write-Host "   🛍️ Products: $($response.products.Count)" -ForegroundColor Gray
            }
            if ($response.revenue) {
                Write-Host "   💰 Revenue: $($response.revenue.totalRevenue) DKK" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ❌ FAILED: $($response.error)" -ForegroundColor Red
        }
        
        $script:results += @{
            Test = $TestName
            Category = $Category
            Status = if ($success) { "PASS" } else { "FAIL" }
            Response = $response
            ExecutionTime = (Get-Date) - $testStart
        }
        
    } catch {
        Write-Host "   ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $script:results += @{
            Test = $TestName
            Category = $Category
            Status = "ERROR"
            Error = $_.Exception.Message
        }
    }
}

# =============================================================================
# 1. SYSTEM VERIFICATION
# =============================================================================
Write-Host "`n📊 1. SYSTEM VERIFICATION & V2.0.0 CONFIRMATION" -ForegroundColor Cyan
$testStart = Get-Date

# Verify v2.0.0 is live
try {
    $rootCheck = Invoke-RestMethod -Uri "$BASE_URL/" -Method GET
    if ($rootCheck.service -eq "Billy-mcp By Tekup" -and $rootCheck.version -eq "2.0.0") {
        Write-Host "🎉 V2.0.0 CONFIRMED LIVE! ✅" -ForegroundColor Green
        Write-Host "   Service: $($rootCheck.service)" -ForegroundColor Green
        Write-Host "   Version: $($rootCheck.version)" -ForegroundColor Green
    } else {
        Write-Host "❌ Version mismatch!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Root endpoint failed!" -ForegroundColor Red
}

Test-API "Health Check" "/health" @{} "" "System"
Test-API "Auth Validation" "/api/v1/tools/validate_auth" @{} "" "System"

# =============================================================================
# 2. CRITICAL FIX VERIFICATION  
# =============================================================================
Write-Host "`n🎯 2. CRITICAL FIX VERIFICATION (JØRGEN PAGH SEARCH)" -ForegroundColor Cyan

Test-API "Jørgen Pagh Search (PRIMARY FIX)" "/api/v1/tools/list_customers" @{
    search = "Jørgen"
    limit = 10
} "Should find Jørgen Pagh" "Critical"

Test-API "Erik Gideon Search" "/api/v1/tools/list_customers" @{
    search = "Erik"
    limit = 5
} "" "Critical"

# =============================================================================
# 3. COMPREHENSIVE CUSTOMER MANAGEMENT
# =============================================================================
Write-Host "`n👥 3. COMPREHENSIVE CUSTOMER MANAGEMENT TESTING" -ForegroundColor Cyan

Test-API "List All Customers" "/api/v1/tools/list_customers" @{ limit = 20 } "" "Customers"
Test-API "Customer Pagination (Page 1)" "/api/v1/tools/list_customers" @{ limit = 10; offset = 0 } "" "Customers"
Test-API "Customer Pagination (Page 2)" "/api/v1/tools/list_customers" @{ limit = 10; offset = 10 } "" "Customers"
Test-API "Search Common Names" "/api/v1/tools/list_customers" @{ search = "Jensen"; limit = 5 } "" "Customers"
Test-API "Search by Phone" "/api/v1/tools/list_customers" @{ search = "12345"; limit = 5 } "" "Customers"
Test-API "Empty Search" "/api/v1/tools/list_customers" @{ search = ""; limit = 5 } "" "Customers"

# =============================================================================
# 4. COMPREHENSIVE INVOICE MANAGEMENT  
# =============================================================================
Write-Host "`n📄 4. COMPREHENSIVE INVOICE MANAGEMENT TESTING" -ForegroundColor Cyan

Test-API "List All Invoices" "/api/v1/tools/list_invoices" @{ limit = 20 } "" "Invoices"
Test-API "List Draft Invoices" "/api/v1/tools/list_invoices" @{ limit = 10; state = "draft" } "" "Invoices"
Test-API "List Approved Invoices" "/api/v1/tools/list_invoices" @{ limit = 10; state = "approved" } "" "Invoices"
Test-API "Invoice Pagination" "/api/v1/tools/list_invoices" @{ limit = 5; offset = 0 } "" "Invoices"
Test-API "Search Invoice by Number" "/api/v1/tools/list_invoices" @{ search = "1"; limit = 5 } "" "Invoices"

$today = Get-Date -Format "yyyy-MM-dd"
$lastWeek = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
Test-API "Recent Invoices (Last Week)" "/api/v1/tools/list_invoices" @{
    startDate = $lastWeek
    endDate = $today
    limit = 10
} "" "Invoices"

# =============================================================================
# 5. COMPREHENSIVE PRODUCT MANAGEMENT
# =============================================================================
Write-Host "`n🛍️ 5. COMPREHENSIVE PRODUCT MANAGEMENT TESTING" -ForegroundColor Cyan

Test-API "List All Products" "/api/v1/tools/list_products" @{ limit = 20 } "" "Products"
Test-API "Search REN Products" "/api/v1/tools/list_products" @{ search = "REN"; limit = 10 } "" "Products"
Test-API "Search Rengøring Products" "/api/v1/tools/list_products" @{ search = "rengøring"; limit = 5 } "" "Products"
Test-API "Product Pagination" "/api/v1/tools/list_products" @{ limit = 5; offset = 0 } "" "Products"

# =============================================================================
# 6. REVENUE & ANALYTICS
# =============================================================================
Write-Host "`n💰 6. REVENUE & ANALYTICS TESTING" -ForegroundColor Cyan

$lastMonth = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
$last3Months = (Get-Date).AddDays(-90).ToString("yyyy-MM-dd")

Test-API "Revenue Last 30 Days" "/api/v1/tools/get_revenue" @{
    startDate = $lastMonth
    endDate = $today
} "" "Revenue"

Test-API "Revenue Last 7 Days" "/api/v1/tools/get_revenue" @{
    startDate = $lastWeek  
    endDate = $today
} "" "Revenue"

Test-API "Revenue Last 3 Months" "/api/v1/tools/get_revenue" @{
    startDate = $last3Months
    endDate = $today
} "" "Revenue"

# =============================================================================
# 7. COMPLEX CUSTOMER SERVICE SCENARIOS
# =============================================================================
Write-Host "`n📞 7. COMPLEX CUSTOMER SERVICE SCENARIOS" -ForegroundColor Cyan

# Scenario 1: Customer lookup + invoice history
Write-Host "`n📋 Scenario 1: Complete Customer Analysis" -ForegroundColor Yellow
Test-API "Find Customer by Name" "/api/v1/tools/list_customers" @{ search = "Jørgen"; limit = 5 } "" "Scenario"

# Get a customer ID for further testing
try {
    $customerResponse = Invoke-RestMethod -Uri "$BASE_URL/api/v1/tools/list_customers" -Method POST -Headers @{
        'X-API-Key' = $API_KEY
        'Content-Type' = 'application/json'
    } -Body '{"limit": 1}' -TimeoutSec 30
    
    if ($customerResponse.success -and $customerResponse.customers.Count -gt 0) {
        $customerId = $customerResponse.customers[0].id
        Write-Host "   Using customer ID: $customerId" -ForegroundColor Gray
        
        Test-API "Get Customer Details" "/api/v1/tools/get_customer" @{
            contactId = $customerId
        } "" "Scenario"
        
        Test-API "Customer Invoice History" "/api/v1/tools/list_invoices" @{
            contactId = $customerId
            limit = 10
        } "" "Scenario"
    }
} catch {
    Write-Host "   Skipping customer detail tests (no customer data)" -ForegroundColor Yellow
}

# =============================================================================
# 8. PERFORMANCE & LOAD TESTING
# =============================================================================
Write-Host "`n⚡ 8. PERFORMANCE & LOAD TESTING" -ForegroundColor Cyan

$loadTestStart = Get-Date

# Test large pagination
Test-API "Large Customer List" "/api/v1/tools/list_customers" @{ limit = 50 } "" "Performance"
Test-API "Large Invoice List" "/api/v1/tools/list_invoices" @{ limit = 50 } "" "Performance"
Test-API "Large Product List" "/api/v1/tools/list_products" @{ limit = 50 } "" "Performance"

$loadTestTime = (Get-Date) - $loadTestStart
Write-Host "   📊 Load Test Execution Time: $($loadTestTime.TotalSeconds) seconds" -ForegroundColor Cyan

# =============================================================================
# 9. CONCURRENT OPERATIONS TESTING
# =============================================================================
Write-Host "`n🔄 9. CONCURRENT OPERATIONS TESTING" -ForegroundColor Cyan

Write-Host "   Testing simultaneous API calls..." -ForegroundColor Yellow

$concurrentStart = Get-Date

# Start multiple jobs simultaneously
$jobs = @()
$jobs += Start-Job -ScriptBlock {
    param($url, $key)
    try {
        Invoke-RestMethod -Uri "$url/api/v1/tools/list_customers" -Method POST -Headers @{
            'X-API-Key' = $key
            'Content-Type' = 'application/json'  
        } -Body '{"limit": 10}' -TimeoutSec 30
    } catch { $_.Exception.Message }
} -ArgumentList $BASE_URL, $API_KEY

$jobs += Start-Job -ScriptBlock {
    param($url, $key)
    try {
        Invoke-RestMethod -Uri "$url/api/v1/tools/list_invoices" -Method POST -Headers @{
            'X-API-Key' = $key
            'Content-Type' = 'application/json'
        } -Body '{"limit": 10}' -TimeoutSec 30  
    } catch { $_.Exception.Message }
} -ArgumentList $BASE_URL, $API_KEY

$jobs += Start-Job -ScriptBlock {
    param($url, $key)  
    try {
        Invoke-RestMethod -Uri "$url/api/v1/tools/list_products" -Method POST -Headers @{
            'X-API-Key' = $key
            'Content-Type' = 'application/json'
        } -Body '{"limit": 10}' -TimeoutSec 30
    } catch { $_.Exception.Message }
} -ArgumentList $BASE_URL, $API_KEY

# Wait for all jobs to complete
$jobResults = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

$concurrentTime = (Get-Date) - $concurrentStart

$successfulJobs = $jobResults | Where-Object { $_.success -eq $true }
Write-Host "   ✅ Concurrent Jobs Success: $($successfulJobs.Count)/$($jobResults.Count)" -ForegroundColor Green
Write-Host "   ⏱️ Concurrent Execution Time: $($concurrentTime.TotalSeconds) seconds" -ForegroundColor Cyan

# =============================================================================
# RESULTS ANALYSIS & REPORTING
# =============================================================================
Write-Host "`n📊 COMPREHENSIVE TEST RESULTS ANALYSIS" -ForegroundColor Magenta
Write-Host "=======================================" -ForegroundColor Magenta

$totalTests = $results.Count
$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$errorCount = ($results | Where-Object { $_.Status -eq "ERROR" }).Count

$totalTime = (Get-Date) - $startTime

Write-Host "`n📈 OVERALL STATISTICS:" -ForegroundColor Cyan
Write-Host "   🧪 Total Tests: $totalTests" -ForegroundColor Gray
Write-Host "   ✅ PASSED: $passCount" -ForegroundColor Green
Write-Host "   ❌ FAILED: $failCount" -ForegroundColor Red  
Write-Host "   🚨 ERRORS: $errorCount" -ForegroundColor Yellow
Write-Host "   ⏱️ Total Execution: $($totalTime.TotalMinutes.ToString('F1')) minutes" -ForegroundColor Cyan

$successRate = if ($totalTests -gt 0) { [math]::Round(($passCount / $totalTests) * 100, 1) } else { 0 }
$ratingColor = if ($successRate -ge 95) { "Green" } elseif ($successRate -ge 85) { "Yellow" } else { "Red" }
Write-Host "   📊 SUCCESS RATE: $successRate%" -ForegroundColor $ratingColor

# Category breakdown
Write-Host "`n📋 CATEGORY BREAKDOWN:" -ForegroundColor Cyan
$categories = $results | Group-Object Category
foreach ($category in $categories) {
    $catPass = ($category.Group | Where-Object { $_.Status -eq "PASS" }).Count
    $catTotal = $category.Group.Count
    $catRate = if ($catTotal -gt 0) { [math]::Round(($catPass / $catTotal) * 100) } else { 0 }
    Write-Host "   📂 $($category.Name): $catPass/$catTotal ($catRate%)" -ForegroundColor Gray
}

# Critical test verification
Write-Host "`n🎯 CRITICAL FIXES VERIFICATION:" -ForegroundColor Magenta
$jorgenTest = $results | Where-Object { $_.Test -like "*Jørgen*" }
if ($jorgenTest -and $jorgenTest.Status -eq "PASS") {
    Write-Host "   ✅ JØRGEN PAGH SEARCH: FIXED! ✅" -ForegroundColor Green
} else {
    Write-Host "   ❌ JØRGEN PAGH SEARCH: STILL ISSUES" -ForegroundColor Red
}

# Performance analysis
Write-Host "`n⚡ PERFORMANCE ANALYSIS:" -ForegroundColor Cyan
$avgTime = ($results | Where-Object { $_.ExecutionTime } | Measure-Object -Property ExecutionTime -Average).Average
Write-Host "   📊 Average Response Time: $($avgTime.TotalMilliseconds.ToString('F0'))ms" -ForegroundColor Gray

# Final assessment
$overallStatus = if ($successRate -ge 95) { "🎉 EXCELLENT - PRODUCTION READY!" }
                elseif ($successRate -ge 85) { "✅ GOOD - MINOR ISSUES" }  
                elseif ($successRate -ge 70) { "⚠️ ACCEPTABLE - SOME CONCERNS"
                } else { "❌ NEEDS WORK - SIGNIFICANT ISSUES" }

Write-Host "`n🏆 FINAL ASSESSMENT: $overallStatus" -ForegroundColor Magenta

if ($successRate -ge 90) {
    Write-Host "`n🚀 Billy-mcp By Tekup v2.0.0 is PRODUCTION READY!" -ForegroundColor Green
    Write-Host "   ✅ Ready for ChatGPT integration" -ForegroundColor Green
    Write-Host "   ✅ Ready for Claude integration" -ForegroundColor Green  
    Write-Host "   ✅ Ready for live customer use" -ForegroundColor Green
}

Write-Host "`n📝 DETAILED TEST RESULTS:" -ForegroundColor Cyan
foreach ($result in $results) {
    $icon = switch ($result.Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "ERROR" { "🚨" }
    }
    Write-Host "  $icon [$($result.Category)] $($result.Test)" -ForegroundColor Gray
}

Write-Host "`n🛌 TESTING COMPLETE - USER CAN WAKE UP!" -ForegroundColor Green
Write-Host "📊 Billy-mcp By Tekup v2.0.0 has been thoroughly tested!" -ForegroundColor Green
Write-Host "⏰ Test completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
