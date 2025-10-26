# 🚀 TekUp Live Editing Workflow
# Ultimate live editing script for Windows

param(
    [string]$Mode = "dev",
    [switch]$OpenBrowser,
    [switch]$OpenEditor,
    [switch]$ShowLogs
)

Write-Host "🚀 TekUp Live Editing Workflow Starting..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Configuration
$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerUrl = "http://localhost:8081"
$PlaygroundUrl = "$ServerUrl/playground"

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $tcpConnection = New-Object System.Net.Sockets.TcpClient
        $tcpConnection.Connect("localhost", $Port)
        $tcpConnection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to start development server
function Start-DevServer {
    Write-Host "🔧 Starting Vite Development Server..." -ForegroundColor Green
    
    if (Test-Port -Port 8081) {
        Write-Host "⚠️ Port 8081 is already in use" -ForegroundColor Yellow
        Write-Host "🌐 Server might already be running at $ServerUrl" -ForegroundColor Yellow
        return
    }
    
    # Start server in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectPath'; npm run dev" -WindowStyle Normal
    
    # Wait for server to start
    Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
    $attempts = 0
    do {
        Start-Sleep -Seconds 2
        $attempts++
        Write-Host "." -NoNewline -ForegroundColor Yellow
    } while (-not (Test-Port -Port 8081) -and $attempts -lt 15)
    
    if (Test-Port -Port 8081) {
        Write-Host "`n✅ Development server is running!" -ForegroundColor Green
        Write-Host "🌐 Website: $ServerUrl" -ForegroundColor Cyan
        Write-Host "🎨 Playground: $PlaygroundUrl" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ Failed to start development server" -ForegroundColor Red
        return
    }
}

# Function to open browser
function Open-Browser {
    Write-Host "🌐 Opening browser..." -ForegroundColor Green
    
    # Try to open playground first, fallback to main site
    try {
        Start-Process $PlaygroundUrl
        Write-Host "📱 Opened Live Editing Playground" -ForegroundColor Green
    }
    catch {
        try {
            Start-Process $ServerUrl
            Write-Host "📱 Opened main website" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Failed to open browser" -ForegroundColor Red
        }
    }
}

# Function to open VS Code
function Open-Editor {
    Write-Host "📝 Opening VS Code..." -ForegroundColor Green
    
    try {
        # Open VS Code with specific files for quick editing
        & code $ProjectPath `
            "$ProjectPath\src\index.css" `
            "$ProjectPath\src\App.tsx" `
            "$ProjectPath\src\components\LiveEditingPlayground.tsx"
        
        Write-Host "✅ VS Code opened with key files" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ VS Code not found. Please install VS Code." -ForegroundColor Red
        Write-Host "💡 Download from: https://code.visualstudio.com/" -ForegroundColor Yellow
    }
}

# Function to show live editing tips
function Show-LiveEditingTips {
    Write-Host "`n🎯 LIVE EDITING TIPS:" -ForegroundColor Magenta
    Write-Host "===================" -ForegroundColor Magenta
    Write-Host "🔥 HOT RELOAD: Save any file → See changes instantly" -ForegroundColor Yellow
    Write-Host "🎨 CSS EDITING: Edit index.css → Live updates" -ForegroundColor Yellow
    Write-Host "⚛️ REACT: Edit .tsx files → Component hot reload" -ForegroundColor Yellow
    Write-Host "🧪 PLAYGROUND: Visit /playground for CSS testing" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🛠️ BROWSER DEVTOOLS:" -ForegroundColor Magenta
    Write-Host "• F12 → Elements → Edit CSS live" -ForegroundColor White
    Write-Host "• Console → Paste devtools-helper.js content" -ForegroundColor White
    Write-Host "• Ctrl+Shift+T/G/A → Quick test shortcuts" -ForegroundColor White
    Write-Host ""
    Write-Host "📁 KEY FILES TO EDIT:" -ForegroundColor Magenta
    Write-Host "• src/index.css → Global styles" -ForegroundColor White
    Write-Host "• src/App.tsx → Main app structure" -ForegroundColor White  
    Write-Host "• src/components/ → React components" -ForegroundColor White
    Write-Host ""
    Write-Host "⌨️ KEYBOARD SHORTCUTS IN BROWSER:" -ForegroundColor Magenta
    Write-Host "• Ctrl+Shift+T → Test color palette" -ForegroundColor White
    Write-Host "• Ctrl+Shift+G → Toggle layout grid" -ForegroundColor White
    Write-Host "• Ctrl+Shift+A → Test animations" -ForegroundColor White
}

# Function to watch for file changes (optional)
function Watch-Files {
    if ($ShowLogs) {
        Write-Host "👀 Watching for file changes..." -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop watching" -ForegroundColor Yellow
        
        # Simple file watcher (Vite handles the real hot reload)
        $watcher = New-Object System.IO.FileSystemWatcher
        $watcher.Path = "$ProjectPath\src"
        $watcher.IncludeSubdirectories = $true
        $watcher.EnableRaisingEvents = $true
        
        Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action {
            $file = $Event.SourceEventArgs.FullPath
            $fileName = Split-Path -Leaf $file
            Write-Host "📝 File changed: $fileName" -ForegroundColor Cyan
        } | Out-Null
        
        try {
            while ($true) {
                Start-Sleep -Seconds 1
            }
        }
        finally {
            $watcher.Dispose()
        }
    }
}

# Main execution
switch ($Mode) {
    "dev" {
        Start-DevServer
        
        if ($OpenBrowser) {
            Start-Sleep -Seconds 2
            Open-Browser
        }
        
        if ($OpenEditor) {
            Start-Sleep -Seconds 1
            Open-Editor
        }
        
        Show-LiveEditingTips
        Watch-Files
    }
    "playground" {
        Write-Host "🎨 Opening Live Editing Playground..." -ForegroundColor Green
        
        if (Test-Port -Port 8081) {
            Open-Browser
        } else {
            Write-Host "❌ Development server not running" -ForegroundColor Red
            Write-Host "💡 Run: .\live-edit.ps1 -Mode dev -OpenBrowser" -ForegroundColor Yellow
        }
    }
    "help" {
        Write-Host "🚀 TekUp Live Editing Commands:" -ForegroundColor Cyan
        Write-Host ".\live-edit.ps1 -Mode dev -OpenBrowser -OpenEditor" -ForegroundColor White
        Write-Host ".\live-edit.ps1 -Mode playground" -ForegroundColor White
        Write-Host ".\live-edit.ps1 -Mode help" -ForegroundColor White
        Write-Host ""
        Write-Host "Switches:" -ForegroundColor Cyan
        Write-Host "-OpenBrowser   → Auto-open browser" -ForegroundColor White
        Write-Host "-OpenEditor    → Auto-open VS Code" -ForegroundColor White
        Write-Host "-ShowLogs      → Show file change logs" -ForegroundColor White
    }
    default {
        Write-Host "❌ Unknown mode: $Mode" -ForegroundColor Red
        Write-Host "💡 Use: .\live-edit.ps1 -Mode help" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Happy Live Editing!" -ForegroundColor Green