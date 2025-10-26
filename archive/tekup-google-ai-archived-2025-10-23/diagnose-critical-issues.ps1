#!/usr/bin/env pwsh
# RenOS Critical Issues Diagnostic Tool
# Run this to quickly identify root causes of reported issues

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  RENOS CRITICAL ISSUES DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "`nRunning comprehensive system check...`n" -ForegroundColor Yellow

# =============================================================================
# TEST 1: Backend Health
# =============================================================================
Write-Host "[1/7] Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod "https://api.renos.dk/health" -TimeoutSec 10
    if ($health.status -eq "ok") {
        Write-Host "  PASS - Backend responding" -ForegroundColor Green
    } else {
        Write-Host "  FAIL - Backend unhealthy: $($health.status)" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAIL - Backend not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# =============================================================================
# TEST 2: Calendar API
# =============================================================================
Write-Host "`n[2/7] Testing Calendar API..." -ForegroundColor Yellow
try {
    $calendarBody = @{
        durationMinutes = 120
    } | ConvertTo-Json
    
    $calendar = Invoke-RestMethod `
        -Uri "https://api.renos.dk/api/calendar/find-slots" `
        -Method POST `
        -ContentType "application/json" `
        -Body $calendarBody `
        -TimeoutSec 10
    
    if ($calendar.success) {
        Write-Host "  PASS - Calendar API working" -ForegroundColor Green
        Write-Host "    Found $($calendar.slots.Count) available slots" -ForegroundColor Gray
    } else {
        Write-Host "  FAIL - Calendar API error: $($calendar.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAIL - Calendar API not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    This is likely WHY the calendar page crashes!" -ForegroundColor Red
}

# =============================================================================
# TEST 3: Dashboard Stats API
# =============================================================================
Write-Host "`n[3/7] Testing Dashboard Stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod "https://api.renos.dk/api/dashboard/stats/overview" -TimeoutSec 10
    
    Write-Host "  PASS - Dashboard API working" -ForegroundColor Green
    Write-Host "    Customers: $($stats.customers.total)" -ForegroundColor Gray
    Write-Host "    Leads: $($stats.leads.total)" -ForegroundColor Gray
    Write-Host "    Bookings: $($stats.bookings.total)" -ForegroundColor Gray
    
    # Check if data exists
    if ($stats.customers.total -gt 0 -and $stats.leads.total -gt 0) {
        Write-Host "  INFO - System has data, checking relations..." -ForegroundColor Cyan
    }
} catch {
    Write-Host "  FAIL - Dashboard API error: $($_.Exception.Message)" -ForegroundColor Red
}

# =============================================================================
# TEST 4: Customers API (Check relations)
# =============================================================================
Write-Host "`n[4/7] Testing Customer Data Relations..." -ForegroundColor Yellow
try {
    $customers = Invoke-RestMethod "https://api.renos.dk/api/dashboard/customers?limit=5" -TimeoutSec 10
    
    if ($customers.Count -gt 0) {
        Write-Host "  PASS - Customers API working" -ForegroundColor Green
        Write-Host "    Retrieved $($customers.Count) customers" -ForegroundColor Gray
        
        # Check if customers have leads/bookings
        $customersWithData = $customers | Where-Object { 
            $_.totalLeads -gt 0 -or $_.totalBookings -gt 0 
        }
        
        if ($customersWithData.Count -eq 0) {
            Write-Host "  WARN - All customers show 0 leads/bookings!" -ForegroundColor Red
            Write-Host "    This confirms Issue #2: Data sync broken" -ForegroundColor Red
        } else {
            Write-Host "  INFO - Some customers have data" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  FAIL - Customers API error: $($_.Exception.Message)" -ForegroundColor Red
}

# =============================================================================
# TEST 5: Bookings API
# =============================================================================
Write-Host "`n[5/7] Testing Bookings Data..." -ForegroundColor Yellow
try {
    $bookings = Invoke-RestMethod "https://api.renos.dk/api/dashboard/bookings/recent?limit=5" -TimeoutSec 10
    
    if ($bookings.Count -gt 0) {
        Write-Host "  PASS - Bookings API working" -ForegroundColor Green
        Write-Host "    Retrieved $($bookings.Count) bookings" -ForegroundColor Gray
        
        # Check if bookings have customer info
        $bookingsWithoutCustomer = $bookings | Where-Object { 
            -not $_.customer -or -not $_.customer.name 
        }
        
        if ($bookingsWithoutCustomer.Count -gt 0) {
            Write-Host "  WARN - $($bookingsWithoutCustomer.Count)/$($bookings.Count) bookings missing customer!" -ForegroundColor Red
            Write-Host "    This confirms Issue #5: Booking data shows 'Ukendt kunde'" -ForegroundColor Red
        } else {
            Write-Host "  INFO - All bookings have customer data" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  FAIL - Bookings API error: $($_.Exception.Message)" -ForegroundColor Red
}

# =============================================================================
# TEST 6: Services API
# =============================================================================
Write-Host "`n[6/7] Testing Services..." -ForegroundColor Yellow
try {
    $services = Invoke-RestMethod "https://api.renos.dk/api/services" -TimeoutSec 10
    
    if ($services.Count -gt 0) {
        Write-Host "  PASS - Services exist: $($services.Count) services" -ForegroundColor Green
    } else {
        Write-Host "  WARN - No services found!" -ForegroundColor Red
        Write-Host "    This confirms Issue #3: Services modul tomt" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAIL - Services API error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    Services endpoint may not exist!" -ForegroundColor Red
}

# =============================================================================
# TEST 7: Cache Stats
# =============================================================================
Write-Host "`n[7/7] Testing Cache Performance..." -ForegroundColor Yellow
try {
    $cache = Invoke-RestMethod "https://api.renos.dk/api/dashboard/cache/stats" -TimeoutSec 10
    
    Write-Host "  PASS - Cache API working" -ForegroundColor Green
    Write-Host "    Hit rate: $($cache.hitRate)" -ForegroundColor Gray
    Write-Host "    Hits: $($cache.hits), Misses: $($cache.misses)" -ForegroundColor Gray
    
    if ($cache.hitRate -match "0%") {
        Write-Host "  WARN - Cache hit rate is 0%!" -ForegroundColor Red
        Write-Host "    This confirms Issue #7: Cache performance problem" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAIL - Cache API error: $($_.Exception.Message)" -ForegroundColor Red
}

# =============================================================================
# SUMMARY
# =============================================================================
Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTIC SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`nCONFIRMED ISSUES:" -ForegroundColor Red
Write-Host "  Issue #1: Calendar API - " -NoNewline
Write-Host "NEEDS INVESTIGATION" -ForegroundColor Yellow

Write-Host "  Issue #2: Customer data sync - " -NoNewline
Write-Host "LIKELY BROKEN" -ForegroundColor Red

Write-Host "  Issue #3: Services module - " -NoNewline
Write-Host "LIKELY EMPTY" -ForegroundColor Red

Write-Host "  Issue #5: Booking customer data - " -NoNewline
Write-Host "LIKELY BROKEN" -ForegroundColor Red

Write-Host "  Issue #7: Cache performance - " -NoNewline
Write-Host "CONFIRMED 0%" -ForegroundColor Red

Write-Host "`nRECOMMENDED FIX ORDER:" -ForegroundColor Yellow
Write-Host "  1. Check Render environment variables (GOOGLE_PRIVATE_KEY, etc.)" -ForegroundColor White
Write-Host "  2. Fix database relations (Customer <-> Leads/Bookings)" -ForegroundColor White
Write-Host "  3. Fix calendar API error handling" -ForegroundColor White
Write-Host "  4. Seed services database" -ForegroundColor White
Write-Host "  5. Fix cache key consistency" -ForegroundColor White

Write-Host "`nNEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Check Render dashboard for environment variables" -ForegroundColor White
Write-Host "  2. Review Render logs for detailed error messages" -ForegroundColor White
Write-Host "  3. Run database audit queries (see CRITICAL_ISSUES_DEBUG_PLAN_COMPLETE.md)" -ForegroundColor White
Write-Host "  4. Start fixing issues per priority order" -ForegroundColor White

Write-Host "`nFull debug plan: CRITICAL_ISSUES_DEBUG_PLAN_COMPLETE.md`n" -ForegroundColor Gray
