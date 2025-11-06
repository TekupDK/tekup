# Luk gamle Comet processer (behold nyeste)
# Finder og lukker zombie processer fra tidligere sessions

Write-Host "🧹 Ryd op i gamle Comet processer" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$allProcs = Get-Process comet -ErrorAction SilentlyContinue | 
    Select-Object Id, @{Name="RAM_MB";Expression={[math]::Round($_.WorkingSet/1MB,2)}}, StartTime |
    Sort-Object StartTime

if ($allProcs.Count -eq 0) {
    Write-Host "Ingen Comet processer fundet" -ForegroundColor Yellow
    exit
}

Write-Host "📊 Fandt $($allProcs.Count) Comet processer:" -ForegroundColor Yellow
Write-Host ""

# Grupper efter start tid
$groups = $allProcs | Group-Object {$_.StartTime.ToString("yyyy-MM-dd HH:mm")}

Write-Host "Sessions fundet:" -ForegroundColor White
foreach ($group in $groups) {
    $totalRAM = ($group.Group | Measure-Object RAM_MB -Sum).Sum
    Write-Host "   $($group.Name): $($group.Count) processer, $([math]::Round($totalRAM,2)) MB" -ForegroundColor White
}

Write-Host ""

# Find ældste session (sandsynligvis zombie processer)
$oldestSession = $groups | Sort-Object Name | Select-Object -First 1
$newestSession = $groups | Sort-Object Name | Select-Object -Last 1

if ($groups.Count -gt 1) {
    Write-Host "💡 Anbefaling:" -ForegroundColor Green
    Write-Host "   Ældste session ($($oldestSession.Name)): $($oldestSession.Count) processer" -ForegroundColor White
    Write-Host "   Nyeste session ($($newestSession.Name)): $($newestSession.Count) processer" -ForegroundColor White
    Write-Host ""
    
    $closeOld = Read-Host "Luk de ældste processer? [Y/n]"
    
    if ($closeOld -ne "n") {
        foreach ($proc in $oldestSession.Group) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Write-Host "   ✓ Lukket proces $($proc.Id) ($($proc.RAM_MB) MB)" -ForegroundColor Green
        }
        
        $saved = ($oldestSession.Group | Measure-Object RAM_MB -Sum).Sum
        Write-Host ""
        Write-Host "✅ Frigivet: $([math]::Round($saved,2)) MB RAM" -ForegroundColor Green
        
        # Vis ny status
        Start-Sleep -Seconds 1
        $remaining = Get-Process comet -ErrorAction SilentlyContinue
        $remainingRAM = [math]::Round(($remaining | Measure-Object WorkingSet -Sum).Sum/1MB,2)
        
        Write-Host "   Tilbage: $($remaining.Count) processer, $remainingRAM MB" -ForegroundColor White
    }
} else {
    Write-Host "✅ Alle processer er fra samme session - ingen zombie processer" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Hvis du vil spare RAM, kan du:" -ForegroundColor Yellow
    Write-Host "   1. Lukke andre tabs i Comet" -ForegroundColor White
    Write-Host "   2. Genstarte Comet (kør: .\scripts\restart-comet.ps1)" -ForegroundColor White
}

Write-Host ""
