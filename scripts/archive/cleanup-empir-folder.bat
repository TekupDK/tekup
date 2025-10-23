@echo off
echo ==========================================
echo CLEANUP: c:\Users\empir\ folder
echo ==========================================
echo.
echo Dette script vil:
echo 1. Slette tomme Tekup mapper
echo 2. Flytte gamle docs til Tekup/archive/
echo 3. Flytte gmail scripts til tekup-gmail-services
echo.
pause

cd /d c:\Users\empir

echo.
echo [1/3] Sletter tomme mapper...
rmdir Tekup-Cloud
rmdir Tekup-org  
rmdir tekup-cloud-dashboard

echo.
echo [2/3] Flytter gamle docs til arkiv...
mkdir Tekup\archive\old-workspace-docs-2025-10-22
move GIT_COMMIT_COMPLETE_2025-10-22.md Tekup\archive\old-workspace-docs-2025-10-22\
move README_START_HERE.md Tekup\archive\old-workspace-docs-2025-10-22\
move TEKUP_CLOUD_KOMPLET_ANALYSE.md Tekup\archive\old-workspace-docs-2025-10-22\
move TEKUP_DISCOVERY_EXECUTIVE_SUMMARY.md Tekup\archive\old-workspace-docs-2025-10-22\

echo.
echo Sletter tomme filer...
del TEKUP_COMPLETE_RESTRUCTURE_PLAN.md
del TEKUP_FOLDER_STRUCTURE_PLAN.md
del WHAT_IS_NEW_IN_EACH_FOLDER.md

echo.
echo [3/3] Flytter gmail scripts...
mkdir Tekup\services\tekup-gmail-services\legacy-scripts
move gmail_pdf_forwarder.py Tekup\services\tekup-gmail-services\legacy-scripts\
move requirements.txt Tekup\services\tekup-gmail-services\legacy-scripts\
move config.json Tekup\services\tekup-gmail-services\legacy-scripts\

echo.
echo ==========================================
echo CLEANUP DONE!
echo ==========================================
echo.
echo c:\Users\empir\ er nu ryddet op!
echo Alle Tekup-relaterede filer er nu i Tekup\ monorepo.
echo.
pause
