# PowerShell helper for running the access tester CLI with preset options.
# Usage: modify the variables below and run
#    pwsh -NoProfile -File scripts/access-tester.ps1
# It will execute the TypeScript command-line tool under test/tools/fileaccess.

# -------------------- configuration --------------------
# choose one of: local, smb, sftp
# switch to sftp to talk to WSL via SSH; ensure openssh-server is running
# inside the WSL distro and that the service is listening on localhost port 22.

# determine location of script and .env file
$scriptDir = Split-Path $MyInvocation.MyCommand.Path
$envFile = Join-Path $scriptDir '.env.local'

# helper that writes current credentials to .env.local if it doesn't exist
function Write-DefaultEnv {
    param(
        [string]$path
    )
    Write-Host "Creating default environment file at $path"
    @"
SFTP_HOST=$sftpHost
SFTP_PORT=$port
SFTP_USER=$username
SFTP_PASS=$password
SFTP_KEY=$privateKey
SFTP_ROOT=$root
WSL_USER=$wslUser
"@ | Out-File -Encoding utf8 $path
}

# default values (will be overridden by environment file)
$type = 'sftp'

# local adapter options (unused for sftp)
$basePath = '.'

# smb adapter options (unused for sftp)
$share = '\\SERVER\SHARE'
$username = ''    # fill in via env file
$password = ''
$domain = ''

# sftp adapter options (defaults are placeholders)
$sftpHost = 'localhost'  # will typically be overridden
$port = 22
$username = ''            # WSL login name
$password = ''            # leave blank if using key auth
$privateKey = ''          # optional
$wslUser = ''             # WSL username
$root = ''                # path inside WSL

# operation to run: read, list, stat, delete
$command = 'list'
$path = ''   # path argument for the command
$recursive = $false
$maxDepth = 1

# if the env file doesn't exist but the default credentials are nonempty,
# create it now using whatever values are currently set (useful after a
# previous manual copy/paste or when the script still contained hardcoded
# credentials before being cleaned up).
if (-not (Test-Path $envFile)) {
    if ($username -or $password -or $sftpHost -or $wslUser -or $root) {
        Write-DefaultEnv -path $envFile
    }
}

# load environment values if present
if (Test-Path $envFile) {
    Write-Host "Loading environment from $envFile"
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if (-not [string]::IsNullOrWhiteSpace($line) -and -not $line.StartsWith('#')) {
            $parts = $line -split '=',2
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $val = $parts[1].Trim().Trim('"')
                switch ($key) {
                    'SFTP_HOST'   { $sftpHost = $val }
                    'SFTP_PORT'   { $port     = [int]$val }
                    'SFTP_USER'   { $username = $val }
                    'SFTP_PASS'   { $password = $val }
                    'SFTP_KEY'    { $privateKey = $val }
                    'SFTP_ROOT'   { $root     = $val }
                    'WSL_USER'    { $wslUser  = $val }
                    default {
                        Set-Variable -Name $key -Value $val -Scope Script -ErrorAction SilentlyContinue
                    }
                }
            }
        }
    }
}
# -------------------------------------------------------

# build flag list
$flags = @()
$flags += "--type=$type"
switch ($type) {
    'local' {
        $flags += "--basePath=$basePath"
    }
    'smb' {
        $flags += "--share=$share"
        if ($username) { $flags += "--username=$username" }
        if ($password) { $flags += "--password=$password" }
        if ($domain) { $flags += "--domain=$domain" }
    }
    'sftp' {
        $flags += "--host=$sftpHost"
        if ($port) { $flags += "--port=$port" }
        if ($username) { $flags += "--username=$username" }
        if ($password) { $flags += "--password=$password" }
        if ($privateKey) { $flags += "--privateKey=$privateKey" }
        if ($root) { $flags += "--root=$root" }
    }
    default {
        Write-Error "Unknown type: $type"
        exit 1
    }
}
if ($recursive) { $flags += '--recursive' }
if ($maxDepth -ne $null) { $flags += "--maxDepth=$maxDepth" }

# command and path
if ($command) { $flags += $command }
if ($path) { $flags += $path }

$cli = "npx ts-node test/tools/fileaccess/accessTester.ts"
$cmd = "$cli $($flags -join ' ')"
Write-Host "Executing: $cmd"

Invoke-Expression $cmd
