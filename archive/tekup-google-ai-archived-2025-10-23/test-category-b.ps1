# Category B E2E Test Results
# Date: October 6, 2025
# Environment: Local Development (Backend: localhost:3000, Frontend: localhost:5173)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   CATEGORY B E2E TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$script:passCount = 0
$script:failCount = 0
$script:skipCount = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [scriptblock]$Test
    )
    
    Write-Host "[$Name]" -ForegroundColor Yellow
    try {
        $result = & $Test
        if ($result) {
            Write-Host "  ✓ PASS" -ForegroundColor Green
            $script:passCount++
        } else {
            Write-Host "  ✗ FAIL" -ForegroundColor Red
            $script:failCount++
        }
    } catch {
        Write-Host "  ✗ FAIL: $_" -ForegroundColor Red
        $script:failCount++
    }
    Write-Host ""
}


# Test 1: Task Templates
Test-Endpoint "Test 1: Get Task Templates" {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/templates/tasks"
    Write-Host "    Service types: $($response.data.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
    return $response.success
}

# Test 2: Create Cleaning Plan
Test-Endpoint "Test 2: Create Cleaning Plan" {
    $planData = @{
        customerId = "test-e2e-customer"
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
    Write-Host "    Plan ID: $($script:testPlanId)" -ForegroundColor Gray
    Write-Host "    Duration: $($response.data.estimatedDuration) min, Price: $($response.data.estimatedPrice) kr" -ForegroundColor Gray
    return $response.success
}

# Test 3: Get Plan Details
Test-Endpoint "Test 3: Get Plan Details" {
    if (-not $script:testPlanId) { $script:skipCount++; return $false }
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/$($script:testPlanId)"
    Write-Host "    Name: $($response.data.name), Tasks: $($response.data.tasks.Count)" -ForegroundColor Gray
    return $response.success
}

# Test 4: Update Plan
Test-Endpoint "Test 4: Update Cleaning Plan" {
    if (-not $script:testPlanId) { $script:skipCount++; return $false }
    $updateData = @{ name = "E2E Test Plan - Updated"; squareMeters = 100 } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/$($script:testPlanId)" -Method Patch -Body $updateData -ContentType "application/json"
    Write-Host "    Updated name: $($response.data.name)" -ForegroundColor Gray
    return $response.success
}

# Test 5: Create Booking
Test-Endpoint "Test 5: Create Test Booking" {
    $bookingData = @{
        customerId = "test-e2e-customer"
        scheduledAt = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss")
        estimatedDuration = 120
        serviceType = "Fast Rengøring"
        status = "confirmed"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/bookings" -Method Post -Body $bookingData -ContentType "application/json"
    $script:testBookingId = $response.id
    Write-Host "    Booking ID: $($script:testBookingId)" -ForegroundColor Gray
    return ($null -ne $script:testBookingId)
}

# Test 6: Start Timer
Test-Endpoint "Test 6: Start Timer" {
    if (-not $script:testBookingId) { $script:skipCount++; return $false }
    $timerData = @{ bookingId = $script:testBookingId } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/start" -Method Post -Body $timerData -ContentType "application/json"
    Write-Host "    Timer started at: $($response.actualStartTime)" -ForegroundColor Gray
    return $response.success
}

# Test 7: Pause Timer (Start Break)
Test-Endpoint "Test 7: Pause Timer (Start Break)" {
    if (-not $script:testBookingId) { $script:skipCount++; return $false }
    Start-Sleep -Seconds 2
    $breakData = @{ bookingId = $script:testBookingId } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/pause" -Method Post -Body $breakData -ContentType "application/json"
    $script:testBreakId = $response.breakId
    Write-Host "    Break ID: $($script:testBreakId)" -ForegroundColor Gray
    return $response.success
}

# Test 8: Resume Timer (End Break)
Test-Endpoint "Test 8: Resume Timer (End Break)" {
    if (-not $script:testBookingId -or -not $script:testBreakId) { $script:skipCount++; return $false }
    Start-Sleep -Seconds 2
    $resumeData = @{ bookingId = $script:testBookingId; breakId = $script:testBreakId } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/resume" -Method Post -Body $resumeData -ContentType "application/json"
    Write-Host "    Break duration: $($response.duration) min" -ForegroundColor Gray
    return $response.success
}

# Test 9: Stop Timer
Test-Endpoint "Test 9: Stop Timer" {
    if (-not $script:testBookingId) { $script:skipCount++; return $false }
    Start-Sleep -Seconds 2
    $stopData = @{ bookingId = $script:testBookingId; timeNotes = "E2E test completed" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/time-tracking/stop" -Method Post -Body $stopData -ContentType "application/json"
    Write-Host "    Actual: $($response.actualDuration) min, Variance: $($response.timeVariance) min, Efficiency: $([math]::Round($response.efficiencyScore, 2))" -ForegroundColor Gray
    return $response.success
}

# Test 10: Delete Plan (Cleanup)
Test-Endpoint "Test 10: Delete Plan (Cleanup)" {
    if (-not $script:testPlanId) { $script:skipCount++; return $false }
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/cleaning-plans/$($script:testPlanId)" -Method Delete
    return $response.success
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passed:  $($script:passCount)" -ForegroundColor Green
Write-Host "  Failed:  $($script:failCount)" -ForegroundColor Red
Write-Host "  Skipped: $($script:skipCount)" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

if ($script:failCount -eq 0) {
    Write-Host "✓ ALL TESTS PASSED - Category B is production ready!" -ForegroundColor Green
} else {
    Write-Host "✗ Some tests failed - review errors above" -ForegroundColor Red
}
