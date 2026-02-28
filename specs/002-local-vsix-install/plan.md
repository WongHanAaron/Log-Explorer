# Implementation Plan: Local VSIX Packaging & Install Scripts

**Branch**: `002-local-vsix-install` | **Date**: 2026-02-28 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/002-local-vsix-install/spec.md`

## Summary

Adds three npm scripts (`package:local`, `install:local`, `release:local`) backed by two small
cross-platform Node.js helper scripts (`scripts/package-local.mjs`,
`scripts/install-local.mjs`). The package script creates a `releases/` output directory and
invokes `@vscode/vsce` to produce a versioned `.vsix` without marketplace credentials. The
install script locates the built `.vsix` and passes it to the `code` CLI. The combined
`release:local` chains both in order, failing fast on error. Updates `.gitignore`,
`.vscodeignore`, and README accordingly.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+ (ESM `.mjs` helper scripts)  
**Primary Dependencies**: `@vscode/vsce` ^3.7.1 (already installed); `code` CLI (VSCode, on PATH)  
**Storage**: N/A — output artefacts written to `releases/` on local filesystem  
**Testing**: Mocha + `@vscode/test-cli` (existing suite); no new test framework needed  
**Target Platform**: Windows, macOS, Linux (developer workstation)  
**Project Type**: VSCode Extension — build tooling addition  
**Performance Goals**: Full build + package in < 30 s on a modern developer machine  
**Constraints**: Zero marketplace credentials; zero internet required at package time; cross-platform  
**Scale/Scope**: Single developer command-line workflow; 2 new script files + 3 npm script entries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate Evaluation

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity & Focus | ✅ PASS | Adds only what is needed (2 script files, 3 npm entries). No excess dependencies. |
| II. Secure Webview Practices | ✅ N/A | This feature adds no webview code. |
| III. Test‑First Development | ⚠️ LIMITED | Scripts are build-tooling, not extension logic. Automated integration tests are impractical (require `code` CLI at test time). Manual acceptance testing via quickstart checklist is the mitigation. Justified below. |
| IV. Branch‑per‑Speckit‑Cycle | ✅ PASS | Work occurs on `002-local-vsix-install`; will squash-merge to `master`. |
| V. Semantic Versioning | ✅ PASS | No version bump needed for tooling-only changes (PATCH is optional; version bumping is out of scope for this feature per spec). |

**Post-Phase 1 re-check**: PASS — design introduces no new runtime code paths, no new
dependencies, and no webview changes. The test-first limitation for build scripts is
well-established practice; the quickstart.md acceptance procedure serves as the manual gate.

**Overall Status**: PASS (with documented justification for Principle III limitation)

## Project Structure

### Documentation (this feature)

```text
specs/002-local-vsix-install/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A for tooling — documents decisions)
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── npm-scripts.md   # Public script interface contract
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code Changes

```text
scripts/                          # NEW — cross-platform Node.js helper scripts
├── package-local.mjs             # Creates releases/ dir, runs vsce package
└── install-local.mjs             # Finds releases/*.vsix, runs code --install-extension

releases/                         # NEW — gitignored output folder for .vsix artefacts

package.json                      # MODIFIED — adds package:local, install:local, release:local scripts
.gitignore                        # MODIFIED — adds releases/ entry
.vscodeignore                     # MODIFIED — adds releases/** and scripts/** entries
README.md                         # MODIFIED — adds Local Install section
```

**Structure Decision**: Single-project layout. No new source folders under `src/`. Helper scripts
live in `scripts/` (separate from `src/` which is TypeScript extension source). The `releases/`
folder is created by the package script at runtime and is never committed.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Principle III (no automated tests for scripts) | `install:local` requires the `code` CLI and a live VSCode instance — not available in headless CI | Mocking the CLI or spawning VSCode in CI adds more complexity than the scripts themselves. Manual quickstart validation is the accepted mitigation. |
