# Analyze Render logs for MCP usage patterns

$logFile = "render-api-logs.json"

Write-Host "Analyzing Render logs from today..." -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host ""

# Read JSON log entries (they're concatenated, not in an array)
$content = Get-Content $logFile -Raw
$entries = $content -split '\}\{' | ForEach-Object {
    $json = $_
    if (-not $json.StartsWith('{')) { $json = '{' + $json }
    if (-not $json.EndsWith('}')) { $json = $json + '}' }
    try {
        $json | ConvertFrom-Json
    } catch {
        # Skip malformed entries
    }
}

Write-Host "Total log entries: $($entries.Count)" -ForegroundColor Green
Write-Host ""

# Extract MCP tool calls
$toolCalls = $entries | Where-Object {
    $pathLabel = $_.labels | Where-Object { $_.name -eq 'path' } | Select-Object -First 1
    $pathLabel -and $pathLabel.value -like '*/api/v1/tools/*'
}

Write-Host "MCP Tool Calls Found: $($toolCalls.Count)" -ForegroundColor Yellow
Write-Host ""

if ($toolCalls.Count -gt 0) {
    Write-Host "TOOL CALL BREAKDOWN:" -ForegroundColor Cyan
    Write-Host "-" * 80
    
    $toolCalls | ForEach-Object {
        $timestamp = ([DateTime]$_.timestamp).ToLocalTime().ToString("HH:mm:ss")
        $path = ($_.labels | Where-Object { $_.name -eq 'path' }).value
        $toolName = ($path -split '/')[-1]
        $status = ($_.labels | Where-Object { $_.name -eq 'statusCode' }).value
        $method = ($_.labels | Where-Object { $_.name -eq 'method' }).value
        
        # Parse response time from message
        if ($_.message -match 'responseTimeMS=(\d+)') {
            $responseTime = $Matches[1]
        } else {
            $responseTime = "N/A"
        }
        
        # Color based on status
        $color = switch ($status) {
            { $_ -match '^2' } { 'Green' }   # 2xx = success
            { $_ -match '^4' } { 'Yellow' }  # 4xx = client error  
            { $_ -match '^5' } { 'Red' }     # 5xx = server error
            default { 'White' }
        }
        
        Write-Host ("  [{0}] {1,-3} {2,-30} {3,5}ms" -f $timestamp, $status, $toolName, $responseTime) -ForegroundColor $color
    }
    
    Write-Host ""
    Write-Host "SUMMARY BY TOOL:" -ForegroundColor Cyan
    Write-Host "-" * 80
    
    $toolCalls | Group-Object {
        $path = ($_.labels | Where-Object { $_.name -eq 'path' }).value
        ($path -split '/')[-1]
    } | Sort-Object Count -Descending | ForEach-Object {
        $successCount = ($_.Group | Where-Object {
            ($_.labels | Where-Object { $_.name -eq 'statusCode' }).value -match '^2'
        }).Count
        $errorCount = $_.Count - $successCount
        
        Write-Host ("  {0,-30} {1,4} calls ({2} success, {3} errors)" -f $_.Name, $_.Count, $successCount, $errorCount) -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "STATUS CODE BREAKDOWN:" -ForegroundColor Cyan
    Write-Host "-" * 80
    
    $toolCalls | Group-Object {
        ($_.labels | Where-Object { $_.name -eq 'statusCode' }).value
    } | Sort-Object Name | ForEach-Object {
        $statusName = switch ($_.Name) {
            '200' { 'OK' }
            '201' { 'Created' }
            '400' { 'Bad Request' }
            '401' { 'Unauthorized' }
            '404' { 'Not Found' }
            '429' { 'Rate Limit Exceeded' }
            '500' { 'Internal Server Error' }
            default { 'Unknown' }
        }
        
        Write-Host ("  {0} {1,-25} {2,4} occurrences" -f $_.Name, $statusName, $_.Count) -ForegroundColor White
    }
    
    # Check for rate limiting
    $rateLimited = $toolCalls | Where-Object {
        ($_.labels | Where-Object { $_.name -eq 'statusCode' }).value -eq '429'
    }
    
    if ($rateLimited.Count -gt 0) {
        Write-Host ""
        Write-Host "WARNING: Rate Limiting Detected!" -ForegroundColor Red
        Write-Host "  $($rateLimited.Count) requests were rate-limited (HTTP 429)" -ForegroundColor Yellow
        Write-Host "  This happened during your invoice analysis earlier" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "No MCP tool calls found in this log sample" -ForegroundColor Yellow
    Write-Host "These logs only show HTTP access logs, not application logs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Note: For full application logs with tool parameters and results," -ForegroundColor Gray
Write-Host "      Supabase audit logging needs to be enabled." -ForegroundColor Gray
