# Tekup Chat API Test Suite - PowerShell
# Tests various scenarios against the chat API

$API_URL = "http://localhost:3000/api/chat"

Write-Host "[TEST] Starting Tekup Chat API Tests`n" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

$testResults = @()

# Test scenarios
$scenarios = @(
    @{
        Name = "Basic Query"
        Message = "Hvad kan du hjælpe mig med?"
        ExpectedKeywords = @("hjælpe", "Tekup")
    },
    @{
        Name = "Billy.dk Invoice Query"
        Message = "Hvordan laver jeg en faktura i Billy.dk?"
        ExpectedKeywords = @("faktura", "Billy")
    },
    @{
        Name = "Strategic Decision"
        Message = "Skal jeg slette Tekup-org?"
        ExpectedKeywords = @("værdi", "extract")
    },
    @{
        Name = "TekupVault Knowledge"
        Message = "Hvad er TekupVault?"
        ExpectedKeywords = @("TekupVault", "knowledge")
    },
    @{
        Name = "Code Help"
        Message = "Vis mig TypeScript eksempel"
        ExpectedKeywords = @("TypeScript", "code")
    }
)

foreach ($scenario in $scenarios) {
    Write-Host "`n[TEST] $($scenario.Name)" -ForegroundColor Yellow
    Write-Host "   Query: `"$($scenario.Message)`""
    
    $startTime = Get-Date
    
    try {
        $body = @{
            message = $scenario.Message
            messages = @()
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri $API_URL -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
        
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        # Check response
        if ($response.message) {
            $messageLength = $response.message.Length
            $sourcesCount = if ($response.sources) { $response.sources.Count } else { 0 }
            
            # Check keywords
            $foundKeywords = 0
            foreach ($keyword in $scenario.ExpectedKeywords) {
                if ($response.message -match $keyword) {
                    $foundKeywords++
                }
            }
            
            $durationRounded = [math]::Round($duration)
            Write-Host "   [PASS] ${durationRounded}ms" -ForegroundColor Green
            Write-Host "      Response: ${messageLength} chars"
            Write-Host "      Sources: ${sourcesCount}"
            Write-Host "      Keywords found: ${foundKeywords}/$($scenario.ExpectedKeywords.Count)"
            
            if ($sourcesCount -gt 0) {
                Write-Host "      Top source: $($response.sources[0].repository)/$($response.sources[0].path)" -ForegroundColor Cyan
            }
            
            $testResults += @{
                Test = $scenario.Name
                Status = "PASS"
                Duration = $duration
                ResponseLength = $messageLength
                Sources = $sourcesCount
                KeywordsFound = $foundKeywords
            }
        } else {
            throw "No message in response"
        }
        
    } catch {
        Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
        
        $testResults += @{
            Test = $scenario.Name
            Status = "FAIL"
            Error = $_.Exception.Message
        }
    }
}

# Summary
Write-Host "`n" ("=" * 60) -ForegroundColor Gray
Write-Host "`n[SUMMARY] Test Results:" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $testResults.Count

Write-Host "   Total: $total"
Write-Host "   Passed: $passed" -ForegroundColor Green
Write-Host "   Failed: $failed" -ForegroundColor Red
Write-Host "   Success Rate: $([math]::Round(($passed / $total) * 100, 1))%"

if ($passed -gt 0) {
    $avgDuration = ($testResults | Where-Object { $_.Status -eq "PASS" } | Measure-Object -Property Duration -Average).Average
    Write-Host "   Avg Response Time: $([math]::Round($avgDuration))ms" -ForegroundColor Cyan
}

Write-Host "`n[DONE] Tests completed!`n" -ForegroundColor Green

# Export results
$testResults | ConvertTo-Json | Out-File -FilePath "tests\test-results.json"
Write-Host "[SAVE] Results saved to tests\test-results.json`n"

exit $failed
