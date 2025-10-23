# PowerShell Stack Overflow Diagnostic
# Finds the exact line causing terminal crashes

$sep = '=' * 80
Write-Host 'PowerShell Stack Overflow Diagnostic' -ForegroundColor Cyan
Write-Host $sep -ForegroundColor Gray
Write-Host ''

# Check all profile locations
Write-Host 'Checking PowerShell profile locations...' -ForegroundColor Cyan
Write-Host ''

$foundProfiles = @()
if (Test-Path $PROFILE) {
  $foundProfiles += $PROFILE
  Write-Host '  Found: CurrentUserCurrentHost' -ForegroundColor Green
  Write-Host "     $PROFILE" -ForegroundColor Gray
}

if ($foundProfiles.Count -eq 0) {
  Write-Host 'No PowerShell profiles found!' -ForegroundColor Red
  Write-Host 'The crash is not from your profile.' -ForegroundColor Yellow
  Write-Host 'Try: powershell.exe -NoProfile' -ForegroundColor Cyan
  pause
  exit
}

$ProfileToTest = $foundProfiles[0]
Write-Host ''
Write-Host "Testing: $ProfileToTest" -ForegroundColor Green
Write-Host ''

# Helper function to test code snippets
function Test-Snippet {
  param([string[]]$SnippetLines)
  $tmp = [System.IO.Path]::GetTempFileName().Replace('.tmp', '.ps1')
  Set-Content -LiteralPath $tmp -Value ($SnippetLines -join [Environment]::NewLine) -Encoding UTF8
  $si = New-Object System.Diagnostics.ProcessStartInfo
  $si.FileName = 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe'
  $si.Arguments = "-NoProfile -ExecutionPolicy Bypass -File "$tmp""
  $si.RedirectStandardOutput = $true
  $si.RedirectStandardError = $true
  $si.UseShellExecute = $false
  $si.CreateNoWindow = $true
  $p = [System.Diagnostics.Process]::Start($si)
  $timeout = $p.WaitForExit(5000)
  if (-not $timeout) {
    $p.Kill()
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
    return $false
  }
  $code = $p.ExitCode
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  return $code -eq 0
}

# Read profile
Write-Host 'Reading profile file...' -ForegroundColor Cyan
$content = Get-Content -LiteralPath $ProfileToTest -Raw -Encoding UTF8
$lines = $content -split "
?
"
$N = $lines.Count
Write-Host "  Total lines: $N" -ForegroundColor Green
Write-Host ''

# Sanity checks
Write-Host 'Running sanity checks...' -ForegroundColor Cyan
$okEmpty = Test-Snippet @()
if (-not $okEmpty) {
  Write-Host '  Empty snippet fails! PowerShell is broken.' -ForegroundColor Red
  pause
  exit
}
Write-Host '  Empty snippet: OK' -ForegroundColor Green

$okFull = Test-Snippet $lines
if ($okFull) {
  Write-Host '  Full profile: OK (no crash detected)' -ForegroundColor Green
  Write-Host ''
  Write-Host 'The profile runs fine in isolation!' -ForegroundColor Yellow
  Write-Host 'This is a VS Code-specific issue.' -ForegroundColor Yellow
  Write-Host 'Try switching to Command Prompt in VS Code.' -ForegroundColor Cyan
  pause
  exit
}
Write-Host '  Full profile: CRASH DETECTED!' -ForegroundColor Red
Write-Host ''

# Binary search
Write-Host 'Binary searching for the failing line...' -ForegroundColor Cyan
Write-Host '  (This may take 30-60 seconds)' -ForegroundColor Gray
Write-Host ''

$lo = 0
$hi = $N

while ($lo + 1 -lt $hi) {
  $mid = [int](($lo + $hi) / 2)
  Write-Host "  Testing lines 1-$mid..." -ForegroundColor Gray -NoNewline
  $ok = Test-Snippet $lines[0..($mid - 1)]
  if ($ok) {
    $lo = $mid
    Write-Host ' OK' -ForegroundColor Green
  } else {
    $hi = $mid
    Write-Host ' CRASH' -ForegroundColor Red
  }
}

$failIndex = $hi - 1
$contextFrom = [Math]::Max(0, $failIndex - 3)
$contextTo = [Math]::Min($N - 1, $failIndex + 3)

Write-Host ''
Write-Host $sep -ForegroundColor Gray
Write-Host ''
Write-Host 'FOUND THE PROBLEM!' -ForegroundColor Red
Write-Host ''
Write-Host "Suspect line #$($failIndex + 1):" -ForegroundColor Yellow
Write-Host ''
Write-Host "  $($lines[$failIndex])" -ForegroundColor Red
Write-Host ''
Write-Host 'Context:' -ForegroundColor Cyan
for ($i = $contextFrom; $i -le $contextTo; $i++) {
  if ($i -eq $failIndex) {
    Write-Host "  $($i+1): $($lines[$i])" -ForegroundColor Red
  } else {
    Write-Host "  $($i+1): $($lines[$i])" -ForegroundColor Gray
  }
}
Write-Host ''

# Analysis
Write-Host 'Analysis:' -ForegroundColor Cyan
$suspectLine = $lines[$failIndex]

if ($suspectLine -match 'function\s+prompt') {
  Write-Host '  This is a PROMPT FUNCTION!' -ForegroundColor Yellow
  Write-Host '  Fix: Replace with a simple prompt' -ForegroundColor Cyan
}
if ($suspectLine -match 'oh-my-posh|posh-git|starship') {
  Write-Host '  This is a PROMPT THEME!' -ForegroundColor Yellow
  Write-Host '  Fix: Comment it out and update the module' -ForegroundColor Cyan
}
if ($suspectLine -match 'Import-Module') {
  Write-Host '  This imports a MODULE!' -ForegroundColor Yellow
  Write-Host '  Fix: Comment it out temporarily' -ForegroundColor Cyan
}

Write-Host ''
$backupPath = "$ProfileToTest.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -LiteralPath $ProfileToTest -Destination $backupPath -Force
Write-Host "Backup created: $backupPath" -ForegroundColor Green
Write-Host ''

Write-Host 'Quick Fix Options:' -ForegroundColor Cyan
Write-Host '  [1] Comment out the failing line' -ForegroundColor Yellow
Write-Host '  [2] Delete the failing line' -ForegroundColor Yellow
Write-Host '  [3] Do nothing' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Enter choice (1-3): ' -ForegroundColor Cyan -NoNewline
$fixChoice = Read-Host

switch ($fixChoice) {
  '1' {
    $lines[$failIndex] = '# COMMENTED OUT (caused stack overflow): ' + $lines[$failIndex]
    $lines -join [Environment]::NewLine | Set-Content -LiteralPath $ProfileToTest -Encoding UTF8
    Write-Host '  Line commented out!' -ForegroundColor Green
  }
  '2' {
    $newLines = $lines[0..($failIndex - 1)] + $lines[($failIndex + 1)..($lines.Count - 1)]
    $newLines -join [Environment]::NewLine | Set-Content -LiteralPath $ProfileToTest -Encoding UTF8
    Write-Host '  Line deleted!' -ForegroundColor Green
  }
  '3' {
    Write-Host '  Profile not modified.' -ForegroundColor Gray
  }
}

Write-Host ''
Write-Host 'Diagnostic complete!' -ForegroundColor Green
Write-Host 'Restart VS Code and test.' -ForegroundColor Cyan
pause
