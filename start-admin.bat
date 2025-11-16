@echo off
echo Starting Invoice Admin Dashboard...
echo.

echo Make sure backend is running on http://localhost:3001
echo Press any key to open admin login page...
pause > nul

echo Opening Admin Login Page...
start admin-frontend\login.html

echo.
echo Admin Login Credentials:
echo Username: admin or user
echo Password: admin123 or user123
echo.