# Complete Repository Audit Script
# Genererer komplet A-Z oversigt over alle Tekup repositories

param(
    [string]$OutputDir = "C:\Users\empir\Tekup-Cloud\audit-results",
    [switch]$IncludeFileContent = $false,
    [switch]$GenerateJSON = $true
)

$ErrorActionPreference = "Continue"

# Farver til output
function Write-Section($text) { Write-Host "`n=== $text ===" -ForegroundColor Cyan }
function Write-Success($text) { Write-Host "✓ $text" -ForegroundColor Green }
function Write-Info($text) { Write-Host "→ $text" -ForegroundColor Yellow }
function Write-Error($text) { Write-Host "✗ $text" -ForegroundColor Red }

# Repository liste
$repositories = @(
    @{ Name = "Tekup-Billy"; Path = "C:\Users\empir\Tekup-Billy"; Priority = "HIGH"; Status = "PRODUCTION" },
    @{ Name = "TekupVault"; Path = "C:\Users\empir\TekupVault"; Priority = "HIGH"; Status = "PRODUCTION" },
    @{ Name = "Tekup-Google-AI"; Path = "C:\Users\empir\Tekup Google AI"; Priority = "MEDIUM"; Status = "ACTIVE" },
    @{ Name = "Tekup-org"; Path = "C:\Users\empir\Tekup-org"; Priority = "LOW"; Status = "ARCHIVED" },
    @{ Name = "Agent-Orchestrator"; Path = "C:\Users\empir\Agent-Orchestrator"; Priority = "MEDIUM"; Status = "DEVELOPMENT" },
    @{ Name = "RendetaljeOS"; Path = "C:\Users\empir\RendetaljeOS"; Priority = "MEDIUM"; Status = "ACTIVE" },
    @{ Name = "Tekup-AI-Assistant"; Path = "C:\Users\empir\Tekup-AI-Assistant"; Priority = "LOW"; Status = "ARCHIVED" },
    @{ Name = "Tekup-Gmail-Automation"; Path = "C:\Users\empir\Tekup-Gmail-Automation"; Priority = "LOW"; Status = "DEVELOPMENT" },
    @{ Name = "Gmail-PDF-Auto"; Path = "C:\Users\empir\Gmail-PDF-Auto"; Priority = "LOW"; Status = "UNKNOWN" },
    @{ Name = "Gmail-PDF-Forwarder"; Path = "C:\Users\empir\Gmail-PDF-Forwarder"; Priority = "LOW"; Status = "UNKNOWN" }
)

# Opret output directory
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Master rapport objekt
$masterReport = @{
    GeneratedAt = Get-Date -Format "o"
    TotalRepositories = $repositories.Count
    Repositories = @()
}

Write-Section "STARTER KOMPLET REPOSITORY AUDIT"
Write-Info "Output: $OutputDir"
Write-Info "Repositories: $($repositories.Count)"

