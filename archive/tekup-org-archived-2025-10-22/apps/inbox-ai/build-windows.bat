@echo off
REM Windows Batch Script for Building AI IMAP Inbox
REM This script provides an easy way to build the Windows application

setlocal enabledelayedexpansion

echo =====================================
echo   AI IMAP Inbox Windows Builder
echo =====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo Node.js version: 
node --version
echo npm version:
npm --version
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if !errorlevel! neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Show menu
:menu
echo Select build option:
echo 1. Build Windows Installer (.exe)
echo 2. Build Portable Windows App
echo 3. Build Both Installer and Portable
echo 4. Build for All Platforms
echo 5. Run Tests Only
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto installer
if "%choice%"=="2" goto portable
if "%choice%"=="3" goto both
if "%choice%"=="4" goto all
if "%choice%"=="5" goto tests
if "%choice%"=="6" goto exit
echo Invalid choice. Please try again.
goto menu

:installer
echo.
echo Building Windows Installer...
npm run dist:win
goto result

:portable
echo.
echo Building Portable Windows App...
npm run dist:win-portable
goto result

:both
echo.
echo Building both Installer and Portable App...
npm run build
npx electron-builder --win
goto result

:all
echo.
echo Building for all platforms...
npm run dist:all
goto result

:tests
echo.
echo Running tests...
npm run test
if %errorlevel% neq 0 (
    echo Tests failed!
    pause
    exit /b 1
)
echo Tests passed!
goto menu

:result
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo Output files are in the 'release' folder.
echo.

if exist "release" (
    echo Generated files:
    dir /b release
    echo.
)

echo Would you like to open the release folder? (y/n)
set /p open="Enter choice: "
if /i "%open%"=="y" (
    start explorer release
)

goto menu

:exit
echo.
echo Goodbye!
pause