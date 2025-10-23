# Get Today's MCP Usage from Supabase Audit Logs
# Shows Shortwave + ChatGPT + Claude usage from production

$SUPABASE_URL = "https://oaevagdgrasfppbrxbey.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8"

Write-Host "Fetching today's MCP usage logs from Supabase..." -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host ""

# Get today's date in ISO format
$today = Get-Date -Format "yyyy-MM-dd"
$todayStart = "${today}T00:00:00"
$todayEnd = "${today}T23:59:59"

Write-Host "Date range: $today (00:00 - 23:59)" -ForegroundColor Yellow
Write-Host ""

try {
    # Query Supabase for today's audit logs
    $uri = "$SUPABASE_URL/rest/v1/billy_audit_logs?created_at=gte.$todayStart&created_at=lte.$todayEnd&order=created_at.desc&limit=1000"
    
    $response = Invoke-RestMethod -Uri $uri -Method Get `
        -Headers @{
            "apikey" = $SUPABASE_KEY
            "Authorization" = "Bearer $SUPABASE_KEY"
            "Content-Type" = "application/json"
        }
    
    if ($response.Count -eq 0) {
        Write-Host "No logs found for today ($today)" -ForegroundColor Red
        Write-Host ""
        Write-Host "This might mean:" -ForegroundColor Yellow
        Write-Host "  1. No MCP usage today yet" -ForegroundColor Yellow
        Write-Host "  2. Supabase logging is disabled" -ForegroundColor Yellow
        Write-Host "  3. Check Render logs instead" -ForegroundColor Yellow
        exit
    }
    
    Write-Host "Found $($response.Count) log entries for today!" -ForegroundColor Green
    Write-Host ""
    
    # Analyze logs
    $toolCounts = @{}
    $actionCounts = @{}
    $hourCounts = @{}
    $successCount = 0
    $errorCount = 0
    
    foreach ($log in $response) {
        # Count by tool
        if ($log.tool_name) {
            if (-not $toolCounts.ContainsKey($log.tool_name)) {
                $toolCounts[$log.tool_name] = 0
            }
            $toolCounts[$log.tool_name]++
        }
        
        # Count by action
        if ($log.action) {
            if (-not $actionCounts.ContainsKey($log.action)) {
                $actionCounts[$log.action] = 0
            }
            $actionCounts[$log.action]++
        }
        
        # Count by hour
        if ($log.created_at) {
            $hour = ([DateTime]$log.created_at).Hour
            if (-not $hourCounts.ContainsKey($hour)) {
                $hourCounts[$hour] = 0
            }
            $hourCounts[$hour]++
        }
        
        # Count success/error
        if ($log.status -eq 'success') {
            $successCount++
        }
        else {
            $errorCount++
        }
    }
    
    # Display results
    Write-Host "TOOL USAGE (Top 20):" -ForegroundColor Cyan
    Write-Host "-" * 80
    $toolCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20 | ForEach-Object {
        $percentage = [math]::Round(($_.Value / $response.Count) * 100, 1)
        Write-Host ("  {0,-40} {1,5} calls ({2}%)" -f $_.Key, $_.Value, $percentage) -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "ACTION BREAKDOWN (Top 20):" -ForegroundColor Cyan
    Write-Host "-" * 80
    $actionCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20 | ForEach-Object {
        $percentage = [math]::Round(($_.Value / $response.Count) * 100, 1)
        Write-Host ("  {0,-40} {1,5} times ({2}%)" -f $_.Key, $_.Value, $percentage) -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "HOURLY DISTRIBUTION:" -ForegroundColor Cyan
    Write-Host "-" * 80
    0..23 | ForEach-Object {
        $hour = $_
        $count = if ($hourCounts.ContainsKey($hour)) { $hourCounts[$hour] } else { 0 }
        $bar = "#" * [math]::Min(50, $count)
        $timeLabel = "{0:D2}:00-{0:D2}:59" -f $hour
        Write-Host ("  {0}  {1,-50} {2}" -f $timeLabel, $bar, $count) -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "SUMMARY:" -ForegroundColor Yellow
    Write-Host "-" * 80
    Write-Host ("  Total calls:     {0}" -f $response.Count) -ForegroundColor Green
    Write-Host ("  Success:         {0} ({1}%)" -f $successCount, [math]::Round(($successCount/$response.Count)*100,1)) -ForegroundColor Green
    Write-Host ("  Errors:          {0} ({1}%)" -f $errorCount, [math]::Round(($errorCount/$response.Count)*100,1)) -ForegroundColor $(if($errorCount -eq 0){"Green"}else{"Red"})
    Write-Host ("  Unique tools:    {0}" -f $toolCounts.Count) -ForegroundColor Cyan
    Write-Host ("  Unique actions:  {0}" -f $actionCounts.Count) -ForegroundColor Cyan
    Write-Host ("  Peak hour:       {0}:00" -f ($hourCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key) -ForegroundColor Cyan
    
    # Export to CSV
    $response | Select-Object created_at, tool_name, action, status, execution_time_ms, @{Name='params';Expression={$_.params | ConvertTo-Json -Compress}} | 
        Export-Csv -Path "mcp-usage-today-$today.csv" -NoTypeInformation -Encoding UTF8
    
    Write-Host ""
    Write-Host "Detailed logs exported to: mcp-usage-today-$today.csv" -ForegroundColor Green
    
    # Show latest 10 calls
    Write-Host ""
    Write-Host "LATEST 10 CALLS:" -ForegroundColor Cyan
    Write-Host "-" * 80
    $response | Select-Object -First 10 | ForEach-Object {
        $time = ([DateTime]$_.created_at).ToString("HH:mm:ss")
        $status = if ($_.status -eq 'success') { "OK" } else { "ERR" }
        Write-Host ("  [{0}] {1,-10} {2,-30} {3}" -f $time, $status, $_.action, $_.tool_name) -ForegroundColor $(if($_.status -eq 'success'){"Green"}else{"Red"})
    }
}
catch {
    Write-Host "Error fetching logs from Supabase:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Check:" -ForegroundColor Yellow
    Write-Host "  1. Supabase credentials are correct" -ForegroundColor Yellow
    Write-Host "  2. billy_audit_logs table exists" -ForegroundColor Yellow
    Write-Host "  3. Internet connection is working" -ForegroundColor Yellow
}
