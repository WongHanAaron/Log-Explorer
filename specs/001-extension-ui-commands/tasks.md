# Tasks: Extension UI Commands & Panels

**Input**: Design documents from `/specs/001-extension-ui-commands/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/commands.md ✅ quickstart.md ✅  
**Tests**: Not requested — no test tasks included per spec.  
**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable — uses a different file, no dependency on incomplete tasks in this phase
- **[Story]**: User story this task belongs to (US1–US8, maps to spec.md)
- Exact file paths included in every description

---

## Phase 1: Setup

**Purpose**: Manifest contributions and shared infrastructure that all user story phases depend on.

- [X] T001 Update `package.json` `contributes` block: add 5 new commands (`logexplorer.newSession`, `logexplorer.editLogFileSourceConfig`, `logexplorer.editFileLogLineConfig`, `logexplorer.editSessionTemplates`, `logexplorer.setupWorkspace`), register new sidebar views (`logexplorer.sessionTools`, `logexplorer.logDetails`) under `logexplorer-container`, add bottom panel container `logexplorer-bottom` and `logexplorer.searchResults` view, and add `menus.commandPalette` entry with `when` clause `workspaceFolderCount > 0 && !logexplorer.workspaceInitialized` for `logexplorer.setupWorkspace` per `contracts/commands.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared utilities that every new panel class imports. MUST be complete before any user story implementation begins.

**⚠️ CRITICAL**: No panel implementation can begin until T002 and T003 are complete.

- [X] T002 [P] Create `src/utils/nonce.ts` — export `getNonce(): string` (32-char alphanumeric random string); extract logic from `LogExplorerPanel._getNonce()` so all new panels share one implementation
- [X] T003 [P] Create `src/utils/stubHtml.ts` — export `getStubWebviewHtml(title: string, message: string, cspSource: string): string` returning a complete nonce-gated HTML document with VS Code CSS variables, a heading, and a placeholder paragraph; uses `getNonce()` from `src/utils/nonce.ts`

**Checkpoint**: `src/utils/nonce.ts` and `src/utils/stubHtml.ts` exist and compile — user story implementation can now begin.

---

## Phase 3: User Story 1 — New Session Panel (Priority: P1) 🎯 MVP

**Goal**: The `Log Explorer: New Session` command opens a stub editor panel titled "New Session"; re-invoking focuses the existing panel.

**Independent Test**: Run `Log Explorer: New Session` from Command Palette → editor tab "New Session" opens with stub content. Run again → same tab is focused, no duplicate.

- [X] T004 [US1] Create `src/panels/editors/NewSessionPanel.ts` — implement `WebviewPanel` singleton class with `static currentPanel: NewSessionPanel | undefined`, `static createOrShow(extensionUri: Uri): void` (calls `reveal()` if panel exists, else creates new panel with `viewType: 'logexplorer.newSession'`, `title: 'New Session'`), `onDidDispose` clearing `currentPanel`, and `webview.html` set via `getStubWebviewHtml` from `src/utils/stubHtml.ts`
- [X] T005 [US1] Register `logexplorer.newSession` command in `src/commands/index.ts` — handler calls `NewSessionPanel.createOrShow(context.extensionUri)`
- [X] T006 [US1] Wire `logexplorer.newSession` registration into `src/extension.ts` `activate()` function

**Checkpoint**: US1 fully functional — `Log Explorer: New Session` opens and focuses stub panel. ✅ MVP deliverable.

---

## Phase 4: User Story 2 — Activity Rail Sidebar Session Tools (Priority: P2)

**Goal**: The Log Explorer Activity Bar sidebar expands to show a "Session Tools" collapsible section with stub content.

**Independent Test**: Click the LogExplorer Activity Bar icon → sidebar opens → "Session Tools" section visible with stub placeholder content.

