# Commit and push to GitHub
Write-Host "Creating GitHub repository..." -ForegroundColor Cyan

# Simple commit message
git commit -m "Initial Tekup Database setup with multi-schema architecture"

# Create GitHub repo
gh repo create tekup-database --private --source=. --remote=origin --description "Central PostgreSQL database for Tekup Portfolio"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Repository created successfully!" -ForegroundColor Green
    
    # Push to GitHub
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    git branch -M main
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/TekupDK/tekup" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to push to GitHub" -ForegroundColor Red
    }
} else {
    Write-Host "Failed to create repository" -ForegroundColor Red
}
