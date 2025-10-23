@echo off
echo ========================================
echo MOVING ALL PROJECTS INTO TEKUP MONOREPO
echo ========================================
echo.
echo IMPORTANT: Close VS Code/IDE before running!
echo.
pause

cd /d c:\Users\empir\Tekup

echo Moving production services...
move ..\tekup-database apps\production\tekup-database
move ..\TekupVault apps\production\tekup-vault
move ..\Tekup-Billy apps\production\tekup-billy

echo.
echo Moving web applications...
move ..\tekup-cloud-dashboard apps\web\tekup-cloud-dashboard

echo.
echo Moving services...
move ..\tekup-ai services\tekup-ai
move ..\tekup-gmail-services services\tekup-gmail-services

echo.
echo Moving archive...
move "..\Tekup Google AI" archive\tekup-google-ai-archived-2025-10-23

echo.
echo ========================================
echo DONE! All projects moved.
echo ========================================
echo.
echo Next: Run commit-all-projects.bat
pause
