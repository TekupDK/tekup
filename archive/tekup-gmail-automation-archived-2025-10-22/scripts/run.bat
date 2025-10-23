@echo off
REM Gmail PDF Forwarder - Windows Start Script
echo.
echo =====================================================
echo Gmail PDF Forwarder til e-conomic
echo =====================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python er ikke installeret eller ikke i PATH
    echo.
    echo Download Python fra: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python fundet
echo.

REM Install dependencies if needed
echo 🔧 Tjekker dependencies...
python -c "import google.auth, googleapiclient, dotenv" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installerer påkrævede pakker...
    pip install -r requirements.txt
    echo.
)

REM Check if .env file exists
if not exist .env (
    echo ❌ .env fil ikke fundet!
    echo.
    echo Du skal oprette .env filen med dine Gmail credentials.
    echo Se eksempel i .env filen eller kør test først.
    echo.
    pause
    exit /b 1
)

echo ✅ .env fil fundet
echo.

REM Run the system
echo 🚀 Starter Gmail PDF Forwarder...
echo.
python gmail_forwarder.py

echo.
echo ✅ Færdig!
echo.
pause

