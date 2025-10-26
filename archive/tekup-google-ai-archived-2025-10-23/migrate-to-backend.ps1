# Migration script for RenOS Backend# Migration script for RenOS Backend

# Kopierer backend-relevante filer til det nye renos-backend repo# Kopierer backend-relevante filer til det nye renos-backend repo



$sourceRoot = "C:\Users\empir\Tekup Google AI"$sourceRoot = "C:\Users\empir\Tekup Google AI"

$targetRoot = "C:\Users\empir\renos-backend"$targetRoot = "C:\Users\empir\renos-backend"



Write-Host "Starting backend migration..." -ForegroundColor CyanWrite-Host "🚀 Starting backend migration..." -ForegroundColor Cyan



# Tjek at target repo eksisterer# Tjek at target repo eksisterer

if (-not (Test-Path $targetRoot)) {
    if (-not (Test-Path $targetRoot)) {

        Write-Host "Target repo not found: $targetRoot" -ForegroundColor Red    Write-Host "❌ Target repo not found: $targetRoot" -ForegroundColor Red

        exit 1    exit 1

    }
}



# 1. Kopier src/ mappen# 1. Kopier src/ mappen (hele backend koden)

Write-Host "Copying src/ folder..." -ForegroundColor YellowWrite-Host "📦 Copying src/ folder..." -ForegroundColor Yellow

Copy-Item -Path "$sourceRoot\src" -Destination "$targetRoot\src" -Recurse -ForceCopy-Item -Path "$sourceRoot\src" -Destination "$targetRoot\src" -Recurse -Force



# 2. Kopier prisma/ mappen# 2. Kopier prisma/ mappen (database schema og migrations)

Write-Host "Copying prisma/ folder..." -ForegroundColor YellowWrite-Host "🗄️  Copying prisma/ folder..." -ForegroundColor Yellow

Copy-Item -Path "$sourceRoot\prisma" -Destination "$targetRoot\prisma" -Recurse -ForceCopy-Item -Path "$sourceRoot\prisma" -Destination "$targetRoot\prisma" -Recurse -Force



# 3. Kopier tests/ mappen# 3. Kopier tests/ mappen

Write-Host "Copying tests/ folder..." -ForegroundColor YellowWrite-Host "🧪 Copying tests/ folder..." -ForegroundColor Yellow

Copy-Item -Path "$sourceRoot\tests" -Destination "$targetRoot\tests" -Recurse -ForceCopy-Item -Path "$sourceRoot\tests" -Destination "$targetRoot\tests" -Recurse -Force



# 4. Kopier docs/ mappen# 4. Kopier docs/ mappen (backend-relevante docs)

Write-Host "Copying docs/ folder..." -ForegroundColor YellowWrite-Host "📚 Copying docs/ folder..." -ForegroundColor Yellow

Copy-Item -Path "$sourceRoot\docs" -Destination "$targetRoot\docs" -Recurse -ForceCopy-Item -Path "$sourceRoot\docs" -Destination "$targetRoot\docs" -Recurse -Force



# 5. Kopier scripts/ mappen# 5. Kopier scripts/ mappen

Write-Host "Copying scripts/ folder..." -ForegroundColor YellowWrite-Host "📜 Copying scripts/ folder..." -ForegroundColor Yellow

Copy-Item -Path "$sourceRoot\scripts" -Destination "$targetRoot\scripts" -Recurse -ForceCopy-Item -Path "$sourceRoot\scripts" -Destination "$targetRoot\scripts" -Recurse -Force



# 6. Kopier root config filer# 6. Kopier root config filer

Write-Host "Copying config files..." -ForegroundColor YellowWrite-Host "⚙️  Copying config files..." -ForegroundColor Yellow

$configFiles = @($configFiles = @(

        "package.json", "package.json",

        "tsconfig.json", "tsconfig.json",

        "tsconfig.eslint.json", "tsconfig.eslint.json",

        "vitest.config.ts", "vitest.config.ts",

        ".env.example", ".env.example",

        ".eslintrc.cjs", ".eslintrc.cjs",

        ".eslintignore", ".eslintignore",

        "eslint.config.cjs", "eslint.config.cjs",

        ".dockerignore", ".dockerignore",

        "Dockerfile", "Dockerfile",

        "docker-compose.yml", "docker-compose.yml",

        "render.yaml"    "render.yaml"

    ))



foreach ($file in $configFiles) {
    foreach ($file in $configFiles) {

        $sourcePath = "$sourceRoot\$file"    $sourcePath = "$sourceRoot\$file"

        if (Test-Path $sourcePath) {
            if (Test-Path $sourcePath) {

                Copy-Item -Path $sourcePath -Destination "$targetRoot\$file" -Force        Copy-Item -Path $sourcePath -Destination "$targetRoot\$file" -Force

                Write-Host "  Copied $file" -ForegroundColor Green        Write-Host "  ✓ Copied $file" -ForegroundColor Green

            }
            else {    } else {

                Write-Host "  Skipped $file (not found)" -ForegroundColor DarkGray        Write-Host "  ⚠ Skipped $file (not found)" -ForegroundColor DarkGray

            }    
        }

    }
}



# 7. Kopier GitHub workflows# 7. Kopier GitHub workflows (CI/CD)

Write-Host "Copying .github/ folder..." -ForegroundColor YellowWrite-Host "🔄 Copying .github/ folder..." -ForegroundColor Yellow

if (Test-Path "$sourceRoot\.github") {
    if (Test-Path "$sourceRoot\.github") {

        Copy-Item -Path "$sourceRoot\.github" -Destination "$targetRoot\.github" -Recurse -Force    Copy-Item -Path "$sourceRoot\.github" -Destination "$targetRoot\.github" -Recurse -Force

    }
}



# 8. Kopier dokumentations-filer# 8. Kopier nødvendige dokumentations-filer

Write-Host "Copying documentation files..." -ForegroundColor YellowWrite-Host "📄 Copying documentation files..." -ForegroundColor Yellow

$docFiles = @($docFiles = @(

        "README.md", "README.md",

        "CONTRIBUTING.md", "CONTRIBUTING.md",

        "SECURITY.md"    "SECURITY.md"

    ))



foreach ($file in $docFiles) {
    foreach ($file in $docFiles) {

        $sourcePath = "$sourceRoot\$file"    $sourcePath = "$sourceRoot\$file"

        if (Test-Path $sourcePath) {
            if (Test-Path $sourcePath) {

                Copy-Item -Path $sourcePath -Destination "$targetRoot\$file" -Force        Copy-Item -Path $sourcePath -Destination "$targetRoot\$file" -Force

                Write-Host "  Copied $file" -ForegroundColor Green        Write-Host "  ✓ Copied $file" -ForegroundColor Green

            }    
        }

    }
}



Write-Host ""Write-Host ""

Write-Host "Backend migration complete!" -ForegroundColor GreenWrite-Host "✅ Backend migration complete!" -ForegroundColor Green

Write-Host ""Write-Host ""

Write-Host "Next steps:" -ForegroundColor CyanWrite-Host "📋 Next steps:" -ForegroundColor Cyan

Write-Host "1. cd C:\Users\empir\renos-backend"Write-Host "1. cd C:\Users\empir\renos-backend"

Write-Host "2. Review and clean package.json"Write-Host "2. Review and clean package.json (remove client dependencies)"

Write-Host "3. npm install"Write-Host "3. npm install"

Write-Host "4. npm run db:push"Write-Host "4. npm run db:push (setup database)"

Write-Host "5. npm run dev"Write-Host "5. npm run dev (test backend)"

Write-Host ""Write-Host ""

