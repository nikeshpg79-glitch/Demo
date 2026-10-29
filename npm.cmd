@echo off
set "NODE_DIR=%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64"
if exist "%NODE_DIR%\npm.cmd" (
    set "PATH=%NODE_DIR%;%PATH%"
    call "%NODE_DIR%\npm.cmd" %*
) else (
    npm %*
)

