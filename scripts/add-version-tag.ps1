$ErrorActionPreference = "Stop"

$lastTag = git describe --tags --abbrev=0 2>$null

if ([string]::IsNullOrWhiteSpace($lastTag)) {
    Write-Host "Last tag: <none>"
} else {
    Write-Host "Last tag: $lastTag"
}

$newTag = Read-Host "Enter new version tag, e.g. v0.1.0"

if ([string]::IsNullOrWhiteSpace($newTag)) {
    throw "Version tag is required."
}

if (-not $newTag.StartsWith("v")) {
    throw "Version tag must start with 'v'. Example: v0.1.0"
}

$existingTag = git tag --list $newTag

if (-not [string]::IsNullOrWhiteSpace($existingTag)) {
    throw "Tag '$newTag' already exists."
}

$tagMessage = Read-Host "Enter tag message"

if ([string]::IsNullOrWhiteSpace($tagMessage)) {
    throw "Tag message is required."
}

git tag -a $newTag -m $tagMessage

Write-Host ""
Write-Host "Created tag: $newTag"
Write-Host ""
Write-Host "To push this tag:"
Write-Host "git push origin $newTag"