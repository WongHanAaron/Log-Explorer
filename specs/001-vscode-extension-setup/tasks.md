# Tasks: VSCode Extension Project Setup with UI Components

**Input**: Design documents from `/specs/001-vscode-extension-setup/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are included only for User Story 3 which specifically covers test infrastructure.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, manifest, TypeScript/esbuild configuration

- [x] T001 Initialize npm project and create extension manifest in package.json with identity fields (name: logexplorer, displayName: LogExplorer, version: 0.1.0, engines.vscode: ^1.85.0, main: ./dist/extension.js)
- [x] T002 [P] Create TypeScript configuration in tsconfig.json targeting ES2020/CommonJS with strict mode, rootDir: src, outDir: dist
- [x] T003 [P] Create esbuild bundler configuration in esbuild.mjs with two entry points (src/extension.ts → dist/extension.js as CJS/Node, src/webview/main.ts → dist/webview.js as IIFE/browser)
- [x] T004 [P] Create monochrome SVG Activity Bar icon in resources/icons/logexplorer.svg
- [x] T005 [P] Create .gitignore with dist/, node_modules/, *.vsix, .vscode-test/ exclusions
- [x] T006 Add npm scripts to package.json: build, watch, pretest, test, package, vscode:prepublish
- [x] T007 [P] Create VSCode workspace settings in .vscode/settings.json with recommended TypeScript and extension development defaults

**Checkpoint**: Project skeleton ready — `npm install` and `npm run build` should succeed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extension entry point and activation — MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create extension entry point in src/extension.ts with activate() and deactivate() functions, register disposables on context.subscriptions
- [x] T009 Add activation events to package.json contributes (implicit onView:logexplorer.panel via views contribution)
- [x] T010 Install all dev dependencies: typescript, @types/vscode, @types/node, esbuild, @vscode/test-cli, @vscode/test-electron, mocha, @types/mocha
- [x] T011 Verify extension compiles and activates in Extension Development Host with zero errors in Output panel

**Checkpoint**: Foundation ready — extension activates cleanly in dev host, user story implementation can begin

---

## Phase 3: User Story 1 — Create and Launch Extension in Development (Priority: P1) 🎯 MVP

**Goal**: A developer can clone the repo, install dependencies, and launch the extension in a VSCode Extension Development Host with confirmed activation.

**Independent Test**: Press F5 in VSCode → Extension Development Host opens → extension activates with zero errors in Output panel.

### Implementation for User Story 1

- [x] T012 [P] [US1] Create debug launch configuration in .vscode/launch.json with "Run Extension" and "Extension Tests" profiles
- [x] T013 [P] [US1] Create build tasks in .vscode/tasks.json with npm:watch as default build task
- [x] T014 [US1] Add console output in src/extension.ts activate() to confirm activation in Output panel (e.g., "LogExplorer extension is now active!")
- [x] T015 [US1] Create README.md with setup instructions: prerequisites, npm install, F5 to launch, matching quickstart.md content

**Checkpoint**: User Story 1 complete — developer can go from fresh clone to running Extension Development Host in under 5 minutes

---

## Phase 4: User Story 2 — View Custom UI Panel in Sidebar (Priority: P2)

**Goal**: The extension contributes a view container to the Activity Bar with a webview-based sidebar panel that renders placeholder content.

**Independent Test**: Click LogExplorer icon in Activity Bar → sidebar panel opens with placeholder content → switch away and back → state preserved.

### Implementation for User Story 2

- [x] T016 [US2] Add viewsContainers and views contributions to package.json per extension-manifest contract (logexplorer-container in activitybar, logexplorer.panel as webview type)
- [x] T017 [US2] Add commands contribution to package.json per commands contract (logexplorer.showPanel with category LogExplorer)
- [x] T018 [US2] Create WebviewViewProvider class in src/panels/LogExplorerPanel.ts implementing vscode.WebviewViewProvider with resolveWebviewView() method
- [x] T019 [P] [US2] Create webview HTML template in src/webview/index.html with Content Security Policy meta tag, nonce-based script loading, and placeholder content
- [x] T020 [P] [US2] Create webview client-side script in src/webview/main.ts with acquireVsCodeApi(), ready message, state persistence via getState/setState, and update message handler per messaging-protocol contract
- [x] T021 [P] [US2] Create webview styles in src/webview/styles.css using VSCode CSS variables for theme-aware styling
- [x] T022 [US2] Implement getWebviewContent() in src/panels/LogExplorerPanel.ts to load index.html with webview.asWebviewUri() for resource paths and nonce generation for CSP
- [x] T023 [US2] Register WebviewViewProvider in src/extension.ts activate() via vscode.window.registerWebviewViewProvider('logexplorer.panel', provider) and push to disposables
- [x] T024 [US2] Register logexplorer.showPanel command in src/commands/index.ts that focuses the LogExplorer panel via vscode.commands.executeCommand('logexplorer.panel.focus')
- [x] T025 [US2] Wire command registration from src/commands/index.ts into src/extension.ts activate() and push to disposables

**Checkpoint**: User Story 2 complete — LogExplorer icon visible in Activity Bar, clicking opens webview sidebar panel with placeholder content, state preserved across visibility toggles

---

## Phase 5: User Story 3 — Run Extension Tests (Priority: P3)

**Goal**: The project includes a working test infrastructure with at least one passing sample test that verifies extension activation.

**Independent Test**: Run `npm test` → at least one test executes and passes with clear output.

### Implementation for User Story 3

- [x] T026 [US3] Create test runner configuration in .vscode-test.mjs with VSCode version, test file globs, and launch args
- [x] T027 [US3] Create test suite entry point in test/suite/index.ts that configures Mocha and discovers test files
- [x] T028 [US3] Create sample integration test in test/suite/extension.test.ts that verifies: extension is present in vscode.extensions.all, extension activates successfully, logexplorer.showPanel command is registered
- [x] T029 [US3] Create test launcher in test/runTest.ts that invokes @vscode/test-electron programmatically (fallback for non-CLI usage)
- [x] T030 [US3] Verify npm test runs successfully: all sample tests pass with clear output

**Checkpoint**: User Story 3 complete — `npm test` launches VSCode, runs integration tests, all pass

---

## Phase 6: User Story 4 — Package Extension for Distribution (Priority: P4)

**Goal**: The build pipeline produces a distributable .vsix file that can be installed in any compatible VSCode instance.

**Independent Test**: Run `npm run package` → .vsix file generated → installs and activates in a fresh VSCode instance.

### Implementation for User Story 4

- [x] T031 [US4] Install @vscode/vsce as dev dependency for extension packaging
- [x] T032 [US4] Configure vscode:prepublish script in package.json to run production esbuild build (minified, no sourcemaps)
- [x] T033 [US4] Add .vscodeignore file to exclude test/, src/, .vscode-test/, .specify/, specs/, .github/ from the packaged extension
- [x] T034 [US4] Verify npm run package produces a valid logexplorer-0.1.0.vsix file

**Checkpoint**: User Story 4 complete — distributable .vsix file can be generated and installed

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [x] T035 [P] Add error fallback in src/panels/LogExplorerPanel.ts resolveWebviewView() to display user-friendly message if webview content fails to load
- [x] T036 [P] Update README.md with complete documentation: all npm scripts, project structure, packaging instructions, minimum VSCode version
- [x] T037 Run quickstart.md validation: fresh clone → npm install → F5 → verify all 4 user stories work end-to-end
- [x] T038 Verify extension activates with zero errors on Windows, macOS, and Linux (or document cross-platform testing approach)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2); independent of US1
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2); benefits from US2 completion (more to test) but can work with just activation
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2); benefits from US2 completion (meaningful package content)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories — foundational dev loop
- **User Story 2 (P2)**: No dependencies on US1 — adds UI independently
- **User Story 3 (P3)**: Can start after Phase 2; tests are richer if US2 is done first (can test view provider registration)
- **User Story 4 (P4)**: Can start after Phase 2; package is more meaningful if US2 is done first (has UI to package)

### Within Each User Story

- package.json contributions before TypeScript implementations
- Provider classes before registration in extension.ts
- Webview assets (HTML, JS, CSS) before provider that loads them
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003, T004, T005, T007 can all run in parallel (Setup phase — different files)
- T012, T013 can run in parallel (US1 — different files)
- T019, T020, T021 can run in parallel (US2 — different webview asset files)
- Once Phase 2 completes, US1 and US2 can start in parallel
- T035, T036 can run in parallel (Polish — different files)

---

## Parallel Example: User Story 2

```bash
# Phase 4 parallel batch 1 — package.json contributions (must be first):
Task: T016 "Add viewsContainers and views contributions to package.json"
Task: T017 "Add commands contribution to package.json"

