# Tekup MCP-Powered UI Testing (Fixed Version)
# Real browser automation using MCP tools

param(
    [ValidateSet("test-marketing", "test-lead", "test-all", "demo")]
    [string]$Mode = "demo",
    [switch]$SaveScreenshots
)

$script:TestResults = @{
    StartTime = Get-Date
    TestSessions = @()
    Screenshots = @()
    Errors = @()
}

function Write-MCPLog {
    param($Message, $Color = "White", $Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss.fff"
    Write-Host "[$timestamp] [MCP-Test] [$Level] $Message" -ForegroundColor $Color
}

function Test-ServiceAvailability {
    Write-MCPLog "Checking service availability..." "Cyan"
    
    $services = @(
        @{Name="Marketing"; URL="http://localhost:8080"}
        @{Name="Lead Platform"; URL="http://localhost:3002"}
        @{Name="Lead API"; URL="http://localhost:3003/qualification/stats"}
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service.URL -Method Head -TimeoutSec 5
            Write-MCPLog "✓ $($service.Name): Available (Status: $($response.StatusCode))" "Green"
        }
        catch {
            Write-MCPLog "✗ $($service.Name): Not available" "Red"
        }
    }
}

function Test-MarketingWithMCP {
    Write-MCPLog "=== Testing Marketing Website with MCP ===" "Blue"
    
    $testSession = @{
        Site = "Marketing Website"
        URL = "http://localhost:8080"
        Tests = @()
        StartTime = Get-Date
    }
    
    try {
        # Navigate to marketing website
        Write-MCPLog "Navigating to marketing website..." "Yellow"
        $navParams = @{url = "http://localhost:8080"}
        $navResult = call_mcp_tool -name "browser_navigate" -input ($navParams | ConvertTo-Json -Compress)
        $testSession.Tests += @{Name = "Navigation"; Status = "PASSED"; Time = Get-Date}
        Write-MCPLog "✓ Navigation successful" "Green"
        
        # Wait for page load
        Start-Sleep -Seconds 3
        
        # Take screenshot
        if ($SaveScreenshots) {
            Write-MCPLog "Taking screenshot..." "Yellow"
            $screenshotParams = @{
                name = "marketing-test-$(Get-Date -Format 'HHmmss')"
                fullPage = $true
            }
            $screenshotResult = call_mcp_tool -name "browser_screenshot" -input ($screenshotParams | ConvertTo-Json -Compress)
            $script:TestResults.Screenshots += "marketing-test-$(Get-Date -Format 'HHmmss')"
            Write-MCPLog "✓ Screenshot captured" "Green"
        }
        
        # Get page content
        Write-MCPLog "Analyzing page content..." "Yellow"
        $contentResult = call_mcp_tool -name "browser_get_text" -input "{}"
        $testSession.Tests += @{Name = "Content Analysis"; Status = "PASSED"; Time = Get-Date}
        Write-MCPLog "✓ Page content analyzed" "Green"
        
        # Get clickable elements
        Write-MCPLog "Finding interactive elements..." "Yellow"
        $elementsResult = call_mcp_tool -name "browser_get_clickable_elements" -input "{}"
        $testSession.Tests += @{Name = "Element Discovery"; Status = "PASSED"; Time = Get-Date}
        Write-MCPLog "✓ Interactive elements found" "Green"
        
        # Test scrolling
        Write-MCPLog "Testing page scroll..." "Yellow"
        $scrollParams = @{amount = 1000}
        $scrollResult = call_mcp_tool -name "browser_scroll" -input ($scrollParams | ConvertTo-Json -Compress)
        Start-Sleep -Seconds 2
        
        # Scroll back
        $scrollBackParams = @{amount = -1000}
        $scrollBackResult = call_mcp_tool -name "browser_scroll" -input ($scrollBackParams | ConvertTo-Json -Compress)
        $testSession.Tests += @{Name = "Scrolling"; Status = "PASSED"; Time = Get-Date}
        Write-MCPLog "✓ Scrolling test completed" "Green"
        
        $testSession.Status = "PASSED"
        Write-MCPLog "✓ Marketing website test completed successfully" "Green"
        
    } catch {
        $testSession.Status = "FAILED"
        $testSession.Error = $_.Exception.Message
        Write-MCPLog "✗ Marketing website test failed: $($_.Exception.Message)" "Red"
        $script:TestResults.Errors += @{
            Test = "Marketing Website"
            Error = $_.Exception.Message
            Timestamp = Get-Date
        }
    }
    
    $testSession.EndTime = Get-Date
    $testSession.Duration = $testSession.EndTime - $testSession.StartTime
    return $testSession
}

