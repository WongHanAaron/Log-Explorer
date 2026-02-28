# PowerShell 7+ helper for packaging the extension locally
# Usage: pwsh -NoProfile -File scripts/package-local.ps1

$ErrorActionPreference = 'Stop'

$root = Get-Location
$releases = Join-Path $root 'releases'

# ensure output folder exists
New-Item -ItemType Directory -Force -Path $releases | Out-Null

Write-Host 'Packaging extension to releases/ ...'

# call vsce (npx ensures local installation)
try {
    pwsh -NoProfile -Command "npx vsce package --out releases/ --allow-missing-repository" 2>&1 | Write-Host
    Write-Host 'Package complete.'
} catch {
    Write-Error "Failed to package extension: $_"
    exit 1
}