$venvPy = "$PSScriptRoot\backend\venv\Scripts\python.exe"
if (-not (Test-Path $venvPy)) {
    $venvPy = "$PSScriptRoot\venv\Scripts\python.exe"
}
if (-not (Test-Path $venvPy)) {
    $venvPy = "python"
}
& $venvPy -m uvicorn @args

