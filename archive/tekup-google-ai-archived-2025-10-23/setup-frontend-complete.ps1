# Complete Frontend Setup - All-in-One
# Dette script sætter alt op i én kommando

$frontendPath = "C:\Users\empir\renos-frontend"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RenOS Frontend Complete Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Set-Location $frontendPath

# 1. Opret Vite projekt
Write-Host "[1/7] Opretter Vite + React + TypeScript projekt..." -ForegroundColor Yellow
npm create vite@latest . -- --template react-ts --force

# 2. Installer dependencies
Write-Host "`n[2/7] Installerer dependencies..." -ForegroundColor Yellow
npm install

# 3. Installer Tailwind CSS
Write-Host "`n[3/7] Installerer Tailwind CSS..." -ForegroundColor Yellow
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Installer React Router
Write-Host "`n[4/7] Installerer React Router..." -ForegroundColor Yellow
npm install react-router-dom

# 5. Installer Data Fetching & State Management
Write-Host "`n[5/7] Installerer TanStack Query, Zustand, og Axios..." -ForegroundColor Yellow
npm install @tanstack/react-query axios zustand

# 6. Installer Dev Dependencies
Write-Host "`n[6/7] Installerer dev dependencies..." -ForegroundColor Yellow
npm install -D @types/node

# 7. Kopier config filer
Write-Host "`n[7/7] Kopierer config filer..." -ForegroundColor Yellow
Copy-Item "C:\Users\empir\Tekup Google AI\tailwind.config.frontend.js" ".\tailwind.config.js" -Force
Copy-Item "C:\Users\empir\Tekup Google AI\vite.config.frontend.ts" ".\vite.config.ts" -Force
Copy-Item "C:\Users\empir\Tekup Google AI\.env.frontend.example" ".\.env.example" -Force
Copy-Item "C:\Users\empir\Tekup Google AI\.env.frontend.example" ".\.env" -Force
Copy-Item "C:\Users\empir\Tekup Google AI\README.frontend.md" ".\README.md" -Force

# Opret src/api folder
New-Item -ItemType Directory -Path ".\src\api" -Force | Out-Null
Copy-Item "C:\Users\empir\Tekup Google AI\api-client.example.ts" ".\src\api\client.ts" -Force

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Frontend Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Installed:" -ForegroundColor Cyan
Write-Host "  - Vite + React 18 + TypeScript" -ForegroundColor White
Write-Host "  - Tailwind CSS (klar til brug)" -ForegroundColor White
Write-Host "  - React Router (navigation)" -ForegroundColor White
Write-Host "  - TanStack Query (data fetching)" -ForegroundColor White
Write-Host "  - Zustand (state management)" -ForegroundColor White
Write-Host "  - Axios (API client)" -ForegroundColor White

Write-Host "`nKlar til at kode!" -ForegroundColor Green
Write-Host "Start dev server: npm run dev" -ForegroundColor Yellow
Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
