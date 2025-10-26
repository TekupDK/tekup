# CSS Development Tools Script
# Comprehensive toolkit for CSS bundle analysis, Tailwind purge testing, style extraction, and P3 color conversion

param(
  [string]$Action = "help",
  [string]$InputPath = "src/styles",
  [string]$OutputPath = "dist",
  [switch]$Verbose = $false,
  [switch]$Watch = $false,
  [string]$ConfigFile = "tailwind.config.ts"
)

# Color output function
function Write-ColorOutput {
  param([string]$Text, [string]$Color = "White")
  $colors = @{
    "Red"     = [System.ConsoleColor]::Red
    "Green"   = [System.ConsoleColor]::Green
    "Yellow"  = [System.ConsoleColor]::Yellow
    "Blue"    = [System.ConsoleColor]::Blue
    "Magenta" = [System.ConsoleColor]::Magenta
    "Cyan"    = [System.ConsoleColor]::Cyan
    "White"   = [System.ConsoleColor]::White
  }
  Write-Host $Text -ForegroundColor $colors[$Color]
}

function Show-Help {
  Write-ColorOutput "🛠️ CSS Development Tools Suite" "Cyan"
  Write-Host ""
  Write-ColorOutput "USAGE:" "Yellow"
  Write-Host "  .\css-tools.ps1 -Action <action> [OPTIONS]"
  Write-Host ""
  Write-ColorOutput "ACTIONS:" "Yellow"
  Write-Host "  analyze       - Analyze CSS bundle size and composition"
  Write-Host "  purge         - Test Tailwind CSS purge with different strategies"
  Write-Host "  extract       - Extract styles from HTML/JS files"
  Write-Host "  convert-p3    - Convert colors to P3 color space"
  Write-Host "  optimize      - Run comprehensive CSS optimization"
  Write-Host "  report        - Generate detailed CSS report"
  Write-Host "  watch         - Watch and auto-optimize CSS files"
  Write-Host ""
  Write-ColorOutput "OPTIONS:" "Yellow"
  Write-Host "  -InputPath <path>     Input directory (default: src/styles)"
  Write-Host "  -OutputPath <path>    Output directory (default: dist)"
  Write-Host "  -ConfigFile <file>    Tailwind config file (default: tailwind.config.ts)"
  Write-Host "  -Verbose              Enable detailed logging"
  Write-Host "  -Watch                Enable file watching mode"
  Write-Host ""
  Write-ColorOutput "EXAMPLES:" "Yellow"
  Write-Host "  .\css-tools.ps1 -Action analyze"
  Write-Host "  .\css-tools.ps1 -Action purge -Verbose"
  Write-Host "  .\css-tools.ps1 -Action convert-p3 -InputPath colors.css"
  Write-Host "  .\css-tools.ps1 -Action optimize -Watch"
  exit 0
}

function Test-Dependencies {
  Write-ColorOutput "🔍 Checking dependencies..." "Yellow"
    
  $dependencies = @(
    @{name = "Node.js"; command = "node"; args = "--version" },
    @{name = "npm"; command = "npm"; args = "--version" },
    @{name = "Tailwind CSS"; command = "npx"; args = "tailwindcss --help" }
  )
    
  $missing = @()
    
  foreach ($dep in $dependencies) {
    try {
      $null = & $dep.command $dep.args.Split(' ') 2>$null
      if ($Verbose) {
        Write-ColorOutput "  ✅ $($dep.name) is available" "Green"
      }
    }
    catch {
      $missing += $dep.name
      Write-ColorOutput "  ❌ $($dep.name) is missing" "Red"
    }
  }
    
  if ($missing.Count -gt 0) {
    Write-ColorOutput "Missing dependencies: $($missing -join ', ')" "Red"
    Write-ColorOutput "Please install the missing dependencies and try again." "Yellow"
    exit 1
  }
    
  Write-ColorOutput "✅ All dependencies are available" "Green"
}

