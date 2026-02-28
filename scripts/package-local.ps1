# PowerShell 7+ helper for packaging the extension locally
# Usage: pwsh -NoProfile -File scripts/package-local.ps1

$ErrorActionPreference = 'Stop'

# helper to run commands in pwsh if available, otherwise warn and run
# the command in the current shell so the scripts still work under Windows
# PowerShell 5.1.
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

# ensure output folder exists
New-Item -ItemType Directory -Force -Path $releases | Out-Null

Write-Host 'Packaging extension to releases/ ...'

# call vsce (npx ensures local installation)
try {
    Invoke-Pwsh "npx vsce package --out releases/ --allow-missing-repository" 2>&1 | Write-Host
    Write-Host 'Package complete.'
} catch {
    Write-Error "Failed to package extension: $_"
    exit 1
}