foreach ($repo in $repositories) {
    Write-Section "Analyserer: $($repo.Name)"
    
    $repoPath = $repo.Path
    $repoData = @{
        Name = $repo.Name
        Path = $repoPath
        Priority = $repo.Priority
        Status = $repo.Status
        Exists = $false
        Analysis = @{}
    }
    
    # Tjek om repo eksisterer
    if (-not (Test-Path $repoPath)) {
        Write-Error "Repository ikke fundet: $repoPath"
        $repoData.Analysis.Error = "Path not found"
        $masterReport.Repositories += $repoData
        continue
    }
    
    $repoData.Exists = $true
    Write-Success "Repository fundet"
    
    # Git analyse
    try {
        Push-Location $repoPath
        
        # Basic Git info
        Write-Info "Git analyse..."
        $gitBranch = git branch --show-current 2>$null
        $gitRemote = git remote get-url origin 2>$null
        $gitLastCommit = git log -1 --format="%H|%an|%ae|%at|%s" 2>$null
        
        if ($gitLastCommit) {
            $commitParts = $gitLastCommit -split '\|'
            $repoData.Analysis.Git = @{
                Branch = $gitBranch
                Remote = $gitRemote
                LastCommit = @{
                    Hash = $commitParts[0]
                    Author = $commitParts[1]
                    Email = $commitParts[2]
                    Timestamp = [DateTimeOffset]::FromUnixTimeSeconds([long]$commitParts[3]).DateTime
                    Message = $commitParts[4]
                }
            }
        }
        
        # Commit statistik (sidste 30 dage)
        $commitCount30d = (git log --since="30 days ago" --oneline 2>$null | Measure-Object).Count
        $commitCount7d = (git log --since="7 days ago" --oneline 2>$null | Measure-Object).Count
        $commitCount24h = (git log --since="24 hours ago" --oneline 2>$null | Measure-Object).Count
        
        $repoData.Analysis.Activity = @{
            Commits30Days = $commitCount30d
            Commits7Days = $commitCount7d
            Commits24Hours = $commitCount24h
            IsActive = $commitCount7d -gt 0
            IsStale = $commitCount30d -eq 0
        }
        
        # Contributors
        $contributors = git log --format="%an" | Sort-Object | Get-Unique
        $repoData.Analysis.Contributors = $contributors
        
        # Tags
        $tags = git tag | Measure-Object | Select-Object -ExpandProperty Count
        $repoData.Analysis.Tags = $tags
        
        Pop-Location
        Write-Success "Git analyse komplet"
        
    } catch {
        Write-Error "Git analyse fejlede: $_"
        $repoData.Analysis.GitError = $_.Exception.Message
    }
    
    # Fil statistik
    try {
        Write-Info "Fil analyse..."
        
        $allFiles = Get-ChildItem -Path $repoPath -Recurse -File -ErrorAction SilentlyContinue | 
            Where-Object { 
                $_.FullName -notmatch '\\node_modules\\' -and 
                $_.FullName -notmatch '\\\.git\\' -and
                $_.FullName -notmatch '\\dist\\' -and
                $_.FullName -notmatch '\\build\\' -and
                $_.FullName -notmatch '\\\.next\\' -and
                $_.FullName -notmatch '\\coverage\\'
            }
        
        $fileStats = $allFiles | Group-Object Extension | 
            Select-Object @{N='Extension';E={$_.Name}}, Count, @{N='TotalSize';E={($_.Group | Measure-Object Length -Sum).Sum}} |
            Sort-Object Count -Descending
        
        $repoData.Analysis.Files = @{
            Total = $allFiles.Count
            TotalSize = ($allFiles | Measure-Object Length -Sum).Sum
            ByExtension = $fileStats | Select-Object -First 20
        }
        
        Write-Success "Fil analyse komplet ($($allFiles.Count) filer)"
        
    } catch {
        Write-Error "Fil analyse fejlede: $_"
        $repoData.Analysis.FileError = $_.Exception.Message
    }
    
    # Teknologi detektion
    try {
        Write-Info "Teknologi detektion..."
        
        $techStack = @{
            Languages = @()
            Frameworks = @()
            Tools = @()
            PackageManagers = @()
        }
        
        # Package managers
        if (Test-Path "$repoPath\package.json") {
            $techStack.PackageManagers += "npm/pnpm"
            $packageJson = Get-Content "$repoPath\package.json" -Raw | ConvertFrom-Json
            
            # Framework detektion fra dependencies
            if ($packageJson.dependencies) {
                if ($packageJson.dependencies.'next') { $techStack.Frameworks += "Next.js" }
                if ($packageJson.dependencies.'react') { $techStack.Frameworks += "React" }
                if ($packageJson.dependencies.'vue') { $techStack.Frameworks += "Vue" }
                if ($packageJson.dependencies.'@nestjs/core') { $techStack.Frameworks += "NestJS" }
                if ($packageJson.dependencies.'express') { $techStack.Frameworks += "Express" }
                if ($packageJson.dependencies.'fastify') { $techStack.Frameworks += "Fastify" }
            }
            
            $repoData.Analysis.PackageJson = @{
                Name = $packageJson.name
                Version = $packageJson.version
                Dependencies = ($packageJson.dependencies | Get-Member -MemberType NoteProperty | Measure-Object).Count
                DevDependencies = ($packageJson.devDependencies | Get-Member -MemberType NoteProperty | Measure-Object).Count
            }
        }
        
        if (Test-Path "$repoPath\pnpm-workspace.yaml") { 
            $techStack.PackageManagers += "pnpm-workspace"
            $techStack.Tools += "Monorepo"
        }
        if (Test-Path "$repoPath\requirements.txt") { $techStack.PackageManagers += "pip" }
        if (Test-Path "$repoPath\Cargo.toml") { $techStack.PackageManagers += "cargo" }
        if (Test-Path "$repoPath\go.mod") { $techStack.PackageManagers += "go modules" }
        
        # Build tools
        if (Test-Path "$repoPath\turbo.json") { $techStack.Tools += "Turborepo" }
        if (Test-Path "$repoPath\Dockerfile") { $techStack.Tools += "Docker" }
        if (Test-Path "$repoPath\docker-compose.yml") { $techStack.Tools += "Docker Compose" }
        if (Test-Path "$repoPath\.github\workflows") { $techStack.Tools += "GitHub Actions" }
        if (Test-Path "$repoPath\render.yaml") { $techStack.Tools += "Render.com" }
        
        # Databases
        if (Test-Path "$repoPath\prisma\schema.prisma") { $techStack.Tools += "Prisma" }
        if (Test-Path "$repoPath\supabase") { $techStack.Tools += "Supabase" }
        
        # Language detektion fra file extensions
        $langMap = @{
            '.ts' = 'TypeScript'
            '.tsx' = 'TypeScript'
            '.js' = 'JavaScript'
            '.jsx' = 'JavaScript'
            '.py' = 'Python'
            '.rs' = 'Rust'
            '.go' = 'Go'
            '.java' = 'Java'
            '.cs' = 'C#'
            '.cpp' = 'C++'
            '.c' = 'C'
        }
        
        $detectedLangs = $fileStats | ForEach-Object {
            $ext = $_.Extension.ToLower()
            if ($langMap.ContainsKey($ext)) {
                @{ Language = $langMap[$ext]; Files = $_.Count }
            }
        } | Where-Object { $_ -ne $null }
        
        $techStack.Languages = $detectedLangs
        
        $repoData.Analysis.TechStack = $techStack
        Write-Success "Teknologi detektion komplet"
        
    } catch {
        Write-Error "Teknologi detektion fejlede: $_"
        $repoData.Analysis.TechError = $_.Exception.Message
    }
    
    # Code quality metrics
    try {
        Write-Info "Code quality analyse..."
        
        $codeFiles = $allFiles | Where-Object { 
            $_.Extension -match '\.(ts|tsx|js|jsx|py|rs|go)$' 
        }
        
        $totalLines = 0
        $totalCodeLines = 0
        $totalCommentLines = 0
        $totalBlankLines = 0
        
        foreach ($file in ($codeFiles | Select-Object -First 100)) {
            try {
                $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
                $totalLines += $content.Count
                
                foreach ($line in $content) {
                    if ([string]::IsNullOrWhiteSpace($line)) {
                        $totalBlankLines++
                    } elseif ($line -match '^\s*(//|#|\*|/\*)') {
                        $totalCommentLines++
                    } else {
                        $totalCodeLines++
                    }
                }
            } catch {
                # Skip files that can't be read
            }
        }
        
        $repoData.Analysis.CodeMetrics = @{
            TotalLines = $totalLines
            CodeLines = $totalCodeLines
            CommentLines = $totalCommentLines
            BlankLines = $totalBlankLines
            CommentRatio = if ($totalCodeLines -gt 0) { [math]::Round($totalCommentLines / $totalCodeLines * 100, 2) } else { 0 }
            FilesAnalyzed = [math]::Min(100, $codeFiles.Count)
            TotalCodeFiles = $codeFiles.Count
        }
        
        Write-Success "Code quality analyse komplet"
        
    } catch {
        Write-Error "Code quality analyse fejlede: $_"
    }
    
    # Documentation check
    try {
        Write-Info "Dokumentations check..."
        
        $docs = @{
            HasREADME = Test-Path "$repoPath\README.md"
            HasCHANGELOG = Test-Path "$repoPath\CHANGELOG.md"
            HasLICENSE = (Test-Path "$repoPath\LICENSE") -or (Test-Path "$repoPath\LICENSE.md")
            HasContributing = Test-Path "$repoPath\CONTRIBUTING.md"
            DocsFolder = Test-Path "$repoPath\docs"
            MarkdownFiles = (Get-ChildItem -Path $repoPath -Filter "*.md" -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
        }
        
        $repoData.Analysis.Documentation = $docs
        Write-Success "Dokumentations check komplet"
        
    } catch {
        Write-Error "Dokumentations check fejlede: $_"
    }
    
    # Gem individual rapport
    $repoReportPath = Join-Path $OutputDir "$($repo.Name)_$timestamp.json"
    $repoData | ConvertTo-Json -Depth 10 | Set-Content $repoReportPath
    Write-Success "Rapport gemt: $repoReportPath"
    
    $masterReport.Repositories += $repoData
}

# Gem master rapport
Write-Section "GEMMER MASTER RAPPORT"

$masterReportPath = Join-Path $OutputDir "MASTER_AUDIT_$timestamp.json"
$masterReport | ConvertTo-Json -Depth 15 | Set-Content $masterReportPath
Write-Success "Master rapport gemt: $masterReportPath"

# Generer Markdown rapport
$mdReport = @"
# Tekup Portfolio - Komplet Repository Audit
**Genereret:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Total Repositories:** $($repositories.Count)

---

## 📊 Executive Summary

"@

# Statistik per status
$byStatus = $masterReport.Repositories | Group-Object Status | 
    Select-Object @{N='Status';E={$_.Name}}, Count, @{N='Repos';E={($_.Group | Select-Object -ExpandProperty Name) -join ', '}}

$mdReport += "`n### Status Distribution`n`n"
$mdReport += "| Status | Count | Repositories |`n"
$mdReport += "|--------|-------|--------------|`n"
foreach ($status in $byStatus) {
    $mdReport += "| $($status.Status) | $($status.Count) | $($status.Repos) |`n"
}

# Aktivitet oversigt
$mdReport += "`n### Activity Overview (Last 30 Days)`n`n"
$mdReport += "| Repository | Priority | 30d | 7d | 24h | Status |`n"
$mdReport += "|------------|----------|-----|----|----|--------|`n"

foreach ($repo in $masterReport.Repositories | Sort-Object Priority, { $_.Analysis.Activity.Commits30Days } -Descending) {
    $activity = $repo.Analysis.Activity
    if ($activity) {
        $statusIcon = if ($activity.IsActive) { "🟢" } elseif ($activity.IsStale) { "🔴" } else { "🟡" }
        $mdReport += "| $($repo.Name) | $($repo.Priority) | $($activity.Commits30Days) | $($activity.Commits7Days) | $($activity.Commits24Hours) | $statusIcon |`n"
    }
}

# Repository detaljer
$mdReport += "`n---`n`n## 📁 Repository Details`n`n"

foreach ($repo in $masterReport.Repositories | Sort-Object Priority) {
    $mdReport += "`n### $($repo.Name)`n`n"
    $mdReport += "**Path:** ``$($repo.Path)```n"
    $mdReport += "**Priority:** $($repo.Priority) | **Status:** $($repo.Status)`n`n"
    
    if ($repo.Analysis.Git) {
        $git = $repo.Analysis.Git
        $mdReport += "**Git:**`n"
        $mdReport += "- Branch: ``$($git.Branch)```n"
        if ($git.LastCommit) {
            $mdReport += "- Last Commit: $($git.LastCommit.Timestamp.ToString('yyyy-MM-dd HH:mm'))`n"
            $mdReport += "- Message: $($git.LastCommit.Message)`n"
        }
    }
    
    if ($repo.Analysis.Files) {
        $files = $repo.Analysis.Files
        $sizeMB = [math]::Round($files.TotalSize / 1MB, 2)
        $mdReport += "`n**Files:** $($files.Total) files ($sizeMB MB)`n`n"
        
        if ($files.ByExtension) {
            $mdReport += "Top file types:`n"
            foreach ($ext in ($files.ByExtension | Select-Object -First 5)) {
                $extName = if ($ext.Extension) { $ext.Extension } else { "(no ext)" }
                $mdReport += "- ``$extName``: $($ext.Count) files`n"
            }
        }
    }
    
    if ($repo.Analysis.TechStack) {
        $tech = $repo.Analysis.TechStack
        $mdReport += "`n**Tech Stack:**`n"
        if ($tech.Languages) {
            $langs = ($tech.Languages | ForEach-Object { "$($_.Language) ($($_.Files))" }) -join ", "
            $mdReport += "- Languages: $langs`n"
        }
        if ($tech.Frameworks -and $tech.Frameworks.Count -gt 0) {
            $mdReport += "- Frameworks: $($tech.Frameworks -join ', ')`n"
        }
        if ($tech.Tools -and $tech.Tools.Count -gt 0) {
            $mdReport += "- Tools: $($tech.Tools -join ', ')`n"
        }
    }
    
    if ($repo.Analysis.CodeMetrics) {
        $code = $repo.Analysis.CodeMetrics
        $mdReport += "`n**Code Metrics:**`n"
        $mdReport += "- Total Lines: $($code.TotalLines)`n"
        $mdReport += "- Code: $($code.CodeLines) | Comments: $($code.CommentLines) | Blank: $($code.BlankLines)`n"
        $mdReport += "- Comment Ratio: $($code.CommentRatio)%`n"
    }
    
    $mdReport += "`n---`n"
}

# Gem Markdown rapport
$mdReportPath = Join-Path $OutputDir "MASTER_AUDIT_$timestamp.md"
$mdReport | Set-Content $mdReportPath
Write-Success "Markdown rapport gemt: $mdReportPath"

Write-Section "AUDIT KOMPLET"
Write-Success "Master JSON: $masterReportPath"
Write-Success "Master Markdown: $mdReportPath"
Write-Info "Individuelle rapporter: $OutputDir\*_$timestamp.json"

# Returner sti til reports
return @{
    MasterJSON = $masterReportPath
    MasterMarkdown = $mdReportPath
    OutputDir = $OutputDir
    Timestamp = $timestamp
}
