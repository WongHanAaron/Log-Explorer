# Tasks: Split‑view editor for Log File Path Configs

**Input**: Design documents from `/specs/001-logfile-path-ui/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Unit and integration tasks are included where specified by user stories.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US3)
- Exact file paths are included in every description

---

## Phase 1: Setup (Foundational modifications)

**Purpose**: Prepare shared infrastructure (logging and protocol files). These tasks modify different source files and can begin immediately.

- [x] T001 [P] Add logging to `src/services/config-store.ts` by importing `OutputLogger` and emitting a log entry (name + action) whenever a filepath configuration is created, updated or deleted; update existing unit tests in `test/unit/services/config-store.test.ts` to assert log calls are made.
- [x] T002 [P] Update `specs/001-logfile-path-ui/contracts/panel-protocol.md` to include the `configListChanged` and `init` messages as defined in the plan (if not already present) and commit the change.

---

## Phase 2: Foundational Event Support

**Purpose**: Ensure the ConfigStore can notify listeners about name-list changes and that the host panel can consume these events. All subsequent user stories depend on this.

- [x] T003 [P] Verify `ConfigStore` already exposes an event emitter (`onDidChange`); if not, retrofit it by adding a simple `EventEmitter<void>` that fires on any create/update/delete. Add unit tests covering the emission.
- [x] T004 [P] Add helper method `listConfigNames(category)` to `src/services/config-store.ts` if not already present (should already exist per spec); write or update unit tests for it.

---

## Phase 3: User Story 1 — Browse and select configurations (Priority: P1) 🎯 MVP

**Goal**: Display a searchable list of config names and allow selecting one.  The list should load on panel open and update when the store changes.

**Independent Test**: Populate the ConfigStore with several filepath entries, open the panel and verify the left list shows them; programmatically add a new entry and confirm the list updates automatically; use the search box to filter.

- [x] T005 [US1] Modify `src/panels/editors/LogFileSourcesPanel.ts`:
  - During panel initialization send an `init` message containing `names: string[]` retrieved via `this._store.listConfigNames(ConfigCategory.Filepath)` and optional `currentShortName`.
  - Register a listener on `this._store.onDidChange` that re-fetches the name list and posts a `configListChanged` message to the webview.
  - Handle incoming `selectConfig` message by fetching that config via `getConfig` and posting either `{ type: 'configData', config: json }` or reuse existing `filepath-config:load` message.
- [x] T006 [US1] Enhance React UI in `src/webview/log-file-sources/App.tsx`:
  - Add state for `names: string[]`, `searchText`, and `selectedName`.
  - Render a left column with `<input id="search" />` and a `<ul>` listing filtered `names` (case-insensitive substring match). Add click handlers to each `<li>` that set `selectedName` and post `{ type: 'selectConfig', name }`.
  - On initial load (`ready` message), replace existing form population logic with handling `{ type: 'init', names, current?: string, config? }`.
  - Handle `configListChanged` message by updating `names` state and clearing `selectedName` if its name is no longer present.  Show an empty-state `<div>` when `names` is empty.
  - Implement debounced search (200 ms) to update filter as user types.
  - Move existing form fields into a right‑hand column; apply CSS flex layout to make two columns.
- [x] T007 [P] Add unit tests for the modified `App.tsx` (`test/unit/webview/log-file-sources/app.test.ts`):
  - Simulate initial `init` message and assert rendered list contains items.
  - Simulate user typing into search box and verify DOM updates accordingly.
  - Simulate `configListChanged` messages and assert list updates/empty state behavior.
  - Simulate clicking a name and assert that `window.postMessage` is called with `selectConfig`.

---

## Phase 4: User Story 2 — Edit a selected configuration (Priority: P2)

**Goal**: Clicking an item loads its data into the right‑hand editor and changes can be saved back to the store.

**Independent Test**: Select an entry from the list and assert that the right panel’s fields are populated; change a value and click Save; verify the ConfigStore entry updates.

- [x] T008 [US2] Update host panel message handling in `LogFileSourcesPanel.ts` to respond to `configData` or reuse `filepath-config:load` messages as needed when `selectConfig` is received, sending the full config object to the webview.
- [x] T009 [US2] Modify `App.tsx` to handle incoming `configData`/`filepath-config:load` by populating the form fields and storing `selectedName`; ensure saves still post `filepath-config:save` with the config object.
- [x] T010 [US2] Add a unit test verifying that after clicking a name, the form fields update with the expected values and saving generates a `filepath-config:save` message with the edited data.

---

## Phase 5: User Story 3 — Add and remove configurations externally (Priority: P3)

**Goal**: When configs change elsewhere, the list reflects those changes and the editor clears or switches accordingly.

**Independent Test**: Use the ConfigStore API in a test to delete an entry while the panel is open and ensure the list drops the name; add an entry and ensure it appears.

- [x] T011 [US3] Confirm host listener added in T005 correctly handles deletion of the currently-loaded config by posting a message to clear the form or selecting another available name; add logic in `LogFileSourcesPanel.ts` if necessary.
- [x] T012 [US3] In `App.tsx` display an error banner or clear the form when notified that the selected config no longer exists (triggered by `configListChanged` with missing `selectedName`).
- [x] T013 [US3] Write an integration test (`test/integration/LogFilePathPanel.int.test.ts`) that opens the panel, programmatically adds and removes configs via `ConfigStore`, and asserts that the webview list updates and editor state follows.

---

## Phase 6: Polish & Cross‑Cutting Concerns

**Purpose**: Address layout responsiveness, keyboard accessibility, and final build verification.

- [x] T014 [P] Update CSS (either existing styles or new file under `src/webview/log-file-sources`) to make the split view responsive; allow horizontal scroll or column collapse at narrow widths.
- [x] T015 [P] Add keyboard navigation in the list: arrow keys move the `selectedName` highlight and Enter triggers the same behaviour as a click.  Ensure search box and form fields maintain correct tab order.
- [x] T016 Run `npm run build` and ensure TypeScript compiles without errors; verify that the webview bundle includes the modified `log-file-sources` code.
- [x] T017 [P] Update `specs/001-logfile-path-ui/quickstart.md` with instructions to verify the split view and the logging output channel, as per plan.

---

## Dependencies & Execution Order

- Setup tasks (T001–T002) may run in parallel; they unblock all later work.
- Foundational tasks (T003–T004) should complete before US1 tasks begin.
- US1 tasks (T005–T007) are the MVP path; T005 and T006 can be done in parallel, but the webview tests (T007) depend on both.
- US2 tasks depend on the messaging infrastructure from US1.
- US3 tasks build on the store listener added in US1.
- Polish tasks can be performed concurrently with later story work but should finish before merging.

---

🎯 **MVP plan**: complete Phase 1 & 2, then finish Phase 3 (T005–T007). Once the list and selection works, continue with US2 and US3. Cross‑cutting polish may be deferred until after core functionality is verified.

---

This tasks.md provides a checklist matching the plan and is ready for implementation tracking.