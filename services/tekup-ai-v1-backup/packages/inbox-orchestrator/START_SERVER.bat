@echo off
echo Starting Friday AI Server...
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting server on port 3011...
echo.
call npm run dev
pause

