# Tasks: Log File Source Editor Save

**Input**: Design documents from `/specs/004-logfile-source-save/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

This feature is focused on enhancing the existing React-based log-file-sources editor with a
working save mechanism and validation logic.  Most of the work happens in `src/webview/log-file-sources`.

## Phase 1: Setup (Shared Infrastructure)

No new directories or major scaffolding are required; the code lives within the
existing webview module.

- [x] T001 [P] Add `canSave` boolean prop to `FormPageProps` and update `src/webview/log-file-sources/components/FormPage.tsx` so the Save button is only rendered when `canSave` is true (this also prepares the UI for validation logic).
- [x] T002 [P] Update `src/webview/log-file-sources/App.tsx` to declare new state variables `savedConfig` and `canSave`, and to wire a `useEffect` that recomputes `canSave` based on form validity and dirty comparison.
- [x] T003 [P] Modify the message-handling logic in `App.tsx` to populate `savedConfig` when a config is loaded or successfully saved, and to update the `status` state for save errors.

**Checkpoint**: Webview builds and the Save button appears only when appropriate (see existing unit tests).

---

## Phase 2: Foundational (Blocking Prerequisites)

These tasks establish the core client-side behavior that all user stories rely on.

- [x] T004 [P] Add or extend unit tests under `test/unit/webview/log-file-sources`:
  - verify Save button is hidden initially and after invalid inputs
  - verify it appears with valid input
  - verify the `filepath-config:save` message payload contains the expected properties (shortName, pathPattern, tags, etc.) and omits any extraneous fields
  - verify an error `status` message displays when a save-result with `success: false` arrives
- [x] T005 [P] Add backend panel unit test `test/unit/panels/log-file-sources-panel.test.ts` that simulates posting a `filepath-config:save` message and asserts that `ConfigStore.writeConfig` is called with the right category, filename, and data (mock or stub `ConfigStore` and `vscode.workspace.fs.createDirectory`).

**Checkpoint**: All new unit tests pass and provide confidence in the code paths.

---

## Phase 3: User Story 1 - Save Valid Configuration (Priority: P1) 🎯 MVP

**Goal**: Enable the form to actually persist configuration objects to disk via the
existing `ConfigStore` and ensure the UX reflects saved/unsaved state.

**Independent Test**: Fill the form with valid data, click Save, and observe a file
appearing under `.logex/filepath-configs/` with correct content.  Editing the same
config and clicking Save again should update the file rather than create a duplicate.

### Implementation for User Story 1

- [x] T006 [US1] Implement overwrite‑confirmation flow in `src/webview/log-file-sources/App.tsx`:
  - when the user attempts to save and the short name already exists (use `savedConfig` and/or query host), show a confirmation dialog (`window.confirm` or host message) before proceeding
  - if the user declines, abort the save; if they accept, continue to post the save message
- [x] T007 [US1] Add a unit test in `test/unit/webview/log-file-sources/app.test.ts` that simulates an existing-name conflict and verifies the confirmation step is triggered and respected
- [x] T008 [US1] Ensure that the host panel (`src/panels/editors/LogFileSourcesPanel.ts`) already creates the `.logex/filepath-configs/` directory and invokes `ConfigStore.writeConfig` as in existing code; if not, make any necessary adjustments (already satisfied by current implementation)
- [x] T009 [US1] Add an integration or end‑to‑end test that opens the real webview, enters data, clicks Save, and verifies the file is written on disk (can reuse existing VSCode test harness with workspace fixtures)
- [x] T010 [US1] Add UI handling & messaging for the scenario where the panel returns a save failure (e.g. workspace read-only); confirm this behaviour via test or manual quickstart step

**Checkpoint**: All US1 acceptance scenarios from spec.md are satisfied, including overwrite confirmation and error handling.

---

## Phase 4: Polish & Cross‑Cutting Concerns

These tasks improve developer experience and documentation around the feature.

- [x] T011 [P] Update `specs/004-logfile-source-save/quickstart.md` with instructions covering the save workflow (already done)
- [x] T012 [P] Add comments/documentation in `App.tsx` explaining `savedConfig`/`canSave` logic
- [x] T013 [P] Add an e2e test to the extension suite that covers a full save cycle as a regression guard
- [x] T014 [P] Review and refactor any duplicated validation logic between `validateForm` and the save‑button effect
- [x] T015 [P] Ensure `tsconfig.json` and ESLint rules do not flag the new state variables or hooks (run `npm run build`/`npm run lint`)

**Checkpoint**: Code is clean, documented, and has at least one high‑level regression test.

---

## Dependencies & Execution Order

- Foundation tasks (`T001`–`T004`) can be worked in parallel; they all modify different files or tests.
- `T005` (panel unit test) depends on `T008` being confirmed if the panel code is amended.
- User story tasks (`T006`–`T010`) depend on the foundational tasks completing, especially the ability to compute `canSave` and display errors.
- Tasks within US1 are mostly independent but `T007` (test conflict) requires `T006` implementation.
- Polish tasks can begin once at least the core save flow is working (post-US1).

### Parallel Opportunities

- Front‑end changes (App/FormPage/tests) can be developed by one engineer while another writes the panel unit test or integration harness.
- Confirmation dialog UI can be prototyped separately from the disk‑write test.

Feel free to adjust task IDs if new work arises; the checklist format ensures clarity and traceability.
