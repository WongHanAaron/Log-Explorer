# Tasks: Shareable two‑column config editor infrastructure

**Input**: Design documents from `/specs/007-config-panel-infra/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md (optional), data-model.md (optional), contracts/ ✅

**Tests**: Unit tasks accompany each component; integration tasks cover cross-panel behaviour.

**Organization**: Grouped by major work areas driven by plan.

## Format: `[ID] [P?] Description`

- **[P]**: Parallelizable
- File paths provided where implementation should occur

---

## Phase 1: Core framework

- [x] T001 Implement `src/panels/editors/GenericConfigPanel.ts` with initialization, messaging (init/selectConfig/configListChanged), and abstract hooks for subclasses.
- [x] T002 Add unit tests for `GenericConfigPanel` in `test/unit/panels/genericConfigPanel.test.ts` verifying message send/receive and unsaved-change confirmation handling.
- [x] T003 Create `src/utils/panelHelpers.ts` with helper functions for registering panels and parsing webview messages; write unit tests.

---

## Phase 2: Shared webview components

- [ ] T004 Create `src/webview/config-panel/components/ConfigList.tsx` implementing search/filter/keyboard navigation.
- [ ] T005 Create `src/webview/config-panel/components/FormWrapper.tsx` providing unsaved-change prompt and render-prop API for forms.
- [ ] T006 Update `src/webview/config-panel/App.tsx` composing `ConfigList` and `FormWrapper`, handling generic message flow.
- [ ] T007 Write unit tests for ConfigList and FormWrapper in `test/unit/webview/config-panel/`.

---

## Phase 3: Refactor log-filepath panel

- [ ] T008 Refactor `src/panels/editors/LogFileSourcesPanel.ts` to subclass `GenericConfigPanel` and supply filepath-specific form logic.
- [ ] T009 Change log-filepath webview entrypoint to use generic `App` with a filepath form render prop; adjust existing tests accordingly.

---

## Phase 4: Protocol & services

- [ ] T010 Update `specs/007-config-panel-infra/contracts/panel-protocol.md` with shared messages.
- [ ] T011 Add `ConfigStore.listConfigNames` utility if missing (already exists); ensure subscription logic remains correct.

---

## Phase 5: Documentation & examples

- [ ] T012 Write quickstart in `specs/007-config-panel-infra/quickstart.md` showing how to subclass and use the framework.
- [ ] T013 Add higher‑level docs under `docs/` describing the public API and examples.

---

## Phase 6: Integration tests

- [ ] T014 Create `test/integration/genericConfigPanel.int.test.ts` verifying two panels with different categories behave independently and receive events.

---

## Phase 7: Polish & release

- [ ] T015 Remove TODO comments, ensure linting and compilation succeed.
- [ ] T016 Update version if needed; verify no conflicts with existing panels.

---

This checklist mirrors the plan; tick items as you implement them to track progress.