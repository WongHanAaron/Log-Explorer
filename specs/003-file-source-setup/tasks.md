# Tasks: File Source Setup (003)

**Input**: Design documents from `specs/003-file-source-setup/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Organization**: Phases follow TDD order — test stubs before domain code, domain before services,
services before UI.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to ([US1], [US2], [US3])
- Exact file paths are in every task description

---

## Phase 1: Domain Objects — Tests First (TDD)

**Purpose**: Define and validate domain types with tests before any implementation.

- [ ] T001 [US2] Create `test/unit/domain/filepath-config.test.ts` — tests: `isFilepathConfig` accepts valid object; rejects missing shortName; rejects non-kebab shortName; rejects empty label; rejects empty pathPattern; `isKebabName` pattern edge cases; `toKebabName` lowercases and strips special chars
- [ ] T002 [US2] Create `src/domain/filepath-config.ts` — `FilepathConfig` interface, `isFilepathConfig`, `isKebabName`, `toKebabName` — make T001 pass
- [ ] T003 [US3] Create `test/unit/domain/filelog-config.test.ts` — tests: `isFileLogLineConfig` dispatches correctly for `text`/`xml`/`json`; rejects unknown type; `TextLineConfig` with prefix-suffix extraction; `TextLineConfig` with regex extraction; `JsonLineConfig` with field mappings; `XmlLineConfig` with fields
- [ ] T004 [US3] Create `src/domain/filelog-config.ts` — all interfaces and validators from data-model.md — make T003 pass

**Checkpoint**: `npm run test:unit` passes for all domain tests.

---

## Phase 2: Config Store Service — Tests First (TDD)

**Purpose**: Read/write/list/delete config JSON files via `vscode.workspace.fs`.

- [ ] T005 [US2] Create `test/unit/services/config-store.test.ts` — tests: `configFilename` produces `{shortName}.json`; `parseFilepathConfig` returns config on valid JSON; `parseFilepathConfig` throws on malformed JSON; short-name–to-filename mapping roundtrip; `parseFileLogLineConfig` returns correct union type on valid text/json configs
- [ ] T006 [US2] Create `src/services/config-store.ts` — exports: `configFilename(shortName)`, `parseFilepathConfig(json)`, `parseFileLogLineConfig(json)`, `listConfigs(dir: vscode.Uri)`, `readConfig(dir: vscode.Uri, shortName)`, `writeConfig(dir: vscode.Uri, shortName, data)`, `deleteConfig(dir: vscode.Uri, shortName)` — all I/O via `vscode.workspace.fs`

**Checkpoint**: `npm run test:unit` passes for all config-store tests.

---

## Phase 3: US1 — Initialize Workspace

**Purpose**: Extend `setupWorkspace.ts` to create both subdirectories and optionally update `.gitignore`.

- [ ] T007 [US1] Update `src/workspace/setupWorkspace.ts`:
  - Create `.logex/filepath-configs/` via `vscode.workspace.fs.createDirectory` (idempotent)
  - Create `.logex/filelog-configs/` via `vscode.workspace.fs.createDirectory` (idempotent)
  - If `.gitignore` exists at workspace root and does not already contain `.logex/`: prompt user "Add .logex/ to .gitignore? (Yes / No)" via `showInformationMessage` with choices; if Yes, append `\n# Log Explorer config\n.logex/\n`
  - Success notification: `"Log Explorer workspace initialised."`
  - Error notification on fs failure without exposing internals

**Checkpoint**: US1 acceptance scenarios 1–3 from spec.md pass manually.

---

## Phase 4: US2 — Log Filepath Config Editor

**Purpose**: Replace stub `LogFileSourcesPanel.ts` with a working CRUD editor.

