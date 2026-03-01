# Implementation Plan: Extension UI Commands & Panels

**Branch**: `001-extension-ui-commands` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-extension-ui-commands/spec.md`

## Summary

Register 5 commands: 4 editor-area webview panels (New Session, Log File Sources, Log File Lines, Session Templates) plus a workspace initialisation command (Setup New Workspace) that creates a `.logex` folder at the workspace root. Expand the existing Activity Bar sidebar with two collapsible views (Session Tools, Log Details) and add a bottom panel tab (Search Results). All UI surfaces are stub implementations. The `Setup New Workspace` command uses `vscode.workspace.fs` for cross-platform folder creation and a VS Code context key (`logexplorer.workspaceInitialized`) to show/hide itself based on whether `.logex` already exists.

## Technical Context

**Language/Version**: TypeScript 5.x targeting ES2020  
**Primary Dependencies**: `@types/vscode ^1.85.0`, `esbuild` (bundler), `typescript ^5.x`  
**Storage**: Local workspace filesystem — `.logex` folder created via `vscode.workspace.fs` (cross-platform, no native I/O)  
**Testing**: Mocha with `@vscode/test-cli` / `@vscode/test-electron`  
**Target Platform**: VS Code Extension Host, VS Code engine `^1.85.0` (cross-platform)  
**Project Type**: VS Code extension  
**Performance Goals**: Command palette to visible panel < 2 s; folder creation < 1 s; command palette response < 1 s  
**Constraints**: All webviews MUST use per-page CSP nonces; local resources via `webview.asWebviewUri`; messages MUST include `type` field (constitution §II); no native binaries; cross-platform file I/O only  
**Scale/Scope**: 8 UI surfaces; ~6 new TypeScript files; 0 new npm dependencies

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity & Focus | ✅ Pass | Stub UIs only; zero new production dependencies; `vscode.workspace.fs` is built-in |
| II. Secure Webview Practices | ✅ Pass | All new panels inherit existing nonce helper; CSP applied to every panel |
| III. Test-First Development | ✅ Pass | Tests for command registration and context key logic written before implementation |
| IV. Branch-per-Speckit-Cycle | ✅ Pass | Working on `001-extension-ui-commands` |
| V. Semantic Versioning | ✅ Pass | New user-facing features: `0.1.0 → 0.2.0` |

*Gate: PASS — no violations. Re-checked after Phase 1 design: PASS.*

## Project Structure

### Documentation (this feature)

```text
specs/001-extension-ui-commands/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── commands.md      ← Phase 1 output
└── tasks.md             ← Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── extension.ts                         ← updated: register new providers, commands & context key check
├── commands/
│   └── index.ts                         ← updated: register 5 commands (4 panels + setupWorkspace)
├── panels/
│   ├── LogExplorerPanel.ts              ← existing sidebar panel (unchanged)
│   ├── editors/                         ← NEW: WebviewPanel editor-area tabs
│   │   ├── NewSessionPanel.ts
│   │   ├── LogFileSourcesPanel.ts
│   │   ├── LogFileLinesPanel.ts
│   │   └── SessionTemplatesPanel.ts
│   └── views/                           ← NEW: WebviewViewProvider sidebar/bottom views
│       ├── SessionToolsViewProvider.ts
│       ├── LogDetailsViewProvider.ts
│       └── SearchResultsViewProvider.ts
├── workspace/                           ← NEW: workspace-level operations
│   └── setupWorkspace.ts               ← createLogexFolder + context key management
└── webview/
    ├── index.html                        ← existing (unchanged)
    ├── main.ts                           ← existing (unchanged)
    └── styles.css                        ← existing (unchanged)

test/
└── suite/
    ├── extension.test.ts                 ← existing
    └── commands.test.ts                  ← NEW: command registration + context key tests (written first)

package.json                              ← updated: new contributes entries + when clause
```

**Structure Decision**: Single project layout. New panel classes split into `editors/` (`WebviewPanel`) and `views/` (`WebviewViewProvider`). Workspace-level operations isolated in `src/workspace/` to keep them separate from UI concerns.

## Phase 0: Research

See [research.md](./research.md) for full findings. Key resolved decisions:

| Unknown | Decision |
|---------|----------|
| Editor panel open/focus deduplication | Static `currentPanel` + `reveal()` singleton per class |
| Bottom panel registration | `contributes.viewsContainers.panel` + `WebviewViewProvider` |
| Multiple sidebar views | Multiple entries in `contributes.views["logexplorer-container"]`, one provider per view ID |
| Stub webview HTML pattern | Inline HTML with per-page nonce; no bundled JS for stub phase |
| Cross-platform folder creation | `vscode.workspace.fs.createDirectory()` — no `fs` or `mkdirSync` needed |
| Command visibility based on filesystem state | VS Code context key `logexplorer.workspaceInitialized` set on activation; `when` clause gates command |

## Phase 1: Design

### Entities

See [data-model.md](./data-model.md).

### Interface Contracts

See [contracts/commands.md](./contrac
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