# Phase 4 parallel batch 2 — webview assets (all different files):
Task: T019 "Create webview HTML template in src/webview/index.html"
Task: T020 "Create webview client-side script in src/webview/main.ts"
Task: T021 "Create webview styles in src/webview/styles.css"

# Phase 4 sequential — provider depends on assets, registration depends on provider:
Task: T018 "Create WebviewViewProvider class in src/panels/LogExplorerPanel.ts"
Task: T022 "Implement getWebviewContent() in src/panels/LogExplorerPanel.ts"
Task: T023 "Register WebviewViewProvider in src/extension.ts"
Task: T024 "Register logexplorer.showPanel command in src/commands/index.ts"
Task: T025 "Wire command registration into src/extension.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Extension launches in dev host with confirmed activation
5. Deploy/demo if ready — this is the minimum viable development environment

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Dev loop works → MVP! ✓
3. Add User Story 2 → Sidebar panel renders → Visual demo! ✓
4. Add User Story 3 → Tests pass → Quality gate! ✓
5. Add User Story 4 → .vsix packaged → Distribution ready! ✓
6. Each story adds value without breaking previous stories

### Suggested MVP Scope

**User Story 1** alone is the MVP: a compilable, launchable extension that activates in the development host. This proves the toolchain works and enables all future development. User Story 2 is the next highest-value increment (visible UI). Together, US1 + US2 form a strong demo-ready MVP.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- esbuild.mjs must handle both extension and webview entry points
- Webview assets (HTML, CSS, JS) must be copied/referenced correctly from dist/
