# Manual Browser Test Guide - Cache & CORS Fix Verification
# Run this after deployment to verify everything works

Write-Host "`n🧪 MANUAL BROWSER TEST GUIDE" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "📋 STEP 1: Open Dashboard" -ForegroundColor Yellow
Write-Host "   1. Open Chrome/Edge (private/incognito mode recommended)"
Write-Host "   2. Navigate to: https://www.renos.dk/dashboard"
Write-Host "   3. Press F12 to open DevTools"
Write-Host "   4. Go to Console tab`n"

Write-Host "✅ EXPECTED RESULTS:" -ForegroundColor Green
Write-Host "   - Dashboard loads (not blank)"
Write-Host "   - Customer stats visible"
Write-Host "   - Recent leads showing"
Write-Host "   - Bookings displayed"
Write-Host "   - NO red CORS errors in console`n"

Write-Host "`n📋 STEP 2: Check Service Worker Status" -ForegroundColor Yellow
Write-Host "   In DevTools Console, run:`n"
Write-Host "   navigator.serviceWorker.getRegistrations().then(r => {" -ForegroundColor Gray
Write-Host "     console.log('SW Count:', r.length);" -ForegroundColor Gray
Write-Host "     r.forEach(sw => console.log('SW Scope:', sw.scope));" -ForegroundColor Gray
Write-Host "   });" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ ACCEPTABLE RESULTS:" -ForegroundColor Green
Write-Host "   - SW Count: 0 (no service worker - best)" -ForegroundColor Green
Write-Host "   OR" -ForegroundColor Yellow
Write-Host "   - SW Count: 1, Scope: https://www.renos.dk/ (old SW - OK for now)`n" -ForegroundColor Yellow

Write-Host "`n📋 STEP 3: Check Caches" -ForegroundColor Yellow
Write-Host "   In DevTools Console, run:`n"
Write-Host "   caches.keys().then(keys => console.log('Caches:', keys));" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ ACCEPTABLE RESULTS:" -ForegroundColor Green
Write-Host "   - Caches: [] (no caches - best)" -ForegroundColor Green
Write-Host "   OR" -ForegroundColor Yellow
Write-Host "   - Caches: ['renos-v1'] (old cache - OK, will be cleared on reload)`n" -ForegroundColor Yellow

Write-Host "`n📋 STEP 4: Check Network Requests" -ForegroundColor Yellow
Write-Host "   1. Go to DevTools → Network tab"
Write-Host "   2. Reload page (F5)"
Write-Host "   3. Look for requests to /api/dashboard/stats/overview`n"

Write-Host "✅ EXPECTED RESULTS:" -ForegroundColor Green
Write-Host "   - Request URL: https://api.renos.dk/api/dashboard/stats/overview" -ForegroundColor Green
Write-Host "   - Status: 200 OK" -ForegroundColor Green
Write-Host "   - Response: JSON with customers/leads/bookings data" -ForegroundColor Green
Write-Host "   - NO CORS errors`n" -ForegroundColor Green

Write-Host "`n📋 STEP 5: Test Without Hard Refresh" -ForegroundColor Yellow
Write-Host "   1. Close browser completely"
Write-Host "   2. Reopen browser (normal mode)"
Write-Host "   3. Navigate to: https://www.renos.dk/dashboard"
Write-Host "   4. Do NOT press Ctrl+Shift+R`n"

Write-Host "✅ EXPECTED RESULTS:" -ForegroundColor Green
Write-Host "   - Dashboard loads immediately" -ForegroundColor Green
Write-Host "   - Data appears (customers, leads, bookings)" -ForegroundColor Green
Write-Host "   - No errors in console`n" -ForegroundColor Green

Write-Host "`n📋 STEP 6: Check API Calls" -ForegroundColor Yellow
Write-Host "   In DevTools Console, run:`n"
Write-Host "   fetch('https://api.renos.dk/api/dashboard/stats/overview')" -ForegroundColor Gray
Write-Host "     .then(r => r.json())" -ForegroundColor Gray
Write-Host "     .then(d => console.log('API Response:', d))" -ForegroundColor Gray
Write-Host "     .catch(e => console.error('API Error:', e));" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ EXPECTED RESULTS:" -ForegroundColor Green
Write-Host "   - API Response: {customers: {...}, leads: {...}, bookings: {...}}" -ForegroundColor Green
Write-Host "   - NO errors`n" -ForegroundColor Green

Write-Host "`n🚨 FAILURE SCENARIOS" -ForegroundColor Red
Write-Host "============================`n" -ForegroundColor Red

Write-Host "❌ IF YOU SEE: CORS Errors" -ForegroundColor Red
Write-Host "   Error message: 'Access-Control-Allow-Origin' header is missing"
Write-Host "   → API URL is still wrong (relative URL issue)"
Write-Host "   → Run: " -NoNewline
Write-Host "git pull && npm run build:client && <redeploy frontend>" -ForegroundColor Gray
Write-Host ""

Write-Host "❌ IF YOU SEE: Dashboard Blank" -ForegroundColor Red
Write-Host "   No data shows, no errors in console"
Write-Host "   → Backend might be down"
Write-Host "   → Check: " -NoNewline
Write-Host "curl https://api.renos.dk/health" -ForegroundColor Gray
Write-Host ""

Write-Host "❌ IF YOU SEE: 404 Errors" -ForegroundColor Red
Write-Host "   API calls return 404 Not Found"
Write-Host "   → Endpoint path might be wrong"
Write-Host "   → Check: API routes in src/server.ts" -ForegroundColor Gray
Write-Host ""

Write-Host "`n📊 AUTOMATED PRE-CHECK" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

Write-Host "Running automated checks first...`n" -ForegroundColor Yellow

# Backend Health
try {
    $health = Invoke-RestMethod -Uri "https://api.renos.dk/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Backend Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Health: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   → Fix backend before testing frontend!" -ForegroundColor Red
}

# Frontend Accessibility
try {
    $fe = Invoke-WebRequest -Uri "https://www.renos.dk" -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ Frontend: $($fe.StatusCode) OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Dashboard API
try {
    $api = Invoke-RestMethod -Uri "https://api.renos.dk/api/dashboard/stats/overview" -Method GET -TimeoutSec 10
    Write-Host "✅ Dashboard API: Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Dashboard API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✨ AUTOMATED CHECKS COMPLETE" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "📝 NOW PROCEED WITH MANUAL BROWSER TESTS ABOVE" -ForegroundColor Yellow
Write-Host "   Open: https://www.renos.dk/dashboard" -ForegroundColor White
Write-Host "   Press F12 → Console tab" -ForegroundColor White
Write-Host "   Verify: No CORS errors, data loads`n" -ForegroundColor White

Write-Host "💡 TIP: Use Incognito/Private mode for clean test (no old cache)" -ForegroundColor Cyan
Write-Host ""

# Pause for user to read
Write-Host "Press any key to open dashboard in browser..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Try to open browser
try {
    Start-Process "https://www.renos.dk/dashboard"
    Write-Host "✅ Browser opened! Check console for errors." -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not auto-open browser. Please open manually:" -ForegroundColor Yellow
    Write-Host "   https://www.renos.dk/dashboard" -ForegroundColor White
}
