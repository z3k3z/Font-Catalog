$ErrorActionPreference = "Stop"

$lastTag = git describe --tags --abbrev=0

Write-Host "Last tag: $lastTag"
Write-Host ""

git log "$lastTag..HEAD" `
    --pretty=format:"- %s (%h)" `
    --no-merges