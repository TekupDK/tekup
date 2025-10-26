# Monitor Ollama Model Downloads
# TekUp AI Assistant Project

Write-Host "🔄 Monitoring Ollama Model Downloads..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop monitoring`n" -ForegroundColor Yellow

$ollamaPath = "C:\Users\empir\AppData\Local\Programs\Ollama\ollama.exe"

# Expected models
$expectedModels = @{
    "qwen2.5-coder:14b-instruct-q4_K_M" = "~8GB"
    "llama3.3:8b-instruct-q5_K_M" = "~6GB"
    "mistral:7b-instruct-q4_K_M" = "~4GB"
}

while ($true) {
    Clear-Host
    Write-Host "======================================" -ForegroundColor Blue
    Write-Host "   OLLAMA MODEL DOWNLOAD STATUS" -ForegroundColor White
    Write-Host "======================================" -ForegroundColor Blue
    Write-Host "Time: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""
    
    # Get current models
    $output = & $ollamaPath list 2>&1
    $models = @()
    
    if ($output -match "NAME.*ID.*SIZE.*MODIFIED") {
        $lines = $output -split "`n" | Select-Object -Skip 1
        foreach ($line in $lines) {
            if ($line.Trim() -ne "") {
                $parts = $line -split '\s+' | Where-Object { $_ -ne "" }
                if ($parts.Count -ge 4) {
                    $models += @{
                        Name = $parts[0]
                        ID = $parts[1]
                        Size = $parts[2]
                        Modified = $parts[3..($parts.Count-1)] -join " "
                    }
                }
            }
        }
    }
    
    # Display download status
    foreach ($expectedModel in $expectedModels.Keys) {
        $downloaded = $models | Where-Object { $_.Name -eq $expectedModel }
        
        if ($downloaded) {
            Write-Host "✅ " -NoNewline -ForegroundColor Green
            Write-Host "$expectedModel" -NoNewline
            Write-Host " (Size: $($downloaded.Size))" -ForegroundColor Gray
        } else {
            Write-Host "⏳ " -NoNewline -ForegroundColor Yellow
            Write-Host "$expectedModel" -NoNewline
            Write-Host " (Expected: $($expectedModels[$expectedModel]))" -ForegroundColor Gray
            
            # Check if currently downloading
            $processes = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
            if ($processes) {
                Write-Host "   📥 Downloading..." -ForegroundColor Cyan
            }
        }
    }
    
    Write-Host ""
    Write-Host "Downloaded Models: $($models.Count) / $($expectedModels.Count)" -ForegroundColor White
    
    if ($models.Count -eq $expectedModels.Count) {
        Write-Host "`n🎉 All models downloaded successfully!" -ForegroundColor Green
        Write-Host "You can now proceed with Jan AI configuration." -ForegroundColor White
        break
    }
    
    # Check Ollama server status
    Write-Host "`nServer Status: " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -ErrorAction Stop
        Write-Host "✅ Running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Not responding" -ForegroundColor Red
    }
    
    # Wait before next check
    Start-Sleep -Seconds 10
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
