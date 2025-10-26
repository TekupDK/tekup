# Quick Cache Verification Script
# Checks if you're seeing the OLD or NEW version

Write-Host "`n🔍 RenOS Cache Check" -ForegroundColor Cyan
Write-Host "==================`n" -ForegroundColor Cyan

# Expected values (from latest build)
$expectedJsHash = "index-BkPeDZ3X.js"
$expectedCssHash = "index-BrK6QlqX.css"
$expectedIcon = "/favicon.png"

Write-Host "📡 Fetching production HTML..." -ForegroundColor Yellow
$html = curl.exe -s https://www.renos.dk

if ($html -match 'vite\.svg') {
    Write-Host "❌ PROBLEM: Still showing OLD version (/vite.svg found)" -ForegroundColor Red
    Write-Host "`n💡 Solution:" -ForegroundColor Yellow
    Write-Host "   1. Open DevTools (F12)" -ForegroundColor White
    Write-Host "   2. Application → Service Workers → Unregister ALL" -ForegroundColor White
    Write-Host "   3. Application → Storage → Clear site data" -ForegroundColor White
    Write-Host "   4. Hard Refresh (Ctrl+Shift+R)`n" -ForegroundColor White
} else {
    Write-Host "✅ GOOD: No /vite.svg reference found" -ForegroundColor Green
}

if ($html -match $expectedJsHash) {
    Write-Host "✅ JavaScript: Using NEW hash ($expectedJsHash)" -ForegroundColor Green
} else {
    if ($html -match 'index-DhwbZfHL\.js') {
        Write-Host "❌ JavaScript: Using OLD hash (index-DhwbZfHL.js)" -ForegroundColor Red
    } else {
        Write-Host "⚠️  JavaScript: Unknown hash (check manually)" -ForegroundColor Yellow
    }
}

if ($html -match $expectedCssHash) {
    Write-Host "✅ CSS: Using NEW hash ($expectedCssHash)" -ForegroundColor Green
} else {
    if ($html -match 'index-lTF4m7SI\.css') {
        Write-Host "❌ CSS: Using OLD hash (index-lTF4m7SI.css)" -ForegroundColor Red
    } else {
        Write-Host "⚠️  CSS: Unknown hash (check manually)" -ForegroundColor Yellow
    }
}

if ($html -match 'href="/favicon\.png"') {
    Write-Host "✅ Favicon: Correctly pointing to /favicon.png" -ForegroundColor Green
} else {
    Write-Host "❌ Favicon: NOT using correct path" -ForegroundColor Red
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
if ($html -match 'vite\.svg' -or $html -match 'index-DhwbZfHL\.js') {
    Write-Host "   Status: CACHE PROBLEM - You are seeing OLD version" -ForegroundColor Red
    Write-Host "   Action Required: Clear Service Worker + Hard Refresh" -ForegroundColor Yellow
} else {
    Write-Host "   Status: ALL GOOD - New version is live!" -ForegroundColor Green
}

Write-Host "`nℹ️  Full guide: See CACHE_TROUBLESHOOTING_GUIDE.md`n" -ForegroundColor Gray
