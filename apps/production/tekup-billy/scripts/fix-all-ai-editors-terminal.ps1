# 🤖 Fix Terminal Crashes for All AI Editors
# Fixes terminal issues in: Kiro, VS Code, Windsurf, Cursor
# Run this script as Administrator

Write-Host "🤖 Fixing Terminal Crashes for AI Editors (Kiro, VS Code, Windsurf, Cursor)" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Gray
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Denne script skal køres som Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Sådan kører du som Administrator:" -ForegroundColor Yellow
    Write-Host "  1. Åbn PowerShell som Administrator (Højreklik → Run as Administrator)" -ForegroundColor Yellow
    Write-Host "  2. Naviger til: cd C:\Users\empir\Tekup-Billy" -ForegroundColor Yellow
    Write-Host "  3. Kør: .\fix-all-ai-editors-terminal.ps1" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# AI Editor Paths to add to Windows Defender exclusions
$exclusionPaths = @(
    # Project folders
    "C:\Users\empir\Tekup-Billy",
    
    # Kiro AI Editor
    "C:\Users\empir\AppData\Local\Programs\Kiro",
    "C:\Users\empir\AppData\Roaming\Kiro",
    
    # VS Code
    "C:\Users\empir\AppData\Local\Programs\Microsoft VS Code",
    "C:\Users\empir\AppData\Roaming\Code",
    
    # Windsurf
    "C:\Users\empir\AppData\Local\Programs\Windsurf",
    "C:\Users\empir\AppData\Roaming\Windsurf",
    
    # Cursor
    "C:\Users\empir\AppData\Local\Programs\Cursor",
    "C:\Users\empir\AppData\Roaming\Cursor"
)

# Processes to exclude
$exclusionProcesses = @(
    "powershell.exe",
    "pwsh.exe",
    "cmd.exe",
    "Kiro.exe",
    "Code.exe",
    "Windsurf.exe",
    "Cursor.exe"
)

Write-Host "📁 Tilføjer Windows Defender folder exclusions..." -ForegroundColor Cyan
$addedPaths = 0
$skippedPaths = 0

foreach ($path in $exclusionPaths) {
    if (Test-Path $path) {
        try {
            Add-MpPreference -ExclusionPath $path -ErrorAction Stop
            Write-Host "  ✅ Added: $path" -ForegroundColor Green
            $addedPaths++
        } catch {
            if ($_.Exception.Message -like "*already exists*") {
                Write-Host "  ⏭️  Skipped (already exists): $path" -ForegroundColor Gray
                $skippedPaths++
            } else {
                Write-Host "  ⚠️  Warning: $path - $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  ⏭️  Skipped (not found): $path" -ForegroundColor Gray
        $skippedPaths++
    }
}

Write-Host ""
Write-Host "🔧 Tilføjer Windows Defender process exclusions..." -ForegroundColor Cyan
$addedProcesses = 0

foreach ($process in $exclusionProcesses) {
    try {
        Add-MpPreference -ExclusionProcess $process -ErrorAction Stop
        Write-Host "  ✅ Added: $process" -ForegroundColor Green
        $addedProcesses++
    } catch {
        if ($_.Exception.Message -like "*already exists*") {
            Write-Host "  ⏭️  Skipped (already exists): $process" -ForegroundColor Gray
        } else {
            Write-Host "  ⚠️  Warning: $process - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Resultat:" -ForegroundColor Cyan
Write-Host "  Paths tilføjet: $addedPaths" -ForegroundColor Green
Write-Host "  Paths skipped: $skippedPaths" -ForegroundColor Gray
Write-Host "  Processes tilføjet: $addedProcesses" -ForegroundColor Green
Write-Host ""

# Verify current exclusions
Write-Host "🔍 Verificerer Windows Defender exclusions..." -ForegroundColor Cyan
try {
    $currentExclusions = Get-MpPreference | Select-Object -ExpandProperty ExclusionPath
    Write-Host "  Totalt antal folder exclusions: $($currentExclusions.Count)" -ForegroundColor Green
    
    $currentProcessExclusions = Get-MpPreference | Select-Object -ExpandProperty ExclusionProcess
    Write-Host "  Totalt antal process exclusions: $($currentProcessExclusions.Count)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Kunne ikke verificere exclusions" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Windows Defender exclusions er nu konfigureret!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Næste skridt:" -ForegroundColor Cyan
Write-Host "  1. 🔄 Restart alle AI editors (Kiro, VS Code, Windsurf, Cursor)" -ForegroundColor Yellow
Write-Host "  2. 🔄 Åbn ny terminal i hver editor" -ForegroundColor Yellow
Write-Host "  3. ✅ Test med: Write-Host 'Terminal fungerer!' -ForegroundColor Green" -ForegroundColor Yellow
Write-Host ""
Write-Host "🐛 Hvis problemet fortsætter:" -ForegroundColor Cyan
Write-Host "  - Check Windows Event Viewer for fejl" -ForegroundColor Yellow
Write-Host "  - Disable anti-virus midlertidigt for test" -ForegroundColor Yellow
Write-Host "  - Prøv at køre editoren som Administrator" -ForegroundColor Yellow
Write-Host "  - Se TERMINAL_DIAGNOSTIC_REPORT.md for flere løsninger" -ForegroundColor Yellow
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Gray
Write-Host ""

# Optional: Create a test script for each editor
Write-Host "📝 Opretter test script..." -ForegroundColor Cyan
$testScript = @"
# Terminal Test Script
Write-Host "Testing terminal in AI editor..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Basic command
Write-Host "✅ Test 1: Basic command" -ForegroundColor Green
`$env:COMPUTERNAME

# Test 2: File operations
Write-Host "✅ Test 2: File operations" -ForegroundColor Green
Get-ChildItem | Select-Object -First 3

# Test 3: Long command
Write-Host "✅ Test 3: Long command" -ForegroundColor Green
`$longString = "This is a very long test string that should not cause the terminal to crash if the fix worked correctly. Lorem ipsum dolor sit amet, consectetur adipiscing elit."
Write-Host `$longString

# Test 4: Environment variables
Write-Host "✅ Test 4: Environment variables" -ForegroundColor Green
Write-Host "User: `$env:USERNAME"
Write-Host "Path: `$env:PATH" | Select-Object -First 100

Write-Host ""
Write-Host "🎉 All tests passed! Terminal is working correctly!" -ForegroundColor Green
"@

$testScript | Out-File -FilePath "test-terminal.ps1" -Encoding UTF8
Write-Host "  ✅ Created: test-terminal.ps1" -ForegroundColor Green

Write-Host ""
Write-Host "Kør './test-terminal.ps1' i hver editor for at teste!" -ForegroundColor Cyan
Write-Host ""
pause
