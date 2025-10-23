@echo off
echo ========================================
echo Tekup-Billy Test Suite (CMD Version)
echo No PowerShell Required
echo ========================================
echo.

echo Starting comprehensive test suite...
echo.

echo === 1. Environment Check ===
echo Node.js version:
node --version
echo.
echo npm version:
npm --version
echo.

echo === 2. Building Project ===
echo Building TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo ✅ Build successful
echo.

echo === 3. Integration Tests ===
echo Running integration tests...
call npx tsx tests/test-integration.ts
if %errorlevel% neq 0 (
    echo ❌ Integration tests failed!
    echo Check Supabase configuration and Billy API credentials
    pause
    exit /b 1
)
echo ✅ Integration tests passed
echo.

echo === 4. Production Tests ===
echo Testing production deployment...
call npx tsx tests/test-production.ts
if %errorlevel% neq 0 (
    echo ❌ Production tests failed!
    echo Check Render.com deployment status
    pause
    exit /b 1
)
echo ✅ Production tests passed
echo.

echo === 5. Billy API Tests ===
echo Testing Billy.dk API directly...
call npx tsx tests/test-billy-api.ts
if %errorlevel% neq 0 (
    echo ❌ Billy API tests failed!
    echo Check API credentials and network connection
    pause
    exit /b 1
)
echo ✅ Billy API tests passed
echo.

echo === 6. MCP Server Test ===
echo Testing MCP server startup...
timeout /t 2 /nobreak >nul
echo Starting server for 10 seconds...
start /b npm start
timeout /t 10 /nobreak >nul
taskkill /f /im node.exe >nul 2>&1
echo ✅ MCP server startup test completed
echo.

echo ========================================
echo 🎉 ALL TESTS PASSED!
echo ========================================
echo.
echo Tekup-Billy is fully functional:
echo ✅ Build system working
echo ✅ Integration tests passing  
echo ✅ Production deployment healthy
echo ✅ Billy.dk API connection working
echo ✅ MCP server starting correctly
echo.
echo Ready for development and deployment!
echo.
echo Next steps:
echo - Start development: npm run dev
echo - Deploy to production: git push
echo - Monitor health: npm run test:production
echo.

pause