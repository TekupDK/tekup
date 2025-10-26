# Quick Deployment Test - Cache + CORS Fix
# Run after ~5-8 minutes when deployment completes

Write-Host "`n🧪 TESTING CACHE + CORS FIX..." -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Test 1: Frontend Accessible
Write-Host "1️⃣  Testing Frontend Access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://www.renos.dk" -Method Head -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is UP!" -ForegroundColor Green
    }
}
catch {
    Write-Host "   ❌ Frontend not responding yet (wait a bit)" -ForegroundColor Red
}

# Test 2: Backend Accessible
Write-Host "`n2️⃣  Testing Backend Access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://api.renos.dk/api/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend is UP!" -ForegroundColor Green
    }
}
catch {
    Write-Host "   ❌ Backend not responding yet (wait a bit)" -ForegroundColor Red
}

# Test 3: Check if sw.js exists (should return 404 or be old)
Write-Host "`n3️⃣  Checking Service Worker File..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://www.renos.dk/sw.js" -UseBasicParsing
    Write-Host "   ⚠️  sw.js still exists (will be ignored by new code)" -ForegroundColor Yellow
}
catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ✅ sw.js not found (perfect!)" -ForegroundColor Green
    }
}

Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 NEXT MANUAL STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open browser: https://www.renos.dk/dashboard" -ForegroundColor Cyan
Write-Host "2. Open DevTools (F12) → Console tab"
Write-Host "3. Paste this test:"
Write-Host ""
Write-Host "   navigator.serviceWorker.getRegistrations().then(r => " -ForegroundColor White
Write-Host "     console.log(r.length === 0 ? '✅ SW Removed!' : '⚠️ Reload page')" -ForegroundColor White
Write-Host "   )" -ForegroundColor White
Write-Host ""
Write-Host "4. Check Console for CORS errors:"
Write-Host "   Expected: ✅ NO CORS errors" -ForegroundColor Green
Write-Host "   Bad:      ❌ 'Access-Control-Allow-Origin' errors" -ForegroundColor Red
Write-Host ""
Write-Host "5. Check Dashboard loads with data:"
Write-Host "   Expected: ✅ Customer stats, leads, bookings visible" -ForegroundColor Green
Write-Host ""
Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n💡 If issues persist:" -ForegroundColor Yellow
Write-Host "   - Hard refresh ONCE: Ctrl+Shift+R"
Write-Host "   - Reload normally: F5"
Write-Host "   - Should work after 2nd reload"
Write-Host ""
Write-Host "📚 Documentation: EXECUTIVE_CACHE_CORS_FIX.md" -ForegroundColor Cyan
Write-Host ""
