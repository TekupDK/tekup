# Edge Case & Error Handling Tests
# Tests unusual inputs and error scenarios

$API_URL = "http://localhost:3000/api/chat"

Write-Host "[TEST] Edge Cases & Error Handling`n" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

$results = @()

# Test scenarios
$tests = @(
    @{
        Name = "Empty Message"
        Body = @{ message = ""; messages = @() }
        ExpectError = $true
    },
    @{
        Name = "Very Long Message (2000+ chars)"
        Body = @{
            message = ("A" * 2500) + " Hvad er Tekup?"
            messages = @()
        }
        ExpectError = $false
    },
    @{
        Name = "Special Characters"
        Body = @{
            message = "Test: <>!@#$%^&*()_+{}|:""<>?[];',./`~"
            messages = @()
        }
        ExpectError = $false
    },
    @{
        Name = "Danish Characters"
        Body = @{
            message = "Æble, øl, og å i Århus"
            messages = @()
        }
        ExpectError = $false
    },
    @{
        Name = "Code Injection Attempt"
        Body = @{
            message = "'; DROP TABLE messages; --"
            messages = @()
        }
        ExpectError = $false
    },
    @{
        Name = "XSS Attempt"
        Body = @{
            message = "<script>alert('XSS')</script>"
            messages = @()
        }
        ExpectError = $false
    },
    @{
        Name = "Missing messages field"
        Body = @{ message = "Test" }
        ExpectError = $false  # Should default to empty array
    },
    @{
        Name = "Invalid JSON in history"
        Body = @{
            message = "Test"
            messages = "not-an-array"
        }
        ExpectError = $true
    },
    @{
        Name = "Unicode Emojis"
        Body = @{
            message = "Test 🚀 💻 🎉 med emojis"
            messages = @()
        }
        ExpectError = $false
    },
    @{
        Name = "Multi-line Input"
        Body = @{
            message = "Line 1`nLine 2`nLine 3"
            messages = @()
        }
        ExpectError = $false
    }
)

foreach ($test in $tests) {
    Write-Host "`n[TEST] $($test.Name)" -ForegroundColor Yellow
    
    $startTime = Get-Date
    
    try {
        $body = $test.Body | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri $API_URL -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30 -ErrorAction Stop
        
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($test.ExpectError) {
            Write-Host "   [FAIL] Expected error but got success" -ForegroundColor Red
            $results += @{
                Test = $test.Name
                Status = "FAIL"
                Reason = "Should have returned error"
            }
        } else {
            # Check response
            if ($response.message) {
                $responsePreview = $response.message.Substring(0, [Math]::Min(100, $response.message.Length))
                Write-Host "   [PASS] $([math]::Round($duration))ms" -ForegroundColor Green
                Write-Host "      Response: $($responsePreview)..."
                
                # Security checks
                if ($test.Name -match "XSS|Injection") {
                    if ($response.message -match "<script|DROP TABLE") {
                        Write-Host "      [SECURITY] Response contains unsafe content!" -ForegroundColor Red
                    } else {
                        Write-Host "      [SECURITY] Sanitized correctly" -ForegroundColor Green
                    }
                }
                
                $results += @{
                    Test = $test.Name
                    Status = "PASS"
                    Duration = $duration
                }
            } else {
                Write-Host "   [FAIL] No message in response" -ForegroundColor Red
                $results += @{
                    Test = $test.Name
                    Status = "FAIL"
                    Reason = "Empty response"
                }
            }
        }
    } catch {
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($test.ExpectError) {
            Write-Host "   [PASS] Correctly rejected ($([math]::Round($duration))ms)" -ForegroundColor Green
            Write-Host "      Error: $($_.Exception.Message.Substring(0, [Math]::Min(80, $_.Exception.Message.Length)))"
            
            $results += @{
                Test = $test.Name
                Status = "PASS"
                Duration = $duration
            }
        } else {
            Write-Host "   [FAIL] Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
            
            $results += @{
                Test = $test.Name
                Status = "FAIL"
                Error = $_.Exception.Message
            }
        }
    }
}

# Summary
Write-Host "`n" ("=" * 60) -ForegroundColor Gray
Write-Host "`n[SUMMARY] Edge Case Test Results:" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $results.Count

Write-Host "   Total: $total"
Write-Host "   Passed: $passed" -ForegroundColor Green
Write-Host "   Failed: $failed" -ForegroundColor Red
Write-Host "   Success Rate: $([math]::Round(($passed / $total) * 100, 1))%"

# Export
$results | ConvertTo-Json | Out-File -FilePath "tests\edge-case-results.json"
Write-Host "`n[SAVE] Results saved to tests\edge-case-results.json`n"

exit $failed
