@echo off
echo Removing .git folders from subprojects...
cd /d c:\Users\empir\Tekup

rmdir /s /q apps\production\tekup-billy\.git
rmdir /s /q apps\production\tekup-database\.git
rmdir /s /q apps\production\tekup-vault\.git
rmdir /s /q apps\web\tekup-cloud-dashboard\.git
rmdir /s /q services\tekup-ai\.git
rmdir /s /q services\tekup-gmail-services\.git
rmdir /s /q archive\tekup-google-ai-archived-2025-10-23\.git

echo Done! Now all projects are part of the monorepo.
pause
