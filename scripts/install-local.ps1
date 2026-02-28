# PowerShell 7+ helper for installing the locally built .vsix into VSCode
# Usage: pwsh -NoProfile -File scripts/install-local.ps1

$ErrorActionPreference = 'Stop'

# helper that prefers PowerShell 7+ but will still run everything
# in the current shell if pwsh is not available (with a warning).
function Invoke-Pwsh {
    param([string]$cmd)

    if ($PSVersionTable.PSVersion.Major -ge 7) {
        Invoke-Expression $cmd
        return
    }

    if (Get-Command pwsh -ErrorAction SilentlyContinue) {
        pwsh -NoProfile -Command $cmd
        return
    }

    Write-Warning "PowerShell 7+ (pwsh) not available; executing command in current shell."
    Invoke-Expression $cmd
}

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
    Invoke-Pwsh "code --install-extension `"$vsixPath`" --force" 2>&1 | Write-Host
    Write-Host 'Installation complete.'
} catch {
    Write-Error "Failed to install extension: $_"
    exit 1
}