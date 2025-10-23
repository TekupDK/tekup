# Simple Repository Audit Script
# Komplet A-Z oversigt over alle Tekup repositories

param(
    [string]$OutputDir = "C:\Users\empir\Tekup-Cloud\audit-results"
)

$ErrorActionPreference = "Continue"

# Funktioner
function Write-Section($text) { Write-Host "`n=== $text ===" -ForegroundColor Cyan }
function Write-Success($text) { Write-Host "OK $text" -ForegroundColor Green }
function Write-Info($text) { Write-Host "->  $text" -ForegroundColor Yellow }

# Repository liste
$repositories = @(
    @{ Name = "Tekup-Billy"; Path = "C:\Users\empir\Tekup-Billy"; Priority = "HIGH"; Status = "PRODUCTION" }
    @{ Name = "TekupVault"; Path = "C:\Users\empir\TekupVault"; Priority = "HIGH"; Status = "PRODUCTION" }
    @{ Name = "Tekup-Google-AI"; Path = "C:\Users\empir\Tekup Google AI"; Priority = "MEDIUM"; Status = "ACTIVE" }
    @{ Name = "Tekup-org"; Path = "C:\Users\empir\Tekup-org"; Priority = "LOW"; Status = "ARCHIVED" }
    @{ Name = "Agent-Orchestrator"; Path = "C:\Users\empir\Agent-Orchestrator"; Priority = "MEDIUM"; Status = "DEVELOPMENT" }
    @{ Name = "RendetaljeOS"; Path = "C:\Users\empir\RendetaljeOS"; Priority = "MEDIUM"; Status = "ACTIVE" }
    @{ Name = "Tekup-AI-Assistant"; Path = "C:\Users\empir\Tekup-AI-Assistant"; Priority = "LOW"; Status = "ARCHIVED" }
    @{ Name = "Tekup-Gmail-Automation"; Path = "C:\Users\empir\Tekup-Gmail-Automation"; Priority = "LOW"; Status = "DEVELOPMENT" }
)

# Opret output directory
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

Write-Section "STARTER REPOSITORY AUDIT"
Write-Info "Output: $OutputDir"

$allResults = @()

foreach ($repo in $repositories) {
    Write-Section "Analyserer: $($repo.Name)"
    
    $repoPath = $repo.Path
    $result = [PSCustomObject]@{
        Name = $repo.Name
        Path = $repoPath
        Priority = $repo.Priority
        Status = $repo.Status
        Exists = Test-Path $repoPath
        GitBranch = ""
        LastCommit = ""
        LastCommitDate = ""
        Commits30d = 0
        Commits7d = 0
        Commits24h = 0
        TotalFiles = 0
        TotalSize = 0
        HasPackageJson = $false
        HasDockerfile = $false
        HasPrisma = $false
        HasREADME = $false
        Languages = ""
        Frameworks = ""
    }
    
    if (-not $result.Exists) {
        Write-Info "Repository ikke fundet"
        $allResults += $result
        continue
    }
    
    Write-Success "Repository fundet"
    
    # Git info
    try {
        Push-Location $repoPath
        
        $result.GitBranch = git branch --show-current 2>$null
        $lastCommit = git log -1 --format="%h %s" 2>$null
        $result.LastCommit = $lastCommit
        $lastDate = git log -1 --format="%at" 2>$null
        if ($lastDate) {
            $result.LastCommitDate = [DateTimeOffset]::FromUnixTimeSeconds([long]$lastDate).DateTime.ToString("yyyy-MM-dd HH:mm")
        }
        
        $result.Commits30d = (git log --since="30 days ago" --oneline 2>$null | Measure-Object).Count
        $result.Commits7d = (git log --since="7 days ago" --oneline 2>$null | Measure-Object).Count
        $result.Commits24h = (git log --since="24 hours ago" --oneline 2>$null | Measure-Object).Count
        
        Pop-Location
        Write-Success "Git info hentet"
    } catch {
        Write-Info "Git info fejlede"
    }
    
    # Fil statistik
    try {
        $files = Get-ChildItem -Path $repoPath -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { 
                $_.FullName -notlike "*\node_modules\*" -and 
                $_.FullName -notlike "*\.git\*" -and
                $_.FullName -notlike "*\dist\*" -and
                $_.FullName -notlike "*\build\*"
            }
        
        $result.TotalFiles = $files.Count
        $totalBytes = ($files | Measure-Object -Property Length -Sum).Sum
        $result.TotalSize = [math]::Round($totalBytes / 1MB, 2)
        
        Write-Success "Fil statistik ($($files.Count) filer, $($result.TotalSize) MB)"
    } catch {
        Write-Info "Fil statistik fejlede"
    }
    
    # Teknologi check
    $result.HasPackageJson = Test-Path "$repoPath\package.json"
    $result.HasDockerfile = Test-Path "$repoPath\Dockerfile"
    $result.HasPrisma = Test-Path "$repoPath\prisma\schema.prisma"
    $result.HasREADME = Test-Path "$repoPath\README.md"
    
    # Package.json analyse
    if ($result.HasPackageJson) {
        try {
            $pkg = Get-Content "$repoPath\package.json" -Raw | ConvertFrom-Json
            $frameworks = @()
            
            if ($pkg.dependencies) {
                if ($pkg.dependencies.next) { $frameworks += "Next.js" }
                if ($pkg.dependencies.react) { $frameworks += "React" }
                if ($pkg.dependencies.'@nestjs/core') { $frameworks += "NestJS" }
                if ($pkg.dependencies.express) { $frameworks += "Express" }
            }
            
            $result.Frameworks = $frameworks -join ", "
            Write-Success "Package.json analyseret"
        } catch {
            Write-Info "Package.json parsing fejlede"
        }
    }
    
    # Language detektion
    $langFiles = @()
    if ($files) {
        $tsFiles = ($files | Where-Object { $_.Extension -eq ".ts" -or $_.Extension -eq ".tsx" }).Count
        $jsFiles = ($files | Where-Object { $_.Extension -eq ".js" -or $_.Extension -eq ".jsx" }).Count
        $pyFiles = ($files | Where-Object { $_.Extension -eq ".py" }).Count
        
        if ($tsFiles -gt 0) { $langFiles += "TypeScript ($tsFiles)" }
        if ($jsFiles -gt 0) { $langFiles += "JavaScript ($jsFiles)" }
        if ($pyFiles -gt 0) { $langFiles += "Python ($pyFiles)" }
        
        $result.Languages = $langFiles -join ", "
    }
    
    $allResults += $result
    Write-Success "Analyse komplet"
}

