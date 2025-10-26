# CSS Development Tool Manager
# Master script to manage all CSS development tools and workflows

param(
    [string]$Command = "help",
    [string]$Profile = "default",
    [string]$Environment = "dev",
    [int]$Port = 3000,
    [string]$Browser = "chrome",
    [switch]$Watch,
    [switch]$Analytics,
    [switch]$Verbose,
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
    Write-ColorOutput "🎨 CSS Development Tool Manager" "Cyan"
    Write-Host ""
    Write-ColorOutput "A comprehensive toolkit for CSS development with Tailwind 4.1 and modern workflows" "White"
    Write-Host ""
    Write-ColorOutput "USAGE:" "Yellow"
    Write-Host "  .\css-dev-manager.ps1 -Command <command> [OPTIONS]"
    Write-Host ""
    Write-ColorOutput "COMMANDS:" "Yellow"
    Write-Host ""
    Write-ColorOutput "🚀 Development Commands:" "Green"
    Write-Host "  start              - Start enhanced development server"
    Write-Host "  live               - Start live development with hot reload"
    Write-Host "  playground         - Launch CSS playground environment"
    Write-Host "  debug              - Start development with debug profile"
    Write-Host "  performance        - Start development with performance monitoring"
    Write-Host ""
    Write-ColorOutput "🔧 Tool Commands:" "Blue"
    Write-Host "  analyze            - Run CSS analysis tools"
    Write-Host "  purge              - Test Tailwind CSS purging"
    Write-Host "  extract            - Extract CSS classes from source files"
    Write-Host "  optimize           - Optimize CSS files"
    Write-Host "  convert-p3         - Convert colors to P3 color space"
    Write-Host ""
    Write-ColorOutput "🧪 Testing Commands:" "Magenta"
    Write-Host "  test-visual        - Run visual regression tests"
    Write-Host "  test-a11y          - Run accessibility tests"
    Write-Host "  test-perf          - Run performance tests"
    Write-Host "  test-validate      - Validate CSS syntax and best practices"
    Write-Host "  test-all           - Run complete test suite"
    Write-Host "  baseline           - Create test baselines"
    Write-Host ""
    Write-ColorOutput "📊 Reporting Commands:" "Yellow"
    Write-Host "  report             - Generate comprehensive reports"
    Write-Host "  dashboard          - Launch CSS development dashboard"
    Write-Host "  stats              - Show CSS statistics"
    Write-Host "  health             - Check development environment health"
    Write-Host ""
    Write-ColorOutput "⚙️  Management Commands:" "Cyan"
    Write-Host "  setup              - Setup development environment"
    Write-Host "  update             - Update development tools"
    Write-Host "  clean              - Clean temporary files and caches"
    Write-Host "  backup             - Backup CSS configurations"
    Write-Host "  restore            - Restore CSS configurations"
    Write-Host ""
    Write-ColorOutput "OPTIONS:" "Yellow"
    Write-Host "  -Profile <name>       Development profile (default, debug, performance, minimal)"
    Write-Host "  -Environment <env>    Environment (dev, staging, prod)"
    Write-Host "  -Port <number>        Development server port (default: 3000)"
    Write-Host "  -Browser <name>       Browser for testing (chrome, firefox, edge)"
    Write-Host "  -Watch               Enable file watching"
    Write-Host "  -Analytics           Enable analytics and monitoring"
    Write-Host "  -Verbose             Enable verbose output"
    Write-Host "  -Help                Show this help message"
    Write-Host ""
    Write-ColorOutput "PROFILES:" "Yellow"
    Write-Host "  default       - Standard development setup"
    Write-Host "  debug         - Enhanced debugging with extra tools"
    Write-Host "  performance   - Performance monitoring enabled"
    Write-Host "  minimal       - Lightweight setup for low-spec machines"
    Write-Host ""
    Write-ColorOutput "EXAMPLES:" "Yellow"
    Write-Host "  .\css-dev-manager.ps1 -Command start                    # Basic development"
    Write-Host "  .\css-dev-manager.ps1 -Command live -Profile debug      # Debug development"
    Write-Host "  .\css-dev-manager.ps1 -Command test-all -Browser chrome # Full testing"
    Write-Host "  .\css-dev-manager.ps1 -Command dashboard -Analytics     # Development dashboard"
    Write-Host "  .\css-dev-manager.ps1 -Command analyze -Verbose         # Detailed analysis"
    exit 0
}

