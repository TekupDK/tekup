# Interactive Repository Sortering Script
# Hjælper med at kategorisere repositories: BEHOLD, ARKIVER, EKSTRAHER

param(
    [string]$AuditFile = "C:\Users\empir\Tekup-Cloud\audit-results\audit_2025-10-17_14-00-28.csv"
)

Write-Host @"

╔═══════════════════════════════════════════════════════╗
║  TEKUP PORTFOLIO - INTERAKTIV REPOSITORY SORTERING   ║
╚═══════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Indlæs audit data
if (-not (Test-Path $AuditFile)) {
    Write-Host "Audit fil ikke fundet: $AuditFile" -ForegroundColor Red
    Write-Host "Kør først: .\scripts\repo-audit-simple.ps1" -ForegroundColor Yellow
    exit 1
}

$repos = Import-Csv $AuditFile

Write-Host "Indlæst $($repos.Count) repositories fra audit.`n" -ForegroundColor Green

# Kategorier
$categories = @{
    KEEP = @{
        Name = "BEHOLD & UDVIKL AKTIVT"
        Color = "Green"
        Icon = "✅"
        Repos = @()
    }
    MAINTAIN = @{
        Name = "VEDLIGEHOLD (Support mode)"
        Color = "Cyan"
        Icon = "🔧"
        Repos = @()
    }
    EXTRACT = @{
        Name = "EKSTRAHER KOMPONENTER"
        Color = "Yellow"
        Icon = "📦"
        Repos = @()
    }
    ARCHIVE = @{
        Name = "ARKIVER (Read-only)"
        Color = "Gray"
        Icon = "📁"
        Repos = @()
    }
    DELETE = @{
        Name = "SLET PERMANENT"
        Color = "Red"
        Icon = "🗑️"
        Repos = @()
    }
}

# Vis menu funktion
function Show-RepoMenu($repo) {
    Clear-Host
    Write-Host "`n╔═══════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  REPOSITORY KATEGORISERING" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════╝`n" -ForegroundColor Cyan
    
    Write-Host "Repository: " -NoNewline -ForegroundColor White
    Write-Host $repo.Name -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Gray
    
    Write-Host "📊 STATISTIK:" -ForegroundColor Cyan
    Write-Host "  Path:        $($repo.Path)" -ForegroundColor Gray
    Write-Host "  Priority:    $($repo.Priority)" -ForegroundColor Gray
    Write-Host "  Status:      $($repo.Status)" -ForegroundColor Gray
    Write-Host "  Files:       $($repo.TotalFiles) files ($($repo.TotalSize) MB)" -ForegroundColor Gray
    Write-Host "  Commits 30d: $($repo.Commits30d)" -ForegroundColor Gray
    Write-Host "  Commits 7d:  $($repo.Commits7d)" -ForegroundColor Gray
    Write-Host "  Last:        $($repo.LastCommitDate)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "💻 TEKNOLOGI:" -ForegroundColor Cyan
    Write-Host "  Languages:   $($repo.Languages)" -ForegroundColor Gray
    Write-Host "  Frameworks:  $($repo.Frameworks)" -ForegroundColor Gray
    Write-Host "  Docker:      $($repo.HasDockerfile)" -ForegroundColor Gray
    Write-Host "  Prisma:      $($repo.HasPrisma)" -ForegroundColor Gray
    Write-Host ""
    
    # Aktivitets vurdering
    $activityStatus = if ($repo.Commits7d -gt 0) {
        Write-Host "🟢 AKTIV" -ForegroundColor Green -NoNewline
        " - Udvikling i gang"
    } elseif ($repo.Commits30d -eq 0) {
        Write-Host "🔴 STILLE" -ForegroundColor Red -NoNewline
        " - Ingen aktivitet 30+ dage"
    } else {
        Write-Host "🟡 IDLE" -ForegroundColor Yellow -NoNewline
        " - Sporadisk aktivitet"
    }
    Write-Host $activityStatus -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "═══════════════════════════════════════════════" -ForegroundColor Gray
    Write-Host "`nVÆLG KATEGORI:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [1] ✅ BEHOLD & UDVIKL AKTIVT" -ForegroundColor Green
    Write-Host "      → Production-ready eller aktiv udvikling"
    Write-Host ""
    Write-Host "  [2] 🔧 VEDLIGEHOLD (Support mode)" -ForegroundColor Cyan
    Write-Host "      → Stable, kun bug fixes og security updates"
    Write-Host ""
    Write-Host "  [3] 📦 EKSTRAHER KOMPONENTER" -ForegroundColor Yellow
    Write-Host "      → Hent værdifulde dele før arkivering"
    Write-Host ""
    Write-Host "  [4] 📁 ARKIVER (Read-only)" -ForegroundColor Gray
    Write-Host "      → Gem repository som reference"
    Write-Host ""
    Write-Host "  [5] 🗑️  SLET PERMANENT" -ForegroundColor Red
    Write-Host "      → Ingen værdi, slet lokalt og fra GitHub"
    Write-Host ""
    Write-Host "  [S] ⏭️  SKIP (beslut senere)" -ForegroundColor DarkGray
    Write-Host "  [Q] 🚪 QUIT" -ForegroundColor DarkGray
    Write-Host ""
}