# Gem CSV
Write-Section "GEMMER RESULTATER"

$csvPath = Join-Path $OutputDir "audit_$timestamp.csv"
$allResults | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
Write-Success "CSV gemt: $csvPath"

# Generer Markdown rapport
$mdPath = Join-Path $OutputDir "audit_$timestamp.md"

$md = @"
# Tekup Portfolio - Repository Audit
**Genereret:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Total Repositories:** $($repositories.Count)

---

## Aktivitet Oversigt

| Repository | Priority | Status | 30d | 7d | 24h | Aktivitet |
|------------|----------|--------|-----|----|----|-----------|

"@

foreach ($r in $allResults | Sort-Object Priority, Commits30d -Descending) {
    $activity = if ($r.Commits7d -gt 0) { "ACTIVE" } elseif ($r.Commits30d -eq 0) { "STALE" } else { "IDLE" }
    $md += "| $($r.Name) | $($r.Priority) | $($r.Status) | $($r.Commits30d) | $($r.Commits7d) | $($r.Commits24h) | $activity |`n"
}

$md += @"

---

## Repository Detaljer

"@

foreach ($r in $allResults | Sort-Object Priority) {
    $md += @"

### $($r.Name)

**Path:** ``$($r.Path)``  
**Priority:** $($r.Priority) | **Status:** $($r.Status) | **Exists:** $($r.Exists)

**Git:**
- Branch: $($r.GitBranch)
- Last Commit: $($r.LastCommitDate)
- Message: $($r.LastCommit)

**Files:** $($r.TotalFiles) files ($($r.TotalSize) MB)

**Tech Stack:**
- Languages: $($r.Languages)
- Frameworks: $($r.Frameworks)
- Package.json: $($r.HasPackageJson)
- Docker: $($r.HasDockerfile)
- Prisma: $($r.HasPrisma)
- README: $($r.HasREADME)

---

"@
}

$md | Set-Content $mdPath -Encoding UTF8
Write-Success "Markdown gemt: $mdPath"

# Vis console summary
Write-Section "AUDIT SUMMARY"

Write-Host "`nAKTIVE PROJEKTER (commits sidste 7 dage):" -ForegroundColor Green
$allResults | Where-Object { $_.Commits7d -gt 0 } | ForEach-Object {
    Write-Host "  + $($_.Name): $($_.Commits7d) commits" -ForegroundColor Green
}

Write-Host "`nSTILLE PROJEKTER (ingen commits 30 dage):" -ForegroundColor Red
$allResults | Where-Object { $_.Commits30d -eq 0 } | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Red
}

Write-Host "`nFILER:" -ForegroundColor Cyan
Write-Host "  CSV: $csvPath" -ForegroundColor White
Write-Host "  Markdown: $mdPath" -ForegroundColor White

Write-Host "`nKLAR TIL SORTERING!" -ForegroundColor Yellow
Write-Host "Åbn CSV i Excel eller Markdown i VS Code for komplet overblik.`n" -ForegroundColor Gray
