# Add Windows Defender exclusions for Tekup AI v2
# Run as Administrator

Write-Host "🛡️ Adding Windows Defender Exclusions for Tekup AI v2" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run:" -ForegroundColor Yellow
    Write-Host "   .\scripts\add-defender-exclusions.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Get project root
$projectRoot = $PSScriptRoot | Split-Path -Parent

Write-Host "📁 Project root: $projectRoot" -ForegroundColor Yellow
Write-Host ""

# Add exclusions
try {
    # Exclude entire project folder
    Add-MpPreference -ExclusionPath $projectRoot
    Write-Host "✅ Added exclusion: $projectRoot" -ForegroundColor Green
    
    # Exclude node_modules specifically
    $nodeModules = Join-Path $projectRoot "node_modules"
    if (Test-Path $nodeModules) {
        Add-MpPreference -ExclusionPath $nodeModules
        Write-Host "✅ Added exclusion: $nodeModules" -ForegroundColor Green
    }
    
    # Exclude dist folder
    $dist = Join-Path $projectRoot "dist"
    if (Test-Path $dist) {
        Add-MpPreference -ExclusionPath $dist
        Write-Host "✅ Added exclusion: $dist" -ForegroundColor Green
    }
    
    # Exclude common dev processes
    Add-MpPreference -ExclusionProcess "node.exe"
    Write-Host "✅ Added process exclusion: node.exe" -ForegroundColor Green
    
    Add-MpPreference -ExclusionProcess "tsx.exe"
    Write-Host "✅ Added process exclusion: tsx.exe" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🎉 Windows Defender exclusions added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 This will significantly improve:" -ForegroundColor Cyan
    Write-Host "   • File watching performance" -ForegroundColor White
    Write-Host "   • Hot reload speed" -ForegroundColor White
    Write-Host "   • Overall build times" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ Error adding exclusions: $_" -ForegroundColor Red
    Write-Host ""
}

# Show current exclusions
Write-Host "📋 Current Windows Defender Exclusions:" -ForegroundColor Yellow
$exclusions = Get-MpPreference | Select-Object -ExpandProperty ExclusionPath
$exclusions | Where-Object {$_ -like "*Tekup*"} | ForEach-Object {
    Write-Host "   • $_" -ForegroundColor White
}
Write-Host ""
