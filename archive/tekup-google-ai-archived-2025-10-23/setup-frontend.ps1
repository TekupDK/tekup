# Frontend Setup Script
# Installerer moderne stack uden at oprette pages/komponenter

$frontendPath = "C:\Users\empir\renos-frontend"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RenOS Frontend Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Set-Location $frontendPath

# 1. Opret Vite projekt
Write-Host "[1/6] Opretter Vite + React + TypeScript projekt..." -ForegroundColor Yellow
npm create vite@latest . -- --template react-ts --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Vite setup failed" -ForegroundColor Red
    exit 1
}
Write-Host "  SUCCESS: Vite projekt oprettet" -ForegroundColor Green

# 2. Installer dependencies
Write-Host "`n[2/6] Installerer dependencies..." -ForegroundColor Yellow
npm install
Write-Host "  SUCCESS: Dependencies installeret" -ForegroundColor Green

# 3. Installer Tailwind CSS
Write-Host "`n[3/6] Installerer Tailwind CSS..." -ForegroundColor Yellow
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
Write-Host "  SUCCESS: Tailwind CSS installeret" -ForegroundColor Green

# 4. Installer React Router
Write-Host "`n[4/6] Installerer React Router..." -ForegroundColor Yellow
npm install react-router-dom
npm install -D @types/react-router-dom
Write-Host "  SUCCESS: React Router installeret" -ForegroundColor Green

# 5. Installer Data Fetching & State Management
Write-Host "`n[5/6] Installerer TanStack Query, Zustand, og Axios..." -ForegroundColor Yellow
npm install @tanstack/react-query axios zustand
Write-Host "  SUCCESS: Data fetching & state management installeret" -ForegroundColor Green

# 6. Installer Dev Dependencies
Write-Host "`n[6/6] Installerer dev dependencies..." -ForegroundColor Yellow
npm install -D @types/node
Write-Host "  SUCCESS: Dev dependencies installeret" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Frontend Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Installed packages:" -ForegroundColor Cyan
Write-Host "  - Vite (build tool)" -ForegroundColor White
Write-Host "  - React 18 + TypeScript" -ForegroundColor White
Write-Host "  - Tailwind CSS (styling)" -ForegroundColor White
Write-Host "  - React Router (navigation)" -ForegroundColor White
Write-Host "  - TanStack Query (data fetching)" -ForegroundColor White
Write-Host "  - Zustand (state management)" -ForegroundColor White
Write-Host "  - Axios (HTTP client)" -ForegroundColor White

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Konfigurer Tailwind CSS (tailwind.config.js)" -ForegroundColor White
Write-Host "2. Opret src/api/ folder med API client" -ForegroundColor White
Write-Host "3. Opret .env fil med VITE_API_URL" -ForegroundColor White
Write-Host "4. Start dev server: npm run dev" -ForegroundColor White
Write-Host ""