# Hovedloop
$currentIndex = 0
$skipped = @()

while ($currentIndex -lt $repos.Count) {
    $repo = $repos[$currentIndex]
    
    Show-RepoMenu $repo
    
    $choice = Read-Host "Dit valg"
    
    switch ($choice.ToUpper()) {
        "1" { 
            $categories.KEEP.Repos += $repo
            Write-Host "`n✅ $($repo.Name) tilføjet til BEHOLD`n" -ForegroundColor Green
            $currentIndex++
            Start-Sleep -Milliseconds 800
        }
        "2" { 
            $categories.MAINTAIN.Repos += $repo
            Write-Host "`n🔧 $($repo.Name) tilføjet til VEDLIGEHOLD`n" -ForegroundColor Cyan
            $currentIndex++
            Start-Sleep -Milliseconds 800
        }
        "3" { 
            $categories.EXTRACT.Repos += $repo
            Write-Host "`n📦 $($repo.Name) tilføjet til EKSTRAHER`n" -ForegroundColor Yellow
            $currentIndex++
            Start-Sleep -Milliseconds 800
        }
        "4" { 
            $categories.ARCHIVE.Repos += $repo
            Write-Host "`n📁 $($repo.Name) tilføjet til ARKIVER`n" -ForegroundColor Gray
            $currentIndex++
            Start-Sleep -Milliseconds 800
        }
        "5" { 
            Write-Host "`nER DU SIKKER? Dette repository vil blive slettet permanent!" -ForegroundColor Red
            $confirm = Read-Host "Skriv 'DELETE' for at bekræfte"
            if ($confirm -eq "DELETE") {
                $categories.DELETE.Repos += $repo
                Write-Host "🗑️  $($repo.Name) markeret til SLETNING`n" -ForegroundColor Red
                $currentIndex++
                Start-Sleep -Milliseconds 800
            } else {
                Write-Host "Sletning annulleret`n" -ForegroundColor Yellow
            }
        }
        "S" { 
            $skipped += $repo
            Write-Host "`n⏭️  $($repo.Name) skipped`n" -ForegroundColor DarkGray
            $currentIndex++
            Start-Sleep -Milliseconds 500
        }
        "Q" { 
            Write-Host "`nAfbryder...`n" -ForegroundColor Yellow
            break
        }
        default {
            Write-Host "`nUgyldigt valg. Prøv igen.`n" -ForegroundColor Red
            Start-Sleep -Milliseconds 1000
        }
    }
}

# Vis resultat
Clear-Host
Write-Host @"

╔═══════════════════════════════════════════════════════╗
║           SORTERING KOMPLET - OVERSIGT                ║
╚═══════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

foreach ($catKey in $categories.Keys | Sort-Object) {
    $cat = $categories[$catKey]
    if ($cat.Repos.Count -gt 0) {
        Write-Host "`n$($cat.Icon) $($cat.Name) ($($cat.Repos.Count)):" -ForegroundColor $cat.Color
        foreach ($repo in $cat.Repos) {
            Write-Host "   • $($repo.Name)" -ForegroundColor Gray
        }
    }
}

if ($skipped.Count -gt 0) {
    Write-Host "`n⏭️  SKIPPED ($($skipped.Count)):" -ForegroundColor DarkGray
    foreach ($repo in $skipped) {
        Write-Host "   • $($repo.Name)" -ForegroundColor DarkGray
    }
}

# Gem resultat
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$outputPath = "C:\Users\empir\Tekup-Cloud\audit-results\sorting_result_$timestamp.json"

$result = @{
    GeneratedAt = Get-Date -Format "o"
    Categories = @{}
    Skipped = $skipped | Select-Object Name, Path, Priority, Status
}

foreach ($catKey in $categories.Keys) {
    $result.Categories[$catKey] = $categories[$catKey].Repos | Select-Object Name, Path, Priority, Status, Commits30d, Commits7d, TotalFiles, TotalSize
}

$result | ConvertTo-Json -Depth 10 | Set-Content $outputPath

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "`n📄 RESULTAT GEMT:" -ForegroundColor Yellow
Write-Host "   $outputPath" -ForegroundColor White

Write-Host "`n🎯 NÆSTE SKRIDT:" -ForegroundColor Yellow
Write-Host "   1. Review resultater i JSON filen" -ForegroundColor Gray
Write-Host "   2. Ekstraher komponenter fra EXTRACT kategori" -ForegroundColor Gray
Write-Host "   3. Arkiver repositories i ARCHIVE kategori" -ForegroundColor Gray
Write-Host "   4. Slet repositories i DELETE kategori (vær forsigtig!)" -ForegroundColor Gray
Write-Host ""
