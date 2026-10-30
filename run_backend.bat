@echo off
title PQC HealthSecure - Backend (FastAPI)
cd /d "%~dp0"

set "PY_EXE=%~dp0backend\venv\Scripts\python.exe"
if not exist "%PY_EXE%" (
    set "PY_EXE=%~dp0venv\Scripts\python.exe"
)
if not exist "%PY_EXE%" (
    set "PY_EXE=python"
)

echo ========================================================
echo Starting PQC HealthSecure Backend on http://127.0.0.1:8001...
echo Interactive API Docs: http://127.0.0.1:8001/docs
echo Health Check:        http://127.0.0.1:8001/api/health
echo ========================================================
echo.

"%PY_EXE%" "%~dp0main.py"
pause
