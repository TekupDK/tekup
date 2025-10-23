# PowerShell Profile Stack Overflow Finder
# This script finds the exact line in your PowerShell profile causing crashes
# Run from: CMD or powershell.exe -NoProfile

Write-Host "PowerShell Profile Crash Diagnostic" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Gray
Write-Host ""

# Config: choose which profile to test
$ProfileToTest = $PROFILE # current host profile

if (-not (Test-Path $ProfileToTest)) {
  Write-Host "Profile file not found: $ProfileToTest" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Checking all profile locations:" -ForegroundColor Cyan
  [PSCustomObject]@{
    CurrentUserCurrentHost = $PROFILE
    CurrentUserAllHosts    = $PROFILE.CurrentUserAllHosts
    AllUsersCurrentHost    = $PROFILE.AllUsersCurrentHost
    AllUsersAllHosts       = $PROFILE.AllUsersAllHosts
  } | Format-List
  pause
  return
}

Write-Host "Testing profile: $ProfileToTest" -ForegroundColor Green
Write-Host ""

# Read and normalize lines
$lines = Get-Content -LiteralPath $ProfileToTest -Raw -ErrorAction Stop -Encoding UTF8
$lines = $lines -split "(`r`n|`n|`r)"
$N = $lines.Count

Write-Host "Total lines in profile: $N" -ForegroundColor Cyan
Write-Host ""

