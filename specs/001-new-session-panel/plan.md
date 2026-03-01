# Implementation Plan: New Session Panel

**Branch**: `001-new-session-panel` | **Date**: 2026-02-28 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-new-session-panel/spec.md`

## Summary

Upgrade the existing `NewSessionPanel` stub into a fully functional two-panel webview. The left panel is a discovery area with four quadrants (New Session Templates, Recent Sessions, Local Logs stub, Getting Started stub). The right panel is a dynamic creation form. Data flows via the ready-handshake messaging pattern: on open the extension reads `.logex/session-templates/` and `.logex/sessions/` from disk and pushes them to the webview; on submit the webview sends form data back and the extension writes a new session folder + `session.json` under `.logex/sessions/`.

## Technical Context

**Language/Version**: TypeScript 5.x, target ES2020  
**Primary Dependencies**: VS Code API ^1.85.0; esbuild ^0.27  
**Storage**: Filesystem — `.logex/session-templates/*.json` (read) and `.logex/sessions/<name>/session.json` (read/write) via `vscode.workspace.fs`  
**Testing**: Mocha + `@vscode/test-cli` / `@vscode/test-electron` (existing project test setup; no new tests requested for this feature per spec)  
**Target Platform**: VS Code Extension Host (Node.js 18+); webview runs in sandboxed browser context  
**Project Type**: VS Code extension — WebviewPanel (editor tab)  
**Performance Goals**: Template list populates within 500 ms for ≥50 templates (SC-002)  
**Constraints**: Strict CSP (nonce-gated scripts, no `unsafe-eval`, no CDN); webview UI must use VS Code CSS custom properties only; all file I/O via `vscode.workspace.fs` (remote-workspace safe)  
**Scale/Scope**: Single panel; expected < 100 templates; < 1000 sessions

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Simplicity & Focus | ✅ PASS | Feature is narrowly scoped to session creation; Local Logs and Getting Started deliberately left as stubs |
| II. Secure Webview Practices | ✅ PASS | CSP enforced with per-page nonce (via `getNonce()`); resources via `asWebviewUri`; messages use discriminated `type` field and are validated |
| III. Test-First Development | ⚠ NOTED | No tests requested per spec. Constitution requires tests; this is a known deviation accepted by the spec author. Tests SHOULD be added in a follow-up cycle |
| IV. Branch-per-Speckit-Cycle | ✅ PASS | Work is on `001-new-session-panel`; merge to main via squash |
| V. Semantic Versioning | ✅ PASS | New user-facing feature → minor bump `0.2.0 → 0.3.0` required at implementation time |

**Gate**: PASS with one noted deviation (no tests). Re-checked after Phase 1 — no violations found in design.

## Project Structure

### Documentation (this feature)

```text
specs/001-new-session-panel/
├── plan.md                        ← This file
├── research.md                    ← Messaging, file I/O, UI tech, esbuild, schemas
├── data-model.md                  ← SessionTemplate, Session, SourceEntry, SessionSummary
├── quickstart.md                  ← Developer setup + verification checklist
├── contracts/
│   ├── messaging-protocol.md      ← Webview ↔ extension message types + sequence
│   └── session-schema.md          ← SessionTemplate JSON + session.json schemas
└── tasks.md                       ← (created by /speckit.tasks — not yet)
```

### Source Code (repository root)

```text
src/
├── panels/editors/
│   └── NewSessionPanel.ts          ← MODIFY: upgrade stub to full webview with messaging
├── workspace/
│   ├── sessionTemplates.ts         ← CREATE: loadTemplates(workspaceRoot)
│   └── sessions.ts                 ← CREATE: loadRecentSessions(), createSession(), toKebabCase()
└── webview/new-session/
    ├── main.ts                     ← CREATE: webview entry point (ready → init rendering, submit)
    └── styles.css                  ← CREATE: two-column layout using VS Code CSS variables

esbuild.mjs                         ← MODIFY: add newSessionWebviewConfig entry
```

### Output

```text
dist/
└── webview/
    └── new-session.js              ← compiled webview bundle (iife, browser target)
```

## Key Decisions

1. **Messaging**: Ready-handshake pattern — webview sends `ready`, extension responds with `init` payload. See [contracts/messaging-protocol.md](contracts/messaging-protocol.md).
2. **File I/O**: `vscode.workspace.fs` exclusively — safe for remote workspaces.
3. **UI Technology**: Vanilla TypeScript + VS Code CSS variables. `@vscode/webview-ui-toolkit` is archived (Nov 2024) and must not be used.
4. **Webview bundle**: New `newSessionWebviewConfig` entry in `esbuild.mjs` → `dist/webview/new-session.js`.
5. **Template schema**: Single JSON file per template under `.logex/session-templates/`. Malformed files silently skipped.
6. **Session storage**: `.logex/sessions/<kebab-name>/session.json`. `createDirectory` has mkdirp semantics — no parent check needed.

## Complexity Tracking

No constitution violations requiring justification.
