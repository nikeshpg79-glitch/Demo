@echo off
title PQC HealthSecure - Backend (FastAPI)
cd /d "%~dp0backend"
echo Starting PQC HealthSecure Backend on http://127.0.0.1:8001...
echo Swagger API Docs: http://127.0.0.1:8001/docs
echo.
"%~dp0backend\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
pause

