# Deploy MkDocs documentation to GitHub Pages
# Usage: ./scripts/deploy-docs.ps1

Write-Host "🚀 Deploying TekUp AI Assistant documentation to GitHub Pages..." -ForegroundColor Cyan
Write-Host ""

# Build MkDocs site
Write-Host "📦 Building documentation..." -ForegroundColor Yellow
python -m mkdocs build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ MkDocs build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Documentation built successfully" -ForegroundColor Green
Write-Host ""

# Deploy to GitHub Pages
Write-Host "🌐 Deploying to GitHub Pages..." -ForegroundColor Yellow
python -m mkdocs gh-deploy --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Your documentation is live at:" -ForegroundColor Cyan
    Write-Host "   https://github.com/JonasAbde/tekup-ai-assistant/deployments/github-pages" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 It may take a minute or two to appear." -ForegroundColor Yellow
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
