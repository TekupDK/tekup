@echo off
echo Creating new TekupDK/tekup repository...

gh repo create TekupDK/tekup --public --description "Tekup Complete Monorepo - All projects in one workspace"

echo.
echo Repository created!
echo Now changing remote...

cd /d c:\Users\empir\Tekup

git remote remove origin
git remote add origin https://github.com/TekupDK/tekup.git

echo.
echo Pushing to new repository...
git push -u origin master

echo.
echo ========================================
echo DONE! New repo at:
echo https://github.com/TekupDK/tekup
echo ========================================
pause
