# Restart Comet (Perplexity) optimalt
# Lukker alle Comet processer og genåbner localhost:3000

Write-Host "🔄 Genstart Comet (Perplexity) for localhost:3000" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Tjek current status
$cometProcs = Get-Process comet -ErrorAction SilentlyContinue
$currentRAM = [math]::Round(($cometProcs | Measure-Object WorkingSet -Sum).Sum/1MB,2)

Write-Host "📊 Nuværende status:" -ForegroundColor Yellow
Write-Host "   Comet processer: $($cometProcs.Count)" -ForegroundColor White
Write-Host "   Total RAM: $currentRAM MB" -ForegroundColor White
Write-Host ""

# Gem localhost URL
$url = "http://localhost:3000"

# Bekræft handling
$confirm = Read-Host "Vil du genstarte Comet og genåbne $url? [Y/n]"

if ($confirm -ne "n") {
    Write-Host ""
    Write-Host "🔄 Lukker alle Comet processer..." -ForegroundColor Yellow
    
    # Luk alle Comet processer
    Stop-Process -Name comet -Force -ErrorAction SilentlyContinue
    
    Write-Host "   ✓ Comet lukket" -ForegroundColor Green
    
    # Vent lidt for at sikre alt er lukket
    Start-Sleep -Seconds 2
    
    # Åbn Comet igen med localhost
    Write-Host ""
    Write-Host "🚀 Åbner Comet med $url..." -ForegroundColor Yellow
    
    $cometPath = "C:\Users\empir\AppData\Local\Perplexity\Comet\Application\comet.exe"
    
    if (Test-Path $cometPath) {
        Start-Process $cometPath -ArgumentList $url
        Write-Host "   ✓ Comet startet" -ForegroundColor Green
        
        # Vent og tjek ny status
        Start-Sleep -Seconds 3
        
        $newProcs = Get-Process comet -ErrorAction SilentlyContinue
        $newRAM = [math]::Round(($newProcs | Measure-Object WorkingSet -Sum).Sum/1MB,2)
        
        Write-Host ""
        Write-Host "✅ Færdig!" -ForegroundColor Green
        Write-Host "   Nye processer: $($newProcs.Count)" -ForegroundColor White
        Write-Host "   Ny RAM: $newRAM MB" -ForegroundColor White
        Write-Host "   RAM sparet: $([math]::Round($currentRAM - $newRAM, 2)) MB" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Kunne ikke finde Comet executable" -ForegroundColor Red
        Write-Host "   Åbn Comet manuelt og naviger til $url" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ Genstart annulleret" -ForegroundColor Yellow
}

Write-Host ""
