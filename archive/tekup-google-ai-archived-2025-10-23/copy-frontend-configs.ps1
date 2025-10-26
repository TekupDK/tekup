# Copy Frontend Config Files Script
# Kopierer alle frontend config filer til det nye repo

$frontendPath = "C:\Users\empir\renos-frontend"

Write-Host "`nKopierer frontend config filer..." -ForegroundColor Cyan

# Kopier config filer
Copy-Item "C:\Users\empir\Tekup Google AI\tailwind.config.frontend.js" "$frontendPath\tailwind.config.js" -Force
Write-Host "  Copied tailwind.config.js" -ForegroundColor Green

Copy-Item "C:\Users\empir\Tekup Google AI\vite.config.frontend.ts" "$frontendPath\vite.config.ts" -Force
Write-Host "  Copied vite.config.ts" -ForegroundColor Green

Copy-Item "C:\Users\empir\Tekup Google AI\.env.frontend.example" "$frontendPath\.env.example" -Force
Write-Host "  Copied .env.example" -ForegroundColor Green

Copy-Item "C:\Users\empir\Tekup Google AI\.env.frontend.example" "$frontendPath\.env" -Force
Write-Host "  Copied .env" -ForegroundColor Green

Copy-Item "C:\Users\empir\Tekup Google AI\README.frontend.md" "$frontendPath\README.md" -Force
Write-Host "  Copied README.md" -ForegroundColor Green

# Opret src/api folder og kopier example API client
New-Item -ItemType Directory -Path "$frontendPath\src\api" -Force | Out-Null
Copy-Item "C:\Users\empir\Tekup Google AI\api-client.example.ts" "$frontendPath\src\api\client.ts" -Force
Write-Host "  Copied src/api/client.ts" -ForegroundColor Green

Write-Host "`nConfig filer kopieret!" -ForegroundColor Green
