# Research: Local VSIX Packaging & Install Scripts

**Feature**: 002-local-vsix-install  
**Phase**: 0 — Outline & Research  
**Date**: 2026-02-28

No NEEDS CLARIFICATION items were raised in the Technical Context — all decisions were determinable
from the existing project state and toolchain. This document records the key decisions and their
rationale for future reference.

---

## Decision 1: Cross-Platform Script Approach

**Decision**: Use two small Node.js ESM helper scripts (`scripts/package-local.mjs`,
`scripts/install-local.mjs`) rather than shell scripts or npm lifecycle hacks.

**Rationale**:
- The project already uses `esbuild.mjs` as an ESM Node.js build script; the same pattern is
  idiomatic and consistent.
- Node.js is guaranteed to be available on every developer machine (it is a prerequisite for
  running the project at all).
- Node.js `child_process.execSync` and `fs.mkdirSync` are fully cross-platform; no reliance on
  `mkdir -p` (Unix) or `mkdir /y` (Windows CMD) is needed.
- Shell-scripted npm `&&` chains work across platforms for the top-level `release:local` entry,
  but complex logic (finding the `.vsix` file, validating it exists) requires a real scripting
  host.

**Alternatives considered**:
- *PowerShell (`.ps1`) script*: Works great on Windows but requires PowerShell Core on macOS/Linux
  — an extra dependency. Rejected (FR-007).
- *Bash script (`.sh`)*: Works on macOS/Linux but fails on Windows without Git Bash or WSL.
  Rejected (FR-007).
- *Inline npm script with `cross-env` / `shx`*: Adds a runtime dependency and inline scripts
  become unreadable. Rejected (Principle I — Simplicity).

---

## Decision 2: Output Directory Name

**Decision**: `releases/` at the project root.

**Rationale**:
- Clearly communicates intent — these are releasable artefacts, not build intermediates.
- Keeps `.vsix` files separate from `dist/` (compiled TypeScript bundles) and `out/` (test
  compilation output), avoiding confusion.
- Excluded from version control via `.gitignore` and from the packaged extension via
  `.vscodeignore` — both already curated in the project.
- The spec listed `releases/` as the expected default (FR-003).

**Alternatives considered**:
- *`dist/` (co-located with compiled output)*: Would mix build artefacts with distributable
  packages. Rejected for clarity.
- *`build/`*: Common in other ecosystems but not idiomatic for VSCode extensions. Rejected.
- *Project root (current behaviour)*: `*.vsix` already matches the `.gitignore`, but files
  would clutter the root. Rejected (FR-003 requires a clearly named folder).

---

## Decision 3: vsce `--out` Flag for Output Directory

**Decision**: Use `vsce package --out releases/ --allow-missing-repository` to direct output
into the `releases/` folder.

**Rationale**:
- `@vscode/vsce` v3 supports `--out <path>` which accepts either a file path or a directory.
  When a directory is passed, vsce names the file automatically as `{name}-{version}.vsix`.
- FR-002 requires the filename to include the version (`logexplorer-0.1.0.vsix`) — this is the
  default vsce filename when `--out` points to a directory.
- The `package-local.mjs` script creates the directory with `fs.mkdirSync('releases',
  {recursive: true})` before invoking vsce, satisfying the edge-case requirement that the folder
  is auto-created.

**Alternatives considered**:
- *Always specify a full file path*: Would require reading `package.json` version in the script
  to construct the filename. Redundant when vsce already does this automatically. Rejected.

---

## Decision 4: Finding the .vsix for Install

**Decision**: `install-local.mjs` uses Node.js `fs.readdirSync` + `Array.find` to locate the
first `*.vsix` in `releases/`, then passes it to `code --install-extension <path>`.

**Rationale**:
- In the expected single-version workflow the `releases/` folder contains exactly one `.vsix`
  (overwritten on each package run because the filename is version-pinned and the developer bumps
  the version manually). Finding the first match is safe.
