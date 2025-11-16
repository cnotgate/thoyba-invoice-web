@echo off
echo Starting Invoice Web App...
echo.

echo Starting backend server...
start cmd /k "cd backend && npm start"

timeout /t 3 /nobreak > nul

echo Choose which frontend to open:
echo 1. Invoice Input Form (frontend/index.html)
echo 2. Admin Dashboard (admin-frontend/login.html)
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo Opening Invoice Input Form...
    start http://localhost:3001/frontend/index.html
) else if "%choice%"=="2" (
    echo Opening Admin Dashboard...
    start http://localhost:3001/admin-frontend/login.html
) else (
    echo Invalid choice. Opening Invoice Input Form by default...
    start http://localhost:3001/frontend/index.html
)

echo.
echo Backend running at: http://localhost:3001
echo Admin login: admin/admin123 or user/user123
echo.