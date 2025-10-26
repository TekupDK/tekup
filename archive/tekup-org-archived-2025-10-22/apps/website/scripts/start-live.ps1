# Enhanced Start Live Script
# Advanced development server with automatic browser DevTools opening, CSS source maps, and live reload notifications

param(
    [int]$Port = 3000,
    [string]$Browser = "chrome",
    [switch]$DevTools = $true,
    [switch]$SourceMaps = $true,
    [switch]$Notifications = $true,
    [switch]$Analytics = $false,
    [string]$Profile = "default",
    [switch]$Help
)

# Color output function
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
    Write-ColorOutput "🚀 Enhanced Start Live Development Server" "Cyan"
    Write-Host ""
    Write-ColorOutput "USAGE:" "Yellow"
    Write-Host "  .\start-live.ps1 [OPTIONS]"
    Write-Host ""
    Write-ColorOutput "OPTIONS:" "Yellow"
    Write-Host "  -Port <number>       Development server port (default: 3000)"
    Write-Host "  -Browser <name>      Browser to launch (chrome, firefox, edge)"
    Write-Host "  -DevTools           Auto-open browser DevTools (default: true)"
    Write-Host "  -SourceMaps         Enable CSS source map generation (default: true)"
    Write-Host "  -Notifications      Enable live reload notifications (default: true)"
    Write-Host "  -Analytics          Enable development analytics (default: false)"
    Write-Host "  -Profile <name>     Use development profile (default, debug, performance)"
    Write-Host "  -Help               Show this help message"
    Write-Host ""
    Write-ColorOutput "PROFILES:" "Yellow"
    Write-Host "  default       - Standard development setup"
    Write-Host "  debug         - Enhanced debugging with extra tools"
    Write-Host "  performance   - Performance monitoring enabled"
    Write-Host "  minimal       - Lightweight setup for low-spec machines"
    Write-Host ""
    Write-ColorOutput "EXAMPLES:" "Yellow"
    Write-Host "  .\start-live.ps1                           # Basic setup"
    Write-Host "  .\start-live.ps1 -Profile debug            # Debug profile"
    Write-Host "  .\start-live.ps1 -Port 8080 -Browser edge  # Custom port & browser"
    exit 0
}

if ($Help) { Show-Help }

# Development profiles
$Profiles = @{
    "default" = @{
        sourceMapLevel = "cheap-module-source-map"
        devtools = "eval-source-map"
        notifications = $true
        hotReload = $true
        cssMinification = $false
        bundleAnalyzer = $false
        performanceHints = $false
    }
    "debug" = @{
        sourceMapLevel = "source-map"
        devtools = "source-map"
        notifications = $true
        hotReload = $true
        cssMinification = $false
        bundleAnalyzer = $true
        performanceHints = $true
    }
    "performance" = @{
        sourceMapLevel = "hidden-source-map"
        devtools = "eval"
        notifications = $false
        hotReload = $true
        cssMinification = $true
        bundleAnalyzer = $true
        performanceHints = $true
    }
    "minimal" = @{
        sourceMapLevel = "eval-cheap-module-source-map"
        devtools = "eval"
        notifications = $false
        hotReload = $true
        cssMinification = $false
        bundleAnalyzer = $false
        performanceHints = $false
    }
}

# Validate profile
if (-not $Profiles.ContainsKey($Profile)) {
    Write-ColorOutput "❌ Invalid profile: $Profile" "Red"
    Write-ColorOutput "Available profiles: $($Profiles.Keys -join ', ')" "Yellow"
    exit 1
}

$profileConfig = $Profiles[$Profile]

Write-ColorOutput "🎨 Starting Enhanced Live Development Server..." "Cyan"
Write-Host ""
Write-ColorOutput "📋 Configuration:" "Green"
Write-Host "  Port: $Port"
Write-Host "  Browser: $Browser"
Write-Host "  Profile: $Profile"
Write-Host "  DevTools: $DevTools"
Write-Host "  Source Maps: $SourceMaps"
Write-Host "  Notifications: $Notifications"
Write-Host "  Analytics: $Analytics"
Write-Host ""