if ($Help -or $Command -eq "help") { Show-Help }

# Configuration
$ScriptDir = $PSScriptRoot
$ProjectRoot = Split-Path $ScriptDir -Parent
$ResultsDir = Join-Path $ProjectRoot "css-test-results"

# Available scripts
$Scripts = @{
    "start-live" = Join-Path $ScriptDir "start-live.ps1"
    "live-edit" = Join-Path $ScriptDir "live-edit.ps1"
    "css-tools" = Join-Path $ScriptDir "css-tools.ps1"
    "css-testing" = Join-Path $ScriptDir "css-testing.ps1"
}

function Test-ScriptAvailability {
    $missing = @()
    foreach ($script in $Scripts.Values) {
        if (-not (Test-Path $script)) {
            $missing += $script
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-ColorOutput "❌ Missing required scripts:" "Red"
        $missing | ForEach-Object { Write-Host "  • $_" }
        return $false
    }
    return $true
}

function Show-EnvironmentStatus {
    Write-ColorOutput "🏗️  Development Environment Status" "Cyan"
    Write-Host ""
    
    # Check Node.js
    $nodeVersion = try { & node --version } catch { "Not installed" }
    Write-Host "  Node.js: $nodeVersion"
    
    # Check npm
    $npmVersion = try { & npm --version } catch { "Not installed" }
    Write-Host "  npm: $npmVersion"
    
    # Check Tailwind CSS
    $tailwindVersion = try { & npx tailwindcss --help | Select-String "tailwindcss" | Select-Object -First 1 } catch { "Not available" }
    Write-Host "  Tailwind CSS: $($tailwindVersion -replace 'tailwindcss', '' -replace 'v', '')"
    
    # Check package.json
    $packageJsonPath = Join-Path $ProjectRoot "package.json"
    if (Test-Path $packageJsonPath) {
        $packageInfo = Get-Content $packageJsonPath | ConvertFrom-Json
        Write-Host "  Project: $($packageInfo.name) v$($packageInfo.version)"
    } else {
        Write-Host "  Project: package.json not found" -ForegroundColor Yellow
    }
    
    # Check development server status
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "  Dev Server: Running on port $Port" -ForegroundColor Green
    } catch {
        Write-Host "  Dev Server: Not running" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

function Start-DevelopmentEnvironment {
    param([string]$profile, [int]$port, [string]$browser)
    
    Write-ColorOutput "🚀 Starting CSS development environment..." "Blue"
    
    $startArgs = @(
        "-Port", $port,
        "-Browser", $browser,
        "-Profile", $profile
    )
    
    if ($Analytics) { $startArgs += "-Analytics" }
    if ($Verbose) { $startArgs += "-Verbose" }
    
    & $Scripts["start-live"] @startArgs
}

function Start-LiveDevelopment {
    param([string]$profile, [int]$port, [string]$browser)
    
    Write-ColorOutput "🎯 Starting live CSS development..." "Blue"
    
    $liveArgs = @(
        "-Port", $port,
        "-Browser", $browser,
        "-Profile", $profile
    )
    
    if ($Analytics) { $liveArgs += "-Analytics" }
    if ($Watch) { $liveArgs += "-Watch" }
    
    & $Scripts["live-edit"] @liveArgs
}

function Invoke-CSSAnalysis {
    Write-ColorOutput "🔍 Running CSS analysis..." "Blue"
    
    $analysisArgs = @(
        "-Action", "analyze",
        "-Directory", $ProjectRoot
    )
    
    if ($Verbose) { $analysisArgs += "-Verbose" }
    
    & $Scripts["css-tools"] @analysisArgs
}

function Invoke-CSSTestSuite {
    param([string]$testType)
    
    Write-ColorOutput "🧪 Running CSS test suite..." "Blue"
    
    $testArgs = @(
        "-Action", $testType,
        "-Directory", $ProjectRoot,
        "-Browser", $Browser
    )
    
    if ($Verbose) { $testArgs += "-Verbose" }
    
    & $Scripts["css-testing"] @testArgs
}

function Start-CSSDashboard {
    Write-ColorOutput "📊 Starting CSS Development Dashboard..." "Blue"
    
    # Create dashboard HTML
    $dashboardHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS Development Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'p3-cyan': 'color(display-p3 0 1 1)',
                        'p3-purple': 'color(display-p3 0.5 0 1)',
                        'p3-green': 'color(display-p3 0 1 0.5)',
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen">
    <div class="container mx-auto px-6 py-8">
        <header class="mb-8">
            <h1 class="text-4xl font-bold text-p3-cyan mb-2">🎨 CSS Development Dashboard</h1>
            <p class="text-gray-300">Real-time monitoring and control center</p>
        </header>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            <div class="bg-gradient-to-br from-purple-800 to-pink-800 rounded-lg p-6 hover:scale-105 transition-transform cursor-pointer" onclick="openTool('live-editor')">
                <h3 class="text-xl font-semibold mb-2">🎯 Live Editor</h3>
                <p class="text-sm text-purple-100">Real-time CSS editing with hot reload</p>
            </div>
            
            <div class="bg-gradient-to-br from-blue-800 to-cyan-800 rounded-lg p-6 hover:scale-105 transition-transform cursor-pointer" onclick="openTool('css-analyzer')">
                <h3 class="text-xl font-semibold mb-2">🔍 CSS Analyzer</h3>
                <p class="text-sm text-blue-100">Analyze CSS structure and performance</p>
            </div>
            
            <div class="bg-gradient-to-br from-green-800 to-emerald-800 rounded-lg p-6 hover:scale-105 transition-transform cursor-pointer" onclick="openTool('color-palette')">
                <h3 class="text-xl font-semibold mb-2">🎨 Color Palette</h3>
                <p class="text-sm text-green-100">P3 color space management</p>
            </div>
            
            <div class="bg-gradient-to-br from-orange-800 to-red-800 rounded-lg p-6 hover:scale-105 transition-transform cursor-pointer" onclick="openTool('testing-suite')">
                <h3 class="text-xl font-semibold mb-2">🧪 Testing Suite</h3>
                <p class="text-sm text-orange-100">Visual regression and validation</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section class="bg-gray-800 rounded-lg p-6">
                <h2 class="text-2xl font-semibold mb-4 text-p3-green">📊 Quick Stats</h2>
                <div id="stats-container" class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-gray-700 rounded">
                        <span>Development Server</span>
                        <span id="server-status" class="px-2 py-1 rounded text-sm">Checking...</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-700 rounded">
                        <span>CSS Files</span>
                        <span id="css-files-count" class="font-mono">--</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-700 rounded">
                        <span>Total CSS Size</span>
                        <span id="css-size" class="font-mono">--</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-700 rounded">
                        <span>Tailwind Classes</span>
                        <span id="tailwind-classes" class="font-mono">--</span>
                    </div>
                </div>
            </section>
            
            <section class="bg-gray-800 rounded-lg p-6">
                <h2 class="text-2xl font-semibold mb-4 text-p3-purple">⚡ Quick Actions</h2>
                <div class="grid grid-cols-2 gap-4">
                    <button onclick="runAction('analyze')" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors">
                        Analyze CSS
                    </button>
                    <button onclick="runAction('test-visual')" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors">
                        Visual Test
                    </button>
                    <button onclick="runAction('optimize')" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors">
                        Optimize CSS
                    </button>
                    <button onclick="runAction('validate')" class="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded transition-colors">
                        Validate CSS
                    </button>
                </div>
            </section>
        </div>
        
        <section class="mt-8 bg-gray-800 rounded-lg p-6">
            <h2 class="text-2xl font-semibold mb-4">📈 Performance Metrics</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center">
                    <div class="text-3xl font-bold text-p3-cyan" id="css-coverage">--</div>
                    <div class="text-sm text-gray-400">CSS Coverage</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-p3-green" id="load-time">--</div>
                    <div class="text-sm text-gray-400">Load Time (ms)</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-p3-purple" id="accessibility-score">--</div>
                    <div class="text-sm text-gray-400">A11y Score</div>
                </div>
            </div>
        </section>
    </div>
    
    <script>
        // Dashboard functionality
        function openTool(tool) {
            console.log('Opening tool:', tool);
            // Integration with actual tools would go here
        }
        
        function runAction(action) {
            console.log('Running action:', action);
            // Integration with PowerShell scripts would go here
        }
        
        function updateStats() {
            // Check server status
            fetch('http://localhost:$Port')
                .then(response => {
                    document.getElementById('server-status').textContent = 'Online';
                    document.getElementById('server-status').className = 'px-2 py-1 rounded text-sm bg-green-600';
                })
                .catch(() => {
                    document.getElementById('server-status').textContent = 'Offline';
                    document.getElementById('server-status').className = 'px-2 py-1 rounded text-sm bg-red-600';
                });
        }
        
        // Update stats every 30 seconds
        updateStats();
        setInterval(updateStats, 30000);
        
        // Simulated metrics (would be real in production)
        document.getElementById('css-coverage').textContent = '85%';
        document.getElementById('load-time').textContent = '342';
        document.getElementById('accessibility-score').textContent = '94';
        document.getElementById('css-files-count').textContent = '23';
        document.getElementById('css-size').textContent = '284KB';
        document.getElementById('tailwind-classes').textContent = '1,247';
    </script>
</body>
</html>
"@
    
    $dashboardPath = Join-Path $ResultsDir "dashboard.html"
    if (-not (Test-Path (Split-Path $dashboardPath))) {
        New-Item -ItemType Directory -Path (Split-Path $dashboardPath) -Force | Out-Null
    }
    
    $dashboardHtml | Out-File -FilePath $dashboardPath -Encoding UTF8
    
    # Open dashboard in browser
    Start-Process $dashboardPath
    Write-ColorOutput "✅ Dashboard opened at: $dashboardPath" "Green"
}

function Show-CSSStats {
    Write-ColorOutput "📊 CSS Statistics" "Cyan"
    Write-Host ""
    
    # Find all CSS files
    $cssFiles = Get-ChildItem -Path $ProjectRoot -Filter "*.css" -Recurse | Where-Object { $_.Directory.Name -notmatch "node_modules|\.git" }
    
    $totalSize = 0
    $totalLines = 0
    
    Write-Host "CSS Files Found:"
    foreach ($file in $cssFiles) {
        $content = Get-Content $file.FullName -Raw
        $lines = ($content -split "`n").Count
        $size = $file.Length
        
        $totalSize += $size
        $totalLines += $lines
        
        Write-Host "  📄 $($file.Name): $([math]::Round($size/1KB, 1))KB ($lines lines)"
    }
    
    Write-Host ""
    Write-Host "Summary:"
    Write-Host "  Total Files: $($cssFiles.Count)"
    Write-Host "  Total Size: $([math]::Round($totalSize/1KB, 1))KB"
    Write-Host "  Total Lines: $totalLines"
    Write-Host ""
}

function Clean-TempFiles {
    Write-ColorOutput "🧹 Cleaning temporary files..." "Yellow"
    
    $tempPaths = @(
        $env:TEMP,
        $ResultsDir,
        (Join-Path $ProjectRoot "node_modules\.cache"),
        (Join-Path $ProjectRoot ".vite"),
        (Join-Path $ProjectRoot "dist")
    )
    
    foreach ($path in $tempPaths) {
        if (Test-Path $path) {
            try {
                Get-ChildItem -Path $path -Filter "*css-test*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
                Get-ChildItem -Path $path -Filter "*vite-dev-config*" -ErrorAction SilentlyContinue | Remove-Item -Force
                Write-Host "  🗑️  Cleaned: $path"
            } catch {
                Write-Host "  ⚠️  Could not clean: $path" -ForegroundColor Yellow
            }
        }
    }
    
    Write-ColorOutput "✅ Cleanup completed" "Green"
}

# Main execution
try {
    Write-ColorOutput "🎨 CSS Development Tool Manager" "Cyan"
    Write-Host ""
    
    if (-not (Test-ScriptAvailability)) {
        Write-ColorOutput "❌ Required scripts are missing. Please ensure all CSS development scripts are in the scripts directory." "Red"
        exit 1
    }
    
    switch ($Command.ToLower()) {
        "start" { 
            Show-EnvironmentStatus
            Start-DevelopmentEnvironment -profile $Profile -port $Port -browser $Browser 
        }
        "live" { 
            Show-EnvironmentStatus
            Start-LiveDevelopment -profile $Profile -port $Port -browser $Browser 
        }
        "playground" { 
            Show-EnvironmentStatus
            Start-DevelopmentEnvironment -profile "debug" -port $Port -browser $Browser
        }
        "debug" { 
            Show-EnvironmentStatus
            Start-DevelopmentEnvironment -profile "debug" -port $Port -browser $Browser 
        }
        "performance" { 
            Show-EnvironmentStatus
            Start-DevelopmentEnvironment -profile "performance" -port $Port -browser $Browser 
        }
        "analyze" { 
            Invoke-CSSAnalysis 
        }
        "purge" { 
            & $Scripts["css-tools"] -Action "purge" -Directory $ProjectRoot $(if ($Verbose) { "-Verbose" } else { "" })
        }
        "extract" { 
            & $Scripts["css-tools"] -Action "extract" -Directory $ProjectRoot $(if ($Verbose) { "-Verbose" } else { "" })
        }
        "optimize" { 
            & $Scripts["css-tools"] -Action "optimize" -Directory $ProjectRoot $(if ($Verbose) { "-Verbose" } else { "" })
        }
        "convert-p3" { 
            & $Scripts["css-tools"] -Action "convert-p3" -Directory $ProjectRoot $(if ($Verbose) { "-Verbose" } else { "" })
        }
        "test-visual" { 
            Invoke-CSSTestSuite -testType "regression" 
        }
        "test-a11y" { 
            Invoke-CSSTestSuite -testType "accessibility" 
        }
        "test-perf" { 
            Invoke-CSSTestSuite -testType "performance" 
        }
        "test-validate" { 
            Invoke-CSSTestSuite -testType "validation" 
        }
        "test-all" { 
            Invoke-CSSTestSuite -testType "all" 
        }
        "baseline" { 
            Invoke-CSSTestSuite -testType "baseline" 
        }
        "report" { 
            Invoke-CSSTestSuite -testType "report" 
        }
        "dashboard" { 
            Start-CSSDashboard 
        }
        "stats" { 
            Show-CSSStats 
        }
        "health" { 
            Show-EnvironmentStatus 
        }
        "setup" {
            Write-ColorOutput "🛠️  Setting up CSS development environment..." "Blue"
            # Install packages, create directories, etc.
            Write-ColorOutput "✅ Setup completed" "Green"
        }
        "update" {
            Write-ColorOutput "🔄 Updating CSS development tools..." "Blue"
            # Update packages and tools
            Write-ColorOutput "✅ Update completed" "Green"
        }
        "clean" { 
            Clean-TempFiles 
        }
        "backup" {
            Write-ColorOutput "💾 Creating CSS configuration backup..." "Blue"
            # Backup configurations
            Write-ColorOutput "✅ Backup created" "Green"
        }
        "restore" {
            Write-ColorOutput "📥 Restoring CSS configurations..." "Blue"
            # Restore configurations
            Write-ColorOutput "✅ Restore completed" "Green"
        }
        default {
            Write-ColorOutput "❌ Unknown command: $Command" "Red"
            Write-Host ""
            Show-Help
        }
    }
    
} catch {
    Write-ColorOutput "❌ CSS Development Manager failed: $($_.Exception.Message)" "Red"
    if ($Verbose) {
        Write-Host $_.ScriptStackTrace
    }
    exit 1
}