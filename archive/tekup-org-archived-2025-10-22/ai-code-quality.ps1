# Tekup AI-Powered Code Quality Analyzer
# Advanced static analysis with AI-driven insights

param(
    [ValidateSet("analyze", "report", "fix", "continuous")]
    [string]$Mode = "analyze",
    [string]$TargetPath = ".",
    [switch]$IncludeTests,
    [switch]$GenerateReport,
    [int]$Threshold = 7  # Code quality threshold (1-10)
)

$script:AnalysisResults = @{
    StartTime = Get-Date
    Files = @()
    Issues = @()
    Metrics = @{
        TotalFiles = 0
        CodeLines = 0
        TestCoverage = 0
        QualityScore = 0
        SecurityIssues = 0
        PerformanceIssues = 0
        Maintainability = 0
    }
    Recommendations = @()
}

function Write-QualityLog {
    param($Message, $Color = "White", $Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss.fff"
    Write-Host "[$timestamp] [AI-Quality] [$Level] $Message" -ForegroundColor $Color
}

function Get-CodebaseStatistics {
    param($Path)
    
    Write-QualityLog "Analyzing codebase structure..." "Cyan" "ANALYZE"
    
    # Get all relevant code files
    $codeExtensions = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.ps1", "*.json", "*.md")
    $allFiles = @()
    
    foreach ($ext in $codeExtensions) {
        $files = Get-ChildItem -Path $Path -Recurse -Filter $ext -File | 
                 Where-Object { $_.FullName -notmatch "node_modules|\.git|dist|build" }
        $allFiles += $files
    }
    
    $stats = @{
        TotalFiles = $allFiles.Count
        TypeScript = ($allFiles | Where-Object { $_.Extension -match "\.tsx?$" }).Count
        JavaScript = ($allFiles | Where-Object { $_.Extension -match "\.jsx?$" }).Count
        PowerShell = ($allFiles | Where-Object { $_.Extension -eq ".ps1" }).Count
        Config = ($allFiles | Where-Object { $_.Extension -eq ".json" }).Count
        Documentation = ($allFiles | Where-Object { $_.Extension -eq ".md" }).Count
        TotalSizeKB = [math]::Round(($allFiles | Measure-Object Length -Sum).Sum / 1KB, 2)
    }
    
    $script:AnalysisResults.Metrics.TotalFiles = $stats.TotalFiles
    
    Write-QualityLog "Found $($stats.TotalFiles) code files ($($stats.TotalSizeKB) KB total)" "Green" "STATS"
    Write-QualityLog "  TypeScript: $($stats.TypeScript) files" "White"
    Write-QualityLog "  JavaScript: $($stats.JavaScript) files" "White"
    Write-QualityLog "  PowerShell: $($stats.PowerShell) files" "White"
    Write-QualityLog "  Config/JSON: $($stats.Config) files" "White"
    Write-QualityLog "  Documentation: $($stats.Documentation) files" "White"
    
    return $stats
}

function Invoke-AICodeAnalysis {
    param($Files)
    
    Write-QualityLog "Running AI-powered code analysis..." "Magenta" "AI"
    
    $issues = @()
    $totalLines = 0
    
    foreach ($file in $Files) {
        if ($file.Length -eq 0) { continue }  # Skip empty files
        
        try {
            $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
            if (-not $content) { continue }
            
            $lines = $content -split "`n"
            $totalLines += $lines.Count
            
            $fileAnalysis = @{
                File = $file.Name
                Path = $file.FullName
                Lines = $lines.Count
                Issues = @()
            }
            
            # AI Pattern Detection
            $patterns = Get-AICodePatterns -Content $content -Extension $file.Extension
            $fileAnalysis.Issues += $patterns
            $issues += $patterns
            
            # Complexity Analysis
            $complexity = Get-CodeComplexity -Content $content -Extension $file.Extension
            $fileAnalysis.Complexity = $complexity
            
            if ($complexity.Score -gt 8) {
                $issues += @{
                    Type = "Complexity"
                    Severity = "High" 
                    Message = "High complexity detected (Score: $($complexity.Score))"
                    File = $file.Name
                    Line = 0
                }
            }
            
            $script:AnalysisResults.Files += $fileAnalysis
            
        } catch {
            Write-QualityLog "Error analyzing $($file.Name): $($_.Exception.Message)" "Red" "ERROR"
        }
    }
    
    $script:AnalysisResults.Metrics.CodeLines = $totalLines
    $script:AnalysisResults.Issues = $issues
    
    Write-QualityLog "Analyzed $totalLines lines of code across $($Files.Count) files" "Green" "AI"
    Write-QualityLog "Found $($issues.Count) potential issues" "Yellow" "AI"
    
    return $issues
}

function Get-AICodePatterns {
    param($Content, $Extension)
    
    $patterns = @()
    
    # Common anti-patterns and code smells
    $antiPatterns = @{
        # Security patterns
        "console\.log\(" = @{Type="Security"; Severity="Medium"; Message="Console.log detected - potential information leakage"}
        "password.*=.*['\"]" = @{Type="Security"; Severity="High"; Message="Hardcoded password detected"}
        "api.*key.*=.*['\"]" = @{Type="Security"; Severity="High"; Message="Hardcoded API key detected"}
        
        # Performance patterns
        "for.*of.*forEach" = @{Type="Performance"; Severity="Medium"; Message="Nested loops detected - potential performance issue"}
        "setTimeout.*0" = @{Type="Performance"; Severity="Low"; Message="setTimeout with 0 delay - consider alternatives"}
        
        # Code quality patterns
        "any" = @{Type="Quality"; Severity="Medium"; Message="TypeScript 'any' type usage - consider specific typing"}
        "TODO|FIXME|HACK" = @{Type="Quality"; Severity="Low"; Message="TODO/FIXME comment found"}
        
        # Maintainability patterns
        "\.length\s*>\s*[5-9][0-9]" = @{Type="Maintainability"; Severity="Medium"; Message="Large data structure - consider refactoring"}
    }
    
    foreach ($pattern in $antiPatterns.Keys) {
        $matches = [regex]::Matches($Content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
            $lineNumber = ($Content.Substring(0, $match.Index) -split "`n").Count
            $patterns += @{
                Type = $antiPatterns[$pattern].Type
                Severity = $antiPatterns[$pattern].Severity
                Message = $antiPatterns[$pattern].Message
                Line = $lineNumber
                Pattern = $pattern
            }
        }
    }
    
    return $patterns
}

function Get-CodeComplexity {
    param($Content, $Extension)
    
    $complexity = @{
        Score = 1
        Functions = 0
        Conditions = 0
        Loops = 0
        Classes = 0
    }
    
    # Count complexity indicators
    $complexity.Functions = ([regex]::Matches($Content, "function\s+\w+|=>\s*{|\w+\s*:\s*function", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
    $complexity.Conditions = ([regex]::Matches($Content, "if\s*\(|else\s*if|switch\s*\(|\?\s*:|\|\||&&", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count  
    $complexity.Loops = ([regex]::Matches($Content, "for\s*\(|while\s*\(|forEach|map\s*\(", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
    $complexity.Classes = ([regex]::Matches($Content, "class\s+\w+|interface\s+\w+", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
    
    # Calculate complexity score (simplified McCabe-style)
    $complexity.Score = 1 + $complexity.Conditions + $complexity.Loops
    if ($complexity.Functions -gt 10) { $complexity.Score += 2 }
    if ($complexity.Classes -gt 5) { $complexity.Score += 1 }
    
    return $complexity
}

function Generate-AIRecommendations {
    param($Issues, $Stats)
    
    Write-QualityLog "Generating AI recommendations..." "Blue" "AI"
    
    $recommendations = @()
    
    # Security recommendations
    $securityIssues = $Issues | Where-Object { $_.Type -eq "Security" }
    if ($securityIssues.Count -gt 0) {
        $recommendations += "🔒 Security: Found $($securityIssues.Count) security issues. Consider implementing secure coding practices and using environment variables for sensitive data."
        $script:AnalysisResults.Metrics.SecurityIssues = $securityIssues.Count
    }
    
    # Performance recommendations  
    $performanceIssues = $Issues | Where-Object { $_.Type -eq "Performance" }
    if ($performanceIssues.Count -gt 0) {
        $recommendations += "⚡ Performance: Found $($performanceIssues.Count) performance issues. Consider code optimization and algorithmic improvements."
        $script:AnalysisResults.Metrics.PerformanceIssues = $performanceIssues.Count
    }
    
    # Code quality recommendations
    $qualityIssues = $Issues | Where-Object { $_.Type -eq "Quality" }
    if ($qualityIssues.Count -gt 0) {
        $recommendations += "📈 Quality: Found $($qualityIssues.Count) code quality issues. Improve type safety and remove technical debt."
    }
    
    # Architecture recommendations based on file count and structure
    if ($Stats.TotalFiles -gt 100) {
        $recommendations += "🏗️ Architecture: Large codebase detected. Consider modularization and microservice patterns."
    }
    
    if ($Stats.TypeScript -eq 0 -and $Stats.JavaScript -gt 20) {
        $recommendations += "🔧 Migration: Consider migrating JavaScript files to TypeScript for better type safety."
    }
    
    # Calculate overall quality score
    $totalIssues = $Issues.Count
    $criticalIssues = ($Issues | Where-Object { $_.Severity -eq "High" }).Count
    $qualityScore = [math]::Max(1, 10 - ($totalIssues * 0.1) - ($criticalIssues * 0.5))
    $script:AnalysisResults.Metrics.QualityScore = [math]::Round($qualityScore, 1)
    
    $script:AnalysisResults.Recommendations = $recommendations
    return $recommendations
}

function Show-QualityReport {
    param($Stats, $Issues, $Recommendations)
    
    Write-QualityLog "=== AI CODE QUALITY REPORT ===" "Blue"
    Write-QualityLog "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Cyan"
    Write-QualityLog "" "White"
    
    # Overall metrics
    Write-QualityLog "📊 CODEBASE METRICS" "Blue"
    Write-QualityLog "├─ Total Files: $($Stats.TotalFiles)" "White"
    Write-QualityLog "├─ Lines of Code: $($script:AnalysisResults.Metrics.CodeLines)" "White"
    Write-QualityLog "├─ Code Size: $($Stats.TotalSizeKB) KB" "White"
    Write-QualityLog "└─ Quality Score: $($script:AnalysisResults.Metrics.QualityScore)/10" -ForegroundColor $(if($script:AnalysisResults.Metrics.QualityScore -ge 7){"Green"}elseif($script:AnalysisResults.Metrics.QualityScore -ge 5){"Yellow"}else{"Red"})
    Write-QualityLog "" "White"
    
    # Issue breakdown
    $highIssues = ($Issues | Where-Object { $_.Severity -eq "High" }).Count
    $mediumIssues = ($Issues | Where-Object { $_.Severity -eq "Medium" }).Count
    $lowIssues = ($Issues | Where-Object { $_.Severity -eq "Low" }).Count
    
    Write-QualityLog "🚨 ISSUES DETECTED" "Red"
    Write-QualityLog "├─ High Priority: $highIssues" "Red"
    Write-QualityLog "├─ Medium Priority: $mediumIssues" "Yellow"
    Write-QualityLog "└─ Low Priority: $lowIssues" "Green"
    Write-QualityLog "" "White"
    
    # Top issues
    if ($Issues.Count -gt 0) {
        Write-QualityLog "🔍 TOP ISSUES" "Yellow"
        $topIssues = $Issues | Sort-Object @{Expression={if($_.Severity -eq "High"){3}elseif($_.Severity -eq "Medium"){2}else{1}}; Descending=$true} | Select-Object -First 5
        foreach ($issue in $topIssues) {
            $color = switch ($issue.Severity) { "High" { "Red" }; "Medium" { "Yellow" }; default { "White" } }
            Write-QualityLog "  [$($issue.Severity)] $($issue.Type): $($issue.Message)" $color
        }
        Write-QualityLog "" "White"
    }
    
    # AI Recommendations
    Write-QualityLog "🤖 AI RECOMMENDATIONS" "Magenta"
    foreach ($rec in $Recommendations) {
        Write-QualityLog "  $rec" "Cyan"
    }
    Write-QualityLog "" "White"
    
    # Final assessment
    if ($script:AnalysisResults.Metrics.QualityScore -ge $Threshold) {
        Write-QualityLog "✅ QUALITY ASSESSMENT: PASSED" "Green"
    } else {
        Write-QualityLog "❌ QUALITY ASSESSMENT: NEEDS IMPROVEMENT" "Red"
    }
}

function Export-QualityReport {
    if (-not $GenerateReport) { return }
    
    $reportDir = "ai-quality-reports"
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $reportFile = "$reportDir/quality-report-$timestamp.json"
    
    $report = @{
        GeneratedAt = Get-Date
        Analysis = $script:AnalysisResults
        Summary = @{
            QualityScore = $script:AnalysisResults.Metrics.QualityScore
            TotalIssues = $script:AnalysisResults.Issues.Count
            HighPriorityIssues = ($script:AnalysisResults.Issues | Where-Object { $_.Severity -eq "High" }).Count
            Passed = $script:AnalysisResults.Metrics.QualityScore -ge $Threshold
        }
    }
    
    $report | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportFile -Encoding UTF8
    Write-QualityLog "Quality report exported: $reportFile" "Green" "EXPORT"
}

# Main execution
Write-QualityLog "Starting AI Code Quality Analysis..." "Blue"
Write-QualityLog "Target: $TargetPath | Mode: $Mode | Threshold: $Threshold" "Cyan"

try {
    # Get codebase statistics
    $stats = Get-CodebaseStatistics -Path $TargetPath
    
    # Get files for analysis
    $codeExtensions = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.ps1")
    $filesToAnalyze = @()
    
    foreach ($ext in $codeExtensions) {
        $files = Get-ChildItem -Path $TargetPath -Recurse -Filter $ext -File | 
                 Where-Object { $_.FullName -notmatch "node_modules|\.git|dist|build" }
        $filesToAnalyze += $files
    }
    
    if ($filesToAnalyze.Count -eq 0) {
        Write-QualityLog "No code files found for analysis" "Yellow" "WARN"
        exit 0
    }
    
    # Run AI analysis
    $issues = Invoke-AICodeAnalysis -Files $filesToAnalyze
    
    # Generate recommendations
    $recommendations = Generate-AIRecommendations -Issues $issues -Stats $stats
    
    # Show report
    Show-QualityReport -Stats $stats -Issues $issues -Recommendations $recommendations
    
    # Export report if requested
    Export-QualityReport
    
    Write-QualityLog "AI Code Quality Analysis completed!" "Green"
    
} catch {
    Write-QualityLog "Analysis failed: $($_.Exception.Message)" "Red" "ERROR"
    exit 1
}