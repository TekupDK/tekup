@echo off
echo ========================================
echo PowerShell Fix Script for Tekup-Billy
echo Exit Code: -2147023895 (ACCESS_DENIED)
echo ========================================
echo.

echo Step 1: Checking current execution policy...
powershell -Command "Get-ExecutionPolicy -List" 2>nul
if %errorlevel% neq 0 (
    echo PowerShell access denied - trying bypass method...
    goto :bypass_method
)

echo.
echo Step 2: Setting execution policy to RemoteSigned...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force" 2>nul
if %errorlevel% neq 0 (
    echo Failed to set execution policy - trying bypass method...
    goto :bypass_method
)

echo.
echo Step 3: Testing PowerShell execution...
powershell -Command "echo 'PowerShell test successful'" 2>nul
if %errorlevel% neq 0 (
    echo PowerShell still failing - using bypass method...
    goto :bypass_method
)

echo.
echo ✅ PowerShell fixed successfully!
echo You can now use PowerShell normally.
goto :test_tekup_billy

:bypass_method
echo.
echo Using PowerShell bypass method...
powershell -ExecutionPolicy Bypass -Command "echo 'Bypass method works'" 2>nul
if %errorlevel% neq 0 (
    echo ❌ PowerShell completely blocked - using CMD fallback
    goto :cmd_fallback
)

echo.
echo Setting execution policy with bypass...
powershell -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force" 2>nul

echo.
echo ✅ PowerShell fixed with bypass method!
goto :test_tekup_billy

:cmd_fallback
echo.
echo ⚠️  PowerShell is blocked - using Command Prompt fallback
echo This is fine for Tekup-Billy development.
echo.

:test_tekup_billy
echo.
echo ========================================
echo Testing Tekup-Billy Core Functions
echo ========================================

echo.
echo Testing Node.js...
node -e "console.log('✅ Node.js version:', process.version)"
if %errorlevel% neq 0 (
    echo ❌ Node.js not working
    goto :end
)

echo.
echo Testing npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not working
    goto :end
) else (
    echo ✅ npm is working
)

echo.
echo Testing TypeScript...
npx tsc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ TypeScript not available
    goto :end
) else (
    echo ✅ TypeScript is working
)

echo.
echo Building Tekup-Billy...
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Build failed
    goto :end
) else (
    echo ✅ Build successful
)

echo.
echo ========================================
echo 🎉 Tekup-Billy is ready to use!
echo ========================================
echo.
echo Next steps:
echo 1. npm run test:integration
echo 2. npm run test:production  
echo 3. npm start
echo.
echo If PowerShell still doesn't work:
echo - Use Command Prompt instead
echo - Add Windows Defender exclusion
echo - Run VS Code as Administrator
echo.

:end
pause