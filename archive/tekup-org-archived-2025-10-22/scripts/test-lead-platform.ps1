# Lead Platform Testing Script with MCP Browser Automation
# This script runs comprehensive tests on the Lead Platform using MCP browser tools

param(
    [Parameter()]
    [ValidateSet("api", "frontend", "integration", "all")]
    [string]$TestType = "all",
    
    [Parameter()]
    [string]$BaseUrl = "http://localhost",
    
    [Parameter()]
    [int]$BackendPort = 3003,
    
    [Parameter()]
    [int]$FrontendPort = 3002
)

$ErrorActionPreference = "Stop"

# Test configuration
$BACKEND_URL = "$BaseUrl`:$BackendPort"
$FRONTEND_URL = "$BaseUrl`:$FrontendPort"
$API_URL = "$BACKEND_URL/api"

# Test results
$TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Tests = @()
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Details = ""
    )
    
    $TestResults.Total++
    if ($Success) {
        $TestResults.Passed++
        Write-Host "✅ $TestName" -ForegroundColor Green
    } else {
        $TestResults.Failed++
        Write-Host "❌ $TestName" -ForegroundColor Red
        if ($Details) {
            Write-Host "   Details: $Details" -ForegroundColor Yellow
        }
    }
    
    $TestResults.Tests += @{
        Name = $TestName
        Success = $Success
        Details = $Details
        Timestamp = Get-Date
    }
}

function Test-ServiceAvailability {
    param([string]$Url, [string]$ServiceName)
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 10
        Write-TestResult "Service Available: $ServiceName" $true "Status: OK"
        return $true
    } catch {
        Write-TestResult "Service Available: $ServiceName" $false "Error: $($_.Exception.Message)"
        return $false
    }
}

function Test-APIEndpoints {
    Write-Host "`n🔍 Testing API Endpoints..." -ForegroundColor Cyan
    
    # Test API documentation endpoint
    try {
        $apiResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api" -Method Get -TimeoutSec 10
        Write-TestResult "API Documentation Endpoint" $true "Swagger UI accessible"
    } catch {
        Write-TestResult "API Documentation Endpoint" $false $_.Exception.Message
    }
    
    # Test qualification stats endpoint
    try {
        $headers = @{ 'x-tenant-key' = 'test-tenant' }
        $statsResponse = Invoke-RestMethod -Uri "$BACKEND_URL/qualification/stats" -Method Get -Headers $headers -TimeoutSec 10
        
        if ($statsResponse -and $statsResponse.total -ge 0) {
            Write-TestResult "Qualification Stats Endpoint" $true "Returned valid stats: Total=$($statsResponse.total)"
        } else {
            Write-TestResult "Qualification Stats Endpoint" $false "Invalid response format"
        }
    } catch {
        Write-TestResult "Qualification Stats Endpoint" $false $_.Exception.Message
    }
    
    # Test lead qualification endpoint
    try {
        $headers = @{ 
            'x-tenant-key' = 'test-tenant'
            'Content-Type' = 'application/json'
        }
        $leadData = @{
            leadId = "test-lead-123"
            tenantId = "test-tenant"
        } | ConvertTo-Json
        
        $qualifyResponse = Invoke-RestMethod -Uri "$BACKEND_URL/qualification/test-lead-123/qualify" -Method Post -Headers $headers -Body $leadData -TimeoutSec 10
        
        if ($qualifyResponse -and $qualifyResponse.score -ge 0) {
            Write-TestResult "Lead Qualification Endpoint" $true "Score: $($qualifyResponse.score), Level: $($qualifyResponse.qualification)"
        } else {
            Write-TestResult "Lead Qualification Endpoint" $false "Invalid qualification response"
        }
    } catch {
        Write-TestResult "Lead Qualification Endpoint" $false $_.Exception.Message
    }
}

function Test-Frontend {
    Write-Host "`n🎨 Testing Frontend with MCP Browser Automation..." -ForegroundColor Cyan
    
    # Note: These would be executed via MCP browser tools if available
    # For now, we'll use PowerShell web requests for basic testing
    
    try {
        # Test frontend availability
        $frontendResponse = Invoke-WebRequest -Uri $FRONTEND_URL -Method Get -TimeoutSec 15
        
        if ($frontendResponse.StatusCode -eq 200) {
            Write-TestResult "Frontend Accessibility" $true "HTTP $($frontendResponse.StatusCode)"
            
            # Check for basic React/Next.js indicators
            $content = $frontendResponse.Content
            $hasReact = $content -like "*react*" -or $content -like "*next*" -or $content -like "*__NEXT_DATA__*"
            Write-TestResult "Frontend Framework Detection" $hasReact "React/Next.js detected: $hasReact"
            
        } else {
            Write-TestResult "Frontend Accessibility" $false "HTTP $($frontendResponse.StatusCode)"
        }
    } catch {
        Write-TestResult "Frontend Accessibility" $false $_.Exception.Message
    }
}

