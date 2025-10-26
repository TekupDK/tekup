# Enhanced Live Edit Script for CSS Development
# Supports multi-browser launch, device emulation, CSS hot reload monitoring, and performance metrics

param(
    [string]$Browser = "chrome",
    [string]$Device = "desktop",
    [switch]$Performance = $false,
    [switch]$HotReload = $true,
    [int]$Port = 3000,
    [switch]$DevTools = $false,
    [switch]$Help
)

# Color functions for better output
function Write-ColorOutput {
    param([string]$Text, [string]$Color = "White")
    $colors = @{
        "Red" = [System.ConsoleColor]::Red
        "Green" = [System.ConsoleColor]::Green
        "Yellow" = [System.ConsoleColor]::Yellow
        "Blue" = [System.ConsoleColor]::Blue
        "Magenta" = [System.ConsoleColor]::Magenta
        "Cyan" = [System.ConsoleColor]::Cyan
        "White" = [System.ConsoleColor]::White
    }
    Write-Host $Text -ForegroundColor $colors[$Color]
}

function Show-Help {
    Write-ColorOutput "🚀 Enhanced Live Edit Script for CSS Development" "Cyan"
    Write-Host ""
    Write-ColorOutput "USAGE:" "Yellow"
    Write-Host "  .\live-edit.ps1 [OPTIONS]"
    Write-Host ""
    Write-ColorOutput "OPTIONS:" "Yellow"
    Write-Host "  -Browser <chrome|firefox|edge|safari>  Browser to launch (default: chrome)"
    Write-Host "  -Device <preset>                       Device emulation preset"
    Write-Host "  -Performance                           Enable performance monitoring"
    Write-Host "  -HotReload                            Enable CSS hot reload monitoring"
    Write-Host "  -Port <number>                        Development server port (default: 3000)"
    Write-Host "  -DevTools                             Auto-open DevTools"
    Write-Host "  -Help                                 Show this help message"
    Write-Host ""
    Write-ColorOutput "DEVICE PRESETS:" "Yellow"
    Write-Host "  desktop, mobile, tablet, iphone, android, ipad"
    Write-Host ""
    Write-ColorOutput "EXAMPLES:" "Yellow"
    Write-Host "  .\live-edit.ps1                                    # Basic launch"
    Write-Host "  .\live-edit.ps1 -Browser firefox -Device mobile   # Firefox mobile"
    Write-Host "  .\live-edit.ps1 -Performance -DevTools           # With monitoring"
    exit 0
}

if ($Help) { Show-Help }

# Device emulation presets
$DevicePresets = @{
    "desktop" = @{
        width = 1920
        height = 1080
        userAgent = ""
        touch = $false
    }
    "mobile" = @{
        width = 375
        height = 667
        userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
        touch = $true
    }
    "tablet" = @{
        width = 768
        height = 1024
        userAgent = "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
        touch = $true
    }
    "iphone" = @{
        width = 375
        height = 812
        userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
        touch = $true
    }
    "android" = @{
        width = 360
        height = 640
        userAgent = "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36"
        touch = $true
    }
    "ipad" = @{
        width = 1024
        height = 768
        userAgent = "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
        touch = $true
    }
}

# Browser configurations
$BrowserConfigs = @{
    "chrome" = @{
        executable = "chrome.exe"
        args = @("--new-window", "--disable-web-security", "--allow-running-insecure-content")
        devToolsFlag = "--auto-open-devtools-for-tabs"
    }
    "firefox" = @{
        executable = "firefox.exe"
        args = @("-new-window", "-devtools")
        devToolsFlag = "-devtools"
    }
    "edge" = @{
        executable = "msedge.exe"
        args = @("--new-window", "--disable-web-security")
        devToolsFlag = "--auto-open-devtools-for-tabs"
    }
    "safari" = @{
        executable = "safari.exe"
        args = @()
        devToolsFlag = ""
    }
}

Write-ColorOutput "🎨 Starting Enhanced Live Edit Environment..." "Cyan"
Write-Host ""

