# Implementation Plan: File Source Setup

**Branch**: `003-file-source-setup` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-file-source-setup/spec.md`

## Summary

This feature adds the workspace initialization command and two webview-based config editors that let developers define *where* log files live (filepath configs) and *how* log lines are structured (line-parsing configs). All configuration is persisted as versioned JSON files on disk under `.logex/` using kebab-cased short names as filenames, backed by explicit TypeScript domain objects shared across the extension.

## Technical Context

**Language/Version**: TypeScript 5.x targeting ES2020
**Primary Dependencies**: `vscode` ^1.85.0; no new runtime npm packages required (regex and JSON path handled natively; XPath via the `xmldom`/`xpath` pairing if XML parsing needed in later phases)
**Storage**: JSON files on disk under `.logex/filepath-configs/` and `.logex/filelog-configs/` read and written via `vscode.workspace.fs` (async, cross-platform)
**Testing**: Mocha with `@vscode/test-cli` / `@vscode/test-electron`; unit tests for domain objects and serialisation; extension integration tests for commands and webview messaging
**Target Platform**: VSCode Extension Host, Node.js 18+, Windows / macOS / Linux
**Project Type**: VSCode extension feature (new command + two WebviewPanel editors)
**Performance Goals**: Config operations are disk I/O on small JSON files (<10 KB); no latency targets beyond "instant on human scale"
**Constraints**: Strict CSP with per-page nonces on all webviews (constitution §II); cross-platform paths via `vscode.Uri`; test-first (constitution §III); no native binaries
**Scale/Scope**: Tens of config files per workspace; no database or network access

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity & Focus | ✅ PASS | Feature is narrowly scoped to config CRUD; no extraneous libs |
| II. Secure Webview Practices | ✅ PASS | Both editors must use CSP nonces and `localResourceRoots`; messages typed with `type` field |
| III. Test-First Development | ✅ PASS | Domain model serialisation and command logic must have failing tests before implementation |
| IV. Branch-per-Cycle | ✅ PASS | Branch `003-file-source-setup` must be created before implementation begins |
| V. Semantic Versioning | ✅ PASS | No version bump required at planning phase; bump MINOR on merge |

*No constitution violations. Both Phase 0 (research) and Phase 1 (design) gates pass.*

## Project Structure

### Documentation (this feature)

```text
specs/003-file-source-setup/
├── plan.md        ← this file
├── research.md    ← Phase 0
├── data-model.md  ← Phase 1
├── quickstart.md  ← Phase 1
└── contracts/
    ├── commands.md
    └── webview-messages.md
```

### Source Code Layout

```text
src/
├── commands/
│   └── index.ts              # existing – add initializeWorkspace command
├── domain/
│   ├── filepath-config.ts    # FilepathConfig domain object + validator
│   └── filelog-config.ts     # FileLogLineConfig hierarchy + validators
├── services/
│   ├── config-store.ts       # read/write JSON from .logex/ via vscode.workspace.fs
│   └── kebab.ts              # short-name sanitisation helpers
└── panels/
    ├── FilepathConfigEditor.ts   # WebviewPanel for Log Filepath Config Editor
    └── FilelogConfigEditor.ts    # WebviewPanel for File Log Line Config Editor

src/webview/
├── filepath-editor/
│   ├── index.html
│   ├── main.ts
│   └── styles.css
└── filelog-editor/
    ├── index.html
    ├── main.ts
    └── styles.css

test/
├── unit/
│   ├── domain/filepath-config.test.ts
│   ├── domain/filelog-config.test.ts
│   └── services/config-store.test.ts
└── suite/
    └── filelog-commands.test.ts  # integration tests for extension commands

.logex/                  ← workspace data (gitignored by default, user's choice)
  filepath-configs/      ← created by Initialize Workspace command
  filelog-configs/       ← created by Initialize Workspace command
```

**Structure Decision**: Single VS Code extension project; new `domain/` and `services/` folders added to `src/` for clean separation. Two new WebviewPanel implementations under `panels/`. Webview HTML/TS placed in `src/webview/` sub-folders consistent with existing `src/webview/` pattern.

## Complexity Tracking

No constitution violations. No complexity justification required.
