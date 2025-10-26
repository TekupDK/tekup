# Fix all .js imports in TypeScript files
Get-ChildItem -Path "C:\Users\empir\Tekup-org\apps\tekup-lead-platform\src" -Recurse -Name "*.ts" | ForEach-Object {
    $filePath = "C:\Users\empir\Tekup-org\apps\tekup-lead-platform\src\$_"
    $content = Get-Content -Path $filePath -Raw
    $updatedContent = $content -replace "from '([^']+)\.js'", "from '$1'"
    $updatedContent = $updatedContent -replace 'from "([^"]+)\.js"', 'from "$1"'
    Set-Content -Path $filePath -Value $updatedContent -NoNewline
    Write-Host "Fixed: $_"
}
