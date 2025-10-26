# Fix PowerShell Emoji Display
# Adds UTF-8 encoding to PowerShell profile for proper emoji rendering

param([switch]$Temp, [switch]$Test)

$utf8Line = '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8'

if ($Test) {
    Write-Host "`nTesting emoji display..." -ForegroundColor Cyan
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Host "If you see emojis below (not garbled text), UTF-8 works!"
    Write-Host "[SCAN] [OK] [ERROR] [EMAIL] [WARNING] [CELEBRATE]"
    exit 0
}

if ($Temp) {
    Write-Host "Setting UTF-8 for current session only..." -ForegroundColor Cyan
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Host "[OK] Done! Run without --temp to make permanent." -ForegroundColor Green
    exit 0
}

Write-Host "`n[SETUP] PowerShell Emoji Fix - Permanent Installation" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Gray

if (-not (Test-Path $PROFILE)) {
    Write-Host "`nCreating PowerShell profile..." -ForegroundColor Yellow
    New-Item -Path $PROFILE -ItemType File -Force | Out-Null
    Write-Host "[OK] Profile created: $PROFILE" -ForegroundColor Green
}

$profileContent = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
if ($profileContent -match [regex]::Escape($utf8Line)) {
    Write-Host "`n[OK] UTF-8 encoding already configured!" -ForegroundColor Green
    Write-Host "    Location: $PROFILE" -ForegroundColor Gray
} else {
    Write-Host "`nAdding UTF-8 encoding to profile..." -ForegroundColor Cyan
    
    $addition = "`n# Fix emoji display (added by RenOS)`n$utf8Line`n"
    Add-Content -Path $PROFILE -Value $addition
    
    Write-Host "[OK] UTF-8 encoding added to profile!" -ForegroundColor Green
    Write-Host "    Location: $PROFILE" -ForegroundColor Gray
}

Write-Host "`nApplying to current session..." -ForegroundColor Cyan
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "[OK] Active now!" -ForegroundColor Green

Write-Host "`n[SUCCESS] Installation complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Restart PowerShell for permanent effect" -ForegroundColor Gray
Write-Host "  2. Or continue - already active in this session!" -ForegroundColor Gray
Write-Host "  3. Run with --test flag to verify" -ForegroundColor Gray
Write-Host ""
