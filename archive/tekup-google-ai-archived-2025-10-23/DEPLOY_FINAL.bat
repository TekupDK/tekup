@echo off
cls
echo ========================================
echo   RENOS DESIGN DEPLOYMENT - FINAL FIX
echo ========================================
echo.

REM Change to project directory first
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo [1/6] Checking git status...
git status
echo.

echo [2/6] Adding frontend files...
git add client/src/styles/dashboard-enhancements.css
git add client/src/App.css  
git add client/src/pages/Dashboard/Dashboard.tsx
git add client/src/pages/Customers/Customers.tsx
echo.

echo [3/6] Adding documentation...
git add *.md *.txt *.bat *.ps1
echo.

echo [4/6] Committing changes...
git commit -m "feat: Premium design enhancements v5.0 - glassmorphism, gradient text, hover animations, premium tooltips, modern table design, shimmer loading"
echo.

echo [5/6] Pushing to GitHub...
git push origin main
echo.

echo [6/6] Checking final status...
git log --oneline -3
echo.

echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Frontend changes pushed to GitHub
echo.
echo IMPORTANT: Wait 5 minutes, then:
echo 1. Go to www.renos.dk
echo 2. Press CTRL+SHIFT+R (hard refresh)
echo 3. Clear browser cache if needed
echo.
echo Check deployment: https://dashboard.render.com
echo.
pause

