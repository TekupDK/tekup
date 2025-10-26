# 🔍 RenOS Production Verification Script
# Validates live deployment against local build
# Usage: .\verify-production.ps1

Write-Host "🚀 RenOS Production Verification Starting..." -ForegroundColor Cyan
Write-Host ""

$productionUrl = "https://www.renos.dk"
$localBuildPath = "client/dist"

# Test 1: Production Accessibility
Write-Host "📡 Test 1: Production Site Accessibility" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $productionUrl -Method Head -TimeoutSec 10
    Write-Host "✅ Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Last-Modified: $($response.Headers['Last-Modified'])" -ForegroundColor Gray
    Write-Host "   ETag: $($response.Headers['ETag'])" -ForegroundColor Gray
    
    # Parse deployment time
    $lastModified = [DateTime]::Parse($response.Headers['Last-Modified'])
    $minutesAgo = [Math]::Round(((Get-Date) - $lastModified).TotalMinutes, 1)
    Write-Host "   ⏱️  Deployed: $minutesAgo minutes ago" -ForegroundColor Gray
} catch {
    Write-Host "❌ Production site unreachable: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: SPA Routing (Critical Routes)
Write-Host "🔗 Test 2: SPA Routing Verification" -ForegroundColor Yellow
$routes = @("/", "/dashboard", "/login", "/vilkaar", "/privatlivspolitik", "/customers")
$routesPassed = 0

foreach ($route in $routes) {
    try {
        $response = Invoke-WebRequest -Uri "$productionUrl$route" -Method Head -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $route → 200 OK" -ForegroundColor Green
            $routesPassed++
        } else {
            Write-Host "⚠️  $route → $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $route → FAILED" -ForegroundColor Red
    }
}

Write-Host "   Routes Passed: $routesPassed/$($routes.Count)" -ForegroundColor Gray
Write-Host ""

# Test 3: Assets (Favicon, Manifest, Icons)
Write-Host "📦 Test 3: Static Assets" -ForegroundColor Yellow
$assets = @(
    "/favicon.png",
    "/manifest.json",
    "/icons/app-icon.png",
    "/_redirects"
)

$assetsPassed = 0
foreach ($asset in $assets) {
    try {
        $response = Invoke-WebRequest -Uri "$productionUrl$asset" -Method Head -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $asset → 200 OK" -ForegroundColor Green
            $assetsPassed++
        } else {
            Write-Host "⚠️  $asset → $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $asset → NOT FOUND" -ForegroundColor Red
    }
}

Write-Host "   Assets Passed: $assetsPassed/$($assets.Count)" -ForegroundColor Gray
Write-Host ""

# Test 4: Local Build Verification
Write-Host "🏗️  Test 4: Local Build Check" -ForegroundColor Yellow
if (Test-Path $localBuildPath) {
    Write-Host "✅ Local build directory exists" -ForegroundColor Green
    
    # Check critical files
    $criticalFiles = @(
        "$localBuildPath/index.html",
        "$localBuildPath/_redirects",
        "$localBuildPath/manifest.json",
        "$localBuildPath/favicon.png"
    )
    
    $buildFilesPassed = 0
    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            Write-Host "✅ $(Split-Path $file -Leaf)" -ForegroundColor Green
            $buildFilesPassed++
        } else {
            Write-Host "❌ $(Split-Path $file -Leaf) MISSING" -ForegroundColor Red
        }
    }
    
    Write-Host "   Build Files: $buildFilesPassed/$($criticalFiles.Count)" -ForegroundColor Gray
} else {
    Write-Host "❌ Local build directory not found" -ForegroundColor Red
    Write-Host "   Run: cd client && npm run build" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: CSS Bundle Check
Write-Host "🎨 Test 5: CSS Bundle Verification" -ForegroundColor Yellow
try {
    $htmlContent = Invoke-WebRequest -Uri $productionUrl -TimeoutSec 10
    
    # Check for CSS bundle
    if ($htmlContent.Content -match 'href="(/assets/index-[a-zA-Z0-9]+\.css)"') {
        $cssPath = $matches[1]
        Write-Host "✅ CSS Bundle Found: $cssPath" -ForegroundColor Green
        
        # Try to fetch CSS
        try {
            $cssResponse = Invoke-WebRequest -Uri "$productionUrl$cssPath" -Method Head
            $cssSize = [Math]::Round($cssResponse.Headers['Content-Length'] / 1024, 2)
            Write-Host "   Size: $cssSize KB" -ForegroundColor Gray
        } catch {
            Write-Host "⚠️  CSS bundle exists but couldn't verify size" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ CSS Bundle NOT found in HTML" -ForegroundColor Red
    }
    
    # Check for JS bundle
    if ($htmlContent.Content -match 'src="(/assets/index-[a-zA-Z0-9]+\.js)"') {
        $jsPath = $matches[1]
        Write-Host "✅ JS Bundle Found: $jsPath" -ForegroundColor Green
    } else {
        Write-Host "❌ JS Bundle NOT found in HTML" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Couldn't fetch HTML content: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 6: HEAD Validation
Write-Host "📋 Test 6: HTML HEAD Validation" -ForegroundColor Yellow
try {
    $htmlContent = Invoke-WebRequest -Uri $productionUrl
    
    # Check for critical HEAD elements
    $headChecks = @{
        "Favicon" = '<link rel="icon".*?href="/favicon\.png"'
        "Manifest" = '<link rel="manifest".*?href="/manifest\.json"'
        "Theme-Color" = '<meta name="theme-color"'
        "Viewport" = '<meta name="viewport"'
        "Title" = '<title>RenOS'
    }
    
    foreach ($check in $headChecks.GetEnumerator()) {
        if ($htmlContent.Content -match $check.Value) {
            Write-Host "✅ $($check.Key)" -ForegroundColor Green
        } else {
            Write-Host "❌ $($check.Key) MISSING" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ HEAD validation failed" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$totalTests = 6
$passedTests = 0

if ($routesPassed -eq $routes.Count) { $passedTests++ }
if ($assetsPassed -ge ($assets.Count - 1)) { $passedTests++ }  # Allow 1 failure
if ($buildFilesPassed -eq $criticalFiles.Count) { $passedTests++ }

Write-Host "Tests Passed: $passedTests/$totalTests" -ForegroundColor $(if ($passedTests -ge 5) { "Green" } else { "Yellow" })
Write-Host ""

# Recommendations
Write-Host "💡 RECOMMENDATIONS:" -ForegroundColor Yellow
Write-Host ""

if ($minutesAgo -gt 10) {
    Write-Host "⚠️  Deployment is $minutesAgo minutes old" -ForegroundColor Yellow
    Write-Host "   Check Render.com dashboard for latest deployment status" -ForegroundColor Gray
    Write-Host "   URL: https://dashboard.render.com" -ForegroundColor Gray
}

if ($routesPassed -lt $routes.Count) {
    Write-Host "⚠️  Some routes are failing" -ForegroundColor Yellow
    Write-Host "   Verify _redirects file is deployed correctly" -ForegroundColor Gray
    Write-Host "   Check: $productionUrl/_redirects" -ForegroundColor Gray
}

if ($passedTests -ge 5) {
    Write-Host "✅ Production deployment looks healthy!" -ForegroundColor Green
    Write-Host "   Consider doing a hard refresh (Ctrl+F5) in browser" -ForegroundColor Gray
} else {
    Write-Host "❌ Production deployment has issues" -ForegroundColor Red
    Write-Host "   Check Render.com build logs for errors" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔄 To force cache clear, try:" -ForegroundColor Cyan
Write-Host "   1. Hard refresh: Ctrl + F5" -ForegroundColor Gray
Write-Host "   2. Incognito mode" -ForegroundColor Gray
Write-Host "   3. Clear browser cache manually" -ForegroundColor Gray
Write-Host ""

# Git status check
Write-Host "📚 Git Status:" -ForegroundColor Cyan
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "⚠️  Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
} else {
    Write-Host "✅ Working tree clean" -ForegroundColor Green
}

$lastCommit = git log -1 --oneline
Write-Host "   Latest commit: $lastCommit" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Verification Complete!" -ForegroundColor Green
Write-Host ""
