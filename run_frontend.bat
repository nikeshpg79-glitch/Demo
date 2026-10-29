@echo off
title PQC HealthSecure - Frontend (Vite React)
cd /d "%~dp0frontend"

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64;%PATH%"
)

echo Starting PQC HealthSecure Frontend on http://localhost:5173...
echo.
npm run dev
pause