function Get-CSSFileStats {
  param([string]$FilePath)
    
  if (-not (Test-Path $FilePath)) {
    return $null
  }
    
  $content = Get-Content $FilePath -Raw
  $size = (Get-Item $FilePath).Length
  $lines = ($content -split "`n").Count
  $rules = ([regex]::Matches($content, '\{[^}]*\}')).Count
  $selectors = ([regex]::Matches($content, '[^{]+\{')).Count
  $mediaQueries = ([regex]::Matches($content, '@media[^{]+\{')).Count
  $keyframes = ([regex]::Matches($content, '@keyframes[^{]+\{')).Count
    
  return @{
    Path         = $FilePath
    Size         = $size
    SizeKB       = [math]::Round($size / 1024, 2)
    Lines        = $lines
    Rules        = $rules
    Selectors    = $selectors
    MediaQueries = $mediaQueries
    Keyframes    = $keyframes
  }
}

function Invoke-CSSAnalysis {
  Write-ColorOutput "📊 Starting CSS Bundle Analysis..." "Cyan"
    
  # Find all CSS files
  $cssFiles = Get-ChildItem -Path $InputPath -Recurse -Filter "*.css" -ErrorAction SilentlyContinue
    
  if ($cssFiles.Count -eq 0) {
    Write-ColorOutput "❌ No CSS files found in $InputPath" "Red"
    return
  }
    
  Write-ColorOutput "Found $($cssFiles.Count) CSS files" "Blue"
    
  $totalStats = @{
    Files             = 0
    TotalSize         = 0
    TotalLines        = 0
    TotalRules        = 0
    TotalSelectors    = 0
    TotalMediaQueries = 0
    TotalKeyframes    = 0
  }
    
  $fileDetails = @()
    
  foreach ($file in $cssFiles) {
    $stats = Get-CSSFileStats -FilePath $file.FullName
    if ($stats) {
      $fileDetails += $stats
      $totalStats.Files++
      $totalStats.TotalSize += $stats.Size
      $totalStats.TotalLines += $stats.Lines
      $totalStats.TotalRules += $stats.Rules
      $totalStats.TotalSelectors += $stats.Selectors
      $totalStats.TotalMediaQueries += $stats.MediaQueries
      $totalStats.TotalKeyframes += $stats.Keyframes
            
      if ($Verbose) {
        Write-Host "  📄 $($file.Name): $($stats.SizeKB)KB, $($stats.Rules) rules"
      }
    }
  }
    
  # Generate report
  Write-Host ""
  Write-ColorOutput "📈 CSS Bundle Analysis Report" "Green"
  Write-Host "================================"
  Write-Host "Total Files: $($totalStats.Files)"
  Write-Host "Total Size: $([math]::Round($totalStats.TotalSize / 1024, 2)) KB"
  Write-Host "Total Lines: $($totalStats.TotalLines)"
  Write-Host "Total Rules: $($totalStats.TotalRules)"
  Write-Host "Total Selectors: $($totalStats.TotalSelectors)"
  Write-Host "Media Queries: $($totalStats.TotalMediaQueries)"
  Write-Host "Keyframes: $($totalStats.TotalKeyframes)"
  Write-Host ""
    
  # Largest files
  Write-ColorOutput "📋 Largest CSS Files:" "Yellow"
  $fileDetails | Sort-Object Size -Descending | Select-Object -First 5 | ForEach-Object {
    Write-Host "  $([System.IO.Path]::GetFileName($_.Path)): $($_.SizeKB) KB"
  }
    
  # Save detailed report
  $reportFile = Join-Path $OutputPath "css-analysis-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
  $reportData = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Summary   = $totalStats
    Files     = $fileDetails
  }
    
  New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
  $reportData | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportFile -Encoding UTF8
    
  Write-ColorOutput "📄 Detailed report saved to: $reportFile" "Green"
}

