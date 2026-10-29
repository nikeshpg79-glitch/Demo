@echo off
title PQC HealthSecure - Launcher
echo ========================================================
echo Launching PQC HealthSecure (Backend + Frontend)
echo ========================================================
echo.
start "PQC Backend (FastAPI)" cmd /c "%~dp0run_backend.bat"
timeout /t 2 >nul
start "PQC Frontend (React + Vite)" cmd /c "%~dp0run_frontend.bat"
echo.
echo Both services have been launched in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend API Docs: http://127.0.0.1:8001/docs
echo.
pause

