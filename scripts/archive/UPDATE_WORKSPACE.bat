@echo off
echo Updating workspace file...
cd /d c:\Users\empir\Tekup

echo Creating backup...
copy Tekup-Portfolio.code-workspace Tekup-Portfolio.code-workspace.backup

echo Done! Now manually update the workspace paths in:
echo Tekup-Portfolio.code-workspace
echo.
echo Change:
echo   "../tekup-ai" to "services/tekup-ai"
echo   "../tekup-database" to "apps/production/tekup-database"
echo   etc.
pause
