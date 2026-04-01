@echo off
echo =======================================================
echo          PREDICTIFI.AI - STARTUP SEQUENCE
echo =======================================================
echo.
echo Starting Backend API...
start "Backend API" cmd /k "cd backend && call venv\Scripts\activate.bat && python app.py"

echo Starting Vite Frontend Development Server...
start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"

echo.
echo Components launched in separate windows!
echo Once the frontend server is ready, open http://localhost:5173 
echo Keep the new console windows open while using the app.
echo.
pause