# Validate device preset
if (-not $DevicePresets.ContainsKey($Device)) {
    Write-ColorOutput "❌ Invalid device preset: $Device" "Red"
    Write-ColorOutput "Available presets: $($DevicePresets.Keys -join ', ')" "Yellow"
    exit 1
}

# Validate browser
if (-not $BrowserConfigs.ContainsKey($Browser)) {
    Write-ColorOutput "❌ Invalid browser: $Browser" "Red"
    Write-ColorOutput "Available browsers: $($BrowserConfigs.Keys -join ', ')" "Yellow"
    exit 1
}

$deviceConfig = $DevicePresets[$Device]
$browserConfig = $BrowserConfigs[$Browser]

Write-ColorOutput "📋 Configuration:" "Green"
Write-Host "  Browser: $Browser"
Write-Host "  Device: $Device ($($deviceConfig.width)x$($deviceConfig.height))"
Write-Host "  Port: $Port"
Write-Host "  Hot Reload: $HotReload"
Write-Host "  Performance: $Performance"
Write-Host "  DevTools: $DevTools"
Write-Host ""

# Start development server
Write-ColorOutput "🚀 Starting development server..." "Yellow"
$serverProcess = $null

try {
    # Check if npm/yarn is available
    $packageManager = "npm"
    if (Get-Command "yarn" -ErrorAction SilentlyContinue) {
        $packageManager = "yarn"
    }

    Write-ColorOutput "📦 Using package manager: $packageManager" "Blue"
    
    # Start development server in background
    $serverProcess = Start-Process -FilePath $packageManager -ArgumentList @("run", "dev", "--", "--port", $Port) -PassThru -WindowStyle Hidden
    
    # Wait for server to start
    Write-ColorOutput "⏳ Waiting for server to start..." "Yellow"
    Start-Sleep -Seconds 3
    
    # Test if server is running
    $maxAttempts = 10
    $attempt = 0
    $serverRunning = $false
    
    while ($attempt -lt $maxAttempts -and -not $serverRunning) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            $serverRunning = $true
            Write-ColorOutput "✅ Development server is running on http://localhost:$Port" "Green"
        } catch {
            $attempt++
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 1
        }
    }
    
    if (-not $serverRunning) {
        throw "Development server failed to start after $maxAttempts attempts"
    }
    
    Write-Host ""
    
    # Prepare browser launch arguments
    $url = "http://localhost:$Port"
    $browserArgs = @($browserConfig.args)
    
    # Add device emulation for Chrome
    if ($Browser -eq "chrome" -and $Device -ne "desktop") {
        $browserArgs += "--window-size=$($deviceConfig.width),$($deviceConfig.height)"
        if ($deviceConfig.userAgent) {
            $browserArgs += "--user-agent=`"$($deviceConfig.userAgent)`""
        }
        if ($deviceConfig.touch) {
            $browserArgs += "--touch-events=enabled"
        }
    }
    
    # Add DevTools flag if requested
    if ($DevTools -and $browserConfig.devToolsFlag) {
        $browserArgs += $browserConfig.devToolsFlag
    }
    
    # Add URL
    $browserArgs += $url
    
    # Launch browser
    Write-ColorOutput "🌐 Launching $Browser..." "Blue"
    Start-Process -FilePath $browserConfig.executable -ArgumentList $browserArgs -ErrorAction Stop
    
    Write-ColorOutput "✅ Browser launched successfully!" "Green"
    Write-Host ""
    
    # CSS Hot Reload Monitoring
    if ($HotReload) {
        Write-ColorOutput "🔥 Starting CSS Hot Reload Monitor..." "Yellow"
        
        # Create file watcher
        $watcher = New-Object System.IO.FileSystemWatcher
        $watcher.Path = (Get-Location).Path
        $watcher.Filter = "*.css"
        $watcher.IncludeSubdirectories = $true
        $watcher.EnableRaisingEvents = $true
        
        # Register event handlers
        $action = {
            $path = $Event.SourceEventArgs.FullPath
            $name = $Event.SourceEventArgs.Name
            $changeType = $Event.SourceEventArgs.ChangeType
            $timeStamp = Get-Date -Format "HH:mm:ss"
            
            Write-ColorOutput "[$timeStamp] 🎨 CSS File $changeType : $name" "Cyan"
            
            # Log to performance file if enabled
            if ($Performance) {
                $logEntry = "$timeStamp - CSS $changeType - $name"
                Add-Content -Path "css-hotreload.log" -Value $logEntry
            }
        }
        
        Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action
        Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action
        Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action
        
        Write-ColorOutput "✅ CSS Hot Reload Monitor active" "Green"
    }
    
    # Performance Monitoring
    if ($Performance) {
        Write-ColorOutput "📊 Starting Performance Monitor..." "Yellow"
        
        # Create performance log file
        $perfLogFile = "css-performance-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
        $startTime = Get-Date
        
        "CSS Development Session Performance Log" | Out-File -FilePath $perfLogFile
        "Started: $startTime" | Out-File -FilePath $perfLogFile -Append
        "Browser: $Browser" | Out-File -FilePath $perfLogFile -Append
        "Device: $Device" | Out-File -FilePath $perfLogFile -Append
        "Port: $Port" | Out-File -FilePath $perfLogFile -Append
        "----------------------------------------" | Out-File -FilePath $perfLogFile -Append
        
        # Monitor system resources
        $perfJob = Start-Job -ScriptBlock {
            param($logFile, $port)
            
            while ($true) {
                $timestamp = Get-Date -Format "HH:mm:ss"
                $cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average | Select-Object -ExpandProperty Average
                $memory = Get-WmiObject -Class Win32_OperatingSystem
                $memoryUsed = [math]::Round(($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize * 100, 2)
                
                $logEntry = "$timestamp - CPU: $cpu% - Memory: $memoryUsed%"
                Add-Content -Path $logFile -Value $logEntry
                
                Start-Sleep -Seconds 10
            }
        } -ArgumentList $perfLogFile, $Port
        
        Write-ColorOutput "✅ Performance Monitor active (logging to $perfLogFile)" "Green"
    }
    
    Write-Host ""
    Write-ColorOutput "🎯 Live Edit Environment Ready!" "Green"
    Write-ColorOutput "📝 Available Commands:" "Yellow"
    Write-Host "  • Open browser DevTools: F12"
    Write-Host "  • Reload page: Ctrl+R or F5"
    Write-Host "  • Hard reload: Ctrl+Shift+R"
    Write-Host "  • Open CSS DevTools: Ctrl+Shift+D (if integrated)"
    Write-Host "  • Stop this script: Ctrl+C"
    Write-Host ""
    
    # Keep script running
    Write-ColorOutput "🔄 Monitoring for changes... (Press Ctrl+C to stop)" "Cyan"
    
    # Main monitoring loop
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if server process is still running
        if ($serverProcess -and $serverProcess.HasExited) {
            Write-ColorOutput "❌ Development server has stopped unexpectedly" "Red"
            break
        }
    }
    
} catch {
    Write-ColorOutput "❌ Error: $($_.Exception.Message)" "Red"
    exit 1
} finally {
    # Cleanup
    Write-ColorOutput "🧹 Cleaning up..." "Yellow"
    
    # Stop file watcher
    if ($watcher) {
        $watcher.EnableRaisingEvents = $false
        $watcher.Dispose()
        Get-EventSubscriber | Unregister-Event
    }
    
    # Stop performance monitoring
    if ($perfJob) {
        Stop-Job -Job $perfJob
        Remove-Job -Job $perfJob
        
        if ($Performance) {
            $endTime = Get-Date
            "Ended: $endTime" | Out-File -FilePath $perfLogFile -Append
            $duration = $endTime - $startTime
            "Duration: $($duration.ToString('hh\:mm\:ss'))" | Out-File -FilePath $perfLogFile -Append
            Write-ColorOutput "📊 Performance log saved to $perfLogFile" "Green"
        }
    }
    
    # Stop development server
    if ($serverProcess -and -not $serverProcess.HasExited) {
        Write-ColorOutput "🛑 Stopping development server..." "Yellow"
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    Write-ColorOutput "✅ Live Edit session ended" "Green"
}