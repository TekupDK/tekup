# Simple rename script
Write-Host "Starting rename..." -ForegroundColor Cyan

# Navigate to parent
Set-Location "C:\Users\Jonas-dev\"

# Rename
Rename-Item "Tekup-Monorepo" "tekup"

Write-Host "Done! Folder renamed to: tekup" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: code C:\Users\Jonas-dev\tekup\Tekup-Portfolio.code-workspace"