function Invoke-TailwindPurgeTest {
  Write-ColorOutput "🧹 Starting Tailwind CSS Purge Testing..." "Cyan"
    
  if (-not (Test-Path $ConfigFile)) {
    Write-ColorOutput "❌ Tailwind config file not found: $ConfigFile" "Red"
    return
  }
    
  # Test different purge strategies
  $strategies = @(
    @{name = "Conservative"; safelistPattern = ".*" },
    @{name = "Aggressive"; safelistPattern = "" },
    @{name = "Balanced"; safelistPattern = "hover:.*|focus:.*|active:.*" }
  )
    
  $results = @()
    
  foreach ($strategy in $strategies) {
    Write-ColorOutput "Testing $($strategy.name) purge strategy..." "Yellow"
        
    # Create temporary config
    $tempConfig = Join-Path $env:TEMP "tailwind-temp-$($strategy.name.ToLower()).config.js"
    $configContent = Get-Content $ConfigFile -Raw
        
    # Modify purge settings
    if ($strategy.safelistPattern) {
      $modifiedConfig = $configContent -replace 'safelist:\s*\[.*?\]', "safelist: [/$($strategy.safelistPattern)/]"
    }
    else {
      $modifiedConfig = $configContent -replace 'safelist:\s*\[.*?\]', "safelist: []"
    }
        
    $modifiedConfig | Out-File -FilePath $tempConfig -Encoding UTF8
        
    try {
      # Build with this strategy
      $outputFile = Join-Path $env:TEMP "output-$($strategy.name.ToLower()).css"
      $inputFile = Join-Path $InputPath "input.css"
            
      if (-not (Test-Path $inputFile)) {
        # Create a basic input file
        "@tailwind base;`n@tailwind components;`n@tailwind utilities;" | Out-File -FilePath $inputFile -Encoding UTF8
      }
            
      $buildResult = & npx tailwindcss -i $inputFile -o $outputFile -c $tempConfig --minify 2>&1
            
      if (Test-Path $outputFile) {
        $stats = Get-CSSFileStats -FilePath $outputFile
        $results += @{
          Strategy  = $strategy.name
          SizeKB    = $stats.SizeKB
          Rules     = $stats.Rules
          Selectors = $stats.Selectors
          Success   = $true
        }
                
        Write-ColorOutput "  ✅ $($strategy.name): $($stats.SizeKB) KB" "Green"
      }
      else {
        $results += @{
          Strategy = $strategy.name
          Error    = $buildResult
          Success  = $false
        }
        Write-ColorOutput "  ❌ $($strategy.name): Build failed" "Red"
      }
            
    }
    catch {
      Write-ColorOutput "  ❌ $($strategy.name): $($_.Exception.Message)" "Red"
    }
    finally {
      # Cleanup
      Remove-Item $tempConfig -ErrorAction SilentlyContinue
      Remove-Item $outputFile -ErrorAction SilentlyContinue
    }
  }
    
  # Report results
  Write-Host ""
  Write-ColorOutput "🧹 Tailwind Purge Test Results" "Green"
  Write-Host "==============================="
    
  $results | Where-Object Success | Sort-Object SizeKB | ForEach-Object {
    $reduction = if ($results[0].SizeKB -gt 0) { 
      [math]::Round((($results[0].SizeKB - $_.SizeKB) / $results[0].SizeKB) * 100, 1)
    }
    else { 0 }
        
    Write-Host "$($_.Strategy): $($_.SizeKB) KB ($reduction% reduction)"
  }
    
  # Save results
  $purgeReportFile = Join-Path $OutputPath "tailwind-purge-test-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
  New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
  $results | ConvertTo-Json -Depth 2 | Out-File -FilePath $purgeReportFile -Encoding UTF8
    
  Write-ColorOutput "📄 Purge test results saved to: $purgeReportFile" "Green"
}

