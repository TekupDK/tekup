@echo off
cd /d c:\Users\empir\Tekup
git commit -m "feat: consolidate all projects into monorepo structure"
git push origin master
echo.
echo =============================================
echo MONOREPO COMPLETE!
echo =============================================
echo.
echo All projects are now in:
echo https://github.com/TekupDK/tekup-workspace-docs
echo.
echo PC 2 can clone everything with one command!
pause
