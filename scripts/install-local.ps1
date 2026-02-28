# PowerShell 7+ helper for installing the locally built .vsix into VSCode
# Usage: pwsh -NoProfile -File scripts/install-local.ps1

$ErrorActionPreference = 'Stop'

$root = Get-Location
$releases = Join-Path $root 'releases'

if (-not (Test-Path $releases)) {
    Write-Error "No .vsix found in releases/. Run 'pwsh -File scripts/package-local.ps1' or 'npm run package:local' first."
    exit 1
}

$vsix = Get-ChildItem -Path $releases -Filter *.vsix | Select-Object -First 1
if (-not $vsix) {
    Write-Error "No .vsix found in releases/. Run 'pwsh -File scripts/package-local.ps1' or 'npm run package:local' first."
    exit 1
}

$vsixPath = $vsix.FullName
Write-Host "Installing $vsixPath..."

try {
    pwsh -NoProfile -Command "code --install-extension `"$vsixPath`" --force" 2>&1 | Write-Host
    Write-Host 'Installation complete.'
} catch {
    Write-Error "Failed to install extension: $_"
    exit 1
}