@echo off
title PQC HealthSecure - Backend (FastAPI)
cd /d "%~dp0backend"

set "PY_EXE=%~dp0backend\venv\Scripts\python.exe"
if not exist "%PY_EXE%" (
    set "PY_EXE=%~dp0venv\Scripts\python.exe"
)
if not exist "%PY_EXE%" (
    set "PY_EXE=python"
)

echo Starting PQC HealthSecure Backend on http://127.0.0.1:8001...
echo Swagger API Docs: http://127.0.0.1:8001/docs
echo Health Check:     http://127.0.0.1:8001/api/health
echo.

"%PY_EXE%" -m uvicorn app.main:app --app-dir "%~dp0backend" --host 127.0.0.1 --port 8001 --reload
pause
