param (
    [string]$Version = ""
)

$ErrorActionPreference = "Stop"

$appName = "Fontopia"

if ([string]::IsNullOrWhiteSpace($Version)) {
    $Version = Read-Host "Enter version tag, e.g. v0.1.0"
}

if (-not $Version.StartsWith("v")) {
    throw "Version tag must start with 'v'. Example: v0.1.0"
}

$gitCommit = git rev-parse HEAD
$gitCommitShort = git rev-parse --short HEAD
$buildTimeUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$distRoot = "dist"
$appDistPath = Join-Path $distRoot $appName
$zipPath = Join-Path $distRoot "$appName-$Version.zip"

$instructionsSourcePath = "packaging\README.txt"
$instructionsTargetPath = Join-Path $appDistPath "README.txt"

$buildInfoSourcePath = "packaging\build-info.json"

$buildInfo = [ordered]@{
    appName = "Fontopia!"
    version = $Version
    gitCommit = $gitCommit
    gitCommitShort = $gitCommitShort
    buildTimeUtc = $buildTimeUtc
}

$buildInfo |
    ConvertTo-Json -Depth 4 |
    Set-Content -Path $buildInfoSourcePath -Encoding UTF8

pyinstaller `
    --name $appName `
    --onedir `
    --add-data "app/static;app/static" `
    --add-data "$buildInfoSourcePath;packaging" `
    desktop_main.py

$readmeText = Get-Content -Path $instructionsSourcePath -Raw
$readmeText = $readmeText.Replace("{{VERSION}}", $Version)
Set-Content -Path $instructionsTargetPath -Value $readmeText -Encoding UTF8

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive `
    -Path "$appDistPath\*" `
    -DestinationPath $zipPath `
    -Force

Write-Host ""
Write-Host "Built: $zipPath"