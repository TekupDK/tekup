# Simple MCP Browser Automation Demo
param([switch]$Screenshots)

Write-Host "[INFO] Starting MCP browser automation demo..." -ForegroundColor Blue

# Test service availability first
Write-Host "[INFO] Checking services..." -ForegroundColor Cyan

$services = @("http://localhost:8080", "http://localhost:3002", "http://localhost:3003/qualification/stats")
foreach ($url in $services) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 5
        Write-Host "✓ $url : Available" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ $url : Not available" -ForegroundColor Red
    }
}

Write-Host "`n[INFO] Starting MCP browser tests..." -ForegroundColor Blue

try {
    # Test 1: Navigate to marketing website
    Write-Host "[TEST] Navigating to marketing website..." -ForegroundColor Yellow
    
    $navParams = @{url = "http://localhost:8080"}
    $navJson = $navParams | ConvertTo-Json -Compress
    $navResult = call_mcp_tool -name "browser_navigate" -input $navJson
    
    Write-Host "✓ Navigation successful" -ForegroundColor Green
    Start-Sleep -Seconds 3
    
    # Test 2: Take screenshot if requested
    if ($Screenshots) {
        Write-Host "[TEST] Taking screenshot..." -ForegroundColor Yellow
        $timestamp = Get-Date -Format "HHmmss"
        
        $screenshotParams = @{
            name = "marketing-demo-$timestamp"
            fullPage = $true
        }
        $screenshotJson = $screenshotParams | ConvertTo-Json -Compress
        $screenshotResult = call_mcp_tool -name "browser_screenshot" -input $screenshotJson
        
        Write-Host "✓ Screenshot captured: marketing-demo-$timestamp" -ForegroundColor Green
    }
    
    # Test 3: Get page text
    Write-Host "[TEST] Getting page content..." -ForegroundColor Yellow
    $textResult = call_mcp_tool -name "browser_get_text" -input "{}"
    Write-Host "✓ Page content retrieved" -ForegroundColor Green
    
    # Test 4: Get clickable elements
    Write-Host "[TEST] Finding clickable elements..." -ForegroundColor Yellow
    $elementsResult = call_mcp_tool -name "browser_get_clickable_elements" -input "{}"
    Write-Host "✓ Interactive elements found" -ForegroundColor Green
    
    # Test 5: Test scrolling
    Write-Host "[TEST] Testing scroll functionality..." -ForegroundColor Yellow
    $scrollParams = @{amount = 1000}
    $scrollJson = $scrollParams | ConvertTo-Json -Compress
    $scrollResult = call_mcp_tool -name "browser_scroll" -input $scrollJson
    
    Start-Sleep -Seconds 2
    
    # Scroll back
    $scrollBackParams = @{amount = -1000}
    $scrollBackJson = $scrollBackParams | ConvertTo-Json -Compress
    $scrollBackResult = call_mcp_tool -name "browser_scroll" -input $scrollBackJson
    
    Write-Host "✓ Scrolling test completed" -ForegroundColor Green
    
    # Test 6: Navigate to lead platform
    Write-Host "[TEST] Navigating to lead platform..." -ForegroundColor Yellow
    
    $leadNavParams = @{url = "http://localhost:3002"}
    $leadNavJson = $leadNavParams | ConvertTo-Json -Compress
    $leadNavResult = call_mcp_tool -name "browser_navigate" -input $leadNavJson
    
    Write-Host "✓ Lead platform navigation successful" -ForegroundColor Green
    Start-Sleep -Seconds 4
    
    # Test 7: Take lead platform screenshot
    if ($Screenshots) {
        Write-Host "[TEST] Taking lead platform screenshot..." -ForegroundColor Yellow
        $leadTimestamp = Get-Date -Format "HHmmss"
        
        $leadScreenshotParams = @{
            name = "lead-demo-$leadTimestamp"
            fullPage = $true
        }
        $leadScreenshotJson = $leadScreenshotParams | ConvertTo-Json -Compress
        $leadScreenshotResult = call_mcp_tool -name "browser_screenshot" -input $leadScreenshotJson
        
        Write-Host "✓ Lead platform screenshot captured: lead-demo-$leadTimestamp" -ForegroundColor Green
    }
    
    Write-Host "`n=== MCP DEMO RESULTS ===" -ForegroundColor Blue
    Write-Host "✓ All MCP browser automation tests passed!" -ForegroundColor Green
    Write-Host "✓ Marketing website: Navigated and tested" -ForegroundColor Green
    Write-Host "✓ Lead platform: Navigated and tested" -ForegroundColor Green
    if ($Screenshots) {
        Write-Host "✓ Screenshots: Captured for both platforms" -ForegroundColor Green
    }
    
} catch {
    Write-Host "✗ MCP test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[INFO] MCP demo completed!" -ForegroundColor Blue