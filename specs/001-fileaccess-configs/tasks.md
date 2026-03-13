# Tasks: FileAccessConfigs editor and command

**Input**: design documents from `/specs/001-fileaccess-configs/`  
**Prerequisites**: `plan.md` ✅, `spec.md` ✅, `research.md` ✅, `data-model.md` ✅, `quickstart.md` ✅  
**Tests**: unit coverage is required for every acceptance scenario; integration tests verify end‑to‑end behaviour.

**Organization**: tasks are grouped by phase and by user story (US1–US3) so that each story
can be implemented and tested independently.  Setup and foundational phases contain
cross‑cutting work that must be completed before the first story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable with other tasks (updating different files or independent work).
- **[Story]**: Label for user‑story tasks only (`[US1]`, `[US2]`, `[US3]`).
- Every description names the exact file(s) to change.

---

## Phase 1: Setup (Initial scaffolding)

*Purpose*: introduce new types, enum entries and messaging infrastructure.  All edits
touch different files and can be done in parallel.

- [ ] T001 [P] Add `FileAccess = 'fileaccess'` to the `ConfigCategory` enum in `src/services/config-store.ts` and export it; update any existing unit tests that iterate over the enum.
- [X] T002 [P] Create `src/domain/config/fileaccess-config.ts` implementing a `FileAccessConfig` class (mirroring `filepath-config.ts`) with `id`, `name`, `adapterType` (`'local'|'sftp'|'smb'`) and `settings` interfaces; include `toJson()`/`fromJson()` and validation logic.
- [X] T003 [P] Add unit tests in `test/unit/domain/fileaccess-config.test.ts` verifying round‑trip JSON serialisation, adapter‑specific validation rules, and that duplicate names are rejected (follow `filepath-config.test.ts` style).
- [X] T004 [P] Extend `ConfigParser` (in `src/services/config-store.ts` or its own module) with `parseFileAccessConfig(json: string): Promise<FileAccessConfig>` and add corresponding tests in `test/unit/services/config-store.test.ts` covering valid config, missing fields, and malformed JSON.
- [X] T005 [P] Update `src/utils/workspaceSetup.ts` to add `'fileaccess-configs'` to the `LOGEX_SUBDIRS` constant; modify any tests that assert the list of sub‑directories.
- [X] T006 [P] Add new message type definitions to `src/webview/messages.ts`:
  - `FileAccessConfigSaveMessage`
  - `FileAccessConfigValidateNameMessage`
  - `FileAccessConfigDeleteMessage`
  - result/response types such as `'fileaccess-config:save-result'` and `'fileaccess-config:name-available'`
  and export them for use by the webview code.
- [X] T007 [P] Create or update `specs/001-fileaccess-configs/contracts/panel-protocol.md` documenting the webview ↔ host messages required by this feature (init, configListChanged, selectConfig, the three fileaccess‑config messages, cancel, log).

---

## Phase 2: Foundational Config‑Store & helpers

*Purpose*: ensure the store supports the new category and add tests; nothing
story‑specific depends on this phase.

- [X] T008 [P] Add unit tests in `test/unit/services/config-store.test.ts` exercising the new `ConfigCategory.FileAccess`:
  - `listConfigNames` returns `[]` for an empty folder and correct names after writing via `ConfigSaver`.
  - `getConfig` throws the expected error when the name is missing.
  - `writeConfig`/`deleteConfig` round‑trip a `FileAccessConfig`.
- [ ] T009 [P] (Optional) Add a small integration test in `test/suite/extension.test.ts` verifying that `ConfigStore` can read/write a FileAccessConfig using the workspace fs (copy pattern from existing filepath tests).
- [X] T010 [P] Update `docs/developer-references/config-store.md` to mention the new category and parser method.

---

## Phase 3: User Story 1 — Open panel with list and blank editor (Priority: P1) 🎯 MVP

**Goal**: the command opens a panel showing a two‑column list populated from
the store and an adjacent (initially empty) editor.  No configs → placeholder message.

