@echo off
cd /d c:\Users\empir\Tekup
git commit -m "docs: update all documentation for monorepo structure"
git push origin master
echo.
echo Documentation updated!
echo - README.md reflects monorepo
echo - README_PC2_SETUP.md shows simple 1-clone setup
echo.
pause
