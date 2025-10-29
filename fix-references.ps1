# Fix JonasAbde references to TekupDK
# Run this script from the Tekup root directory

$ErrorActionPreference = "Stop"

Write-Host "=== Fixing JonasAbde references to TekupDK ===" -ForegroundColor Cyan
Write-Host ""

# Files to update (excluding archive)
$files = Get-ChildItem -Path . -Filter "*.md" -Recurse -File |
    Where-Object { $_.FullName -notmatch '\\archive\\' -and $_.FullName -notmatch '\\node_modules\\' }

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content

    # Replace all JonasAbde variations
    $content = $content -replace 'github\.com/JonasAbde/', 'github.com/TekupDK/'
    $content = $content -replace '@JonasAbde', '@TekupDK'
    $content = $content -replace 'Owner: Jonas Abde \(@JonasAbde\)', 'Organization: TekupDK'
    $content = $content -replace 'Jonas Abde \(@JonasAbde\)', 'TekupDK'
    $content = $content -replace 'Contact @JonasAbde', 'Create GitHub issue'
    $content = $content -replace 'Maintained by: Jonas Abde', 'Maintained by: TekupDK'
    $content = $content -replace 'JonasAbde/', 'TekupDK/'

    # Check if any changes were made
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $changes = ($originalContent.Length - $content.Replace($originalContent, "").Length)
        Write-Host "✓ Updated: $($file.FullName)" -ForegroundColor Green
        $totalFiles++
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Files updated: $totalFiles" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review changes: git diff" -ForegroundColor White
Write-Host "2. Verify correctness" -ForegroundColor White
Write-Host "3. Commit changes with git" -ForegroundColor White
