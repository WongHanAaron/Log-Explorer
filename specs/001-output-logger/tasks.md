# Tasks for 001-output-logger

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure utility directory exists and basic logging scaffolding is ready.

- [x] T001 Create `src/utils` directory if it does not already exist  
- [x] T002 Add `src/utils/logger.ts` file placeholder with stub class exported (no logic yet) [P]
- [x] T003 Add `src/webview/webviewLogger.ts` file placeholder with empty WebViewLogger object [P]

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the core logging abstraction and integrate it into the extension.
All user stories depend on this being finished.

- [x] T004 Implement `OutputLogger` class in `src/utils/logger.ts` with methods `debug`, `info`, `warn`, `error`, `log`, `show`, `close`/`dispose` and lazy channel creation; constructor accepts optional `scope` string which is stored. The generic `log(level, message, scope?)` method handles all levels; the helpers call it with fixed severities. `error()` additionally accepts an optional `Error`/`unknown` parameter whose message and stack are appended.
- [x] T005 Add log level filtering support inside `OutputLogger` (read from setting later) and implement scope prefixing when formatting messages
- [x] T006 Add scope-based filtering logic: allow configuration to specify allowed/denied scopes and apply it during message write
- [x] T007 Write unit tests for `OutputLogger` covering message formatting, level filtering, and disposal in `test/unit/logger.test.ts` [P]
- [x] T008 Instantiate singleton `logger` in `src/utils/logger.ts` and export it  
- [x] T009 Modify `src/extension.ts` (or activation entrypoint) to import `logger`, add it to `context.subscriptions`, and log an initial activation message  
- [x] T010 Replace any existing calls to `vscode.window.createOutputChannel` elsewhere with `logger` usage [P]

---

## Phase 3: User Story 1 - Log messages from extension (Priority: P1) 🎯 MVP

**Goal**: Allow core extension code to write diagnostics through `logger` and view them in Output panel.

**Independent Test**: Trigger a command or activation and verify a line appears in the "Log Explorer" channel.

### Tests for User Story 1

- [x] T011 [P] [US1] Add an integration test that activates the extension and asserts `logger` appended a known message to the channel (mocking `OutputChannel`) in `test/integration/logger-activation.test.ts`

### Implementation for User Story 1

- [x] T012 [US1] Add a sample command (e.g. `logExplorer.testLog`) in `src/commands/` that calls `logger.info('test')`  
- [x] T013 [US1] Update documentation (quickstart or README) to instruct developers how to view the output  
- [x] T014 [US1] Ensure `logger.show()` is callable from a command and add an example command `logExplorer.showLog` [P]

**Checkpoint**: US1 is functional and can be tested independently (commands write to output channel).

---

## Phase 4: User Story 2 - WebView forwards logs to host (Priority: P2)

**Goal**: Webview code uses `WebViewLogger` to send log requests to the host, which routes them to the same output channel.

**Independent Test**: Within a running webview, call the logger and observe message in output pane.

### Tests for User Story 2

- [x] T014 [P] [US2] Add unit tests for `WebViewLogger` helper verifying it posts the correct message (including optional `scope`) to VS Code API by mocking `acquireVsCodeApi()` in `test/unit/webviewLogger.test.ts`
- [x] T015 [P] [US2] Add integration test that simulates `onDidReceiveMessage` with a valid log payload (including scope) and asserts `OutputLogger` received it in `test/integration/webview-message.test.ts`
- [x] T017 [P] [US2] Add a negative test sending a malformed message and verify host ignores it without throwing in `test/unit/webview-message-invalid.test.ts`

### Implementation for User Story 2

- [x] T018 [US2] Implement `WebViewLogger` in `src/webview/webviewLogger.ts` with method `log(text: string, level?: string)` that calls `acquireVsCodeApi().postMessage`  
- [x] T019 [US2] Update one existing webview (for example `src/webview/log-file-lines/App.tsx`) to import and use `WebViewLogger` for a sample log event [P]
- [x] T020 [US2] In each panel creation location (`src/panels/*`), register `panel.webview.onDidReceiveMessage` and route `{type:'log',level,text}` messages to `logger`, validating payload structure  
- [x] T021 [US2] Add a utility in `src/utils` to safely validate log message objects (used by handlers) [P]

**Checkpoint**: US2 is complete when webview-originating logs appear in the output channel.

---

## Phase 5: User Story 3 - Control visibility and levels (Priority: P3)

**Goal**: Provide configuration for log level and commands to show/hide output.

**Independent Test**: Change the setting and verify logs are filtered; call show/hide commands.

### Tests for User Story 3

- [x] T022 [P] [US3] Unit tests for level filtering reacting to `logExplorer.logLevel` setting changes
- [x] T023 [P] [US3] Integration test that sets the configuration, logs messages at multiple levels, and verifies only appropriate messages appear

### Implementation for User Story 3

- [x] T024 [US3] Add configuration schema entry for `logExplorer.logLevel` in `package.json` and default to `info`  
- [x] T025 [US3] Update `OutputLogger` constructor to read the setting and subscribe to `workspace.onDidChangeConfiguration` updates  
- [x] T026 [US3] Add commands `logExplorer.showLog` / `logExplorer.hideLog` implementing `logger.show()` and `logger.channel.dispose()` as needed

**Checkpoint**: Reader can configure and control logging levels and visibility.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanups and documentation.

- [x] T027 [P] [US1,US2,US3] Update `docs/` and README with full logging instructions
- [x] T028 Code cleanup: remove unused imports and stubs created in Phase1
- [x] T029 [P] Add any missing unit tests discovered during implementation
- [x] T030 Ensure quickstart.md examples still work and update if necessary
- [x] T031 [P] Review and bump version in `package.json` if appropriate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately; preparing directory structure.
- **Foundational (Phase 2)**: Blocks all user stories until complete.
- **User Stories (Phase 3+)**: All depend on foundational phase; after Phase 2 they
  may proceed in parallel or sequentially by priority.
- **Polish (Final Phase)**: Depends on completion of desired user stories.

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2, and provides MVP value.
- **US2 (P2)**: Requires Phase 2 but not US1; may integrate with US1 code once
  available.
- **US3 (P3)**: Follows Phase 2 and may run alongside US1/US2.

### Parallel Opportunities

- Tasks marked `[P]` (mostly file creation, tests, utilities) can run in parallel across
  stories.
- Once foundational work is done, multiple developers can implement different stories
  concurrently.
- Within each story, tests and helper utilities can be developed in parallel.

---
