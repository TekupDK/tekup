# PowerShell script to fix common markdown linting issues

Write-Host "Fixing Markdown linting issues..." -ForegroundColor Cyan

$files = Get-ChildItem -Path . -Filter "*.md" -Recurse | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "\.git" -and
    $_.FullName -notmatch "dist" 
}

$fixedCount = 0
$totalFiles = $files.Count

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix 0: Remove trailing spaces
    $content = $content -replace ' +\n', '\n'
    
    # Fix 1: Remove excessive blank lines
    $content = $content -replace '\n\n\n+', '\n\n'
    
    # Fix 2: Add blank line before headings (but not multiple)
    $content = $content -replace '([^\n])\n(#{1,6} )', '$1\n\n$2'
    
    # Fix 3: Add blank line after headings
    $content = $content -replace '(#{1,6} .+)\n([^#\n-])', '$1\n\n$2'
    
    # Fix 4: Add blank lines around lists (numbered and bulleted)
    $content = $content -replace '([^\n])\n(\d+\. )', '$1\n\n$2'
    $content = $content -replace '([^\n])\n([-*+] )', '$1\n\n$2'
    
    # Fix 5: Add blank lines around fenced code blocks
    $content = $content -replace '([^\n])\n(```)', '$1\n\n$2'
    $content = $content -replace '(```)\n([^`\n])', '$1\n\n$2'
    
    # Fix 6: Add language to code blocks (default plaintext)
    $content = $content -replace '```\n(?!```)', '```plaintext\n'
    
    # Fix 7: Fix emphasis used as heading
    $content = $content -replace '^\*\*([^*]+)\*\*$', '#### $1'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $fixedCount++
        Write-Host "  Fixed" -ForegroundColor Green
    }
    else {
        Write-Host "  No changes" -ForegroundColor Gray
    }
}

Write-Host "`nFixed $fixedCount out of $totalFiles files" -ForegroundColor Cyan
Write-Host "Complete!" -ForegroundColor Green
