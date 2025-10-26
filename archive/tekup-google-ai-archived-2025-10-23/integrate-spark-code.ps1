# Spark Integration Guide
# Hvordan man integrerer GitHub Spark kode i renos-frontend

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Spark → RenOS Frontend Integration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$frontendPath = "C:\Users\empir\renos-frontend"

Write-Host "Opretter folder struktur..." -ForegroundColor Yellow

# Opret component folders
New-Item -ItemType Directory -Path "$frontendPath\src\components\dashboard" -Force | Out-Null
New-Item -ItemType Directory -Path "$frontendPath\src\components\bookings" -Force | Out-Null
New-Item -ItemType Directory -Path "$frontendPath\src\components\customers" -Force | Out-Null
New-Item -ItemType Directory -Path "$frontendPath\src\components\emails" -Force | Out-Null
New-Item -ItemType Directory -Path "$frontendPath\src\components\quotes" -Force | Out-Null
New-Item -ItemType Directory -Path "$frontendPath\src\components\layout" -Force | Out-Null
New-Item -ItemType Directory -Path "$frontendPath\src\components\ui" -Force | Out-Null

# Opret pages folders
New-Item -ItemType Directory -Path "$frontendPath\src\pages" -Force | Out-Null

# Opret types folder
New-Item -ItemType Directory -Path "$frontendPath\src\types" -Force | Out-Null

# Opret hooks folder
New-Item -ItemType Directory -Path "$frontendPath\src\hooks" -Force | Out-Null

Write-Host "  SUCCESS: Folder struktur oprettet!" -ForegroundColor Green

Write-Host "`nFolder struktur:" -ForegroundColor Cyan
Write-Host "src/" -ForegroundColor White
Write-Host "├── api/           # API client (already exists)" -ForegroundColor DarkGray
Write-Host "├── components/" -ForegroundColor White
Write-Host "│   ├── dashboard/  # Dashboard komponenter" -ForegroundColor DarkGray
Write-Host "│   ├── bookings/   # Booking komponenter" -ForegroundColor DarkGray
Write-Host "│   ├── customers/  # Customer komponenter" -ForegroundColor DarkGray
Write-Host "│   ├── emails/     # Email komponenter" -ForegroundColor DarkGray
Write-Host "│   ├── quotes/     # Quote komponenter" -ForegroundColor DarkGray
Write-Host "│   ├── layout/     # Layout komponenter (Sidebar, Header)" -ForegroundColor DarkGray
Write-Host "│   └── ui/         # Reusable UI komponenter" -ForegroundColor DarkGray
Write-Host "├── pages/         # Page komponenter" -ForegroundColor White
Write-Host "├── hooks/         # Custom React hooks" -ForegroundColor White
Write-Host "└── types/         # TypeScript types" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Næste Skridt" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Åbn GitHub Spark og klik 'Publish'" -ForegroundColor Yellow
Write-Host "2. Clone det publishede projekt eller copy-paste filerne" -ForegroundColor Yellow
Write-Host "3. Flyt komponenterne til strukturen ovenfor:" -ForegroundColor Yellow
Write-Host "   - Dashboard.tsx     → src/pages/Dashboard.tsx" -ForegroundColor DarkGray
Write-Host "   - Bookings.tsx      → src/pages/Bookings.tsx" -ForegroundColor DarkGray
Write-Host "   - Customers.tsx     → src/pages/Customers.tsx" -ForegroundColor DarkGray
Write-Host "   - Sidebar.tsx       → src/components/layout/Sidebar.tsx" -ForegroundColor DarkGray
Write-Host "   - MetricCard.tsx    → src/components/dashboard/MetricCard.tsx" -ForegroundColor DarkGray
Write-Host "   - osv..." -ForegroundColor DarkGray
Write-Host "4. Opdater imports i filerne" -ForegroundColor Yellow
Write-Host "5. Tilslut til backend API med TanStack Query" -ForegroundColor Yellow
Write-Host ""

Write-Host "Klar til at integrere Spark koden! 🚀" -ForegroundColor Green
