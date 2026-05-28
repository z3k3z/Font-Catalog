$ErrorActionPreference = "Stop"

$appName = "Fontopia"
$distRoot = "dist"
$appDistPath = Join-Path $distRoot $appName
$zipPath = Join-Path $distRoot "$appName.zip"
$instructionsSourcePath = "packaging\README.txt"
$instructionsTargetPath = Join-Path $appDistPath "README.txt"

pyinstaller `
    --name $appName `
    --onedir `
    --add-data "app/static;app/static" `
    desktop_main.py

Copy-Item `
    -Path $instructionsSourcePath `
    -Destination $instructionsTargetPath `
    -Force

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive `
    -Path "$appDistPath\*" `
    -DestinationPath $zipPath `
    -Force