- [X] T007 [US2] Create `src/panels/views/SessionToolsViewProvider.ts` — implement `WebviewViewProvider` with `resolveWebviewView()` setting `webviewView.webview.html` to `getStubWebviewHtml('Session Tools', 'Session tools will appear here.', webviewView.webview.cspSource)`
- [X] T008 [US2] Register `logexplorer.sessionTools` view provider in `src/extension.ts` `activate()` via `vscode.window.registerWebviewViewProvider('logexplorer.sessionTools', new SessionToolsViewProvider(context.extensionUri))`

**Checkpoint**: US2 fully functional — "Session Tools" view renders stub in sidebar. ✅

---

## Phase 5: User Story 3 — Log File Sources Panel (Priority: P2)

**Goal**: The `Log Explorer: Edit Log File Source Config` command opens a stub editor panel titled "Log File Sources".

**Independent Test**: Run `Log Explorer: Edit Log File Source Config` → editor tab "Log File Sources" opens with stub content.

- [X] T009 [US3] Create `src/panels/editors/LogFileSourcesPanel.ts` — same singleton pattern as `NewSessionPanel.ts` with `viewType: 'logexplorer.logFileSources'`, `title: 'Log File Sources'`, stub HTML via `getStubWebviewHtml('Log File Sources', 'Log file source configuration will appear here.', ...)`
- [X] T010 [US3] Register `logexplorer.editLogFileSourceConfig` command in `src/commands/index.ts` — handler calls `LogFileSourcesPanel.createOrShow(context.extensionUri)`
- [X] T011 [US3] Wire `logexplorer.editLogFileSourceConfig` registration into `src/extension.ts` `activate()`

**Checkpoint**: US3 fully functional — `Log Explorer: Edit Log File Source Config` opens stub panel. ✅

---

## Phase 6: User Story 4 — Log File Lines Panel (Priority: P2)

**Goal**: The `Log Explorer: Edit File Log Line Config` command opens a stub editor panel titled "Log File Lines".

**Independent Test**: Run `Log Explorer: Edit File Log Line Config` → editor tab "Log File Lines" opens with stub content.

- [X] T012 [US4] Create `src/panels/editors/LogFileLinesPanel.ts` — same singleton pattern with `viewType: 'logexplorer.logFileLines'`, `title: 'Log File Lines'`, stub HTML via `getStubWebviewHtml('Log File Lines', 'Log line parsing configuration will appear here.', ...)`
- [X] T013 [US4] Register `logexplorer.editFileLogLineConfig` command in `src/commands/index.ts` — handler calls `LogFileLinesPanel.createOrShow(context.extensionUri)`
- [X] T014 [US4] Wire `logexplorer.editFileLogLineConfig` registration into `src/extension.ts` `activate()`

**Checkpoint**: US4 fully functional — `Log Explorer: Edit File Log Line Config` opens stub panel. ✅

---

## Phase 7: User Story 8 — Setup New Workspace (Priority: P2)

**Goal**: `Log Explorer: Setup New Workspace` creates `.logex` at workspace root, shows confirmation, and hides itself. Command is invisible when `.logex` exists or no workspace is open.

**Independent Test**: Open workspace without `.logex` → run `Log Explorer: Setup New Workspace` → `.logex` folder created on disk → notification "Log Explorer workspace initialised." shown → command gone from palette.

- [X] T015 [US8] Create `src/workspace/setupWorkspace.ts` — export `syncWorkspaceContext(): Promise<void>` (stats `.logex` via `vscode.workspace.fs.stat()`, calls `vscode.commands.executeCommand('setContext', 'logexplorer.workspaceInitialized', bool)`) and `executeSetupWorkspace(): Promise<void>` (calls `vscode.workspace.fs.createDirectory(root/.logex)`, on success calls `syncWorkspaceContext()` then `vscode.window.showInformationMessage('Log Explorer workspace initialised.')`, on error calls `vscode.window.showErrorMessage('Log Explorer: Failed to initialise workspace.')` without exposing error internals)
- [X] T016 [US8] Register `logexplorer.setupWorkspace` command in `src/commands/index.ts` — handler calls `executeSetupWorkspace()`
- [X] T017 [US8] Wire `syncWorkspaceContext()` call on activation and `logexplorer.setupWorkspace` command registration into `src/extension.ts` `activate()` — `syncWorkspaceContext` MUST be awaited before commands are registered so the initial `when` clause state is correct

