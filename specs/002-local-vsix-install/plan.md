# Implementation Plan: Local VSIX Packaging & Install Scripts

**Branch**: `002-local-vsix-install` | **Date**: 2026-02-28 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/002-local-vsix-install/spec.md`

## Summary

Adds three npm scripts (`package:local`, `install:local`, `release:local`) backed by two
cross-platform Node.js ESM helper scripts (`scripts/package-local.mjs`,
`scripts/install-local.mjs`). Also adds two supplemental PowerShell 7+ convenience scripts
(`scripts/package-local.ps1`, `scripts/install-local.ps1`) for developers who prefer a `pwsh`
workflow. The package scripts create a `releases/` output directory and invoke `@vscode/vsce`
to produce a versioned `.vsix` without marketplace credentials. The install scripts locate the
built `.vsix` and pass it to the `code` CLI. The combined `release:local` npm script chains both
in order, failing fast on error. Updates `.gitignore`, `.vscodeignore`, and README accordingly.

## Technical Context

**Language/Version**: Node.js 18+ / ESM `.mjs` helper scripts; PowerShell 7+ (`pwsh`) for `.ps1` convenience scripts  
**Primary Dependencies**: `@vscode/vsce` ^3.7.1 (already installed); `code` CLI (VSCode, on PATH); `pwsh` (PowerShell 7+, optional for `.ps1` scripts)  
**Storage**: N/A — output artefacts written to `releases/` on local filesystem  
**Testing**: Mocha + `@vscode/test-cli` (existing suite); no new test framework needed  
**Target Platform**: Windows, macOS, Linux (developer workstation)  
**Project Type**: VSCode Extension — build tooling addition  
**Performance Goals**: Full build + package in < 30 s on a modern developer machine  
**Constraints**: Zero marketplace credentials; zero internet required at package time; cross-platform for `.mjs` scripts; `pwsh` required for `.ps1` scripts  
**Scale/Scope**: Single developer command-line workflow; 4 new script files + 3 npm script entries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate Evaluation

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity & Focus | ✅ PASS | Adds only what is needed. Two script types serve two distinct audiences (npm users vs pwsh users). No excess dependencies. |
| II. Secure Webview Practices | ✅ N/A | This feature adds no webview code. |
| III. Test‑First Development | ⚠️ LIMITED | Scripts are build-tooling, not extension logic. Automated integration tests are impractical (require `code` CLI at test time). Manual acceptance testing via quickstart.md checklist is the documented mitigation. Justified below. |
| IV. Branch‑per‑Speckit‑Cycle | ✅ PASS | Work occurs on `002-local-vsix-install`; will squash-merge to `master`. |
| V. Semantic Versioning | ✅ PASS | No version bump needed for tooling-only changes. |

**Post-Phase 1 re-check**: PASS — clarification session added PS7+ `.ps1` scripts as a parallel delivery alongside `.mjs` scripts. Design introduces no new runtime code paths, no new npm dependencies, and no webview changes. Test-first limitation for build scripts is well-established practice; quickstart.md acceptance procedure serves as the manual gate.

**Overall Status**: PASS (with documented justification for Principle III limitation)

## Project Structure

### Documentation (this feature)

```text
specs/002-local-vsix-install/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── npm-scripts.md   # Public script interface contract
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code Changes

```text
scripts/                          # NEW — cross-platform helper scripts (flat, all types)
├── package-local.mjs             # Node.js ESM: creates releases/ dir, runs vsce package
├── install-local.mjs             # Node.js ESM: finds releases/*.vsix, runs code --install-extension
├── package-local.ps1             # PowerShell 7+: same behaviour as .mjs counterpart
└── install-local.ps1             # PowerShell 7+: same behaviour as .mjs counterpart

releases/                         # NEW — gitignored output folder for .vsix artefacts

package.json                      # MODIFIED — adds package:local, install:local, release:local scripts
.gitignore                        # MODIFIED — adds releases/ entry
.vscodeignore                     # MODIFIED — adds releases/** and scripts/** entries
README.md                         # MODIFIED — adds Local Install section covering both script types
```

**Structure Decision**: Single-project layout. No new source folders under `src/`. All helper
scripts live flat under `scripts/`. The `.mjs` scripts back the npm entries; the `.ps1` scripts
are standalone convenience wrappers for `pwsh` users. The `releases/` folder is runtime-created
and never committed.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Principle III (no automated tests for scripts) | `install:local` requires the `code` CLI and a live VSCode instance — not available in headless CI | Mocking the CLI or spawning VSCode in CI adds more complexity than the scripts themselves. Manual quickstart validation is the accepted mitigation. |
| Dual script types (.mjs + .ps1) | Clarification session decision: `.ps1` scripts are supplemental conveniences; `.mjs` scripts back npm entries | Replacing `.mjs` with `.ps1` would break cross-platform npm usage for macOS/Linux developers without `pwsh`. |
