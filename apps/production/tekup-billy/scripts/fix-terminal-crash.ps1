# Quick Fix for Terminal Crash
# Run this script as Administrator

Write-Host "Fixing Terminal Crash Issue (Exit Code -2147023895)" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Denne script skal kores som Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Saadan gor du:" -ForegroundColor Yellow
    Write-Host "  1. Luk denne terminal" -ForegroundColor Yellow
    Write-Host "  2. Windows Key -> skriv 'PowerShell'" -ForegroundColor Yellow
    Write-Host "  3. Hojreklik paa 'Windows PowerShell' -> 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "  4. Naviger til: cd C:\Users\empir\Tekup-Billy" -ForegroundColor Yellow
    Write-Host "  5. Kor: .\fix-terminal-crash.ps1" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Tryk Enter for at lukke"
    return
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Add Windows Defender exclusions
Write-Host "📁 Tilføjer Windows Defender exclusions..." -ForegroundColor Cyan

try {
    # Add Tekup-Billy folder
    Add-MpPreference -ExclusionPath "C:\Users\empir\Tekup-Billy"
    Write-Host "  ✅ Added: C:\Users\empir\Tekup-Billy" -ForegroundColor Green
    
    # Add VS Code folder
    Add-MpPreference -ExclusionPath "C:\Users\empir\AppData\Local\Programs\Microsoft VS Code"
    Write-Host "  ✅ Added: VS Code installation folder" -ForegroundColor Green
    
    # Add PowerShell executable
    Add-MpPreference -ExclusionProcess "powershell.exe"
    Write-Host "  ✅ Added: powershell.exe process exclusion" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🎉 Windows Defender exclusions tilføjet succesfuldt!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Fejl ved tilføjelse af exclusions:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Prøv at tilføje exclusions manuelt via Windows Security:" -ForegroundColor Yellow
    Write-Host "  1. Åbn Windows Security" -ForegroundColor Yellow
    Write-Host "  2. Virus & threat protection" -ForegroundColor Yellow
    Write-Host "  3. Manage settings" -ForegroundColor Yellow
    Write-Host "  4. Add or remove exclusions" -ForegroundColor Yellow
    Write-Host "  5. Tilføj: C:\Users\empir\Tekup-Billy" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 Restart VS Code for at ændringerne træder i kraft." -ForegroundColor Cyan
Write-Host ""
pause
