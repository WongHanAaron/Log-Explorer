# Contract: npm Script Interface

**Feature**: 002-local-vsix-install  
**Phase**: 1 — Design  
**Date**: 2026-02-28

This document defines the public interface contract for the three npm scripts introduced by this
feature. Any implementation that satisfies this contract is acceptable.

---

## `npm run package:local`

### Purpose
Compiles the extension from source and packages it into a distributable `.vsix` file in
`releases/`. Does not require marketplace credentials or internet access.

### Pre-conditions
- `npm install` has been run (dependencies present).
- TypeScript source is valid (no compile errors).

### Command
```bash
npm run package:local
```

### Behaviour
1. Creates `releases/` directory if it does not exist.
2. Performs a production build (compiles TypeScript, bundles with esbuild).
3. Packages the extension using `@vscode/vsce` without marketplace credentials.
4. Writes a `.vsix` file to `releases/logexplorer-{version}.vsix` where `{version}` is read
   from `package.json`.

### Exit codes
| Code | Meaning |
|------|---------|
| 0 | Success — `.vsix` file written to `releases/` |
| Non-zero | Failure — compile error, vsce error, or I/O error |

### Post-conditions (success)
- `releases/logexplorer-{version}.vsix` exists and is a valid VSCode extension package.
- No marketplace account or network is needed.

### Stdout / Stderr
- Progress lines from `vsce package`.
- On error: message identifying the failing step printed before exit.

---

## `npm run install:local`

### Purpose
Installs the most recently packaged `.vsix` from `releases/` into the currently active local
VSCode instance without any UI interaction.

### Pre-conditions
- `npm run package:local` has been run at least once (a `.vsix` exists in `releases/`).
- The `code` CLI is available on the system PATH.

### Command
```bash
npm run install:local
```

### Behaviour
1. Scans `releases/` for files matching `*.vsix`.
2. If none found: prints error message and exits non-zero. Does NOT invoke `code`.
3. If found: passes the path to `code --install-extension <path> --force`.
4. On success: prints confirmation message including the installed version.

### Exit codes
| Code | Meaning |
|------|---------|
| 0 | Extension installed successfully |
| Non-zero | No `.vsix` found, `code` CLI not on PATH, or install command failed |

### Post-conditions (success)
- The extension is installed in VSCode at the version encoded in the `.vsix` filename.
- The version in the Extensions panel matches `package.json#version`.

### Stdout / Stderr
- On success: `Installed releases/logexplorer-{version}.vsix. Reload VSCode to activate.`
- On missing file: `No .vsix found in releases/. Run 'npm run package:local' first.`
- On missing `code` CLI: explains that VSCode CLI must be on PATH.

---

## `npm run release:local`

### Purpose
Convenience command that chains `package:local` and `install:local` in sequence. Stops on the
first failure. Suitable for fresh testing sessions.

### Pre-conditions
- Same as `package:local` (strongest pre-conditions apply).

### Command
```bash
npm run release:local
```

### Behaviour
1. Runs `npm run package:local`. If it fails, stops immediately.
2. Runs `npm run install:local`. If it fails, exits non-zero.

### Implementation
```json
"release:local": "npm run package:local && npm run install:local"
```

### Exit codes
| Code | Meaning |
|------|---------|
| 0 | Both package and install succeeded |
| Non-zero | One of the steps failed (which step is indicated in the output) |

---

## Invariants (apply to all three scripts)

- MUST work on Windows, macOS, and Linux without modification.
- MUST NOT transmit any data to external services or registries.
- MUST NOT require marketplace publisher credentials.
- MUST produce human-readable output on failure pointing to the corrective action.