**Checkpoint**: US8 fully functional — command visible in fresh workspace, hidden after creation, context key correctly maintained. ✅

---

## Phase 8: User Story 5 — Session Templates Panel (Priority: P3)

**Goal**: The `Log Explorer: Edit Session Templates` command opens a stub editor panel titled "Session Templates".

**Independent Test**: Run `Log Explorer: Edit Session Templates` → editor tab "Session Templates" opens with stub content.

- [X] T018 [US5] Create `src/panels/editors/SessionTemplatesPanel.ts` — same singleton pattern with `viewType: 'logexplorer.sessionTemplates'`, `title: 'Session Templates'`, stub HTML via `getStubWebviewHtml('Session Templates', 'Session template management will appear here.', ...)`
- [X] T019 [US5] Register `logexplorer.editSessionTemplates` command in `src/commands/index.ts` — handler calls `SessionTemplatesPanel.createOrShow(context.extensionUri)`
- [X] T020 [US5] Wire `logexplorer.editSessionTemplates` registration into `src/extension.ts` `activate()`

**Checkpoint**: US5 fully functional — `Log Explorer: Edit Session Templates` opens stub panel. ✅

---

## Phase 9: User Story 6 — Log Details Side Panel (Priority: P3)

**Goal**: A "Log Details" collapsible section appears in the Log Explorer sidebar with stub placeholder content.

**Independent Test**: Click the LogExplorer Activity Bar icon → sidebar opens → "Log Details" section visible with stub placeholder content.

- [X] T021 [US6] Create `src/panels/views/LogDetailsViewProvider.ts` — implement `WebviewViewProvider` with `resolveWebviewView()` setting stub HTML via `getStubWebviewHtml('Log Details', 'Log entry details will appear here.', webviewView.webview.cspSource)`
- [X] T022 [US6] Register `logexplorer.logDetails` view provider in `src/extension.ts` `activate()` via `vscode.window.registerWebviewViewProvider('logexplorer.logDetails', new LogDetailsViewProvider(context.extensionUri))`

**Checkpoint**: US6 fully functional — "Log Details" view renders stub in sidebar. ✅

---

## Phase 10: User Story 7 — Search Results Bottom Panel (Priority: P3)

**Goal**: A "Search Results" tab appears in the VS Code bottom panel area with stub placeholder content.

**Independent Test**: Open VS Code bottom panel → "Search Results" tab visible → clicking it shows stub content.

- [X] T023 [US7] Create `src/panels/views/SearchResultsViewProvider.ts` — implement `WebviewViewProvider` with `resolveWebviewView()` setting stub HTML via `getStubWebviewHtml('Search Results', 'Log search results will appear here.', webviewView.webview.cspSource)`
- [X] T024 [US7] Register `logexplorer.searchResults` view provider in `src/extension.ts` `activate()` via `vscode.window.registerWebviewViewProvider('logexplorer.searchResults', new SearchResultsViewProvider(context.extensionUri))`

**Checkpoint**: US7 fully functional — "Search Results" tab renders stub in bottom panel. ✅

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final quality and release hygiene tasks.

- [X] T025 Bump version in `package.json` from `0.1.0` to `0.2.0` per constitution §V (Semantic Versioning — new user-facing features warrant a minor bump)
- [X] T026 Run `npm run build` and confirm zero TypeScript compile errors and zero esbuild warnings across all new files
- [X] T027 [P] Update `LogExplorerPanel.ts` to import `getNonce` from `src/utils/nonce.ts` instead of using its private `_getNonce()` method, to unify the nonce implementation (remove the duplicate private method)

