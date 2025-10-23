@echo off
echo ================================================
echo Updating Tekup Workspace Documentation
echo ================================================
echo.

cd /d c:\Users\empir\Tekup

echo Adding new files...
git add docs/DAILY_WORK_LOG_2025-10-23.md

echo Committing changes...
git commit -m "docs: add daily work log for 23 October 2025

Complete session documentation:
- Workspace restructuring completion
- GitHub organization strategy
- Multi-computer workflow setup
- PC 2 documentation
- AI context files
- Automation scripts

Total output: 3,500+ lines, 15+ files
Session time: 1h 40min
Value: 10+ hours saved in future work"

echo.
echo Pushing to GitHub...
git push origin master

echo.
echo ================================================
echo Documentation updated!
echo View at: https://github.com/TekupDK/tekup-workspace-docs
echo ================================================
