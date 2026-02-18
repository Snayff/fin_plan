@echo off
echo.
echo ========================================
echo   Starting FinPlan Development Stack
echo ========================================
echo.

echo [1/3] Starting Docker services...
docker-compose -f docker-compose.dev.yml up -d

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Failed to start services!
    echo    Make sure Docker Desktop is running.
    exit /b 1
)

echo.
echo [2/3] Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

echo.
echo [3/3] Running database migrations...
docker-compose -f docker-compose.dev.yml exec -T backend bun run db:migrate

echo.
echo ========================================
echo   ✅ All Services Started Successfully!
echo ========================================
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:3001
echo   Prisma Studio: Run 'bun run db:studio'
echo.
echo   View logs: bun run docker:logs
echo   Stop services: bun run stop (or run stop-dev.bat)
echo.