# Helper: run a snippet in a fresh PowerShell process
function Test-Snippet {
  param([string[]]$SnippetLines)
  
  $tmp = [System.IO.Path]::GetTempFileName()
  $tmpPs1 = $tmp.Replace(".tmp", ".ps1")
  Move-Item $tmp $tmpPs1 -Force
  
  Set-Content -LiteralPath $tmpPs1 -Value ($SnippetLines -join [Environment]::NewLine) -Encoding UTF8
  
  $si = New-Object System.Diagnostics.ProcessStartInfo
  $si.FileName  = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
  $si.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$tmpPs1`""
  $si.RedirectStandardOutput = $true
  $si.RedirectStandardError  = $true
  $si.UseShellExecute = $false
  $si.CreateNoWindow = $true
  
  $p = [System.Diagnostics.Process]::Start($si)
  $timeout = $p.WaitForExit(5000) # 5 second timeout
  
  if (-not $timeout) {
    try { $p.Kill() } catch {}
  }
  
  $code = $p.ExitCode
  Remove-Item $tmpPs1 -Force -ErrorAction SilentlyContinue
  
  return $code -eq 0
}

# Quick sanity: empty snippet should pass
Write-Host "Running sanity checks..." -ForegroundColor Cyan
$okEmpty = Test-Snippet @()
if (-not $okEmpty) {
  Write-Host "  ERROR: Empty snippet fails. PowerShell environment is broken." -ForegroundColor Red
  pause
  return
}
Write-Host "  OK: Empty snippet passes" -ForegroundColor Green

# Full file indicates failure reproduces
$okFull  = Test-Snippet $lines
if ($okFull) {
  Write-Host "  OK: Full profile passes (no crash detected)" -ForegroundColor Green
  Write-Host ""
  Write-Host "Your profile runs fine in isolation!" -ForegroundColor Yellow
  Write-Host "The crash may be VS Code-specific or environment-related." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Try these fixes:" -ForegroundColor Cyan
  Write-Host "  1. Switch to Command Prompt in VS Code" -ForegroundColor White
  Write-Host "  2. Disable PowerShell extension temporarily" -ForegroundColor White
  Write-Host "  3. Install PowerShell 7: winget install Microsoft.PowerShell" -ForegroundColor White
  pause
  return
}

Write-Host "  CRASH DETECTED: Full profile fails" -ForegroundColor Red
Write-Host ""

# Binary search for the smallest failing prefix
Write-Host "Binary searching for the failing line..." -ForegroundColor Cyan
Write-Host "(This will take 30-60 seconds)" -ForegroundColor Gray
Write-Host ""

$lo = 0
$hi = $N

while ($lo + 1 -lt $hi) {
  $mid = [int](($lo + $hi)/2)
  Write-Host "  Testing lines 1-$mid..." -NoNewline -ForegroundColor Gray
  
  $ok = Test-Snippet $lines[0..($mid-1)]
  
  if ($ok) {
    $lo = $mid
    Write-Host " OK" -ForegroundColor Green
  } else {
    $hi = $mid
    Write-Host " CRASH" -ForegroundColor Red
  }
}

$failIndex = $hi - 1
$contextFrom = [Math]::Max(0, $failIndex - 3)
$contextTo   = [Math]::Min($N - 1, $failIndex + 3)

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host ""
Write-Host "PROBLEM FOUND!" -ForegroundColor Red
Write-Host ""
Write-Host "Suspect line #$($failIndex+1):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  $($lines[$failIndex])" -ForegroundColor Red
Write-Host ""
Write-Host "Context:" -ForegroundColor Cyan
for ($i=$contextFrom; $i -le $contextTo; $i++) {
  if ($i -eq $failIndex) {
    Write-Host ("{0,5}: {1}" -f ($i+1), $lines[$i]) -ForegroundColor Red
  } else {
    Write-Host ("{0,5}: {1}" -f ($i+1), $lines[$i]) -ForegroundColor Gray
  }
}
Write-Host ""

# Heuristics
$suspectLine = $lines[$failIndex]

if ($suspectLine -match '^\s*function\s+prompt\b' -or ($lines[0..$failIndex] -match 'prompt').Count) {
  Write-Host "Analysis: 'prompt' function found near failure." -ForegroundColor Yellow
  Write-Host "Recursive prompt often causes stack overflow." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Fix: Replace prompt function with:" -ForegroundColor Cyan
  Write-Host '  function prompt { "PS $($PWD.Path)> " }' -ForegroundColor Green
  Write-Host ""
}

if ($lines[0..$failIndex] -match 'oh-my-posh|posh-git|PSReadLine|Import-Module') {
  Write-Host "Analysis: Module init near failure." -ForegroundColor Yellow
  Write-Host "Try commenting out that Import-Module line." -ForegroundColor Cyan
  Write-Host ""
}

# Backup
$backupPath = "$ProfileToTest.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -LiteralPath $ProfileToTest -Destination $backupPath -Force
Write-Host "Backup created: $backupPath" -ForegroundColor Green
Write-Host ""

# Offer fixes
Write-Host "Quick Fix Options:" -ForegroundColor Cyan
Write-Host "  [1] Comment out the failing line (safest)" -ForegroundColor Yellow
Write-Host "  [2] Delete the failing line" -ForegroundColor Yellow
Write-Host "  [3] Manual fix (do nothing now)" -ForegroundColor Yellow
Write-Host ""
$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
  "1" {
    $lines[$failIndex] = "# COMMENTED OUT (caused stack overflow): " + $lines[$failIndex]
    $lines -join [Environment]::NewLine | Set-Content -LiteralPath $ProfileToTest -Encoding UTF8
    Write-Host ""
    Write-Host "Line commented out successfully!" -ForegroundColor Green
  }
  
  "2" {
    $newLines = $lines[0..($failIndex - 1)] + $lines[($failIndex + 1)..($lines.Count - 1)]
    $newLines -join [Environment]::NewLine | Set-Content -LiteralPath $ProfileToTest -Encoding UTF8
    Write-Host ""
    Write-Host "Line deleted successfully!" -ForegroundColor Green
  }
  
  default {
    Write-Host ""
    Write-Host "Profile not modified. Fix manually." -ForegroundColor Gray
  }
}

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Close ALL PowerShell terminals" -ForegroundColor White
Write-Host "  2. Restart VS Code / Kiro / Windsurf / Cursor" -ForegroundColor White
Write-Host "  3. Open new terminal and test" -ForegroundColor White
Write-Host ""
Write-Host "If problem persists, restore backup:" -ForegroundColor Yellow
Write-Host "  Copy-Item '$backupPath' '$ProfileToTest' -Force" -ForegroundColor Gray
Write-Host ""
pause
