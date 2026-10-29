param([Parameter(ValueFromRemainingArguments = $true)]$allArgs)
$nodeDir = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64"
if (Test-Path "$nodeDir\npm.cmd") {
    $env:PATH = "$nodeDir;" + $env:PATH
    & "$nodeDir\npm.cmd" @allArgs
} else {
    & npm @allArgs
}
