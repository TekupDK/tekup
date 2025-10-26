@echo off
echo ========================================
echo   RENOS DESIGN DEPLOYMENT
echo ========================================
echo.

REM Navigate to project
cd /d "C:\Users\empir\Tekup Google AI"

echo [1/5] Adding frontend files...
git add client/src/styles/dashboard-enhancements.css client/src/App.css client/src/pages/Dashboard/Dashboard.tsx client/src/pages/Customers/Customers.tsx

echo [2/5] Adding documentation...
git add DESIGN_ENHANCEMENTS_DEPLOYED_OCT_7_2025.md DESIGN_FORBEDRINGER_DANSK_KORT.md VISUAL_COMPARISON_BEFORE_AFTER.md DEPLOYMENT_GUIDE_OCT_7_2025.md STRATEGIC_IMPROVEMENTS_IMPLEMENTED_OCT_7_2025.md QUICK_START_STRATEGIC_FEATURES.md

echo [3/5] Committing changes...
git commit -m "feat: Premium design enhancements v5.0 - glassmorphism, gradient text, modern animations"

echo [4/5] Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Frontend changes pushed to GitHub
echo Render.com will auto-deploy in 3-5 minutes
echo.
echo Go to www.renos.dk to see changes!
echo.
pause

