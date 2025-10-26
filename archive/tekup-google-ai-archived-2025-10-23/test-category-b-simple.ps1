# Category B E2E Test Results
# Date: October 6, 2025

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   CATEGORY B E2E TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passCount = 0
$failCount = 0

# Test 1: Task Templates
Write-Host "[Test 1] Get Task Templates" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/templates/tasks"
    if ($response.success) {
        Write-Host "  ✓ PASS - Service types: $($response.data.PSObject.Properties.Name -join ', ')" -ForegroundColor Green
        $passCount++
    }
} catch {
    Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 2: Create Plan
Write-Host "`n[Test 2] Create Cleaning Plan" -ForegroundColor Yellow
try {
    $planData = @{
        customerId = "test-e2e"
        name = "E2E Test Plan"
        serviceType = "Fast Rengøring"
        frequency = "weekly"
        squareMeters = 80
        tasks = @(
            @{ name = "Støvsugning"; category = "Cleaning"; estimatedTime = 20; isRequired = $true },
            @{ name = "Afstøvning"; category = "Cleaning"; estimatedTime = 15; isRequired = $true }
        )
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans" -Method Post -Body $planData -ContentType "application/json"
    $script:testPlanId = $response.data.id
    Write-Host "  ✓ PASS - Plan ID: $($script:testPlanId), Duration: $($response.data.estimatedDuration) min" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 3: Get Plan
Write-Host "`n[Test 3] Get Plan Details" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/$($script:testPlanId)"
    Write-Host "  ✓ PASS - Name: $($response.data.name), Tasks: $($response.data.tasks.Count)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 4: Update Plan
Write-Host "`n[Test 4] Update Plan" -ForegroundColor Yellow
try {
    $updateData = @{ name = "E2E Test - Updated"; squareMeters = 100 } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/$($script:testPlanId)" -Method Patch -Body $updateData -ContentType "application/json"
    Write-Host "  ✓ PASS - Updated name: $($response.data.name)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 5: Create Booking
Write-Host "`n[Test 5] Create Booking" -ForegroundColor Yellow
try {
    $bookingData = @{
        customerId = "test-e2e"
        scheduledAt = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss")
        estimatedDuration = 120
        serviceType = "Fast Rengøring"
        status = "confirmed"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/bookings" -Method Post -Body $bookingData -ContentType "application/json"
    $script:testBookingId = $response.id
    Write-Host "  ✓ PASS - Booking ID: $($script:testBookingId)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 6: Start Timer
Write-Host "`n[Test 6] Start Timer" -ForegroundColor Yellow
try {
    $timerData = @{ bookingId = $script:testBookingId } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/start" -Method Post -Body $timerData -ContentType "application/json"
    Write-Host "  ✓ PASS - Timer started" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 7: Pause
Write-Host "`n[Test 7] Pause Timer" -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 2
    $breakData = @{ bookingId = $script:testBookingId } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/pause" -Method Post -Body $breakData -ContentType "application/json"
    $script:testBreakId = $response.breakId
    Write-Host "  ✓ PASS - Break ID: $($script:testBreakId)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 8: Resume
Write-Host "`n[Test 8] Resume Timer" -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 2
    $resumeData = @{ bookingId = $script:testBookingId; breakId = $script:testBreakId } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/resume" -Method Post -Body $resumeData -ContentType "application/json"
    Write-Host "  ✓ PASS - Break duration: $($response.duration) min" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 9: Stop Timer
Write-Host "`n[Test 9] Stop Timer" -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 2
    $stopData = @{ bookingId = $script:testBookingId; timeNotes = "E2E test" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/stop" -Method Post -Body $stopData -ContentType "application/json"
    Write-Host "  ✓ PASS - Duration: $($response.actualDuration) min, Efficiency: $([math]::Round($response.efficiencyScore, 2))" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Test 10: Delete Plan
Write-Host "`n[Test 10] Delete Plan" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/$($script:testPlanId)" -Method Delete
    Write-Host "  ✓ PASS - Plan deleted" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
    $failCount++
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passed: $passCount/10" -ForegroundColor Green
Write-Host "  Failed: $failCount/10" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host "✓ ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