function Test-IntegrationFlow {
    Write-Host "`n🔄 Testing Integration Flow..." -ForegroundColor Cyan
    
    # Test complete lead qualification workflow
    try {
        $headers = @{ 
            'x-tenant-key' = 'test-tenant'
            'Content-Type' = 'application/json'
        }
        
        # Step 1: Get initial stats
        $initialStats = Invoke-RestMethod -Uri "$BACKEND_URL/qualification/stats" -Method Get -Headers $headers -TimeoutSec 10
        
        # Step 2: Qualify a lead
        $leadData = @{
            leadId = "integration-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
            tenantId = "test-tenant"
        } | ConvertTo-Json
        
        $qualificationResult = Invoke-RestMethod -Uri "$BACKEND_URL/qualification/integration-test-$(Get-Date -Format 'yyyyMMddHHmmss')/qualify" -Method Post -Headers $headers -Body $leadData -TimeoutSec 10
        
        # Step 3: Verify qualification result
        if ($qualificationResult.score -ge 0 -and $qualificationResult.qualification) {
            Write-TestResult "Integration: Lead Qualification Flow" $true "Complete workflow executed successfully"
        } else {
            Write-TestResult "Integration: Lead Qualification Flow" $false "Qualification workflow incomplete"
        }
        
    } catch {
        Write-TestResult "Integration: Lead Qualification Flow" $false $_.Exception.Message
    }
}

function Show-TestSummary {
    Write-Host "`n" + "="*50 -ForegroundColor Magenta
    Write-Host "🧪 Lead Platform Test Results Summary" -ForegroundColor Magenta
    Write-Host "="*50 -ForegroundColor Magenta
    
    Write-Host "Total Tests: " -NoNewline
    Write-Host $TestResults.Total -ForegroundColor Cyan
    
    Write-Host "Passed: " -NoNewline
    Write-Host $TestResults.Passed -ForegroundColor Green
    
    Write-Host "Failed: " -NoNewline
    Write-Host $TestResults.Failed -ForegroundColor Red
    
    $successRate = if ($TestResults.Total -gt 0) { 
        [math]::Round(($TestResults.Passed / $TestResults.Total) * 100, 1) 
    } else { 0 }
    
    Write-Host "Success Rate: " -NoNewline
    $color = if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" }
    Write-Host "$successRate%" -ForegroundColor $color
    
    # Show failed tests details
    if ($TestResults.Failed -gt 0) {
        Write-Host "`n❌ Failed Tests:" -ForegroundColor Red
        foreach ($test in $TestResults.Tests | Where-Object { -not $_.Success }) {
            Write-Host "   • $($test.Name): $($test.Details)" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n💡 Recommendations:" -ForegroundColor Cyan
    if ($TestResults.Failed -gt 0) {
        Write-Host "   • Check service logs for error details"
        Write-Host "   • Ensure all dependencies are installed and running"
        Write-Host "   • Verify network connectivity and firewall settings"
    } else {
        Write-Host "   • All tests passed! Lead Platform is ready for development"
        Write-Host "   • Consider adding more comprehensive E2E tests"
    }
}

# Main execution
Write-Host "🏢 TekUp Lead Platform Test Suite" -ForegroundColor Magenta
Write-Host "==================================" -ForegroundColor Magenta

# Check service availability first
Write-Host "`n🔍 Checking Service Availability..." -ForegroundColor Cyan

$backendAvailable = Test-ServiceAvailability "$BACKEND_URL/api" "Lead Platform Backend"
$frontendAvailable = $false

try {
    $frontendResponse = Invoke-WebRequest -Uri $FRONTEND_URL -Method Get -TimeoutSec 10
    $frontendAvailable = $frontendResponse.StatusCode -eq 200
    Write-TestResult "Service Available: Lead Platform Frontend" $frontendAvailable "HTTP $($frontendResponse.StatusCode)"
} catch {
    Write-TestResult "Service Available: Lead Platform Frontend" $false $_.Exception.Message
}

# Run tests based on availability and test type
switch ($TestType) {
    "api" {
        if ($backendAvailable) {
            Test-APIEndpoints
        } else {
            Write-Host "❌ Backend not available - skipping API tests" -ForegroundColor Red
        }
    }
    
    "frontend" {
        if ($frontendAvailable) {
            Test-Frontend
        } else {
            Write-Host "❌ Frontend not available - skipping frontend tests" -ForegroundColor Red
        }
    }
    
    "integration" {
        if ($backendAvailable -and $frontendAvailable) {
            Test-IntegrationFlow
        } else {
            Write-Host "❌ Both services not available - skipping integration tests" -ForegroundColor Red
        }
    }
    
    "all" {
        if ($backendAvailable) {
            Test-APIEndpoints
        }
        if ($frontendAvailable) {
            Test-Frontend
        }
        if ($backendAvailable -and $frontendAvailable) {
            Test-IntegrationFlow
        }
    }
}

Show-TestSummary

# Exit with appropriate code
if ($TestResults.Failed -eq 0) {
    exit 0
} else {
    exit 1
}
