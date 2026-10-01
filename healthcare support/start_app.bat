@echo off
echo Starting Smart Healthcare Support Application...
echo ================================================

echo.
echo Starting Backend Server...
cd backend
start "Backend Server" python app.py

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Opening Frontend in Browser...
cd ..\frontend
start "" "index.html"

echo.
echo Application started successfully!
echo Backend: http://localhost:5000
echo Frontend: Open index.html in your browser
echo.
echo Press any key to stop the backend server...
pause > nul

echo.
echo Stopping backend server...
taskkill /f /im python.exe /fi "WINDOWTITLE eq Backend Server*" 2>nul
echo Application stopped.
pause