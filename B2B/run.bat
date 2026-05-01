@echo off
echo Starting B2B Application...

:: Start Backend
start "Backend Server" cmd /k "cd backend && npm run dev"

:: Start Frontend
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo --------------------------------------------------
echo If windows close immediately or show errors:
echo 1. Make sure MongoDB is running locally.
echo 2. Try running 'npm install' in both folders.
echo --------------------------------------------------
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
echo --------------------------------------------------
pause
