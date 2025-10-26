# RenOS API Smoke Test
param([switch]$Local)

$baseUrl = if ($Local) { "http://localhost:3000" } else { "https://api.renos.dk" }
$passed = 0
$failed = 0

Write-Host "`nRenOS API Test - $(if ($Local) { 'LOCAL' } else { 'PROD' })`n" -ForegroundColor Cyan

function Test-API {
    param([string]$Name, [string]$Path)
    Write-Host "Testing: $Name..." -NoNewline
    try {
        $r = Invoke-RestMethod -Uri "$baseUrl$Path" -TimeoutSec 10
        Write-Host " OK" -ForegroundColor Green
        $script:passed++
        return $r
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        $script:failed++
        return $null
    }
}

$h = Test-API "Health" "/health"
$c = Test-API "Customers" "/api/dashboard/customers"
if ($c) { Write-Host "  Found: $($c.Count) customers" -ForegroundColor Gray }

$l = Test-API "Leads" "/api/dashboard/leads"
if ($l) { 
    $dupe = ($l | Group-Object email | Where-Object { $_.Count -gt 1 }).Count
    if ($dupe) { Write-Host "  Found: $($l.Count) leads (WARNING: $dupe duplicates)" -ForegroundColor Yellow }
    else { Write-Host "  Found: $($l.Count) leads" -ForegroundColor Gray }
}

$b = Test-API "Bookings" "/api/dashboard/bookings"
if ($b) { Write-Host "  Found: $($b.Count) bookings" -ForegroundColor Gray }

$e = Test-API "Email Responses" "/api/dashboard/email-responses"
if ($e) { 
    $p = ($e | Where-Object { $_.status -eq "pending" }).Count
    Write-Host "  Found: $($e.Count) responses$(if ($p) { " ($p pending)" })" -ForegroundColor Gray
}

Write-Host "`nSummary: $passed passed, $failed failed`n" -ForegroundColor Cyan
exit $failed
