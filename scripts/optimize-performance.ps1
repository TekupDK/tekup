# Performance Optimization Script for Tekup AI v2
# Closes unnecessary processes and optimizes system resources

Write-Host "🚀 Tekup AI v2 Performance Optimizer" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check current resource usage
$os = Get-CimInstance Win32_OperatingSystem
$ramUsed = [math]::Round(($os.TotalVisibleMemorySize-$os.FreePhysicalMemory)/1MB,2)
$ramTotal = [math]::Round($os.TotalVisibleMemorySize/1MB,2)
$ramPct = [math]::Round(($ramUsed/$ramTotal)*100,1)

Write-Host "📊 Current Status:" -ForegroundColor Yellow
Write-Host "   RAM: $ramUsed GB / $ramTotal GB ($ramPct%)" -ForegroundColor White
Write-Host ""

# Find resource-heavy processes
$heavyProcesses = Get-Process | Where-Object {$_.WorkingSet -gt 200MB} | 
    Select-Object ProcessName, @{Name="RAM_MB";Expression={[math]::Round($_.WorkingSet/1MB,2)}} |
    Sort-Object RAM_MB -Descending

Write-Host "🔍 Memory-Heavy Processes (>200 MB):" -ForegroundColor Yellow
$heavyProcesses | Format-Table -AutoSize

# Ask user which processes to close
Write-Host ""
Write-Host "💡 Recommendations:" -ForegroundColor Green
Write-Host "   1. Close unused ChatGPT instances" -ForegroundColor White
Write-Host "   2. Close Comet if not using" -ForegroundColor White
Write-Host "   3. Close Shortwave if not checking email" -ForegroundColor White
Write-Host "   4. Keep VS Code, Claude (this chat), and Node.js running" -ForegroundColor White
Write-Host ""

# Interactive process closer
$closeApps = Read-Host "Close unnecessary AI apps? (ChatGPT, Comet, Shortwave) [Y/n]"
if ($closeApps -ne "n") {
    # Close ChatGPT (keep one instance if multiple)
    $chatgptProcesses = Get-Process ChatGPT -ErrorAction SilentlyContinue
    if ($chatgptProcesses.Count -gt 1) {
        Write-Host "📱 Found $($chatgptProcesses.Count) ChatGPT processes" -ForegroundColor Yellow
        $chatgptProcesses | Select-Object -Skip 1 | ForEach-Object {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            Write-Host "   ✓ Closed ChatGPT (PID: $($_.Id))" -ForegroundColor Green
        }
    }
    
    # Close Comet if not needed
    $cometProcesses = Get-Process comet -ErrorAction SilentlyContinue
    if ($cometProcesses) {
        $closeComet = Read-Host "   Close Comet? [Y/n]"
        if ($closeComet -ne "n") {
            Stop-Process -Name comet -Force -ErrorAction SilentlyContinue
            Write-Host "   ✓ Closed Comet" -ForegroundColor Green
        }
    }
    
    # Close Shortwave if not needed
    $shortwaveProcesses = Get-Process Shortwave -ErrorAction SilentlyContinue
    if ($shortwaveProcesses) {
        $closeShortwave = Read-Host "   Close Shortwave? [Y/n]"
        if ($closeShortwave -ne "n") {
            Stop-Process -Name Shortwave -Force -ErrorAction SilentlyContinue
            Write-Host "   ✓ Closed Shortwave" -ForegroundColor Green
        }
    }
}

Write-Host ""

# Clean Docker if needed
Write-Host "🐳 Docker Cleanup:" -ForegroundColor Yellow
$dockerCleanup = Read-Host "Run Docker system prune? [Y/n]"
if ($dockerCleanup -ne "n") {
    docker system prune -f
    Write-Host "   ✓ Docker cleaned" -ForegroundColor Green
}

Write-Host ""

# Check final status
Start-Sleep -Seconds 2
$os = Get-CimInstance Win32_OperatingSystem
$ramUsedAfter = [math]::Round(($os.TotalVisibleMemorySize-$os.FreePhysicalMemory)/1MB,2)
$ramFreed = [math]::Round($ramUsed - $ramUsedAfter, 2)

Write-Host "✅ Optimization Complete!" -ForegroundColor Green
Write-Host "   Previous RAM: $ramUsed GB" -ForegroundColor White
Write-Host "   Current RAM:  $ramUsedAfter GB" -ForegroundColor White
if ($ramFreed -gt 0) {
    Write-Host "   Freed:        $ramFreed GB" -ForegroundColor Green
}
Write-Host ""
Write-Host "💡 Tips for better performance:" -ForegroundColor Cyan
Write-Host "   • Run this script before starting work" -ForegroundColor White
Write-Host "   • Restart VS Code if TypeScript feels slow" -ForegroundColor White
Write-Host "   • Use Ctrl+Shift+P → 'TypeScript: Restart TS Server'" -ForegroundColor White
Write-Host ""