# Create temporary development configuration
$tempConfigFile = Join-Path $env:TEMP "vite-dev-config-$(Get-Date -Format 'yyyyMMdd-HHmmss').js"

$viteConfig = @"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// Enhanced development configuration
export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      devTarget: 'es2020',
    }),
    {
      name: 'live-reload-notifications',
      configureServer(server) {
        server.ws.on('vite:beforeUpdate', (payload) => {
          if ($($Notifications ? 'true' : 'false')) {
            const updateTypes = payload.updates.map(u => u.type).join(', ')
            console.log(\`🔄 Live Reload: \${updateTypes} files updated\`)
          }
        })
      }
    }
  ],
  
  server: {
    port: $Port,
    host: 'localhost',
    open: false, // We'll handle browser opening manually
    hmr: {
      overlay: true,
      clientPort: $Port,
      timeout: 30000,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    cors: true,
  },

  build: {
    sourcemap: $($SourceMaps ? 'true' : 'false'),
    cssCodeSplit: true,
    minify: $($profileConfig.cssMinification ? 'true' : 'false'),
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false,
      }
    }
  },

  css: {
    devSourcemap: $($SourceMaps ? 'true' : 'false'),
    postcss: './postcss.config.js',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@utils': path.resolve(__dirname, './src/utils'),
    }
  },

  define: {
    __DEV_PROFILE__: JSON.stringify('$Profile'),
    __DEV_ANALYTICS__: $($Analytics ? 'true' : 'false'),
  },

  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@vite/client', '@vite/env'],
  }
})
"@

$viteConfig | Out-File -FilePath $tempConfigFile -Encoding UTF8

# Browser launch configurations
$BrowserConfigs = @{
    "chrome" = @{
        executable = "chrome.exe"
        args = @(
            "--new-window",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--allow-running-insecure-content",
            "--disable-extensions-except=",
            "--load-extension="
        )
        devToolsArgs = @("--auto-open-devtools-for-tabs")
    }
    "firefox" = @{
        executable = "firefox.exe"
        args = @("-new-window", "-devtools")
        devToolsArgs = @("-devtools")
    }
    "edge" = @{
        executable = "msedge.exe"
        args = @("--new-window", "--disable-web-security")
        devToolsArgs = @("--auto-open-devtools-for-tabs")
    }
}

try {
    # Start development server
    Write-ColorOutput "🚀 Starting Vite development server..." "Yellow"
    
    $packageManager = "npm"
    if (Get-Command "yarn" -ErrorAction SilentlyContinue) {
        $packageManager = "yarn"
    }
    
    $serverArgs = @("run", "dev")
    if ($packageManager -eq "npm") {
        $serverArgs += @("--", "--config", $tempConfigFile, "--port", $Port)
    } else {
        $serverArgs += @("--config", $tempConfigFile, "--port", $Port)
    }
    
    $serverProcess = Start-Process -FilePath $packageManager -ArgumentList $serverArgs -PassThru -WindowStyle Hidden
    
    # Wait for server to be ready
    Write-ColorOutput "⏳ Waiting for server to initialize..." "Yellow"
    $maxAttempts = 15
    $attempt = 0
    $serverReady = $false
    
    while ($attempt -lt $maxAttempts -and -not $serverReady) {
        Start-Sleep -Seconds 2
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            $serverReady = $true
            Write-ColorOutput "✅ Development server is running on http://localhost:$Port" "Green"
        } catch {
            $attempt++
            Write-Host "." -NoNewline
        }
    }
    
    if (-not $serverReady) {
        throw "Development server failed to start after $maxAttempts attempts"
    }
    
    Write-Host ""
    
    # Launch browser with enhanced configuration
    if ($BrowserConfigs.ContainsKey($Browser)) {
        Write-ColorOutput "🌐 Launching $Browser with development tools..." "Blue"
        
        $browserConfig = $BrowserConfigs[$Browser]
        $browserArgs = @($browserConfig.args)
        
        # Add DevTools arguments if enabled
        if ($DevTools) {
            $browserArgs += $browserConfig.devToolsArgs
        }
        
        # Add special development flags for Chrome
        if ($Browser -eq "chrome") {
            $browserArgs += @(
                "--enable-features=CSSColorSchemeUARendering,WebUIDarkMode",
                "--force-color-profile=display-p3-d65",
                "--enable-experimental-web-platform-features"
            )
            
            # Add profile-specific flags
            if ($Profile -eq "debug") {
                $browserArgs += @("--enable-logging", "--v=1")
            } elseif ($Profile -eq "performance") {
                $browserArgs += @("--enable-gpu-benchmarking", "--show-fps-counter")
            }
        }
        
        # Add URL
        $url = "http://localhost:$Port"
        $browserArgs += $url
        
        Start-Process -FilePath $browserConfig.executable -ArgumentList $browserArgs -ErrorAction Stop
        Write-ColorOutput "✅ Browser launched successfully!" "Green"
    } else {
        Write-ColorOutput "⚠️ Unknown browser: $Browser. Opening default browser..." "Yellow"
        Start-Process "http://localhost:$Port"
    }
    
    # Setup live reload notifications
    if ($Notifications) {
        Write-ColorOutput "🔔 Setting up live reload notifications..." "Yellow"
        
        # Create a simple notification script
        $notificationScript = @"
const fs = require('fs');
const chokidar = require('chokidar');
const { exec } = require('child_process');

console.log('🔔 Live Reload Notifications Active');

const watcher = chokidar.watch(['src/**/*.css', 'src/**/*.tsx', 'src/**/*.ts'], {
    ignoreInitial: true,
    persistent: true
});

watcher.on('change', (path) => {
    const fileName = path.split('/').pop();
    const fileType = path.split('.').pop().toUpperCase();
    console.log(\`🔄 [\${new Date().toLocaleTimeString()}] \${fileType} Changed: \${fileName}\`);
    
    // Windows notification (optional)
    if (process.platform === 'win32') {
        exec(\`powershell -Command "& {[void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [void][System.Reflection.Assembly]::LoadWithPartialName('System.Drawing'); \$notify = New-Object System.Windows.Forms.NotifyIcon; \$notify.Icon = [System.Drawing.SystemIcons]::Information; \$notify.BalloonTipIcon = 'Info'; \$notify.BalloonTipText = '\${fileType} file updated: \${fileName}'; \$notify.BalloonTipTitle = 'Live Reload'; \$notify.Visible = \$true; \$notify.ShowBalloonTip(3000)}"\`, (error) => {
            if (error) console.log('Notification error:', error.message);
        });
    }
});

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('\\n🔔 Live reload notifications stopped');
    watcher.close();
    process.exit(0);
});
"@
        
        $notificationFile = Join-Path $env:TEMP "live-reload-notifications.js"
        $notificationScript | Out-File -FilePath $notificationFile -Encoding UTF8
        
        # Start notification watcher
        $notificationProcess = Start-Process -FilePath "node" -ArgumentList $notificationFile -PassThru -WindowStyle Hidden
        Write-ColorOutput "✅ Live reload notifications enabled" "Green"
    }
    
    # Setup development analytics
    if ($Analytics) {
        Write-ColorOutput "📊 Setting up development analytics..." "Yellow"
        
        $analyticsFile = Join-Path $env:TEMP "dev-analytics-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
        $analyticsStart = Get-Date
        
        "Development Session Analytics - Started: $analyticsStart" | Out-File -FilePath $analyticsFile
        "Profile: $Profile" | Out-File -FilePath $analyticsFile -Append
        "Port: $Port" | Out-File -FilePath $analyticsFile -Append
        "Browser: $Browser" | Out-File -FilePath $analyticsFile -Append
        "DevTools: $DevTools" | Out-File -FilePath $analyticsFile -Append
        "Source Maps: $SourceMaps" | Out-File -FilePath $analyticsFile -Append
        "----------------------------------------" | Out-File -FilePath $analyticsFile -Append
        
        # Monitor resource usage
        $analyticsJob = Start-Job -ScriptBlock {
            param($logFile)
            while ($true) {
                $timestamp = Get-Date -Format "HH:mm:ss"
                $processes = Get-Process | Where-Object { $_.ProcessName -match "(node|chrome|firefox|msedge)" }
                $totalCpu = ($processes | Measure-Object -Property CPU -Sum).Sum
                $totalMemory = ($processes | Measure-Object -Property WorkingSet -Sum).Sum / 1MB
                
                "$timestamp - Dev Processes CPU: $([math]::Round($totalCpu, 2))s - Memory: $([math]::Round($totalMemory, 2))MB" | 
                    Add-Content -Path $logFile
                
                Start-Sleep -Seconds 30
            }
        } -ArgumentList $analyticsFile
        
        Write-ColorOutput "✅ Development analytics logging to: $analyticsFile" "Green"
    }
    
    # Display development information
    Write-Host ""
    Write-ColorOutput "🎯 Development Server Ready!" "Green"
    Write-ColorOutput "🌐 Local URL: http://localhost:$Port" "Cyan"
    Write-ColorOutput "📱 Network URL: http://$(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' | Select-Object -First 1 -ExpandProperty IPAddress):$Port" "Cyan"
    Write-Host ""
    
    Write-ColorOutput "🔧 Development Tools:" "Yellow"
    Write-Host "  • DevTools: $($DevTools ? 'Enabled' : 'Disabled')"
    Write-Host "  • Source Maps: $($SourceMaps ? 'Enabled' : 'Disabled')"
    Write-Host "  • Hot Reload: Enabled"
    Write-Host "  • Notifications: $($Notifications ? 'Enabled' : 'Disabled')"
    Write-Host "  • Analytics: $($Analytics ? 'Enabled' : 'Disabled')"
    
    if ($profileConfig.bundleAnalyzer) {
        Write-Host "  • Bundle Analyzer: Available at http://localhost:$($Port + 1)"
    }
    
    Write-Host ""
    Write-ColorOutput "⌨️  Keyboard Shortcuts:" "Yellow"
    Write-Host "  • Reload Page: Ctrl+R"
    Write-Host "  • Hard Reload: Ctrl+Shift+R"
    Write-Host "  • Open DevTools: F12"
    Write-Host "  • CSS DevTools: Ctrl+Shift+D (if integrated)"
    Write-Host "  • Stop Server: Ctrl+C"
    Write-Host ""
    
    # Keep server running
    Write-ColorOutput "🔄 Development server is running... (Press Ctrl+C to stop)" "Cyan"
    
    # Monitor server health
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if server process is still running
        if ($serverProcess.HasExited) {
            Write-ColorOutput "❌ Development server process has exited unexpectedly" "Red"
            break
        }
        
        # Health check
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        } catch {
            Write-ColorOutput "⚠️ Server health check failed, but process is still running..." "Yellow"
        }
    }
    
} catch {
    Write-ColorOutput "❌ Error: $($_.Exception.Message)" "Red"
    exit 1
} finally {
    # Cleanup
    Write-ColorOutput "🧹 Cleaning up development environment..." "Yellow"
    
    # Stop notification process
    if ($notificationProcess -and -not $notificationProcess.HasExited) {
        Stop-Process -Id $notificationProcess.Id -Force -ErrorAction SilentlyContinue
        Remove-Item $notificationFile -ErrorAction SilentlyContinue
    }
    
    # Stop analytics job
    if ($analyticsJob) {
        Stop-Job -Job $analyticsJob -ErrorAction SilentlyContinue
        Remove-Job -Job $analyticsJob -ErrorAction SilentlyContinue
        
        if ($Analytics) {
            $analyticsEnd = Get-Date
            "Ended: $analyticsEnd" | Add-Content -Path $analyticsFile
            $duration = $analyticsEnd - $analyticsStart
            "Session Duration: $($duration.ToString('hh\:mm\:ss'))" | Add-Content -Path $analyticsFile
            Write-ColorOutput "📊 Analytics saved to: $analyticsFile" "Green"
        }
    }
    
    # Stop development server
    if ($serverProcess -and -not $serverProcess.HasExited) {
        Write-ColorOutput "🛑 Stopping development server..." "Yellow"
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Remove temporary config
    Remove-Item $tempConfigFile -ErrorAction SilentlyContinue
    
    Write-ColorOutput "✅ Development session ended" "Green"
}