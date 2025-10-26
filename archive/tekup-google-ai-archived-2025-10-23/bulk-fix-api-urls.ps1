#!/usr/bin/env pwsh
# Bulk Fix API URLs in Frontend Files
# Replaces hardcoded API URLs with centralized API_CONFIG

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🔧 Bulk Fixing API URLs in Frontend Files" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Files to fix with their old URL patterns
$filesToFix = @(
    @{ Path = "client\src\pages\Leads\Leads.tsx"; OldPattern = "const API_URL = import.meta.env.VITE_API_URL \|\| 'https://tekup-renos\.onrender\.com';" },
    @{ Path = "client\src\pages\Bookings\Bookings.tsx"; OldPattern = "const API_URL = import.meta.env.VITE_API_URL \|\| 'https://tekup-renos\.onrender\.com';" },
    @{ Path = "client\src\pages\Quotes\Quotes.tsx"; OldPattern = "const API_URL = import.meta.env.VITE_API_URL \|\| 'https://tekup-renos\.onrender\.com';" },
    @{ Path = "client\src\pages\Analytics\Analytics.tsx"; OldPattern = "const API_URL = import.meta.env.VITE_API_URL \|\| 'https://tekup-renos\.onrender\.com';" },
    @{ Path = "client\src\pages\CleaningPlans.tsx"; OldPattern = "const API_URL = import.meta.env.VITE_API_URL \|\| 'https://tekup-renos\.onrender\.com';" },
    @{ Path = "client\src\components\Customer360.tsx"; OldPattern = "const API_URL = import.meta.env.VITE_API_URL \|\| 'https://api\.renos\.dk';" },
    @{ Path = "client\src\components\TimeTracker.tsx"; OldPattern = "const API_URL = import.meta.env.VITE_API_URL \|\| 'https://tekup-renos\.onrender\.com';" },
    @{ Path = "client\src\components\EditPlanModal.tsx"; OldPattern = "const API_URL = import.meta.env.VITE_API_URL \|\| 'https://tekup-renos\.onrender\.com';" }
)

$fixed = 0
$failed = 0

foreach ($file in $filesToFix) {
    $filePath = Join-Path $PSScriptRoot $file.Path
    
    if (!(Test-Path $filePath)) {
        Write-Host "❌ File not found: $($file.Path)" -ForegroundColor Red
        $failed++
        continue
    }
    
    try {
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # Replace old API_URL pattern with API_CONFIG import
        $newContent = $content -replace $file.OldPattern, "// Removed: Using centralized API_CONFIG instead"
        
        # Add import if not already present
        if ($newContent -notmatch "import.*API_CONFIG.*from '@/config/api'") {
            $newContent = $newContent -replace "(import .* from 'react';)", "`$1`nimport { API_CONFIG } from '@/config/api';"
        }
        
        # Replace API_URL references with API_CONFIG.BASE_URL
        $newContent = $newContent -replace '\$\{API_URL\}', '${API_CONFIG.BASE_URL}'
        $newContent = $newContent -replace 'API_URL/', 'API_CONFIG.BASE_URL/'
        
        Set-Content $filePath -Value $newContent -Encoding UTF8 -NoNewline
        
        Write-Host "✅ Fixed: $($file.Path)" -ForegroundColor Green
        $fixed++
    }
    catch {
        Write-Host "❌ Error fixing $($file.Path): $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Fixed: $fixed files" -ForegroundColor Green
Write-Host "   ❌ Failed: $failed files" -ForegroundColor Red
Write-Host "`n💡 Next: Run 'npm run build' to verify changes" -ForegroundColor Yellow