**Independent Test**: execute the command, assert the webview renders the split
layout, verify `init` message is posted with `configs: string[]`, and check the
empty‑state behaviour.

- [X] T011 [US1] Register the command `logExplorer.openFileAccessConfigs` in `src/extension.ts` so that it calls `FileAccessConfigsPanel.createOrShow(extensionUri)`; add activation entry if necessary.
- [X] T012 [US1] Implement `src/panels/editors/FileAccessConfigsPanel.ts` by copying `LogFileSourcesPanel.ts` and adapting:
  - use `ConfigCategory.FileAccess`, `FileAccessConfig` and the new message types.
  - view type `'logexplorer.fileAccessConfigs'`.
  - subscribe to `this._store.subscribeConfigAdded(ConfigCategory.FileAccess, …)` and post `{ type: 'configListChanged', configs: names }`.
  - `_sendInit` should fetch names and optional current config just like the filepath panel.
- [X] T013 [US1] Add new webview entrypoint `src/webview/file-access-configs/App.tsx` (can start as a copy of `log-file-sources/App.tsx`) with two‑column layout, empty editor area and a placeholder message when `names` is `[]`.  Wire up `ready` message handling to receive `{ type:'init', configs, current?, error? }`.
- [X] T014 [US1] Add unit tests `test/unit/webview/file-access-configs/app.test.ts` verifying:
  - initial render shows search box and empty‑state text when `configs` is `[]`.
  - receiving an `init` message with names populates the list.
  - `window.postMessage` is called with `selectConfig` when a list entry is clicked.
- [X] T015 [P] Add an empty webview bundle entry to `src/webview/index.ts` / build config if needed so that the new `file-access-configs.js` bundle is included.

---

## Phase 4: User Story 2 — Search/filter and select a configuration (Priority: P2)

**Goal**: typing in the search box filters the two‑column list; clicking a row
loads its details into the editor.

**Independent Test**: populate the store with several configs, open panel,
type a term, confirm list filtered, click an item and assert the editor receives
and displays the config object.

- [ ] T016 [US2] Enhance `App.tsx`:
  - maintain `searchText` state and filter `names` case‑insensitively (substring match) on every keystroke (200 ms debounce).
  - highlight the selected name and post `selectConfig` when clicked.
  - when a `configListChanged` message arrives clear `selectedName` if it was removed.
- [ ] T017 [US2] In `FileAccessConfigsPanel.ts` handle `selectConfig` messages by calling `this._store.getConfig(ConfigCategory.FileAccess, name)` and posting `{ type: 'configData', config }` or an error payload.
- [ ] T018 [US2] Add unit tests for the enhanced UI:
  - simulate typing and assert DOM updates.
  - send `configListChanged` messages and check that the list updates/clears selection.
- [ ] T019 [US2] Add a unit test verifying that when `configData` arrives the editor state is populated with the object (existing fields only; actual form rendering comes later).

---

## Phase 5: User Story 3 — Create, edit and delete configurations (Priority: P3)

**Goal**: the editor can create a new config, save changes to an existing one,
and delete a selected config; the list updates automatically via the store
subscription.  Name uniqueness and required‑field validation must be enforced.

**Independent Test**: open panel, create a config, verify it appears in the list,
modify it, save, delete it, and assert all store operations succeed and the webview
receives appropriate response messages.

- [ ] T020 [US3] Extend `App.tsx` to render form fields for `name`, `adapterType`
  and adapter‑specific settings (reuse dynamic renderer from FilePathConfig).
  Add **Save** and **Delete** buttons; disable Save when validation errors exist.
  Wire button clicks to post the corresponding `fileaccess-config:save`,
  `fileaccess-config:delete` and `fileaccess-config:validate-name` messages.
- [ ] T021 [US3] Implement message handling in `FileAccessConfigsPanel.ts`:
  - `fileaccess-config:save`: invoke `ConfigSaver.save(config, FileAccessConfig, this._store, ConfigCategory.FileAccess, this._configDirUri, 'fileaccess-config:save-result')` and forward the result message.
  - `fileaccess-config:validate-name`: call `this._store.configExists(ConfigCategory.FileAccess, shortName)` and post `{ type:'fileaccess-config:name-available', available: !exists }`.
  - `fileaccess-config:delete`: call `this._store.deleteConfig(ConfigCategory.FileAccess, shortName)` and post `{ type:'fileaccess-config:delete-result', success: true }` (or error).
