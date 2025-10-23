@echo off
cd /d c:\Users\empir\Tekup
git commit -m "docs: update all documentation to reflect monorepo structure and new repo name (TekupDK/tekup)"
git push origin master
echo.
echo ===========================================
echo ALL DOCUMENTATION UPDATED!
echo ===========================================
echo.
echo Updated files:
echo - README.md (monorepo + github.com/TekupDK/tekup)
echo - README_PC2_SETUP.md (simple 1-clone setup)
echo - README_PC2_QUICK_START.md (marked as deprecated)
echo - AI_CONTEXT_SUMMARY.md (monorepo context)
echo - WORKSPACE_STRUCTURE_IMPROVED.md (implementation complete)
echo.
echo Repository: https://github.com/TekupDK/tekup
echo.
pause
