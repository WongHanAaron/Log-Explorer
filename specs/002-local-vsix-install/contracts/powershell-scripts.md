# Contract: PowerShell Convenience Scripts

**Feature**: 002-local-vsix-install  
**Phase**: 1 — Design (updated post-clarification session 2026-02-28)  
**Date**: 2026-02-28

These scripts are **standalone PowerShell 7+ conveniences** for developers who prefer a `pwsh`
terminal workflow. They are NOT npm script entries. They mirror the behaviour of their `.mjs`
counterparts exactly.

**Runtime requirement**: PowerShell 7+ (`pwsh` on PATH).  
See [npm-scripts.md](npm-scripts.md) for the npm-based interface.

---

## `scripts/package-local.ps1`

### Purpose
Creates the `releases/` directory and packages the extension into a `.vsix` file via `vsce`,
without marketplace credentials. Direct PowerShell equivalent of `npm run package:local`.

### Invocation
```powershell
pwsh -NoProfile -File scripts/package-local.ps1
```

Must be run from the **project root** (where `package.json` lives).

### Behaviour
1. Sets `$ErrorActionPreference = 'Stop'` (all errors terminate the script).
2. Creates `releases/` with `New-Item -ItemType Directory -Force` if it does not exist.
3. Invokes `npx vsce package --out releases/ --allow-missing-repository` (or equivalent).
4. Prints the path of the produced `.vsix` on success.

### Exit codes
| Code | Meaning |
|------|---------|
| 0 | Success — `.vsix` file written to `releases/` |
| Non-zero | Failure — compile error, vsce error, or I/O error |

### Post-conditions (success)
- `releases/logexplorer-{version}.vsix` exists and is a valid VSCode extension package.

---

## `scripts/install-local.ps1`

### Purpose
Finds the `.vsix` in `releases/` and installs it into the local VSCode instance.
Direct PowerShell equivalent of `npm run install:local`.

### Invocation
```powershell
pwsh -NoProfile -File scripts/install-local.ps1
```

Must be run from the **project root**.

### Behaviour
1. Sets `$ErrorActionPreference = 'Stop'`.
2. Uses `Get-ChildItem releases -Filter *.vsix | Select-Object -First 1` to find the package.
3. If no `.vsix` found: writes error message and exits with code 1.
4. Invokes `code --install-extension <path> --force`.
5. Prints confirmation message on success.

### Exit codes
| Code | Meaning |
|------|---------|
| 0 | Extension installed successfully |
| 1 | No `.vsix` found in `releases/` |
| Non-zero | `code` CLI not on PATH, or install command failed |

### Error messages
| Condition | Message |
|-----------|---------|
| No `.vsix` in `releases/` | `No .vsix found in releases/. Run 'npm run package:local' or 'pwsh -File scripts/package-local.ps1' first.` |

---

## Invariants (both scripts)

- MUST work on Windows, macOS, and Linux when PowerShell 7+ is installed.
- MUST NOT transmit data to external services or registries.
- MUST NOT require marketplace publisher credentials.
- MUST produce human-readable output on failure.
- MUST be invoked with `pwsh` (PowerShell 7+), not `powershell` (Windows PowerShell 5.1).