- [ ] T008 [P] [US2] Create `src/webview/filepath-editor/index.html` — full HTML with CSP nonce, VS Code CSS variables, form fields: shortName (text), label (text), pathPattern (text), description (textarea); action buttons: Save, Cancel; inline validation error display areas
- [ ] T009 [P] [US2] Create `src/webview/filepath-editor/main.ts` — `acquireVsCodeApi()`, handle `filepath-config:load` message to populate form; handle `filepath-config:save-result`; on Save click post `filepath-config:save`; short-name blur validation (pattern + `filepath-config:validate-name`); handle `filepath-config:name-available` response
- [ ] T010 [P] [US2] Create `src/webview/filepath-editor/styles.css` — form layout using VS Code CSS variables (`--vscode-input-background`, `--vscode-button-background`, etc.)
- [ ] T011 [US2] Update `src/panels/editors/LogFileSourcesPanel.ts` — replace stub with full implementation:
  - Load `src/webview/filepath-editor/index.html` with nonce via `getWebviewContent()`
  - Handle messages: `filepath-config:save` → validate → write via `config-store.ts`, post `save-result`; `filepath-config:validate-name` → check file existence, post `name-available`
  - `createOrShow(extensionUri, shortName?)` — load existing config if `shortName` provided
  - `localResourceRoots` set to `[extensionUri]`
  - Post `filepath-config:load` on panel show with config or null for new

**Checkpoint**: US2 acceptance scenarios 1–5 from spec.md pass manually.

---

## Phase 5: US3 — File Log Line Config Editor

**Purpose**: Replace stub `LogFileLinesPanel.ts` with a working CRUD editor supporting text/xml/json.

- [ ] T012 [P] [US3] Create `src/webview/filelog-editor/index.html` — form with: shortName, label, description, type selector (text/xml/json); dynamic section that shows relevant fields per type:
  - Text: extraction kind selector (prefix-suffix / regex), field list with add/remove, per-field: name, extraction inputs, optional datetime format
  - XML: field list with name + xpath (no rootXPath needed)
  - JSON: field list with name + jsonPath
  - Regex fields include a "Test" button that sends `filelog-config:test-regex`
- [ ] T013 [P] [US3] Create `src/webview/filelog-editor/main.ts` — handle `filelog-config:load`; dynamic field rendering on type change; Save posts `filelog-config:save`; Test Regex posts `filelog-config:test-regex`; handle `filelog-config:regex-test-result` to display match/error; handle `filelog-config:save-result`
- [ ] T014 [P] [US3] Create `src/webview/filelog-editor/styles.css` — VS Code CSS variables, field-list layout with add/remove row buttons
- [ ] T015 [US3] Update `src/panels/editors/LogFileLinesPanel.ts` — replace stub with full implementation:
  - Load `src/webview/filelog-editor/index.html` with nonce
  - Handle `filelog-config:save` → validate → write via `config-store.ts`, post `save-result`
  - Handle `filelog-config:test-regex` → compile and test regex safely in extension host, post result
  - Handle `filelog-config:validate-name` → file existence check, post `name-available`
  - Post `filelog-config:load` on show

**Checkpoint**: US3 acceptance scenarios 1–7 from spec.md pass manually.

---

## Phase 6: Shared Message Types

- [ ] T016 [P] Create `src/webview/messages.ts` — union types `HostToWebviewMessage` and `WebviewToHostMessage` as defined in `contracts/webview-messages.md`; used by both panels for type-safe message dispatch

---

## Phase 7: Build & Package Verification

- [ ] T017 Run `npm run build` — verify zero TypeScript errors
- [ ] T018 Run `npm run test:unit` — verify all domain and service tests pass  
- [ ] T019 [P] Verify `package.json` includes all three commands in `contributes.commands`: `logexplorer.setupWorkspace`, `logexplorer.editLogFileSourceConfig`, `logexplorer.editFileLogLineConfig`
- [ ] T020 [P] Update `.vscodeignore` to exclude `specs/003-file-source-setup/` if not already covered

---

## Dependencies & Execution Order

- **T001 → T002**: Test first, then implementation
- **T003 → T004**: Test first, then implementation
- **T005 → T006**: Test first, then implementation
- **T007**: After T002 and T004 (needs domain types for subdirectory names); no dependency on T006
- **T008–T010 parallel**: webview assets are independent files
- **T011**: After T008–T010 (loads those assets) and T006 (needs config-store)
- **T012–T014 parallel**: webview assets are independent files
- **T015**: After T012–T014 and T006
- **T016**: Parallel — pure type definitions, no runtime dependency
- **T017–T020**: After all previous phases complete
