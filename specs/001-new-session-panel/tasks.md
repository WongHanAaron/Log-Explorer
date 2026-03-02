# Tasks: New Session Panel

**Input**: Design documents from `/specs/001-new-session-panel/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: No test tasks generated — no tests requested in the feature specification (noted deviation in plan.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in every description

---

## Phase 1: Setup (Build Infrastructure)

**Purpose**: Wire up the new webview bundle and bump the version. Both tasks modify different files and are unblocked from the start.

- [X] T001 Update `esbuild.mjs` — add `newSessionWebviewConfig` entry: entrypoint `src/webview/new-session/main.ts`, output `dist/webview/new-session.js`, format `iife`, platform `browser`; add it to the parallel build array alongside the existing `webviewConfig`
- [X] T002 [P] Bump version in `package.json` from `0.2.0` to `0.3.0`

---

## Phase 2: Foundational (Workspace Services)

**Purpose**: Server-side services that read and write session data. All user stories depend on these. Both files are independent and can be written in parallel.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Create `src/workspace/sessionTemplates.ts` — declare and export `interface SourceLogConfigReference { type: 'file' | 'kibana'; sourceConfig: string; logConfig: string; }` and `interface SessionTemplate { id: string; name: string; description: string; parameters: Array<{ name: string }>; sources: SourceLogConfigReference[]; }`; export `loadTemplates(workspaceRoot: vscode.Uri): Promise<SessionTemplate[]>`: reads all `.json` files from `workspaceRoot/.logex/session-templates/` via `vscode.workspace.fs.readDirectory` + `vscode.workspace.fs.readFile`; returns `[]` if directory does not exist (catch `FileNotFound`); silently skips files that fail `JSON.parse` or are missing required top-level fields (`name`, `description`, `parameters`, `sources`); validates each entry in `sources[]` has `type` (`'file'` or `'kibana'`), non-empty `sourceConfig` string, and non-empty `logConfig` string — skips malformed source entries; maps filename without `.json` as the `id` field
- [X] T004 [P] Create `src/workspace/sessions.ts` — import `SourceLogConfigReference` from `./sessionTemplates`; declare `interface SubmitSessionPayload { name: string; description: string; templateName: string | null; parameters: Record<string, string>; timeStart: string; sources: SourceLogConfigReference[]; }` and `interface SessionSummary { name: string; description: string; folderName: string; }`; export three functions: (1) `toKebabCase(name: string): string` — `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`; (2) `loadRecentSessions(workspaceRoot: vscode.Uri): Promise<SessionSummary[]>`: reads children of `workspaceRoot/.logex/sessions/` via `vscode.workspace.fs.readDirectory`; for each `FileType.Directory` entry reads `session.json`; ignores entries with no `session.json` or parse failures; returns `{ name, description, folderName }`; (3) `createSession(workspaceRoot: vscode.Uri, data: SubmitSessionPayload): Promise<SessionSummary>`: calls `toKebabCase(data.name)` for folder name; uses `vscode.workspace.fs.stat` to check if `.logex/sessions/<folderName>` already exists — throws `Error("A session named '<folderName>' already exists. Choose a different name.")` if so; calls `vscode.workspace.fs.createDirectory` then `vscode.workspace.fs.writeFile` with `session.json` containing all payload fields (`sources` as `SourceLogConfigReference[]`); returns `SessionSummary`

**Checkpoint**: Workspace services complete — user story implementation can now begin.

---

## Phase 3: User Story 1 — Create a Session from a Template (Priority: P1) 🎯 MVP

**Goal**: A user can open the New Session panel, select a template, fill in required fields, and successfully create a session folder with `session.json` on disk.

**Independent Test**: Open the panel in a workspace that has at least one `.json` file in `.logex/session-templates/`. Select a template, fill Session Name and other fields, click "Create Session". Verify `.logex/sessions/<kebab-name>/session.json` is created with the correct content — including `sources` as an array of `{ type, sourceConfig, logConfig }` objects. Verify the new session appears in the Recent Sessions list without re-opening the panel.

- [X] T005 [P] [US1] Create `src/webview/new-session/styles.css` — two-column flex layout (left column: 4 equal-height quadrant boxes — top-left `#templates-panel`, top-right `#getting-started-panel`, bottom-left `#recent-sessions-panel`, bottom-right `#local-logs-panel`; right column: `#creation-form` with form fields); use only VS Code CSS custom properties (`--vscode-foreground`, `--vscode-background`, `--vscode-input-background`, `--vscode-input-foreground`, `--vscode-button-background`, `--vscode-button-foreground`, `--vscode-focusBorder`, `--vscode-list-hoverBackground`); style the source log config reference entries as a compact table with `type` selector dropdown, `sourceConfig` input, `logConfig` input, and add/remove buttons; include `.required-error` highlight class for session-name validation failure; include `.empty-state` style for no-template / no-session messages
- [X] T006 [P] [US1] Create `src/webview/new-session/main.ts` — webview entry point:
  - On DOMContentLoaded: acquire VS Code API (`acquireVsCodeApi()`), attach message listener, post `{ type: 'ready' }`
  - Handle `init` message: render template list from `templates[]` (each item: name + description, clickable); render recent sessions list from `recentSessions[]`; show `.empty-state` messages when arrays are empty; set right panel to blank/unselected initial state
  - Template click: update right panel header with selected template name + description; render one `<input>` per parameter using parameter name as label; pre-populate Sources table from template's `sources[]` — each entry is a `SourceLogConfigReference` with `type` (dropdown: `file`/`kibana`), `sourceConfig` (text input), and `logConfig` (text input); store selected template reference
  - Search/filter input (`#template-search`): on `input` event filter displayed template items in real time by matching name or description (case-insensitive)
  - Sources table: "Add Source" button appends a new blank row (`type` `<select>` defaulting to `file`, `sourceConfig` text input, `logConfig` text input, Remove button); "Remove" button on each row deletes that `<tr>`
  - "Create Session" button click: validate session name non-empty — if empty add `.required-error` class to name field and return; collect all form values into `submitSession` payload (name, description, templateName or null, parameters as Record, timeStart, sources as `SourceLogConfigReference[]` — each row's `type`, `sourceConfig`, `logConfig`); post `{ type: 'submitSession', payload }` 
  - Handle `sessionCreated` message: prepend new session entry to recent sessions list; clear form fields; show success indication
  - Handle `sessionError` message: display error text inline near the "Create Session" button
- [X] T007 [US1] Upgrade `src/panels/editors/NewSessionPanel.ts` — replace stub HTML with full webview:
  - In `getWebviewContent()`: build HTML that loads `dist/webview/new-session.js` via `panel.webview.asWebviewUri`; loads `dist/webview/new-session.css` via `asWebviewUri`; sets strict CSP (`script-src 'nonce-${nonce}'`; `style-src ${cspSource} 'unsafe-inline'`; `default-src 'none'`); uses `getNonce()`
  - `onDidReceiveMessage` handler (switch on `message.type`):
    - `'ready'`: `Promise.all([loadTemplates(workspaceRoot), loadRecentSessions(workspaceRoot)])` then post `{ type: 'init', templates, recentSessions }`; on any error post `{ type: 'init', templates: [], recentSessions: [] }`
    - `'submitSession'`: call `createSession(workspaceRoot, message.payload)`; on success post `{ type: 'sessionCreated', session: { name, description, folderName } }`; on error post `{ type: 'sessionError', message: err.message }`
    - `'openSession'`: leave as `// TODO: US2` stub
  - Import `loadTemplates` from `../../workspace/sessionTemplates`; import `loadRecentSessions`, `createSession` from `../../workspace/sessions`; import `getNonce` from `../../utils/nonce`
- [X] T008 [US1] Run `npm run build` — confirm zero TypeScript compilation errors; confirm `dist/webview/new-session.js` is present in the output directory

**Checkpoint**: At this point User Story 1 is fully functional — panel opens, templates load, form submits, session written to disk, recent sessions updates.

---

## Phase 4: User Story 2 — Resume a Recent Session (Priority: P2)

**Goal**: The Recent Sessions list (already rendered in init) supports clicking an entry to open it. The open action loads the session's details.

**Independent Test**: Open the panel in a workspace that contains `.logex/sessions/<folder>/session.json` files. Verify all matching sessions appear in the Recent Sessions list with correct name and description. Click one — verify the session details are surfaced (info notification or form load).

- [X] T009 [P] [US2] Add recent-session click handler in `src/webview/new-session/main.ts` — each rendered recent-session item should call a handler on click that posts `{ type: 'openSession', folderName: string }` to the extension; the handler reads `folderName` from the element's dataset
- [X] T010 [US2] Handle `openSession` message in `src/panels/editors/NewSessionPanel.ts` — read `.logex/sessions/<folderName>/session.json` via `vscode.workspace.fs.readFile`; parse JSON; populate the form by posting `{ type: 'loadSession', session }` back to the webview; handle missing/malformed `session.json` by posting `{ type: 'sessionError', message: '...' }`
- [X] T011 [US2] Handle `loadSession` message in `src/webview/new-session/main.ts` — populate `#session-name`, `#description`, `#time-start` from session fields; rebuild `#sources-tbody` rows from `session.sources` — each `SourceLogConfigReference` row: `type` `<select>` pre-selected to `source.type`, `sourceConfig` input pre-filled, `logConfig` input pre-filled, Remove button; if `session.templateName` is non-null, find the matching template item in `#templates-list` and call its click handler to render parameter fields pre-filled from `session.parameters`

**Checkpoint**: Recent Sessions list displays all sessions; clicking a session re-populates the form.

---

## Phase 5: User Story 3 — Browse Templates Without Selecting (Priority: P2)

**Goal**: Clicking a template shows its name and description in the right panel header without immediately triggering form submission. The initial state of the right panel is blank/unselected.

**Independent Test**: Open the panel with multiple templates present. Verify right panel is blank on first open. Click a template — verify name and description appear in right panel header. Verify "Create Session" is not triggered.

- [X] T012 [US3] Verify and refine template preview behaviour in `src/webview/new-session/main.ts` — confirm template click handler (implemented in T006) only updates the right panel header and parameter fields without submitting; confirm `#creation-form` renders a visible unselected-state placeholder (e.g., "Select a template to begin or fill in fields manually") when `selectedTemplate` is null; confirm that header area clears when the search box filters out a currently-selected template

**Checkpoint**: Template browsing and preview work independently of session creation. Right panel correctly reflects selected vs. unselected states.

---

## Phase 6: User Story 4 — Create a Session with No Template (Priority: P3)

**Goal**: A user in a workspace with no templates can still open the panel, see a clear empty state, manually fill all form fields, and create a session without selecting any template.

**Independent Test**: Open the panel in a workspace where `.logex/session-templates/` is absent or empty. Verify the template list shows a "No templates found" empty-state message and the right panel is immediately editable with all fields blank. Fill in Session Name, Time Start, and add one source row. Click "Create Session" — verify the session folder and `session.json` appear in `.logex/sessions/` with `templateName: null`.

- [X] T013 [US4] Ensure no-template empty state in `src/webview/new-session/main.ts` — when `templates` array from init is empty, render "No templates found." empty-state message in the templates quadrant; ensure right panel is editable immediately (no lock on template selection required); verify `submitSession` payload correctly sends `templateName: null` and `parameters: {}` when no template is selected
- [X] T014 [US4] Verify `createSession` in `src/workspace/sessions.ts` handles `templateName: null` correctly — session.json must serialise with `"templateName": null` (not `undefined`); verify `parameters: {}` round-trips correctly; write a minimal fixture `session.json` by hand and confirm expected fields are present

**Checkpoint**: Panel is fully usable in a fresh workspace with no pre-existing templates.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, duplicate-name guard, and final build verification.

- [X] T015 [P] Add duplicate-session guard in `src/workspace/sessions.ts` — before calling `createDirectory`, use `vscode.workspace.fs.stat` to check if `.logex/sessions/<folderName>` already exists; throw an error with a user-friendly message (e.g., `"A session named '${folderName}' already exists. Choose a different name."`) if it does; this ensures the `sessionError` message is shown in the webview instead of silently overwriting
- [X] T016 Run `npm run build` — zero TypeScript errors; confirm three output files exist: `dist/extension.js`, `dist/webview.js`, `dist/webview/new-session.js`
- [ ] T017 Run quickstart.md verification checklist — install extension locally; open a test workspace; verify all acceptance scenarios from US1–US4 pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately. T001 and T002 are parallel.
- **Foundational (Phase 2)**: Depends on Phase 1 completion. T003 and T004 are parallel.
- **User Stories (Phases 3–6)**: All depend on Phase 2 completion.
  - Phase 3 (US1) must complete before Phases 4–6 (US2, US3, US4 build on the webview/panel from US1).
  - Within Phase 3: T005 and T006 are parallel; T007 depends on T005 + T006 + T003 + T004.
  - Phase 4 (US2): T009 and T010 are parallel; T011 depends on both.
  - Phase 5 (US3): T012 is a verification/refinement of T006 — depends on Phase 3.
  - Phase 6 (US4): T013 depends on T006 (same file); T014 depends on T004.
- **Polish (Phase 7)**: Depends on all user story phases being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No dependency on other stories. This is the MVP.
- **US2 (P2)**: Can start after US1 is complete (adds message handlers to the same files).
- **US3 (P2)**: Can start after US1 is complete (verifies/refines behaviour already implemented).
- **US4 (P3)**: Can start after US1 is complete (same files; adds empty-state logic).

### Within Each User Story

- New files (styles, workspace services) before files that import them
- Webview source (T005, T006) before panel upgrade (T007)
- Services (T003, T004) before panel upgrade (T007)
- Core implementation before integration and polish

---

## Parallel Examples

### Phase 1 — run together

```
T001  Update esbuild.mjs — add newSessionWebviewConfig
T002  Bump package.json to 0.3.0
```

### Phase 2 — run together

```
T003  Create src/workspace/sessionTemplates.ts
T004  Create src/workspace/sessions.ts
```

### Phase 3 — run T005 + T006 together, then T007

```
T005  Create src/webview/new-session/styles.css
T006  Create src/webview/new-session/main.ts
---  (await T003, T004, T005, T006)
T007  Upgrade src/panels/editors/NewSessionPanel.ts
T008  npm run build
```

### Phase 4 — run T009 + T010 together, then T011

```
T009  Add openSession postMessage in main.ts
T010  Handle openSession in NewSessionPanel.ts
---  (await T009, T010)
T011  Handle loadSession in main.ts
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003, T004)
3. Complete Phase 3: User Story 1 (T005–T008)
4. **STOP and VALIDATE**: Panel opens, template loads, form submits, session written to disk.
5. Install locally and smoke-test.

### Incremental Delivery

1. Setup + Foundational → build infrastructure and services ready
2. US1 → end-to-end session creation working (MVP)
3. US2 → recent sessions clickable (resume flow)
4. US3 → template preview verified (discovery UX)
5. US4 → no-template path confirmed (fresh workspace usable)
6. Polish → edge cases and final verification

---

## Notes

- `[P]` tasks touch different files and have no unresolved dependencies — safe to implement in one agent thread alongside each other.
- `[Story]` labels map each task to a user story for traceability back to spec.md.
- All file I/O in workspace services MUST use `vscode.workspace.fs` — never `node:fs`. This is required for remote workspace compatibility (SSH Remote, WSL, Dev Containers).
- CSP in NewSessionPanel must be nonce-gated (`script-src 'nonce-${nonce}'`). Do not relax to `unsafe-inline` or `unsafe-eval`.
- `@vscode/webview-ui-toolkit` is ARCHIVED (November 2024) — do not install or import it.
- The `dist/webview/new-session.css` output path: if esbuild doesn't bundle CSS automatically, import the stylesheet in `main.ts` or copy it manually in the esbuild config. Check `esbuild.mjs` loader settings.
- Commit after each phase or logical group, not after every individual task.
