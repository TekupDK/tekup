# Remove ESLint dependencies from all workspace packages
# This script will process all package.json files in apps/ and packages/ folders

$packagesToProcess = @()

# Find all package.json files in apps and packages, excluding node_modules and .next folders
Get-ChildItem -Path "apps", "packages" -Name "package.json" -Recurse | 
    Where-Object { $_ -notlike "*node_modules*" -and $_ -notlike "*.next*" } |
    ForEach-Object { 
        if ($_ -like "apps/*") {
            $packagesToProcess += "apps/$_"
        } else {
            $packagesToProcess += "packages/$_"
        }
    }

Write-Host "Found $($packagesToProcess.Count) packages to process:"
$packagesToProcess | ForEach-Object { Write-Host "  $_" }

foreach ($packagePath in $packagesToProcess) {
    # Skip the eslint-config package as it should keep its ESLint dependencies
    if ($packagePath -eq "packages/eslint-config/package.json") {
        Write-Host "Skipping $packagePath (ESLint config package)"
        continue
    }

    Write-Host "`nProcessing $packagePath..."
    
    if (Test-Path $packagePath) {
        $content = Get-Content $packagePath -Raw
        $originalContent = $content
        
        # Remove ESLint-related dependencies from devDependencies
        $eslintDependencies = @(
            '"eslint":\s*"[^"]*",?\s*\n?',
            '"eslint-config[^"]*":\s*"[^"]*",?\s*\n?',
            '"eslint-plugin[^"]*":\s*"[^"]*",?\s*\n?',
            '"@eslint[^"]*":\s*"[^"]*",?\s*\n?',
            '"@typescript-eslint[^"]*":\s*"[^"]*",?\s*\n?',
            '"typescript-eslint":\s*"[^"]*",?\s*\n?'
        )
        
        foreach ($pattern in $eslintDependencies) {
            $content = $content -replace $pattern, ""
        }
        
        # Update lint scripts to use "eslint ."
        $content = $content -replace '"lint":\s*"next lint"', '"lint": "eslint ."'
        $content = $content -replace '"lint":\s*"eslint [^"]*"', '"lint": "eslint ."'
        $content = $content -replace '"lint:fix":\s*"eslint [^"]*"', '"lint:fix": "eslint . --fix"'
        
        # Clean up any trailing commas in devDependencies
        $content = $content -replace ',(\s*\n\s*})', '$1'
        
        if ($content -ne $originalContent) {
            Set-Content -Path $packagePath -Value $content -NoNewline
            Write-Host "  ✓ Updated $packagePath"
        } else {
            Write-Host "  - No changes needed for $packagePath"
        }
    } else {
        Write-Host "  ✗ File not found: $packagePath"
    }
}

Write-Host "`n✅ ESLint dependency removal completed!"
Write-Host "Next steps:"
Write-Host "1. Run 'pnpm install' to remove the unused ESLint packages"
Write-Host "2. Test linting with 'pnpm -r lint' to ensure root config works"
