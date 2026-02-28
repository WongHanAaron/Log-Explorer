# Build & Install Guide (Local VSIX)

This guide explains how to compile, package and install the LogExplorer extension on a
local machine. It covers both npm‑based scripts and PowerShell convenience scripts.

## Prerequisites

* Node.js 18+ is required for building the extension and running the helper scripts.
* VSCode 1.85+ with the `code` command‑line launcher on your `PATH`.
* Git (any recent version).
* Optional: PowerShell 7+ (`pwsh`) if you want to use the `.ps1` shortcuts (the scripts will now check for `pwsh` and fail fast with a helpful message if it's missing).

## Build & Package (npm)

```bash
cd /path/to/LogExplorer
npm install          # install dev dependencies
npm run package:local
```

The script performs a production build (`esbuild.mjs --production`), ensures the
`releases/` directory exists, and runs `npx vsce package --out releases/`
(`--allow-missing-repository` ensures packaging succeeds without a repository field).

On success you will see output similar to:

```
DONE  Packaged: releases/logexplorer-0.1.0.vsix (N files, X KB)
```

The generated `.vsix` lives in `releases/` and is git‑ignored.

## Install into VSCode (npm)

```bash
npm run install:local
```

This looks for the first `*.vsix` file in `releases/` and runs

```
code --install-extension "releases/logexplorer-<version>.vsix" --force
```

The `--force` flag replaces any prior installation.

If no package is present you will see:

```
No .vsix found in releases/. Run 'npm run package:local' first.
```

## Full Release in One Step (npm)

```bash
npm run release:local
```

This simply chains the two commands above; if packaging fails the install step is not
attempted.

## PowerShell 7+ Convenience (optional)

If you have PowerShell 7+ (`pwsh`) installed, you can invoke equivalent helper
scripts directly without using npm.

```powershell
pwsh -NoProfile -File scripts/package-local.ps1
pwsh -NoProfile -File scripts/install-local.ps1
```

The first command builds and packages, the second installs the resulting `.vsix`.
To do both in sequence:

```powershell
pwsh -NoProfile -File scripts/package-local.ps1; \
  if ($LASTEXITCODE -eq 0) { pwsh -NoProfile -File scripts/install-local.ps1 }
```

Note that `pwsh` must be on your PATH if you want to run the helper scripts
in a separate PowerShell 7 process.  If you launch the `.ps1` files from the
built‑in Windows PowerShell 5.1 the scripts will now fall back to the current
shell and simply emit a warning; they still perform the build/package or
install steps just fine.  The npm commands (`npm run package:local` /
`npm run install:local`) always work regardless of which shell you use.
## Troubleshooting

* **`code: command not found`** – ensure VSCode is installed and the CLI added to PATH.
* **`pwsh: command not found`** – install PowerShell 7+ from Microsoft if you want to use
  the `.ps1` scripts.
* **TypeScript compile error during packaging** – fix the source error and re-run.
* **Disk full/File permission error** – clear space or check write permissions on `releases/`.

## Notes

* The `releases/` directory is excluded from both Git and the VSIX package via
  `.gitignore`/`.vscodeignore` so you can build as often as you like without
  polluting the repo.
* The npm scripts are cross‑platform; the `.ps1` scripts require `pwsh`, which is
  available on all three supported OSes but not installed by default.
* Use `npm run package` (without `:local`) if you intend to publish on the
  marketplace — that behaviour is unchanged by this feature.