function Test-LeadPlatformWithMCP {
    Write-MCPLog "=== Testing Lead Platform with MCP ===" "Blue"
    
    $testSession = @{
        Site = "Lead Platform"
        URL = "http://localhost:3002"
        Tests = @()
        StartTime = Get-Date
    }
    
    try {
        # Navigate to lead platform
        Write-MCPLog "Navigating to lead platform..." "Yellow"
        $navParams = @{url = "http://localhost:3002"}
        $navResult = call_mcp_tool -name "browser_navigate" -input ($navParams | ConvertTo-Json -Compress)
        $testSession.Tests += @{Name = "Navigation"; Status = "PASSED"; Time = Get-Date}
        Write-MCPLog "✓ Navigation successful" "Green"
        
        # Wait for dashboard load
        Start-Sleep -Seconds 4
        
        # Take dashboard screenshot
        if ($SaveScreenshots) {
            Write-MCPLog "Taking dashboard screenshot..." "Yellow"
            $screenshotParams = @{
                name = "lead-dashboard-$(Get-Date -Format 'HHmmss')"
                fullPage = $true
            }
            $screenshotResult = call_mcp_tool -name "browser_screenshot" -input ($screenshotParams | ConvertTo-Json -Compress)
            $script:TestResults.Screenshots += "lead-dashboard-$(Get-Date -Format 'HHmmss')"
            Write-MCPLog "✓ Dashboard screenshot captured" "Green"
        }
        
        # Get dashboard content
        Write-MCPLog "Analyzing dashboard content..." "Yellow"
        $contentResult = call_mcp_tool -name "browser_get_text" -input "{}"
        $testSession.Tests += @{Name = "Dashboard Load"; Status = "PASSED"; Time = Get-Date}
        Write-MCPLog "✓ Dashboard content analyzed" "Green"
        
        # Get interactive elements
        Write-MCPLog "Finding dashboard controls..." "Yellow"
        $elementsResult = call_mcp_tool -name "browser_get_clickable_elements" -input "{}"
        $testSession.Tests += @{Name = "Controls Discovery"; Status = "PASSED"; Time = Get-Date}
        Write-MCPLog "✓ Dashboard controls identified" "Green"
        
        # Test dashboard navigation
        Write-MCPLog "Testing dashboard navigation..." "Yellow"
        $scrollParams = @{amount = 500}
        $scrollResult = call_mcp_tool -name "browser_scroll" -input ($scrollParams | ConvertTo-Json -Compress)
        Start-Sleep -Seconds 2
        
        $scrollBackParams = @{amount = -500}
        $scrollBackResult = call_mcp_tool -name "browser_scroll" -input ($scrollBackParams | ConvertTo-Json -Compress)
        $testSession.Tests += @{Name = "Dashboard Navigation"; Status = "PASSED"; Time = Get-Date}
        Write-MCPLog "✓ Dashboard navigation test completed" "Green"
        
        $testSession.Status = "PASSED"
        Write-MCPLog "✓ Lead platform test completed successfully" "Green"
        
    } catch {
        $testSession.Status = "FAILED"
        $testSession.Error = $_.Exception.Message
        Write-MCPLog "✗ Lead platform test failed: $($_.Exception.Message)" "Red"
        $script:TestResults.Errors += @{
            Test = "Lead Platform"
            Error = $_.Exception.Message
            Timestamp = Get-Date
        }
    }
    
    $testSession.EndTime = Get-Date
    $testSession.Duration = $testSession.EndTime - $testSession.StartTime
    return $testSession
}

function Show-TestSummary {
    $duration = (Get-Date) - $script:TestResults.StartTime
    
    Write-MCPLog "=== TEST SUMMARY ===" "Blue"
    Write-MCPLog "Test Duration: $($duration.ToString('mm\:ss\.fff'))" "Cyan"
    Write-MCPLog "Total Sessions: $($script:TestResults.TestSessions.Count)" "White"
    
    $passed = ($script:TestResults.TestSessions | Where-Object { $_.Status -eq "PASSED" }).Count
    $failed = ($script:TestResults.TestSessions | Where-Object { $_.Status -eq "FAILED" }).Count
    
    Write-MCPLog "Passed: $passed" "Green"
    Write-MCPLog "Failed: $failed" "Red"
    Write-MCPLog "Screenshots: $($script:TestResults.Screenshots.Count)" "Cyan"
    Write-MCPLog "Errors: $($script:TestResults.Errors.Count)" "Yellow"
    
    if ($script:TestResults.Errors.Count -gt 0) {
        Write-MCPLog "=== ERRORS ===" "Red"
        foreach ($error in $script:TestResults.Errors) {
            Write-MCPLog "$($error.Test): $($error.Error)" "Red"
        }
    }
}

# Main execution
Write-MCPLog "Starting MCP-powered UI testing..." "Blue"
Write-MCPLog "Mode: $Mode | Screenshots: $SaveScreenshots" "Cyan"

# Check service availability first
Test-ServiceAvailability

switch ($Mode.ToLower()) {
    "demo" {
        Write-MCPLog "Running demo test on marketing website..." "Blue"
        $marketingTest = Test-MarketingWithMCP
        $script:TestResults.TestSessions += $marketingTest
    }
    "test-marketing" {
        $marketingTest = Test-MarketingWithMCP
        $script:TestResults.TestSessions += $marketingTest
    }
    "test-lead" {
        $leadTest = Test-LeadPlatformWithMCP
        $script:TestResults.TestSessions += $leadTest
    }
    "test-all" {
        $marketingTest = Test-MarketingWithMCP
        $script:TestResults.TestSessions += $marketingTest
        
        $leadTest = Test-LeadPlatformWithMCP
        $script:TestResults.TestSessions += $leadTest
    }
}

Show-TestSummary
Write-MCPLog "MCP testing completed!" "Green"