---

## Dependencies (User Story Completion Order)

```
Phase 1 (T001) ──► Phase 2 (T002, T003)
                         │
           ┌─────────────┼──────────────────────────────────────┐
           ▼             ▼                    ▼                  ▼
     Phase 3 (US1)  Phase 4 (US2)       Phase 7 (US8)      [any P2]
      P1 - MVP       P2 - sidebar        P2 - workspace
           │
    ┌──────┼──────┐
    ▼      ▼      ▼
  US3    US4    [P2 panels can run in any order after foundation]
           │
    ┌──────┼──────┐
    ▼      ▼      ▼
  US5    US6    US7   (all P3, independent of each other)
           │
     Phase 11 (Polish)
```

**Key dependency rules**:
- T001 (package.json) blocks everything — must be first
- T002 + T003 (utils) block all panel/view class creation tasks
- Within each user story phase: new-file tasks [P] can run in parallel; edits to `src/commands/index.ts` and `src/extension.ts` are sequential (same files touched across phases)
- US2, US3, US4, US8 are all P2 — once Phase 2 is done, their new-file tasks (T007, T009, T012, T015) are fully parallelizable
- T017 (`extension.ts`) MUST await `syncWorkspaceContext()` before command registration — preserve ordering within that file

## Parallel Execution Examples

### After T001 + T002 + T003 are done, these can run simultaneously:
- T004 (`NewSessionPanel.ts`) + T007 (`SessionToolsViewProvider.ts`) + T009 (`LogFileSourcesPanel.ts`) + T012 (`LogFileLinesPanel.ts`) + T015 (`setupWorkspace.ts`) + T018 (`SessionTemplatesPanel.ts`) + T021 (`LogDetailsViewProvider.ts`) + T023 (`SearchResultsViewProvider.ts`)

### After all new files exist:
- T005 → T006 (`commands/index.ts` then `extension.ts` for newSession)
- T010 → T011 (logFileSourceConfig)
- T013 → T014 (logFileLineConfig)
- T016 → T017 (setupWorkspace — but T017 requires special ordering inside extension.ts)

## Implementation Strategy

**MVP (Phase 3 only)**: Complete T001 → T002+T003 → T004+T005+T006. This delivers US1 (New Session panel) as the independently testable first increment.

**Full P2 sweep**: After MVP, complete Phases 4-7 (US2, US3, US4, US8) — all independent of each other after the foundation.

**P3 completion**: Phases 8-10 (US5, US6, US7) are all independent; can be done in any order or in parallel.

**Polish**: Phase 11 last, confirms the full feature compiles cleanly and version is bumped.

---

## Task Count Summary

| Phase | User Story | Priority | Tasks | New Files |
|-------|-----------|----------|-------|-----------|
| 1 | Setup | — | 1 | 0 |
| 2 | Foundational | — | 2 | 2 |
| 3 | US1 New Session Panel | P1 | 3 | 1 |
| 4 | US2 Activity Rail Sidebar | P2 | 2 | 1 |
| 5 | US3 Log File Sources | P2 | 3 | 1 |
| 6 | US4 Log File Lines | P2 | 3 | 1 |
| 7 | US8 Setup New Workspace | P2 | 3 | 1 |
| 8 | US5 Session Templates | P3 | 3 | 1 |
| 9 | US6 Log Details Panel | P3 | 2 | 1 |
| 10 | US7 Search Results Panel | P3 | 2 | 1 |
| 11 | Polish | — | 3 | 0 |
| **Total** | | | **27** | **10** |

**Parallel opportunities identified**: 8 new-file creation tasks can all run concurrently after Phase 2. Phases 4–7 are fully independent of each other.  
**MVP scope**: Phases 1–3 (7 tasks) deliver US1 as the first independently demonstrable increment.
