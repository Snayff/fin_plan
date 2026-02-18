@echo off
echo.
echo ========================================
echo   Stopping FinPlan Development Stack
echo ========================================
echo.

docker-compose -f docker-compose.dev.yml down

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Failed to stop services!
    exit /b 1
)

echo.
echo ========================================
echo   ✅ All Services Stopped Successfully!
echo ========================================
echo.