- [ ] T022 [US3] Add unit tests for the new UI behaviour:
  - verify Save messages are posted with the correct object when form is valid.
  - simulate `name-available` responses and ensure the form shows/hides duplicate-name warnings.
  - check that Delete button posts the delete message and clears the form on success.
- [ ] T023 [US3] Write an integration test `test/integration/file-access-configs.int.test.ts` that:
  1. Opens the panel via the command.
  2. Creates a new config (send save message) and confirms `ConfigStore` stores it.
  3. Modifies the config (post selectConfig, change field, post save) and asserts the stored file changed.
  4. Deletes the config and checks the store file is removed and the list updates.
- [ ] T024 [US3] Add a test case in `test/unit/services/config-store.test.ts` ensuring that
  `configExists` returns `true` after writing a FileAccessConfig and `false` after deletion
  (used by name‑validation).

---

## Phase 6: Polish & Cross‑Cutting Concerns

*Purpose*: final refinements, documentation updates and build validation.

- [ ] T025 [P] Update `specs/001-fileaccess-configs/quickstart.md` with any new
  keyboard shortcuts or behaviours discovered during implementation.
- [ ] T026 [P] Ensure the split‑view layout in `App.tsx` is responsive and that
  the adapter‑specific section scrolls when tall; add CSS if needed under
  `src/webview/file-access-configs/styles.css`.
- [ ] T027 [P] Add keyboard navigation to the list: arrow keys change selection
  and Enter posts `selectConfig`; ensure the search box and form fields keep
  correct focus order.
- [ ] T028 [P] Run `npm run build` and verify TypeScript compiles without errors,
  the new webview bundle is generated, and existing tests still pass.
- [ ] T029 [P] (Optional) Update `docs/developer-references/` or a README with
  notes about the new `FileAccessConfig` domain and how to extend the panel.

---

## Dependencies & Execution Order

1. **Phase 1 tasks** (T001–T007) can all run in parallel; they unblock any
   subsequent coding.
2. **Phase 2 tests** (T008–T010) rely on the enum and parser from Phase 1 but
   otherwise are independent; they should complete before story work begins.
3. **US1 tasks** (T011–T015) implement the panel and are the MVP path; T012 and
   T013 can be worked on in parallel but the unit tests (T014) depend on both.
4. **US2 tasks** depend on the messaging scaffolding added by US1.
5. **US3 tasks** require the `selectConfig` handling from US2 and the parser/
   store support from Phase 2; save/delete handlers (T021) depend on ConfigSaver
   existing.
6. **Polish tasks** may overlap with later story development but should finish
   before merge.

### Story Dependencies

- **US1** is the entry point and must be delivered first; it is the MVP.
- **US2** builds on US1 by adding filtering and selection.
- **US3** builds on US2 by enabling mutation of configs.
- Each story’s tests and implementation are self‑contained so reviewers can
  validate them independently.

### Parallel Examples

- T001–T005 can be completed simultaneously by different developers.
- In Phase 2, writing config‑store tests (T008) can run while documentation
  (T010) is being updated.
- During US1, the host panel (T012) and webview UI (T013) can be developed in
  parallel; their unit tests (T014) wait for both.
- US2 UI enhancements (T016) and panel message handler (T017) are independent
  and can be coded concurrently.
- US3 UI tests (T022) may be written while the panel save/delete logic (T021)
  is still in progress.

---

✅ **Total tasks**: 29  
📌 **Tasks per story**: US1 = 5, US2 = 4, US3 = 5 (plus common store/setup tasks)  
🚀 **MVP scope**: complete through T014 (Phase 1 + Phase 2 + US1)  
🎯 **Independent test criteria**: each story has its own test plan listed above.

This `tasks.md` is ready for implementation tracking; each line can be checked
off as work completes.