# Category B E2E Tests - October 6, 2025

Write-Host ""
Write-Host "========================================"
Write-Host "   CATEGORY B E2E TEST RESULTS"
Write-Host "========================================"
Write-Host ""

$passCount = 0
$failCount = 0

# Test 1
Write-Host "[Test 1] Get Task Templates"
try {
    $r = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/templates/tasks"
    if ($r.success) {
        Write-Host "  PASS - Service types loaded" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 2
Write-Host ""
Write-Host "[Test 2] Create Cleaning Plan"
try {
    # Get first customer
    $customers = Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/customers"
    $customerId = if ($customers.Count -gt 0) { $customers[0].id } else { "cmgb8qiy50000yli8n5k0tpkg" }
    
    $data = @{
        customerId = $customerId
        name = "E2E Test Plan"
        serviceType = "Fast Rengoering"
        frequency = "weekly"
        squareMeters = 80
        tasks = @(
            @{ name = "Stovsugning"; category = "Cleaning"; estimatedTime = 20; isRequired = $true }
        )
    } | ConvertTo-Json -Depth 10
    
    $r = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans" -Method Post -Body $data -ContentType "application/json"
    $global:planId = $r.data.id
    Write-Host "  PASS - Plan created: $($global:planId)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 3
Write-Host ""
Write-Host "[Test 3] Get Plan Details"
try {
    $r = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/$($global:planId)"
    Write-Host "  PASS - Retrieved: $($r.data.name)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 4
Write-Host ""
Write-Host "[Test 4] Update Plan"
try {
    $data = @{ name = "Updated Test Plan" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/$($global:planId)" -Method Patch -Body $data -ContentType "application/json"
    Write-Host "  PASS - Updated successfully" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 5
Write-Host ""
Write-Host "[Test 5] Create Booking"
try {
    $data = @{
        customerId = $customerId
        scheduledAt = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss")
        estimatedDuration = 120
        serviceType = "Fast Rengoering"
        status = "confirmed"
    } | ConvertTo-Json
    
    $r = Invoke-RestMethod -Uri "http://localhost:3000/api/bookings" -Method Post -Body $data -ContentType "application/json"
    $global:bookingId = $r.id
    Write-Host "  PASS - Booking created: $($global:bookingId)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 6
Write-Host ""
Write-Host "[Test 6] Start Timer"
try {
    $r = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/bookings/$($global:bookingId)/start-timer" -Method Post -ContentType "application/json"
    Write-Host "  PASS - Timer started" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 7
Write-Host ""
Write-Host "[Test 7] Pause Timer"
try {
    Start-Sleep -Seconds 2
    $r = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/bookings/$($global:bookingId)/start-break" -Method Post -ContentType "application/json"
    $global:breakId = $r.data.breakId
    Write-Host "  PASS - Break started" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 8
Write-Host ""
Write-Host "[Test 8] Resume Timer"
try {
    Start-Sleep -Seconds 2
    $r = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/breaks/$($global:breakId)/end" -Method Post -ContentType "application/json"
    Write-Host "  PASS - Timer resumed" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 9
Write-Host ""
Write-Host "[Test 9] Stop Timer"
try {
    Start-Sleep -Seconds 2
    $data = @{ timeNotes = "Test complete" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/bookings/$($global:bookingId)/stop-timer" -Method Post -Body $data -ContentType "application/json"
    Write-Host "  PASS - Duration: $($r.data.actualDuration) min, Efficiency: $($r.data.efficiencyScore)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 10
Write-Host ""
Write-Host "[Test 10] Delete Plan"
try {
    $r = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/$($global:planId)" -Method Delete
    Write-Host "  PASS - Plan deleted" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Summary
Write-Host ""
Write-Host "========================================"
Write-Host "   SUMMARY"
Write-Host "========================================"
Write-Host "Passed: $passCount / 10" -ForegroundColor Green
Write-Host "Failed: $failCount / 10" -ForegroundColor Red
Write-Host "========================================"
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "SUCCESS - All tests passed!" -ForegroundColor Green
} else {
    Write-Host "FAILURE - Some tests failed" -ForegroundColor Red
}
