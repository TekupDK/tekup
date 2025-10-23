@echo off
echo ================================================
echo Pushing Tekup Workspace Documentation to GitHub
echo ================================================
echo.

cd /d c:\Users\empir\Tekup

git config user.email "jonas@tekup.dk"
git config user.name "Jonas Abde"

git commit -m "docs: initialize Tekup workspace documentation"

echo.
echo Creating GitHub repository...
gh repo create TekupDK/tekup-workspace-docs --public --description "Tekup Workspace Documentation - Setup guides, structure, and context for multi-repo development" --source=. --push

echo.
echo ================================================
echo Done! Repository created at:
echo https://github.com/TekupDK/tekup-workspace-docs
echo ================================================
