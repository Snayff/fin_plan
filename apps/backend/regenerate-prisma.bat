@echo off
echo Stopping any running processes...
echo.
echo Please stop your backend server (Ctrl+C in the terminal running it)
echo Then press any key to continue...
pause > nul

echo.
echo Cleaning Prisma client...
rmdir /s /q "..\..\node_modules\.prisma" 2>nul
rmdir /s /q "node_modules\.prisma" 2>nul

echo.
echo Regenerating Prisma client...
call bunx prisma generate

echo.
echo Done! You can now restart your backend server.
echo.
pause