function Invoke-StyleExtraction {
  Write-ColorOutput "🔍 Starting Style Extraction..." "Cyan"
    
  # Find HTML and JS files
  $sourceFiles = @()
  $sourceFiles += Get-ChildItem -Path "src" -Recurse -Include "*.html", "*.js", "*.jsx", "*.ts", "*.tsx", "*.vue" -ErrorAction SilentlyContinue
    
  if ($sourceFiles.Count -eq 0) {
    Write-ColorOutput "❌ No source files found for style extraction" "Red"
    return
  }
    
  Write-ColorOutput "Found $($sourceFiles.Count) source files" "Blue"
    
  $extractedStyles = @()
  $classPattern = 'class(?:Name)?=["\'`]([^"\'`]*?)["\'`]'
    
    foreach ($file in $sourceFiles) {
      $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
      if ($content) {
        $matches = [regex]::Matches($content, $classPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($match in $matches) {
          $classes = $match.Groups[1].Value -split '\s+' | Where-Object { $_ -ne '' }
          foreach ($class in $classes) {
            $extractedStyles += @{
              File  = $file.Name
              Class = $class
              Line  = ($content.Substring(0, $match.Index) -split "`n").Count
            }
          }
        }
      }
    }
    
    # Analyze extracted styles
    $uniqueClasses = $extractedStyles | Group-Object Class | Sort-Object Count -Descending
    
    Write-Host ""
    Write-ColorOutput "📊 Style Extraction Results" "Green"
    Write-Host "============================"
    Write-Host "Total class usages: $($extractedStyles.Count)"
    Write-Host "Unique classes: $($uniqueClasses.Count)"
    Write-Host ""
    
    Write-ColorOutput "🏆 Most used classes:" "Yellow"
    $uniqueClasses | Select-Object -First 10 | ForEach-Object {
      Write-Host "  $($_.Name): $($_.Count) usages"
    }
    
    # Categorize classes
    $categories = @{
      "Tailwind Layout"     = @()
      "Tailwind Colors"     = @()
      "Tailwind Typography" = @()
      "Custom Classes"      = @()
      "Component Classes"   = @()
    }
    
    foreach ($class in $uniqueClasses) {
      $className = $class.Name
      if ($className -match '^(flex|grid|block|inline|hidden|relative|absolute|fixed)') {
        $categories["Tailwind Layout"] += $className
      }
      elseif ($className -match '^(bg-|text-|border-)') {
        $categories["Tailwind Colors"] += $className
      }
      elseif ($className -match '^(text-|font-|leading-|tracking-)') {
        $categories["Tailwind Typography"] += $className
      }
      elseif ($className -match '^[a-z]+(-[a-z]+)*$') {
        $categories["Component Classes"] += $className
      }
      else {
        $categories["Custom Classes"] += $className
      }
    }
    
    Write-Host ""
    Write-ColorOutput "📂 Class Categories:" "Yellow"
    foreach ($category in $categories.Keys) {
      $count = $categories[$category].Count
      if ($count -gt 0) {
        Write-Host "  $category: $count classes"
      }
    }
    
    # Save extraction report
    $extractionReport = @{
      Timestamp     = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
      SourceFiles   = $sourceFiles.Count
      TotalUsages   = $extractedStyles.Count
      UniqueClasses = $uniqueClasses.Count
      Categories    = $categories
      TopClasses    = $uniqueClasses | Select-Object -First 20 | ForEach-Object { @{Class = $_.Name; Count = $_.Count } }
      AllStyles     = $extractedStyles
    }
    
    $extractionReportFile = Join-Path $OutputPath "style-extraction-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    $extractionReport | ConvertTo-Json -Depth 3 | Out-File -FilePath $extractionReportFile -Encoding UTF8
    
    Write-ColorOutput "📄 Style extraction report saved to: $extractionReportFile" "Green"
  }

  function Invoke-P3ColorConversion {
    Write-ColorOutput "🌈 Starting P3 Color Conversion..." "Cyan"
    
    # Find CSS files with colors
    $cssFiles = Get-ChildItem -Path $InputPath -Recurse -Filter "*.css" -ErrorAction SilentlyContinue
    
    if ($cssFiles.Count -eq 0) {
      Write-ColorOutput "❌ No CSS files found in $InputPath" "Red"
      return
    }
    
    $colorPattern = '#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)'
    $conversions = @()
    
    foreach ($file in $cssFiles) {
      $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
      if ($content) {
        $matches = [regex]::Matches($content, $colorPattern)
        foreach ($match in $matches) {
          $originalColor = $match.Value
          $p3Color = Convert-ColorToP3 -Color $originalColor
                
          if ($p3Color) {
            $conversions += @{
              File     = $file.Name
              Original = $originalColor
              P3       = $p3Color
            }
          }
        }
      }
    }
    
    if ($conversions.Count -eq 0) {
      Write-ColorOutput "❌ No convertible colors found" "Yellow"
      return
    }
    
    Write-Host ""
    Write-ColorOutput "🎨 P3 Color Conversion Results" "Green"
    Write-Host "==============================="
    Write-Host "Colors converted: $($conversions.Count)"
    Write-Host ""
    
    # Show some examples
    Write-ColorOutput "💡 Conversion Examples:" "Yellow"
    $conversions | Select-Object -First 5 | ForEach-Object {
      Write-Host "  $($_.Original) → $($_.P3)"
    }
    
    # Generate P3 CSS file
    $p3CssFile = Join-Path $OutputPath "p3-colors-$(Get-Date -Format 'yyyyMMdd-HHmmss').css"
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    
    $p3Content = "/* P3 Color Space CSS - Generated $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') */`n`n"
    $p3Content += "@supports (color: color(display-p3 1 0 0)) {`n"
    $p3Content += "  /* P3 colors will be used on compatible displays */`n`n"
    
    $conversions | Group-Object Original | ForEach-Object {
      $original = $_.Name
      $p3 = $_.Group[0].P3
      $safeName = ($original -replace '[^a-zA-Z0-9]', '-').Trim('-')
      $p3Content += "  .color-$safeName { color: $p3; }`n"
      $p3Content += "  .bg-color-$safeName { background-color: $p3; }`n"
      $p3Content += "  .border-color-$safeName { border-color: $p3; }`n`n"
    }
    
    $p3Content += "}`n`n"
    $p3Content += "/* Fallback colors for non-P3 displays */`n"
    
    $conversions | Group-Object Original | ForEach-Object {
      $original = $_.Name
      $safeName = ($original -replace '[^a-zA-Z0-9]', '-').Trim('-')
      $p3Content += ".color-$safeName { color: $original; }`n"
      $p3Content += ".bg-color-$safeName { background-color: $original; }`n"
      $p3Content += ".border-color-$safeName { border-color: $original; }`n`n"
    }
    
    $p3Content | Out-File -FilePath $p3CssFile -Encoding UTF8
    
    # Save conversion report
    $conversionReport = @{
      Timestamp       = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
      FilesProcessed  = $cssFiles.Count
      ColorsConverted = $conversions.Count
      P3CSSFile       = $p3CssFile
      Conversions     = $conversions
    }
    
    $conversionReportFile = Join-Path $OutputPath "p3-conversion-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $conversionReport | ConvertTo-Json -Depth 3 | Out-File -FilePath $conversionReportFile -Encoding UTF8
    
    Write-ColorOutput "📄 P3 CSS file created: $p3CssFile" "Green"
    Write-ColorOutput "📄 Conversion report saved to: $conversionReportFile" "Green"
  }

  function Convert-ColorToP3 {
    param([string]$Color)
    
    # Simple hex to P3 conversion (approximation)
    if ($Color -match '^#([0-9a-fA-F]{6})$') {
      $hex = $matches[1]
      $r = [Convert]::ToInt32($hex.Substring(0, 2), 16) / 255.0
      $g = [Convert]::ToInt32($hex.Substring(2, 2), 16) / 255.0
      $b = [Convert]::ToInt32($hex.Substring(4, 2), 16) / 255.0
        
      return "color(display-p3 $([math]::Round($r, 3)) $([math]::Round($g, 3)) $([math]::Round($b, 3)))"
    }
    
    # Simple 3-digit hex
    if ($Color -match '^#([0-9a-fA-F]{3})$') {
      $hex = $matches[1]
      $r = [Convert]::ToInt32($hex.Substring(0, 1) + $hex.Substring(0, 1), 16) / 255.0
      $g = [Convert]::ToInt32($hex.Substring(1, 1) + $hex.Substring(1, 1), 16) / 255.0
      $b = [Convert]::ToInt32($hex.Substring(2, 1) + $hex.Substring(2, 1), 16) / 255.0
        
      return "color(display-p3 $([math]::Round($r, 3)) $([math]::Round($g, 3)) $([math]::Round($b, 3)))"
    }
    
    return $null
  }

  # Main execution
  if ($Action -eq "help") {
    Show-Help
  }

  Write-ColorOutput "🛠️ CSS Development Tools" "Cyan"
  Write-Host ""

  Test-Dependencies

  switch ($Action.ToLower()) {
    "analyze" { Invoke-CSSAnalysis }
    "purge" { Invoke-TailwindPurgeTest }
    "extract" { Invoke-StyleExtraction }
    "convert-p3" { Invoke-P3ColorConversion }
    "optimize" {
      Invoke-CSSAnalysis
      Invoke-TailwindPurgeTest
      Invoke-StyleExtraction
    }
    "report" {
      Invoke-CSSAnalysis
      Invoke-StyleExtraction
      Invoke-P3ColorConversion
    }
    default {
      Write-ColorOutput "❌ Unknown action: $Action" "Red"
      Write-ColorOutput "Use -Action help to see available actions" "Yellow"
      exit 1
    }
  }

  Write-Host ""
  Write-ColorOutput "✅ CSS Tools operation completed!" "Green"