- Using `child_process.execSync` to invoke the `code` CLI follows the same pattern as running
  `vsce` — consistent and cross-platform.
- If no `.vsix` is found, the script exits with code 1 and a message: "No .vsix found in
  releases/. Run 'npm run package:local' first." (satisfies FR-005).

**Alternatives considered**:
- *Hard-code version in install script*: Would require updating the script on every version bump.
  Rejected (maintenance burden).
- *Read version from `package.json`*: A valid option but adds boilerplate for the same result.
  Dynamic glob find is simpler.

---

## Decision 5: npm Script Naming

**Decision**: `package:local`, `install:local`, `release:local`.

**Rationale**:
- The `:local` suffix clearly scopes these scripts as developer-local operations, distinct from
  any future `package` (marketplace publish) or `install` (npm dependency install) scripts.
- `release:local` as the combined command matches common toolchain conventions
  (e.g., `release:dry-run`, `release:ci`).
- Keeps existing `package` script (vsce package to project root) intact to avoid breaking the
  feature 001 workflow until it is superseded.

---

## Decision 6: PowerShell Script Implementation Pattern

**Decision**: Use PowerShell 7+ (`pwsh`) with `$ErrorActionPreference = 'Stop'`,
`New-Item -ItemType Directory -Force`, and `Invoke-Expression` / `Start-Process` to invoke `vsce`
and `code`, mirroring the Node.js `.mjs` script logic.

**Rationale**:
- `$ErrorActionPreference = 'Stop'` ensures any non-zero exit from child processes throws a
  terminating error, providing fail-fast behaviour equivalent to `process.exit(1)` in Node.js.
- `New-Item -ItemType Directory -Force` is the idiomatic PowerShell equivalent of
  `fs.mkdirSync(..., {recursive: true})` — safe to call even when the directory already exists.
- `Get-ChildItem releases -Filter *.vsix | Select-Object -First 1` provides the same `.vsix`
  discovery as `fs.readdirSync('releases').find(f => f.endsWith('.vsix'))`.
- PowerShell 7+ runs on Windows, macOS, and Linux, satisfying FR-007.
- Scripts are invoked directly as `pwsh -NoProfile -File scripts/package-local.ps1` —
  `‑NoProfile` avoids slow profile loading; `‑File` is preferred over `‑Command` for scripts.

**Alternatives considered**:
- *PowerShell 5.1 (Windows built-in)*: Rejected — not cross-platform (Q1 clarification answer B).
- *Replace `.mjs` files with `.ps1`*: Rejected — would break npm script backing for macOS/Linux
  developers without `pwsh` (Q2 clarification answer B — keep both).

---

## Summary Table

| Question | Resolution |
|----------|-----------|
| How to write cross-platform scripts? | Node.js ESM `.mjs` helper scripts (mirrors `esbuild.mjs` pattern) |
| Where does the `.vsix` go? | `releases/` folder at project root, auto-created |
| How does vsce output to `releases/`? | `vsce package --out releases/` (directory mode) |
| How does the install script find the `.vsix`? | `fs.readdirSync('releases').find(*.vsix)` / `Get-ChildItem releases -Filter *.vsix \| Select-Object -First 1` |
| What are the npm script names? | `package:local`, `install:local`, `release:local` |
| Does the existing `package` script change? | No — preserved as-is; `package:local` is additive |
| Any new npm dependencies needed? | None — `@vscode/vsce` already installed |
| PowerShell script runtime? | PowerShell 7+ (`pwsh`) — cross-platform, `$ErrorActionPreference = 'Stop'` for fail-fast |
| PS1 script location? | `scripts/` at project root, flat (alongside `.mjs` files) |
| Do `.ps1` scripts replace `.mjs`? | No — coexist; `.mjs` back npm entries, `.ps1` are standalone `pwsh` shortcuts |
